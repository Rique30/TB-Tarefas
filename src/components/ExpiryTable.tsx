"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge, expiryStatusTone } from "@/components/Badge";
import { EditExpiryItemButton } from "@/components/ExpiryFormModal";
import { deleteExpiryItem } from "@/app/actions/expiry";
import { EXPIRY_CATEGORY_LABEL, EXPIRY_STATUS_LABEL, expiryStatus, formatDate, daysUntil } from "@/lib/status";

export type ExpiryRow = {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  notifyDaysBefore: number;
  notes: string | null;
};

export function ExpiryTable({ items, canEdit }: { items: ExpiryRow[]; canEdit: boolean }) {
  const [category, setCategory] = useState<string>("");
  const [localItems, setLocalItems] = useState(items);

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
              return (
                <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-background transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.notes && <p className="text-xs text-muted">{item.notes}</p>}
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
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
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
