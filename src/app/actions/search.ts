"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getAccessibleAircraftIds } from "@/lib/permissions";

export type SearchResult = {
  type: "aircraft" | "task" | "expiry" | "maintenance";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const session = await requireSession();
  const q = query.trim();
  if (q.length < 2) return [];

  const accessible = await getAccessibleAircraftIds(session);
  const aircraftFilter = accessible ? { id: { in: accessible } } : {};
  const aircraftIdFilter = accessible ? { aircraftId: { in: accessible } } : {};

  const [aircraft, tasks, expiryItems, maintenance] = await Promise.all([
    prisma.aircraft.findMany({
      where: {
        AND: [
          aircraftFilter,
          { OR: [{ registration: { contains: q } }, { model: { contains: q } }, { nickname: { contains: q } }] },
        ],
      },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        AND: [
          aircraftIdFilter,
          { OR: [{ title: { contains: q } }, { description: { contains: q } }] },
        ],
      },
      include: { aircraft: true, assignees: true },
      take: 6,
    }),
    prisma.expiryItem.findMany({
      where: { AND: [aircraftIdFilter, { name: { contains: q } }] },
      include: { aircraft: true },
      take: 6,
    }),
    prisma.maintenanceEvent.findMany({
      where: { AND: [aircraftIdFilter, { OR: [{ title: { contains: q } }, { scopeDescription: { contains: q } }] }] },
      include: { aircraft: true },
      take: 6,
    }),
  ]);

  const results: SearchResult[] = [];

  for (const a of aircraft) {
    results.push({
      type: "aircraft",
      id: a.id,
      title: `${a.registration} — ${a.model}`,
      subtitle: "Aeronave",
      href: `/aircraft/${a.id}/tarefas`,
    });
  }
  for (const t of tasks) {
    results.push({
      type: "task",
      id: t.id,
      title: t.title,
      subtitle: `Tarefa · ${t.aircraft.registration}${t.assignees.length ? ` · ${t.assignees.map((u) => u.name).join(", ")}` : ""}`,
      href: `/aircraft/${t.aircraftId}/tarefas?task=${t.id}`,
    });
  }
  for (const e of expiryItems) {
    results.push({
      type: "expiry",
      id: e.id,
      title: e.name,
      subtitle: `Vencimento · ${e.aircraft.registration}`,
      href: `/aircraft/${e.aircraftId}/vencimentos`,
    });
  }
  for (const m of maintenance) {
    results.push({
      type: "maintenance",
      id: m.id,
      title: m.title,
      subtitle: `Manutenção · ${m.aircraft.registration}`,
      href: `/aircraft/${m.aircraftId}/manutencao`,
    });
  }

  return results;
}
