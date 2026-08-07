"use client";

import { useActionState, useState } from "react";
import { useCloseOnActionSuccess } from "@/lib/useCloseOnSuccess";
import { Plus, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createAircraft, updateAircraft, type ActionState } from "@/app/actions/aircraft";

const initialState: ActionState = {};

type TeamOption = { id: string; name: string };

export function NewAircraftButton({ teamOptions }: { teamOptions: TeamOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAircraft, initialState);

  useCloseOnActionSuccess(state, setOpen);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-blue text-white text-sm font-medium px-3.5 py-2 hover:bg-brand-navy transition-colors"
      >
        <Plus className="size-4" />
        Nova aeronave
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar aeronave">
        <form action={formAction} className="flex flex-col gap-3">
          <Field label="Matrícula" name="registration" placeholder="PS-WRA" required />
          <Field label="Modelo" name="model" placeholder="Falcon 900EX" required />
          <Field label="Apelido (opcional)" name="nickname" placeholder="" />
          <ResponsibleField teamOptions={teamOptions} selectedIds={[]} />
          <TextAreaField label="Observações" name="notes" />
          {state.error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-lg bg-brand-blue text-white font-medium py-2 text-sm hover:bg-brand-navy transition-colors disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar aeronave"}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function EditAircraftButton({
  aircraft,
  teamOptions,
}: {
  aircraft: {
    id: string;
    registration: string;
    model: string;
    nickname: string | null;
    notes: string | null;
    responsibles: { id: string }[];
  };
  teamOptions: TeamOption[];
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateAircraft.bind(null, aircraft.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useCloseOnActionSuccess(state, setOpen);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
      >
        <Pencil className="size-3.5" />
        Editar ficha
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar aeronave">
        <form action={formAction} className="flex flex-col gap-3">
          <Field label="Matrícula" name="registration" defaultValue={aircraft.registration} required />
          <Field label="Modelo" name="model" defaultValue={aircraft.model} required />
          <Field label="Apelido (opcional)" name="nickname" defaultValue={aircraft.nickname ?? ""} />
          <ResponsibleField teamOptions={teamOptions} selectedIds={aircraft.responsibles.map((r) => r.id)} />
          <TextAreaField label="Observações" name="notes" defaultValue={aircraft.notes ?? ""} />
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

function ResponsibleField({ teamOptions, selectedIds }: { teamOptions: TeamOption[]; selectedIds: string[] }) {
  return (
    <fieldset className="flex flex-col gap-1.5 text-sm">
      <legend className="font-medium text-foreground mb-1">Responsável(is) pela aeronave</legend>
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto rounded-lg border border-border px-3 py-2">
        {teamOptions.map((u) => (
          <label key={u.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="responsibleIds"
              value={u.id}
              defaultChecked={selectedIds.includes(u.id)}
              className="size-3.5 accent-[var(--brand-blue)]"
            />
            {u.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
      />
    </label>
  );
}

function TextAreaField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={3}
        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue resize-none"
      />
    </label>
  );
}
