import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AircraftTabs } from "@/components/AircraftTabs";
import { EditAircraftButton } from "@/components/AircraftFormModal";

export default async function AircraftDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const aircraft = await prisma.aircraft.findUnique({ where: { id } });
  if (!aircraft) notFound();

  if (session.role === "CLIENT") {
    const grant = await prisma.aircraftAccess.findUnique({
      where: { userId_aircraftId: { userId: session.id, aircraftId: id } },
    });
    if (!grant) notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Ficha da aeronave</p>
          <h1 className="text-xl font-semibold text-foreground">
            {aircraft.registration} <span className="text-muted font-normal">· {aircraft.model}</span>
          </h1>
          {aircraft.nickname && <p className="text-sm text-muted">{aircraft.nickname}</p>}
        </div>
        {session.role === "INTERNAL" && <EditAircraftButton aircraft={aircraft} />}
      </div>

      {aircraft.notes && <p className="text-sm text-muted bg-surface border border-border rounded-lg px-3 py-2">{aircraft.notes}</p>}

      <AircraftTabs aircraftId={aircraft.id} />

      {children}
    </div>
  );
}
