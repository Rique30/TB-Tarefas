"use client";

import { useActionState, useState } from "react";
import { useCloseOnActionSuccess } from "@/lib/useCloseOnSuccess";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createUser } from "@/app/actions/users";
import type { ActionState } from "@/app/actions/aircraft";

const initialState: ActionState = {};

export function NewUserButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUser, initialState);

  useCloseOnActionSuccess(state, setOpen);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-blue text-white text-sm font-medium px-3.5 py-2 hover:bg-brand-navy transition-colors"
      >
        <UserPlus className="size-4" />
        Novo usuário
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar usuário">
        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Nome</span>
            <input name="name" required className="rounded-lg border border-border px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">E-mail</span>
            <input name="email" type="email" required className="rounded-lg border border-border px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Senha provisória</span>
            <input name="password" type="text" required minLength={6} className="rounded-lg border border-border px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Perfil</span>
            <select name="role" className="rounded-lg border border-border px-3 py-2 text-sm bg-surface">
              <option value="INTERNAL">Equipe interna (acesso completo)</option>
              <option value="CLIENT">Cliente / proprietário (acesso restrito)</option>
            </select>
          </label>
          {state.error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-lg bg-brand-blue text-white font-medium py-2 text-sm hover:bg-brand-navy transition-colors disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Cadastrar usuário"}
          </button>
        </form>
      </Modal>
    </>
  );
}
