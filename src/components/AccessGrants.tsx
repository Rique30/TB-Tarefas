"use client";

import { useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { grantAircraftAccess, revokeAircraftAccess } from "@/app/actions/users";

export type Grant = { id: string; aircraftId: string; canEdit: boolean; aircraft: { registration: string; model: string } };

export function AccessGrants({
  userId,
  aircraftOptions,
  grants,
}: {
  userId: string;
  aircraftOptions: { id: string; registration: string; model: string }[];
  grants: Grant[];
}) {
  const [localGrants, setLocalGrants] = useState(grants);
  const selectRef = useRef<HTMLSelectElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const available = aircraftOptions.filter((a) => !localGrants.some((g) => g.aircraftId === a.id));

  return (
    <div className="flex flex-col gap-2">
      {localGrants.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {localGrants.map((g) => (
            <li
              key={g.id}
              className="flex items-center gap-1.5 rounded-full bg-background border border-border pl-2.5 pr-1.5 py-1 text-xs"
            >
              <span className="font-medium text-foreground">{g.aircraft.registration}</span>
              <span className="text-muted">{g.canEdit ? "edição" : "leitura"}</span>
              <button
                onClick={() => {
                  setLocalGrants((prev) => prev.filter((x) => x.id !== g.id));
                  startTransition(() => revokeAircraftAccess(g.id));
                }}
                className="text-muted hover:text-danger"
                aria-label="Remover acesso"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const aircraftId = selectRef.current?.value;
            const canEdit = editRef.current?.checked ?? false;
            const aircraft = aircraftOptions.find((a) => a.id === aircraftId);
            if (!aircraftId || !aircraft) return;
            setLocalGrants((prev) => [
              ...prev,
              { id: `temp-${Date.now()}`, aircraftId, canEdit, aircraft: { registration: aircraft.registration, model: aircraft.model } },
            ]);
            startTransition(() => grantAircraftAccess(userId, aircraftId, canEdit));
          }}
        >
          <select ref={selectRef} className="rounded-lg border border-border px-2 py-1 text-xs bg-surface">
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {a.registration}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-muted">
            <input ref={editRef} type="checkbox" className="size-3.5 accent-[var(--brand-blue)]" />
            edição
          </label>
          <button type="submit" className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-background">
            + Conceder acesso
          </button>
        </form>
      )}
    </div>
  );
}
