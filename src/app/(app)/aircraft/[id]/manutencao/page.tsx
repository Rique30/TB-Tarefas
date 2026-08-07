import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaintenanceList } from "@/components/MaintenanceList";
import { NewMaintenanceButton } from "@/components/MaintenanceFormModal";

export default async function AircraftMaintenancePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id: aircraftId } = await params;

  let canEdit = session.role === "INTERNAL";
  if (session.role === "CLIENT") {
    const grant = await prisma.aircraftAccess.findUnique({
      where: { userId_aircraftId: { userId: session.id, aircraftId } },
    });
    canEdit = !!grant?.canEdit;
  }

  const events = await prisma.maintenanceEvent.findMany({
    where: { aircraftId },
    include: { checklistItems: { orderBy: { order: "asc" } } },
    orderBy: [{ status: "asc" }, { periodStart: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Manutenção programada e não programada, com escopo, checklist e histórico.</p>
        {canEdit && <NewMaintenanceButton aircraftId={aircraftId} />}
      </div>
      <MaintenanceList
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          status: e.status,
          scopeDescription: e.scopeDescription,
          discrepancy: e.discrepancy,
          periodStart: e.periodStart ? e.periodStart.toISOString() : null,
          periodEnd: e.periodEnd ? e.periodEnd.toISOString() : null,
          completedAt: e.completedAt ? e.completedAt.toISOString() : null,
          checklistItems: e.checklistItems.map((c) => ({ id: c.id, title: c.title, done: c.done })),
        }))}
        canEdit={canEdit}
      />
    </div>
  );
}
