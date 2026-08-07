import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getAccessibleAircraftIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DashboardFilters } from "@/components/DashboardFilters";
import { StatCard, SectionCard } from "@/components/StatCard";
import { Badge, expiryStatusTone } from "@/components/Badge";
import {
  EXPIRY_CATEGORY_LABEL,
  EXPIRY_STATUS_LABEL,
  MAINTENANCE_STATUS_LABEL,
  daysUntil,
  expiryStatus,
  formatDate,
  isMaintenanceOverdue,
} from "@/lib/status";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ aircraft?: string; responsible?: string; type?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const accessible = await getAccessibleAircraftIds(session);

  const myAircraft =
    session.role === "INTERNAL"
      ? await prisma.aircraft.findMany({
          where: { responsibles: { some: { id: session.id } }, active: true },
          select: { id: true },
        })
      : [];
  const myAircraftIds = myAircraft.map((a) => a.id);
  const hasOwnAircraft = myAircraftIds.length > 0;

  const selectedResponsible = params.responsible;
  const selectedType = params.type;
  const selectedAircraft = params.aircraft ?? (hasOwnAircraft ? "mine" : "all");

  let filterAircraftIds: string[] | null = null;
  if (selectedAircraft === "mine") filterAircraftIds = myAircraftIds;
  else if (selectedAircraft !== "all") filterAircraftIds = [selectedAircraft];

  if (accessible) {
    filterAircraftIds = filterAircraftIds ? filterAircraftIds.filter((id) => accessible.includes(id)) : accessible;
  }

  const aircraftWhere = filterAircraftIds ? { id: { in: filterAircraftIds } } : {};
  const accessibleWhere = accessible ? { id: { in: accessible } } : {};

  const [allAircraft, accessibleAircraft, responsibles] = await Promise.all([
    prisma.aircraft.findMany({ where: aircraftWhere, orderBy: { registration: "asc" } }),
    prisma.aircraft.findMany({ where: accessibleWhere, orderBy: { registration: "asc" } }),
    prisma.user.findMany({ where: { role: "INTERNAL", active: true }, orderBy: { name: "asc" } }),
  ]);

  const aircraftIds = allAircraft.map((a) => a.id);
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 86400000);

  const showTasks = !selectedType || selectedType === "task";
  const showExpiry = !selectedType || selectedType === "expiry";
  const showMaintenance = !selectedType || selectedType === "maintenance";

  const [openTasks, overdueTasks, expiringItems, activeMaintenance, allExpiryForCount, allMaintenanceForCount] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          aircraftId: { in: aircraftIds },
          status: { not: "DONE" },
          ...(selectedResponsible ? { assignees: { some: { id: selectedResponsible } } } : {}),
        },
        include: { aircraft: true, assignees: true },
      }),
      prisma.task.findMany({
        where: {
          aircraftId: { in: aircraftIds },
          status: { not: "DONE" },
          dueDate: { lt: now },
          ...(selectedResponsible ? { assignees: { some: { id: selectedResponsible } } } : {}),
        },
        include: { aircraft: true, assignees: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.expiryItem.findMany({
        where: { aircraftId: { in: aircraftIds }, dueDate: { lt: in60Days } },
        include: { aircraft: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.maintenanceEvent.findMany({
        where: { aircraftId: { in: aircraftIds }, status: { in: ["PLANEJADA", "EM_ANDAMENTO"] } },
        include: { aircraft: true, checklistItems: true },
        orderBy: { periodStart: "asc" },
      }),
      prisma.expiryItem.findMany({ where: { aircraftId: { in: aircraftIds } } }),
      prisma.maintenanceEvent.findMany({ where: { aircraftId: { in: aircraftIds }, status: { not: "CONCLUIDA" } } }),
    ]);

  const expiredCount = allExpiryForCount.filter((e) => expiryStatus(e.dueDate) === "VENCIDO").length;
  const dueSoon30 = allExpiryForCount.filter((e) => {
    const s = expiryStatus(e.dueDate);
    return s !== "VENCIDO" && daysUntil(e.dueDate) <= 30;
  }).length;
  const dueSoon60 = allExpiryForCount.filter((e) => {
    const s = expiryStatus(e.dueDate);
    return s !== "VENCIDO" && daysUntil(e.dueDate) <= 60;
  }).length;

  const overdueByResponsible = new Map<string, { name: string; color: string; tasks: typeof overdueTasks }>();
  for (const t of overdueTasks) {
    const members = t.assignees.length > 0 ? t.assignees : [{ id: "sem-responsavel", name: "Sem responsável", color: "#8a94a6" }];
    for (const member of members) {
      if (!overdueByResponsible.has(member.id)) overdueByResponsible.set(member.id, { name: member.name, color: member.color, tasks: [] });
      overdueByResponsible.get(member.id)!.tasks.push(t);
    }
  }

  const pendingByAircraft = allAircraft.map((a) => {
    const tasksCount = openTasks.filter((t) => t.aircraftId === a.id).length;
    const expiryCount = allExpiryForCount.filter(
      (e) => e.aircraftId === a.id && expiryStatus(e.dueDate) !== "EM_DIA"
    ).length;
    const maintCount = allMaintenanceForCount.filter((m) => m.aircraftId === a.id).length;
    return { aircraft: a, tasksCount, expiryCount, maintCount, total: tasksCount + expiryCount + maintCount };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Painel geral</h1>
        <p className="text-sm text-muted mt-0.5">
          Olá, {session.name.split(" ")[0]} —{" "}
          {selectedAircraft === "mine"
            ? "mostrando as aeronaves que você cuida."
            : "visão consolidada da frota TB Aviation."}
        </p>
      </div>

      <DashboardFilters
        aircraftOptions={accessibleAircraft.map((a) => ({ id: a.id, label: `${a.registration} · ${a.model}` }))}
        responsibleOptions={responsibles.map((r) => ({ id: r.id, label: r.name }))}
        defaultAircraft={selectedAircraft}
        showMineOption={hasOwnAircraft}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tarefas em aberto" value={openTasks.length} icon={ClipboardList} tone="brand" />
        <StatCard label="Tarefas atrasadas" value={overdueTasks.length} icon={AlertTriangle} tone={overdueTasks.length ? "danger" : "success"} />
        <StatCard label="Vencendo em 30 dias" value={dueSoon30} icon={CalendarClock} tone={dueSoon30 ? "warning" : "success"} />
        <StatCard label="Itens vencidos" value={expiredCount} icon={AlertTriangle} tone={expiredCount ? "danger" : "success"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {showExpiry && (
          <SectionCard
            title="Vencimentos — próximos 30/60 dias"
            action={<span className="text-xs text-muted">{dueSoon60} nos próximos 60 dias</span>}
          >
            {expiringItems.length === 0 ? (
              <EmptyState icon={CheckCircle2} text="Nenhum vencimento próximo." />
            ) : (
              <ul className="flex flex-col divide-y divide-border -m-4">
                {expiringItems.slice(0, 8).map((item) => {
                  const status = expiryStatus(item.dueDate);
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted truncate">
                          {item.aircraft.registration} · {EXPIRY_CATEGORY_LABEL[item.category]} · vence em {formatDate(item.dueDate)}
                        </p>
                      </div>
                      <Badge tone={expiryStatusTone(status)}>{EXPIRY_STATUS_LABEL[status]}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        )}

        {showTasks && (
          <SectionCard title="Tarefas atrasadas por responsável">
            {overdueByResponsible.size === 0 ? (
              <EmptyState icon={CheckCircle2} text="Nenhuma tarefa atrasada. 🎉" />
            ) : (
              <div className="flex flex-col gap-3">
                {[...overdueByResponsible.values()].map((group) => (
                  <div key={group.name} className="flex items-start gap-3">
                    <span
                      className="flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: group.color }}
                    >
                      {group.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {group.name} <span className="text-muted font-normal">· {group.tasks.length} atrasada(s)</span>
                      </p>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {group.tasks.slice(0, 3).map((t) => (
                          <li key={t.id} className="text-xs text-muted truncate">
                            {t.title} — {t.aircraft.registration} · venceu em {formatDate(t.dueDate)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {showMaintenance && (
          <SectionCard title="Manutenções programadas em andamento">
            {activeMaintenance.length === 0 ? (
              <EmptyState icon={CheckCircle2} text="Nenhuma manutenção ativa." />
            ) : (
              <ul className="flex flex-col divide-y divide-border -m-4">
                {activeMaintenance.map((m) => {
                  const done = m.checklistItems.filter((c) => c.done).length;
                  const total = m.checklistItems.length;
                  return (
                    <li key={m.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                          <p className="text-xs text-muted truncate">
                            {m.aircraft.registration} ·{" "}
                            {m.periodStart ? `${formatDate(m.periodStart)} — ${formatDate(m.periodEnd)}` : "sem período definido"}
                          </p>
                        </div>
                        {isMaintenanceOverdue(m.periodEnd, m.status) ? (
                          <Badge tone="danger">Atrasada</Badge>
                        ) : (
                          <Badge tone={m.status === "EM_ANDAMENTO" ? "brand" : "neutral"}>{MAINTENANCE_STATUS_LABEL[m.status]}</Badge>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full bg-brand-blue" style={{ width: `${(done / total) * 100}%` }} />
                          </div>
                          <span className="text-xs text-muted shrink-0">
                            {done}/{total}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        )}

        <SectionCard title="Pendências por aeronave">
          <ul className="flex flex-col divide-y divide-border -m-4">
            {pendingByAircraft.map(({ aircraft, tasksCount, expiryCount, maintCount, total }) => (
              <li key={aircraft.id}>
                <Link
                  href={`/aircraft/${aircraft.id}/tarefas`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {aircraft.registration} <span className="text-muted font-normal">· {aircraft.model}</span>
                    </p>
                    <p className="text-xs text-muted truncate">
                      {tasksCount} tarefa(s) · {expiryCount} vencimento(s) · {maintCount} manutenção(ões)
                    </p>
                  </div>
                  <Badge tone={total > 0 ? "warning" : "success"}>{total} pendência(s)</Badge>
                </Link>
              </li>
            ))}
            {pendingByAircraft.length === 0 && <EmptyState icon={Wrench} text="Nenhuma aeronave cadastrada." />}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <Icon className="size-6 text-muted" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
