import { z } from "zod";
import { tableNames, type TableName } from "@/types/database";

/**
 * Base transport validators. They deliberately pass unknown production fields
 * through, so the app does not silently strip columns added outside this repo.
 */
const rowSchema = z.object({ id: z.string().uuid().optional(), workspace_id: z.string().uuid().optional() }).passthrough();
const createSchema = z.object({}).passthrough();
const updateSchema = z.object({}).passthrough();

export const rowSchemas = Object.fromEntries(tableNames.map((name) => [name, rowSchema])) as Record<TableName, typeof rowSchema>;
export const createSchemas = Object.fromEntries(tableNames.map((name) => [name, createSchema])) as Record<TableName, typeof createSchema>;
export const updateSchemas = Object.fromEntries(tableNames.map((name) => [name, updateSchema])) as Record<TableName, typeof updateSchema>;

export { z };
