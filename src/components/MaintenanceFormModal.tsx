"use client";

import { useActionState, useState } from "react";
import { useCloseOnActionSuccess } from "@/lib/useCloseOnSuccess";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createMaintenanceEvent, updateMaintenanceEvent } from "@/app/actions/maintenance";
import type { ActionState } from "@/app/actions/aircraft";

const initialState: ActionState = {};

type MaintenanceValues = {
  title?: string;
  type?: string;
  scopeDescription?: string | null;
  discrepancy?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  status?: string;
};

function MaintenanceFields({ values }: { values: MaintenanceValues }) {
  const [type, setType] = useState(values.type ?? "PROGRAMADA");

  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Título</span>
        <input
          name="title"
          defaultValue={values.title}
          required
          placeholder="ex: Inspeção 12 meses"
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Tipo</span>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm bg-surface"
          >
            <option value="PROGRAMADA">Programada</option>
            <option value="NAO_PROGRAMADA">Não programada</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Status</span>
          <select
            name="status"
            defaultValue={values.status ?? "PLANEJADA"}
            className="rounded-lg border border-border px-3 py-2 text-sm bg-surface"
          >
            <option value="PLANEJADA">Planejada</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>
        </label>
      </div>
      {type === "PROGRAMADA" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Início do período</span>
            <input type="date" name="periodStart" defaultValue={values.periodStart ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Fim do período</span>
            <input type="date" name="periodEnd" defaultValue={values.periodEnd ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm" />
          </label>
        </div>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Escopo dos serviços</span>
        <textarea
          name="scopeDescription"
          defaultValue={values.scopeDescription ?? ""}
          rows={2}
          className="rounded-lg border border-border px-3 py-2 text-sm resize-none"
        />
      </label>
      {type === "NAO_PROGRAMADA" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Discrepância / pane relatada</span>
          <textarea
            name="discrepancy"
            defaultValue={values.discrepancy ?? ""}
            rows={2}
            className="rounded-lg border border-border px-3 py-2 text-sm resize-none"
          />
        </label>
      )}
    </>
  );
}

export function NewMaintenanceButton({ aircraftId }: { aircraftId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = createMaintenanceEvent.bind(null, aircraftId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useCloseOnActionSuccess(state, setOpen);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-blue text-white text-sm font-medium px-3.5 py-2 hover:bg-brand-navy transition-colors"
      >
        <Plus className="size-4" />
        Nova manutenção
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova manutenção">
        <form action={formAction} className="flex flex-col gap-3">
          <MaintenanceFields values={{}} />
          {state.error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-lg bg-brand-blue text-white font-medium py-2 text-sm hover:bg-brand-navy transition-colors disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function EditMaintenanceButton({
  event,
}: {
  event: {
    id: string;
    title: string;
    type: string;
    scopeDescription: string | null;
    discrepancy: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    status: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateMaintenanceEvent.bind(null, event.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useCloseOnActionSuccess(state, setOpen);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-muted hover:text-brand-blue transition-colors">
        <Pencil className="size-3.5" />
        Editar
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar manutenção">
        <form action={formAction} className="flex flex-col gap-3">
          <MaintenanceFields
            values={{
              title: event.title,
              type: event.type,
              scopeDescription: event.scopeDescription,
              discrepancy: event.discrepancy,
              periodStart: event.periodStart?.slice(0, 10),
              periodEnd: event.periodEnd?.slice(0, 10),
              status: event.status,
            }}
          />
          {state.error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-lg bg-brand-blue text-white font-medium py-2 text-sm hover:bg-brand-navy transition-colors disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </Modal>
    </>
  );
}
