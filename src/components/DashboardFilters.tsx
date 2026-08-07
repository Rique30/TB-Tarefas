"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Option = { id: string; label: string };

export function DashboardFilters({
  aircraftOptions,
  responsibleOptions,
}: {
  aircraftOptions: Option[];
  responsibleOptions: Option[];
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
        defaultValue={searchParams.get("responsible") ?? ""}
        onChange={(e) => update("responsible", e.target.value)}
        className="rounded-lg border border-border px-2.5 py-1.5 text-sm bg-surface"
      >
        <option value="">Todos os responsáveis</option>
        {responsibleOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("type") ?? ""}
        onChange={(e) => update("type", e.target.value)}
        className="rounded-lg border border-border px-2.5 py-1.5 text-sm bg-surface"
      >
        <option value="">Todos os tipos</option>
        <option value="task">Tarefas</option>
        <option value="expiry">Vencimentos</option>
        <option value="maintenance">Manutenção</option>
      </select>

      {(searchParams.get("aircraft") || searchParams.get("responsible") || searchParams.get("type")) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-sm text-brand-blue hover:underline ml-auto"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
