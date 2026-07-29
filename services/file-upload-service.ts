import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TableInsert } from "@/types/database";

export type UploadProgress = { id: string; file: File; progress: number; state: "uploading" | "success" | "error"; error?: string };

const readableName = (file: File) => file.name.replace(/\.[^.]+$/, "");
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

// Keep this in sync with the formats promised in the file-library UI. The
// storage bucket policy remains the authority, but rejecting unsupported files
// before transfer provides an immediate, useful error and avoids needless work.
const allowedExtensions = new Set(["mp4", "mov", "avi", "webm", "png", "jpg", "jpeg", "webp", "gif", "psd", "ai", "pdf", "zip", "rar", "docx", "xlsx", "csv", "txt", "mp3", "wav", "m4a"]);

export function uploadValidationError(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) return "Files must be 2 GB or smaller.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.has(extension)) return "This file type is not supported. Upload video, images, audio, PDFs, documents, or archives.";
  return null;
}

/**
 * Uploads into the existing `files` storage bucket and returns a conservative
 * files-table payload. The production files table accepts these established
 * file-management names; no tables or columns are created here.
 */
export async function uploadWorkspaceFile(client: SupabaseClient<Database>, file: File, workspaceId: string | undefined) {
  const validationError = uploadValidationError(file);
  if (validationError) throw new Error(validationError);
  const { data: session, error: sessionError } = await client.auth.getUser();
  if (sessionError || !session.user) throw new Error("Your session has expired. Please sign in again.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${workspaceId ?? "workspace"}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await client.storage.from("files").upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) throw uploadError;
  const { data } = client.storage.from("files").getPublicUrl(path);
  const input: TableInsert<"files"> = {
    workspace_id: workspaceId,
    name: readableName(file),
    file_name: file.name,
    original_name: file.name,
    file_url: data.publicUrl,
    url: data.publicUrl,
    storage_path: path,
    path,
    size: file.size,
    file_size: file.size,
    mime_type: file.type || "application/octet-stream",
    file_type: file.type || "application/octet-stream",
    status: "active",
  };
  // The generated database contract is intentionally passthrough, while this
  // cast keeps the flexible production-table transport at one boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: record, error } = await (client as any).from("files").insert(input).select().single();
  if (error) {
    await client.storage.from("files").remove([path]);
    throw error;
  }
  return record as Record<string, unknown>;
}
