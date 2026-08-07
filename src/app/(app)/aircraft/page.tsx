import Link from "next/link";
import { Plane } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getAccessibleAircraftIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NewAircraftButton } from "@/components/AircraftFormModal";
import { ResponsibleAvatars } from "@/components/ResponsibleAvatars";
import { expiryStatus } from "@/lib/status";
import { Badge } from "@/components/Badge";

export default async function AircraftListPage() {
  const session = await requireSession();
  const accessible = await getAccessibleAircraftIds(session);

  const [aircraftList, teamMembers] = await Promise.all([
    prisma.aircraft.findMany({
      where: { active: true, ...(accessible ? { id: { in: accessible } } : {}) },
      orderBy: { registration: "asc" },
      include: {
        tasks: { where: { status: { not: "DONE" } }, select: { id: true } },
        expiryItems: { select: { id: true, dueDate: true } },
        maintenanceEvents: { where: { status: { not: "CONCLUIDA" } }, select: { id: true } },
        responsibles: true,
      },
    }),
    prisma.user.findMany({ where: { role: "INTERNAL", active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Frota</h1>
          <p className="text-sm text-muted mt-0.5">{aircraftList.length} aeronave(s) na frota TB Aviation.</p>
        </div>
        {session.role === "INTERNAL" && (
          <NewAircraftButton teamOptions={teamMembers.map((u) => ({ id: u.id, name: u.name }))} />
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {aircraftList.map((a) => {
          const expiryAlerts = a.expiryItems.filter((e) => expiryStatus(e.dueDate) !== "EM_DIA").length;
          return (
            <Link
              key={a.id}
              href={`/aircraft/${a.id}/tarefas`}
              className="group bg-surface border border-border rounded-xl p-5 hover:border-brand-blue hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-navy text-white shrink-0">
                  <Plane className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate group-hover:text-brand-blue">{a.registration}</p>
                  <p className="text-sm text-muted truncate">{a.model}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={a.tasks.length ? "brand" : "neutral"}>{a.tasks.length} tarefa(s)</Badge>
                <Badge tone={expiryAlerts ? "warning" : "success"}>{expiryAlerts} vencimento(s)</Badge>
                <Badge tone={a.maintenanceEvents.length ? "brand" : "neutral"}>{a.maintenanceEvents.length} manutenção(ões)</Badge>
              </div>
              {a.responsibles.length > 0 && (
                <div className="mt-3">
                  <ResponsibleAvatars people={a.responsibles} />
                </div>
              )}
            </Link>
          );
        })}
        {aircraftList.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center text-muted">
            <Plane className="size-8" />
            <p>Nenhuma aeronave cadastrada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
