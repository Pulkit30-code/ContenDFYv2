import type { PostgrestError } from "@supabase/supabase-js";

export class DataLayerError extends Error {
  constructor(public readonly cause: PostgrestError) {
    super(cause.message);
    this.name = "DataLayerError";
  }
}

export function throwIfError(error: PostgrestError | null): void {
  if (error) throw new DataLayerError(error);
}
