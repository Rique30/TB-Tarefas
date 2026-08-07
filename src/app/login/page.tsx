"use client";

import { useActionState, Suspense } from "react";
import Image from "next/image";
import { loginAction, type LoginState } from "./actions";
import { useSearchParams } from "next/navigation";

const initialState: LoginState = {};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--brand-navy)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo-stacked.png" alt="TB Aviation" width={220} height={132} priority className="w-[220px] h-auto" />
        </div>
        <form action={formAction} className="bg-surface rounded-2xl shadow-xl p-8 flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Entrar</h1>
            <p className="text-sm text-muted mt-1">Gestão de tarefas, vencimentos e manutenção da frota.</p>
          </div>

          <input type="hidden" name="next" value={next} />

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Usuário</span>
            <input
              name="email"
              type="text"
              required
              autoComplete="username"
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              placeholder="ex: ltavares ou voce@tbaviation.com.br"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Senha</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              placeholder="••••••••"
            />
          </label>

          {state.error && (
            <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-brand-blue text-white font-medium py-2.5 text-sm hover:bg-brand-navy transition-colors disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-center text-xs text-white/60 mt-6">
          TB Aviation · Assessoria Aeronáutica
        </p>
      </div>
    </div>
  );
}
