import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExpiryTable } from "@/components/ExpiryTable";
import { NewExpiryItemButton } from "@/components/ExpiryFormModal";

export default async function AircraftExpiryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id: aircraftId } = await params;

  let canEdit = session.role === "INTERNAL";
  if (session.role === "CLIENT") {
    const grant = await prisma.aircraftAccess.findUnique({
      where: { userId_aircraftId: { userId: session.id, aircraftId } },
    });
    canEdit = !!grant?.canEdit;
  }

  const items = await prisma.expiryItem.findMany({ where: { aircraftId }, orderBy: { dueDate: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Controle de vencimentos: portes obrigatórios e equipamentos com validade.</p>
        {canEdit && <NewExpiryItemButton aircraftId={aircraftId} />}
      </div>
      <ExpiryTable
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          dueDate: i.dueDate.toISOString(),
          notifyDaysBefore: i.notifyDaysBefore,
          notes: i.notes,
        }))}
        canEdit={canEdit}
      />
    </div>
  );
}
