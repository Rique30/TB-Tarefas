"use client";

import { useRef } from "react";
import { Trash2, Wrench, History } from "lucide-react";
import { Badge, maintenanceStatusTone } from "@/components/Badge";
import { EditMaintenanceButton } from "@/components/MaintenanceFormModal";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { useSyncedState } from "@/lib/useSyncedState";
import {
  addMaintenanceChecklistItem,
  toggleMaintenanceChecklistItem,
  deleteMaintenanceChecklistItem,
  deleteMaintenanceEvent,
  uploadMaintenanceAttachment,
  deleteMaintenanceAttachment,
} from "@/app/actions/maintenance";
import { MAINTENANCE_STATUS_LABEL, MAINTENANCE_TYPE_LABEL, formatDate } from "@/lib/status";

export type MaintenanceRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  scopeDescription: string | null;
  discrepancy: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  completedAt: string | null;
  checklistItems: { id: string; title: string; done: boolean }[];
  attachments: { id: string; filename: string; url: string; size: number }[];
};

export function MaintenanceList({ events, canEdit }: { events: MaintenanceRow[]; canEdit: boolean }) {
  const active = events.filter((e) => e.status !== "CONCLUIDA");
  const history = events.filter((e) => e.status === "CONCLUIDA");

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Wrench className="size-4" /> Manutenções ativas
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted bg-surface border border-border rounded-xl px-4 py-6 text-center">
            Nenhuma manutenção programada ou em andamento.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((event) => (
              <MaintenanceCard key={event.id} event={event} canEdit={canEdit} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <History className="size-4" /> Histórico de manutenções finalizadas
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted bg-surface border border-border rounded-xl px-4 py-6 text-center">
            Nenhuma manutenção concluída ainda.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Título</th>
                  <th className="px-4 py-2.5 font-medium">Tipo</th>
                  <th className="px-4 py-2.5 font-medium">Período</th>
                  <th className="px-4 py-2.5 font-medium">Concluída em</th>
                </tr>
              </thead>
              <tbody>
                {history.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{e.title}</td>
                    <td className="px-4 py-2.5 text-muted">{MAINTENANCE_TYPE_LABEL[e.type]}</td>
                    <td className="px-4 py-2.5 text-muted">
                      {e.periodStart ? `${formatDate(e.periodStart)} — ${formatDate(e.periodEnd)}` : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{formatDate(e.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MaintenanceCard({ event, canEdit }: { event: MaintenanceRow; canEdit: boolean }) {
  const [items, setItems] = useSyncedState(event.checklistItems);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = items.filter((i) => i.done).length;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{event.title}</p>
            <Badge tone={event.type === "NAO_PROGRAMADA" ? "danger" : "neutral"}>{MAINTENANCE_TYPE_LABEL[event.type]}</Badge>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {event.periodStart ? `${formatDate(event.periodStart)} — ${formatDate(event.periodEnd)}` : "Sem período definido"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={maintenanceStatusTone(event.status)}>{MAINTENANCE_STATUS_LABEL[event.status]}</Badge>
          {canEdit && (
            <>
              <EditMaintenanceButton
                event={{
                  ...event,
                }}
              />
              <button
                onClick={() => {
                  if (confirm(`Excluir "${event.title}"?`)) deleteMaintenanceEvent(event.id);
                }}
                className="text-muted hover:text-danger transition-colors"
                aria-label="Excluir"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {event.scopeDescription && <p className="mt-2 text-sm text-muted">{event.scopeDescription}</p>}
      {event.discrepancy && (
        <p className="mt-2 text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">
          <strong>Discrepância:</strong> {event.discrepancy}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-brand-blue" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
          <span className="text-xs text-muted shrink-0">
            {done}/{items.length} concluídos
          </span>
        </div>
      )}

      <ul className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.done}
              disabled={!canEdit}
              onChange={(e) => {
                setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: e.target.checked } : i)));
                toggleMaintenanceChecklistItem(item.id, e.target.checked);
              }}
              className="size-4 accent-[var(--brand-blue)]"
            />
            <span className={`text-sm flex-1 ${item.done ? "line-through text-muted" : "text-foreground"}`}>{item.title}</span>
            {canEdit && (
              <button
                onClick={() => {
                  setItems((prev) => prev.filter((i) => i.id !== item.id));
                  deleteMaintenanceChecklistItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {canEdit && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = inputRef.current?.value.trim();
            if (!value) return;
            const tempId = `temp-${Date.now()}`;
            setItems((prev) => [...prev, { id: tempId, title: value, done: false }]);
            if (inputRef.current) inputRef.current.value = "";
            addMaintenanceChecklistItem(event.id, value);
          }}
        >
          <input
            ref={inputRef}
            placeholder="Novo item do checklist de serviço"
            className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background">
            Adicionar
          </button>
        </form>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <AttachmentsPanel
          attachments={event.attachments}
          canEdit={canEdit}
          onUpload={(fd) => uploadMaintenanceAttachment(event.id, fd)}
          onDelete={deleteMaintenanceAttachment}
        />
      </div>
    </div>
  );
}
