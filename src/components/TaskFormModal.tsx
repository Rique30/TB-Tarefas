"use client";

import { useActionState, useState } from "react";
import { useCloseOnActionSuccess } from "@/lib/useCloseOnSuccess";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createTask } from "@/app/actions/tasks";
import type { ActionState as TaskActionState } from "@/app/actions/aircraft";

const initialState: TaskActionState = {};

export function NewTaskModal({
  aircraftId,
  assigneeOptions,
}: {
  aircraftId: string;
  assigneeOptions: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const boundAction = createTask.bind(null, aircraftId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useCloseOnActionSuccess(state, setOpen);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-md size-6 text-muted hover:bg-white hover:text-brand-blue transition-colors"
        aria-label="Nova tarefa"
      >
        <Plus className="size-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova tarefa">
        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Título</span>
            <input
              name="title"
              required
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Descrição</span>
            <textarea
              name="description"
              rows={3}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue resize-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Responsável</span>
            <select name="assigneeId" className="rounded-lg border border-border px-3 py-2 text-sm bg-surface">
              <option value="">Sem responsável</option>
              {assigneeOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Início</span>
              <input type="date" name="startDate" className="rounded-lg border border-border px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Prazo</span>
              <input type="date" name="dueDate" className="rounded-lg border border-border px-3 py-2 text-sm" />
            </label>
          </div>
          {state.error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-lg bg-brand-blue text-white font-medium py-2 text-sm hover:bg-brand-navy transition-colors disabled:opacity-60"
          >
            {pending ? "Criando..." : "Criar tarefa"}
          </button>
        </form>
      </Modal>
    </>
  );
}
