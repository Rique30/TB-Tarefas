"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function TasksFilterBar({
  aircraftOptions,
  responsibleOptions,
  defaultResponsible,
  showMineOption,
}: {
  aircraftOptions: { id: string; label: string }[];
  responsibleOptions: { id: string; label: string }[];
  defaultResponsible: string;
  showMineOption: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center bg-surface border border-border rounded-xl px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Filtros</span>
      <select
        defaultValue={searchParams.get("responsible") ?? defaultResponsible}
        onChange={(e) => update("responsible", e.target.value)}
        className="rounded-lg border border-border px-2.5 py-1.5 text-sm bg-surface"
      >
        {showMineOption && <option value="mine">Minhas tarefas</option>}
        <option value="all">Todos os responsáveis</option>
        {responsibleOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("aircraft") ?? ""}
        onChange={(e) => update("aircraft", e.target.value)}
        className="rounded-lg border border-border px-2.5 py-1.5 text-sm bg-surface"
      >
        <option value="">Todas as aeronaves</option>
        {aircraftOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="rounded-lg border border-border px-2.5 py-1.5 text-sm bg-surface"
      >
        <option value="">Todos os status</option>
        <option value="TODO">A fazer</option>
        <option value="IN_PROGRESS">Em andamento</option>
        <option value="DONE">Finalizado</option>
      </select>
    </div>
  );
}
