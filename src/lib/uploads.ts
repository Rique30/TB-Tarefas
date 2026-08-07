import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_MIME_TYPES = ["application/pdf", "image/png"];
export const DOCUMENT_ACCEPT = ".pdf,.png,application/pdf,image/png";

export function assertDocumentFile(file: File): string | null {
  if (file.size === 0) return "Selecione um arquivo";
  if (file.size > MAX_ATTACHMENT_BYTES) return "Arquivo maior que 10MB";
  if (!DOCUMENT_MIME_TYPES.includes(file.type)) return "Envie um arquivo PDF ou PNG";
  return null;
}

/** Saves an uploaded file under public/uploads and returns its public URL. */
export async function saveUploadedFile(file: File): Promise<{ url: string; size: number }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, uniqueName), buffer);
  return { url: `/uploads/${uniqueName}`, size: file.size };
}
