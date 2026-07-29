import type { SupabaseClient } from "@supabase/supabase-js";
import { primaryKeyByTable, type Database, type TableInsert, type TableName, type TableRow, type TableUpdate } from "@/types/database";
import { throwIfError } from "@/lib/supabase-error";

export type ListOptions = { select?: string; limit?: number; ascending?: boolean; orderBy?: string; enabled?: boolean };

export function createCrudService<T extends TableName>(client: SupabaseClient<Database>, table: T) {
  const primaryKey = primaryKeyByTable[table];
  // PostgREST's conditional generic types cannot retain a type parameter that
  // ranges over 45 unrelated production tables. Keep that limitation at this
  // one boundary; the public API remains table-keyed and typed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = () => (client as unknown as { from: (name: string) => any }).from(table);

  return {
    table,
    primaryKey,
    async list(options: ListOptions = {}): Promise<TableRow<T>[]> {
      let query = from().select(options.select ?? "*");
      if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false });
      if (options.limit) query = query.limit(options.limit);
      const { data, error } = await query;
      throwIfError(error);
      return data as TableRow<T>[];
    },
    async findById(value: string, select = "*"): Promise<TableRow<T> | null> {
      const { data, error } = await from().select(select).eq(primaryKey, value).maybeSingle();
      throwIfError(error);
      return data as TableRow<T> | null;
    },
    async create(input: TableInsert<T>): Promise<TableRow<T>> {
      const { data, error } = await from().insert(input).select().single();
      throwIfError(error);
      return data as TableRow<T>;
    },
    async update(value: string, input: TableUpdate<T>): Promise<TableRow<T>> {
      const { data, error } = await from().update(input).eq(primaryKey, value).select().single();
      throwIfError(error);
      return data as TableRow<T>;
    },
    async remove(value: string): Promise<void> {
      const { error } = await from().delete().eq(primaryKey, value);
      throwIfError(error);
    },
  };
}
