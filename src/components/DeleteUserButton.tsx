"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/app/actions/users";

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Excluir "${name}"? Essa ação não pode ser desfeita.`)) {
          startTransition(() => deleteUser(userId));
        }
      }}
      className="text-muted hover:text-danger transition-colors disabled:opacity-60"
      aria-label="Excluir usuário"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
