"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertAircraftWrite } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { assertDocumentFile, saveUploadedFile } from "@/lib/uploads";
import type { ActionState } from "./aircraft";

const expirySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do item"),
  category: z.enum(["PORTE_OBRIGATORIO", "EQUIPAMENTO"]),
  dueDate: z.string().min(1, "Informe a data de vencimento"),
  notifyDaysBefore: z.coerce.number().int().min(1).max(365).default(30),
  notes: z.string().trim().optional(),
});

function revalidate(aircraftId: string) {
  revalidatePath(`/aircraft/${aircraftId}/vencimentos`);
  revalidatePath("/");
}

export async function createExpiryItem(aircraftId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  await assertAircraftWrite(session, aircraftId);

  const parsed = expirySchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    dueDate: formData.get("dueDate"),
    notifyDaysBefore: formData.get("notifyDaysBefore") || 30,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const item = await prisma.expiryItem.create({
    data: { ...parsed.data, dueDate: new Date(parsed.data.dueDate), aircraftId },
  });
  await logAudit({ entityType: "ExpiryItem", entityId: item.id, action: "CREATED", user: session });

  revalidate(aircraftId);
  return { success: true };
}

export async function updateExpiryItem(itemId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const existing = await prisma.expiryItem.findUniqueOrThrow({ where: { id: itemId } });
  await assertAircraftWrite(session, existing.aircraftId);

  const parsed = expirySchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    dueDate: formData.get("dueDate"),
    notifyDaysBefore: formData.get("notifyDaysBefore") || 30,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.expiryItem.update({
    where: { id: itemId },
    data: { ...parsed.data, dueDate: new Date(parsed.data.dueDate) },
  });
  await logAudit({
    entityType: "ExpiryItem",
    entityId: itemId,
    action: "UPDATED",
    field: "dueDate",
    oldValue: existing.dueDate.toISOString(),
    newValue: parsed.data.dueDate,
    user: session,
  });

  revalidate(existing.aircraftId);
  return { success: true };
}

export async function deleteExpiryItem(itemId: string) {
  const session = await requireSession();
  const existing = await prisma.expiryItem.findUniqueOrThrow({ where: { id: itemId } });
  await assertAircraftWrite(session, existing.aircraftId);

  await prisma.expiryItem.delete({ where: { id: itemId } });
  await logAudit({ entityType: "ExpiryItem", entityId: itemId, action: "DELETED", user: session });
  revalidate(existing.aircraftId);
}

export async function uploadExpiryAttachment(itemId: string, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const item = await prisma.expiryItem.findUniqueOrThrow({ where: { id: itemId } });
  await assertAircraftWrite(session, item.aircraftId);

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Selecione um arquivo" };
  const error = assertDocumentFile(file);
  if (error) return { error };

  const { url, size } = await saveUploadedFile(file);
  await prisma.expiryAttachment.create({
    data: { expiryItemId: itemId, filename: file.name, url, size, uploadedBy: session.id },
  });
  await logAudit({ entityType: "ExpiryItem", entityId: itemId, action: "ATTACHMENT_ADDED", newValue: file.name, user: session });

  revalidate(item.aircraftId);
  return { success: true };
}

export async function deleteExpiryAttachment(attachmentId: string) {
  const session = await requireSession();
  const attachment = await prisma.expiryAttachment.findUniqueOrThrow({
    where: { id: attachmentId },
    include: { expiryItem: true },
  });
  await assertAircraftWrite(session, attachment.expiryItem.aircraftId);

  await prisma.expiryAttachment.delete({ where: { id: attachmentId } });
  revalidate(attachment.expiryItem.aircraftId);
}
