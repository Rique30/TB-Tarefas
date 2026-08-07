"use client";

import { useActionState, useState } from "react";
import { useCloseOnActionSuccess } from "@/lib/useCloseOnSuccess";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createExpiryItem, updateExpiryItem } from "@/app/actions/expiry";
import type { ActionState } from "@/app/actions/aircraft";

const initialState: ActionState = {};

type ExpiryFormValues = {
  id?: string;
  name?: string;
  category?: string;
  dueDate?: string;
  notifyDaysBefore?: number;
  notes?: string | null;
};

function ExpiryFields({ values }: { values: ExpiryFormValues }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Item</span>
        <input
          name="name"
          defaultValue={values.name}
          required
          placeholder="ex: Seguro RETA, Laudo PBN, CVA..."
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Categoria</span>
          <select
            name="category"
            defaultValue={values.category ?? "EQUIPAMENTO"}
            className="rounded-lg border border-border px-3 py-2 text-sm bg-surface"
          >
            <option value="PORTE_OBRIGATORIO">Porte obrigatório</option>
            <option value="EQUIPAMENTO">Equipamento</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Vencimento</span>
          <input
            type="date"
            name="dueDate"
            defaultValue={values.dueDate}
            required
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Notificar com quantos dias de antecedência</span>
        <input
          type="number"
          name="notifyDaysBefore"
          min={1}
          max={365}
          defaultValue={values.notifyDaysBefore ?? 30}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-foreground">Observações</span>
        <textarea
          name="notes"
          defaultValue={values.notes ?? ""}
          rows={2}
          className="rounded-lg border border-border px-3 py-2 text-sm resize-none"
        />
      </label>
    </>
  );
}

export function NewExpiryItemButton({ aircraftId }: { aircraftId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = createExpiryItem.bind(null, aircraftId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useCloseOnActionSuccess(state, setOpen);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-blue text-white text-sm font-medium px-3.5 py-2 hover:bg-brand-navy transition-colors"
      >
        <Plus className="size-4" />
        Novo item
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo item de vencimento">
        <form action={formAction} className="flex flex-col gap-3">
          <ExpiryFields values={{}} />
          {state.error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-lg bg-brand-blue text-white font-medium py-2 text-sm hover:bg-brand-navy transition-colors disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar item"}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function EditExpiryItemButton({
  item,
}: {
  item: { id: string; name: string; category: string; dueDate: string; notifyDaysBefore: number; notes: string | null };
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateExpiryItem.bind(null, item.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useCloseOnActionSuccess(state, setOpen);

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-muted hover:text-brand-blue transition-colors" aria-label="Editar">
        <Pencil className="size-3.5" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar item de vencimento">
        <form action={formAction} className="flex flex-col gap-3">
          <ExpiryFields
            values={{
              name: item.name,
              category: item.category,
              dueDate: item.dueDate.slice(0, 10),
              notifyDaysBefore: item.notifyDaysBefore,
              notes: item.notes,
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
