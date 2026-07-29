import type { SupabaseClient } from "@supabase/supabase-js";
import { tableNames, type Database, type TableName } from "@/types/database";
import { createCrudService } from "@/services/crud-service";

export type Repositories = { [T in TableName]: ReturnType<typeof createCrudService<T>> };

/** Builds a concrete CRUD repository for every production table. */
export function createRepositories(client: SupabaseClient<Database>): Repositories {
  return Object.fromEntries(tableNames.map((table) => [table, createCrudService(client, table)])) as Repositories;
}
