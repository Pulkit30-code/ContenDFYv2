import { createClient } from "@/supabase/client";
import { createRepositories } from "@/services/repositories";
import { createSchemas, rowSchemas, updateSchemas } from "@/lib/table-schemas";

/**
 * One discoverable feature registry for all existing production tables.
 * Components should prefer the React Query hooks; server code can use a
 * repository built with `createServerClient()` instead.
 */
export const tableSchemas = { row: rowSchemas, create: createSchemas, update: updateSchemas };
export function createBrowserRepositories() { return createRepositories(createClient()); }
