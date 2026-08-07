import "server-only";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];
export const DOCUMENT_ACCEPT = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";

export function assertDocumentFile(file: File): string | null {
  if (file.size === 0) return "Selecione um arquivo";
  if (file.size > MAX_ATTACHMENT_BYTES) return "Arquivo maior que 10MB";
  if (!DOCUMENT_MIME_TYPES.includes(file.type)) return "Envie um arquivo PDF, PNG ou JPEG";
  return null;
}

/** Reads an uploaded file's bytes so it can be stored directly in the database. */
export async function readUploadedFile(file: File): Promise<{ data: Uint8Array<ArrayBuffer>; mimeType: string; size: number }> {
  const data = new Uint8Array(await file.arrayBuffer());
  return { data, mimeType: file.type, size: file.size };
}
