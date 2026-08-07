"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertAircraftWrite } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "./aircraft";

const maintenanceSchema = z.object({
  title: z.string().trim().min(1, "Informe um título"),
  type: z.enum(["PROGRAMADA", "NAO_PROGRAMADA"]),
  scopeDescription: z.string().trim().optional(),
  discrepancy: z.string().trim().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  status: z.enum(["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA"]),
});

function toDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function revalidate(aircraftId: string) {
  revalidatePath(`/aircraft/${aircraftId}/manutencao`);
  revalidatePath("/");
}

export async function createMaintenanceEvent(aircraftId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  await assertAircraftWrite(session, aircraftId);

  const parsed = maintenanceSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    scopeDescription: formData.get("scopeDescription") || undefined,
    discrepancy: formData.get("discrepancy") || undefined,
    periodStart: formData.get("periodStart") || undefined,
    periodEnd: formData.get("periodEnd") || undefined,
    status: formData.get("status") || "PLANEJADA",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const event = await prisma.maintenanceEvent.create({
    data: {
      aircraftId,
      title: parsed.data.title,
      type: parsed.data.type,
      scopeDescription: parsed.data.scopeDescription,
      discrepancy: parsed.data.discrepancy,
      periodStart: toDate(parsed.data.periodStart),
      periodEnd: toDate(parsed.data.periodEnd),
      status: parsed.data.status,
      completedAt: parsed.data.status === "CONCLUIDA" ? new Date() : null,
    },
  });
  await logAudit({ entityType: "MaintenanceEvent", entityId: event.id, action: "CREATED", user: session });

  revalidate(aircraftId);
  return { success: true };
}

export async function updateMaintenanceEvent(eventId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const existing = await prisma.maintenanceEvent.findUniqueOrThrow({ where: { id: eventId } });
  await assertAircraftWrite(session, existing.aircraftId);

  const parsed = maintenanceSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    scopeDescription: formData.get("scopeDescription") || undefined,
    discrepancy: formData.get("discrepancy") || undefined,
    periodStart: formData.get("periodStart") || undefined,
    periodEnd: formData.get("periodEnd") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const becameCompleted = parsed.data.status === "CONCLUIDA" && existing.status !== "CONCLUIDA";

  await prisma.maintenanceEvent.update({
    where: { id: eventId },
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      scopeDescription: parsed.data.scopeDescription,
      discrepancy: parsed.data.discrepancy,
      periodStart: toDate(parsed.data.periodStart),
      periodEnd: toDate(parsed.data.periodEnd),
      status: parsed.data.status,
      completedAt: becameCompleted ? new Date() : parsed.data.status === "CONCLUIDA" ? existing.completedAt : null,
    },
  });

  if (existing.status !== parsed.data.status) {
    await logAudit({
      entityType: "MaintenanceEvent",
      entityId: eventId,
      action: "STATUS_CHANGED",
      field: "status",
      oldValue: existing.status,
      newValue: parsed.data.status,
      user: session,
    });
  }

  revalidate(existing.aircraftId);
  return { success: true };
}

export async function deleteMaintenanceEvent(eventId: string) {
  const session = await requireSession();
  const existing = await prisma.maintenanceEvent.findUniqueOrThrow({ where: { id: eventId } });
  await assertAircraftWrite(session, existing.aircraftId);

  await prisma.maintenanceEvent.delete({ where: { id: eventId } });
  await logAudit({ entityType: "MaintenanceEvent", entityId: eventId, action: "DELETED", user: session });
  revalidate(existing.aircraftId);
}

export async function addMaintenanceChecklistItem(eventId: string, title: string) {
  const session = await requireSession();
  const event = await prisma.maintenanceEvent.findUniqueOrThrow({ where: { id: eventId } });
  await assertAircraftWrite(session, event.aircraftId);
  if (!title.trim()) return;

  const last = await prisma.maintenanceChecklistItem.findFirst({
    where: { maintenanceEventId: eventId },
    orderBy: { order: "desc" },
  });
  await prisma.maintenanceChecklistItem.create({
    data: { maintenanceEventId: eventId, title: title.trim(), order: (last?.order ?? -1) + 1 },
  });
  revalidate(event.aircraftId);
}

export async function toggleMaintenanceChecklistItem(itemId: string, done: boolean) {
  const session = await requireSession();
  const item = await prisma.maintenanceChecklistItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { maintenanceEvent: true },
  });
  await assertAircraftWrite(session, item.maintenanceEvent.aircraftId);

  await prisma.maintenanceChecklistItem.update({ where: { id: itemId }, data: { done } });
  revalidate(item.maintenanceEvent.aircraftId);
}

export async function deleteMaintenanceChecklistItem(itemId: string) {
  const session = await requireSession();
  const item = await prisma.maintenanceChecklistItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { maintenanceEvent: true },
  });
  await assertAircraftWrite(session, item.maintenanceEvent.aircraftId);

  await prisma.maintenanceChecklistItem.delete({ where: { id: itemId } });
  revalidate(item.maintenanceEvent.aircraftId);
}
