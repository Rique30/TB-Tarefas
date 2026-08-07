"use client";

import { useTransition } from "react";
import { setUserActive } from "@/app/actions/users";

export function UserActiveToggle({ userId, active }: { userId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => setUserActive(userId, !active))}
      className={`text-xs font-medium rounded-full px-2.5 py-0.5 transition-colors ${
        active ? "bg-success-bg text-success hover:opacity-80" : "bg-gray-100 text-gray-500 hover:opacity-80"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
    </button>
  );
}
