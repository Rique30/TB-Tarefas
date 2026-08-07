import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AircraftTabs } from "@/components/AircraftTabs";
import { EditAircraftButton } from "@/components/AircraftFormModal";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { ResponsibleAvatars } from "@/components/ResponsibleAvatars";
import { uploadAircraftAttachment, deleteAircraftAttachment } from "@/app/actions/aircraft";

export default async function AircraftDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const [aircraft, teamMembers] = await Promise.all([
    prisma.aircraft.findUnique({
      where: { id },
      include: { attachments: { orderBy: { createdAt: "desc" } }, responsibles: true },
    }),
    prisma.user.findMany({ where: { role: "INTERNAL", active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!aircraft) notFound();

  let canEdit = session.role === "INTERNAL";
  if (session.role === "CLIENT") {
    const grant = await prisma.aircraftAccess.findUnique({
      where: { userId_aircraftId: { userId: session.id, aircraftId: id } },
    });
    if (!grant) notFound();
    canEdit = grant.canEdit;
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
          {aircraft.responsibles.length > 0 && (
            <div className="mt-2">
              <ResponsibleAvatars people={aircraft.responsibles} size="md" />
            </div>
          )}
        </div>
        {session.role === "INTERNAL" && (
          <EditAircraftButton
            aircraft={aircraft}
            teamOptions={teamMembers.map((u) => ({ id: u.id, name: u.name }))}
          />
        )}
      </div>

      {aircraft.notes && <p className="text-sm text-muted bg-surface border border-border rounded-lg px-3 py-2">{aircraft.notes}</p>}

      <details className="bg-surface border border-border rounded-lg px-3 py-2.5">
        <summary className="text-sm font-medium text-foreground cursor-pointer select-none">
          Documentos da aeronave ({aircraft.attachments.length})
        </summary>
        <div className="mt-3">
          <AttachmentsPanel
            title=""
            attachments={aircraft.attachments.map((a) => ({ id: a.id, filename: a.filename, url: a.url, size: a.size }))}
            canEdit={canEdit}
            onUpload={uploadAircraftAttachment.bind(null, aircraft.id)}
            onDelete={deleteAircraftAttachment}
          />
        </div>
      </details>

      <AircraftTabs aircraftId={aircraft.id} />

      {children}
    </div>
  );
}
