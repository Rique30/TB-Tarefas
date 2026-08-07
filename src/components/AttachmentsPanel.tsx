"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload, Loader2 } from "lucide-react";
import { useSyncedState } from "@/lib/useSyncedState";

const DOCUMENT_ACCEPT = ".pdf,.png,application/pdf,image/png";

export type PanelAttachment = { id: string; filename: string; url: string; size: number };

export function AttachmentsPanel({
  title = "Documentos",
  attachments,
  canEdit,
  onUpload,
  onDelete,
}: {
  title?: string;
  attachments: PanelAttachment[];
  canEdit: boolean;
  onUpload: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  onDelete: (attachmentId: string) => Promise<void>;
}) {
  const [items, setItems] = useSyncedState(attachments);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
      <ul className="flex flex-col gap-1.5">
        {items.map((a) => (
          <li key={a.id} className="flex items-center gap-2 group">
            <FileText className="size-3.5 text-muted shrink-0" />
            <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-brand-blue hover:underline truncate flex-1">
              {a.filename}
            </a>
            <span className="text-xs text-muted shrink-0">{(a.size / 1024).toFixed(0)} KB</span>
            {canEdit && (
              <button
                onClick={() => {
                  setItems((prev) => prev.filter((x) => x.id !== a.id));
                  onDelete(a.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity"
                aria-label="Excluir anexo"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-muted">Nenhum documento anexado.</p>}
      </ul>
      {canEdit && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const file = fileRef.current?.files?.[0];
            if (!file) return;
            setError(null);
            const fd = new FormData();
            fd.set("file", file);
            startUpload(async () => {
              const result = await onUpload(fd);
              if (result.error) {
                setError(result.error);
                return;
              }
              if (fileRef.current) fileRef.current.value = "";
            });
          }}
        >
          <input ref={fileRef} type="file" accept={DOCUMENT_ACCEPT} className="text-xs flex-1" />
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background disabled:opacity-60 shrink-0"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Enviar
          </button>
        </form>
      )}
      {error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{error}</p>}
      <p className="text-xs text-muted">Apenas PDF ou PNG, até 10MB.</p>
    </div>
  );
}
