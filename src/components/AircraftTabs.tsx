"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function AircraftTabs({ aircraftId }: { aircraftId: string }) {
  const pathname = usePathname();
  const tabs = [
    { key: "tarefas", label: "Tarefas" },
    { key: "vencimentos", label: "Vencimentos" },
    { key: "manutencao", label: "Manutenção" },
  ];

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const href = `/aircraft/${aircraftId}/${tab.key}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.key}
            href={href}
            className={clsx(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              active ? "border-brand-blue text-brand-blue" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
