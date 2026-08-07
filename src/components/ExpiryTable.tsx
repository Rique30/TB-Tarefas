"use client";

import { Fragment, useMemo, useState } from "react";
import { Trash2, Paperclip, ChevronDown, ChevronRight } from "lucide-react";
import { Badge, expiryStatusTone } from "@/components/Badge";
import { EditExpiryItemButton } from "@/components/ExpiryFormModal";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { useSyncedState } from "@/lib/useSyncedState";
import { deleteExpiryItem, uploadExpiryAttachment, deleteExpiryAttachment } from "@/app/actions/expiry";
import { EXPIRY_CATEGORY_LABEL, EXPIRY_STATUS_LABEL, expiryStatus, formatDate, daysUntil } from "@/lib/status";

export type ExpiryAttachmentRow = { id: string; filename: string; url: string; size: number };

export type ExpiryRow = {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  notifyDaysBefore: number;
  notes: string | null;
  attachments: ExpiryAttachmentRow[];
};

const COLUMN_COUNT = 6;

export function ExpiryTable({ items, canEdit }: { items: ExpiryRow[]; canEdit: boolean }) {
  const [category, setCategory] = useState<string>("");
  const [localItems, setLocalItems] = useSyncedState(items);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = category ? localItems.filter((i) => i.category === category) : localItems;
    return [...list].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [localItems, category]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Categoria</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border px-2.5 py-1.5 text-sm bg-surface"
        >
          <option value="">Todas</option>
          <option value="PORTE_OBRIGATORIO">Porte obrigatório</option>
          <option value="EQUIPAMENTO">Equipamento</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium w-6"></th>
              <th className="px-4 py-2.5 font-medium">Item</th>
              <th className="px-4 py-2.5 font-medium">Categoria</th>
              <th className="px-4 py-2.5 font-medium">Vencimento</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              {canEdit && <th className="px-4 py-2.5 font-medium text-right">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const status = expiryStatus(new Date(item.dueDate));
              const days = daysUntil(new Date(item.dueDate));
              const expanded = expandedId === item.id;
              return (
                <Fragment key={item.id}>
                  <tr className="border-b border-border last:border-b-0 hover:bg-background transition-colors">
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        className="flex items-center gap-1 text-muted hover:text-brand-blue"
                        aria-label="Ver documentos"
                      >
                        {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground">{item.name}</p>
                      {item.notes && <p className="text-xs text-muted">{item.notes}</p>}
                      {item.attachments.length > 0 && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                          <Paperclip className="size-3" />
                          {item.attachments.length} documento(s)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{EXPIRY_CATEGORY_LABEL[item.category]}</td>
                    <td className="px-4 py-2.5 text-muted">
                      {formatDate(item.dueDate)}
                      <span className="block text-xs">{days >= 0 ? `em ${days} dia(s)` : `há ${-days} dia(s)`}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={expiryStatusTone(status)}>{EXPIRY_STATUS_LABEL[status]}</Badge>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2.5">
                          <EditExpiryItemButton item={item} />
                          <button
                            onClick={() => {
                              if (confirm(`Excluir "${item.name}"?`)) {
                                setLocalItems((prev) => prev.filter((i) => i.id !== item.id));
                                deleteExpiryItem(item.id);
                              }
                            }}
                            className="text-muted hover:text-danger transition-colors"
                            aria-label="Excluir"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {expanded && (
                    <tr className="border-b border-border last:border-b-0 bg-background">
                      <td></td>
                      <td colSpan={COLUMN_COUNT - 1} className="px-4 py-3">
                        <AttachmentsPanel
                          attachments={item.attachments}
                          canEdit={canEdit}
                          onUpload={(fd) => uploadExpiryAttachment(item.id, fd)}
                          onDelete={deleteExpiryAttachment}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-8 text-center text-muted">
                  Nenhum item de vencimento cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
