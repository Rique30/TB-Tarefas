import { requireSession } from "@/lib/auth";
import { assertAircraftRead } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: RouteContext<"/api/files/[type]/[id]">) {
  const session = await requireSession();
  const { type, id } = await ctx.params;

  const record = await loadAttachment(type, id);
  if (!record) return new Response("Não encontrado", { status: 404 });

  try {
    await assertAircraftRead(session, record.aircraftId);
  } catch {
    return new Response("Acesso negado", { status: 403 });
  }

  return new Response(record.data, {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(record.filename)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

async function loadAttachment(type: string, id: string) {
  switch (type) {
    case "task": {
      const a = await prisma.attachment.findUnique({ where: { id }, include: { task: true } });
      if (!a) return null;
      return { data: a.data, mimeType: a.mimeType, filename: a.filename, aircraftId: a.task.aircraftId };
    }
    case "expiry": {
      const a = await prisma.expiryAttachment.findUnique({ where: { id }, include: { expiryItem: true } });
      if (!a) return null;
      return { data: a.data, mimeType: a.mimeType, filename: a.filename, aircraftId: a.expiryItem.aircraftId };
    }
    case "maintenance": {
      const a = await prisma.maintenanceAttachment.findUnique({ where: { id }, include: { maintenanceEvent: true } });
      if (!a) return null;
      return { data: a.data, mimeType: a.mimeType, filename: a.filename, aircraftId: a.maintenanceEvent.aircraftId };
    }
    case "aircraft": {
      const a = await prisma.aircraftAttachment.findUnique({ where: { id } });
      if (!a) return null;
      return { data: a.data, mimeType: a.mimeType, filename: a.filename, aircraftId: a.aircraftId };
    }
    default:
      return null;
  }
}
