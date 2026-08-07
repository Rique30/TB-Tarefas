"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertAircraftWrite } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { TASK_STATUS_LABEL } from "@/lib/status";
import type { ActionState } from "./aircraft";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Informe um título"),
  description: z.string().trim().optional(),
  assigneeId: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

function toDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function revalidateAircraft(aircraftId: string) {
  revalidatePath(`/aircraft/${aircraftId}/tarefas`);
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function createTask(aircraftId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  await assertAircraftWrite(session, aircraftId);

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    startDate: formData.get("startDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const last = await prisma.task.findFirst({
    where: { aircraftId, status: "TODO" },
    orderBy: { order: "desc" },
  });

  const task = await prisma.task.create({
    data: {
      aircraftId,
      title: parsed.data.title,
      description: parsed.data.description,
      assigneeId: parsed.data.assigneeId || null,
      startDate: toDate(parsed.data.startDate),
      dueDate: toDate(parsed.data.dueDate),
      status: "TODO",
      order: (last?.order ?? -1) + 1,
      createdById: session.id,
    },
  });

  await logAudit({ entityType: "Task", entityId: task.id, action: "CREATED", user: session });
  revalidateAircraft(aircraftId);
  return { success: true };
}

export async function updateTask(taskId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const existing = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await assertAircraftWrite(session, existing.aircraftId);

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    startDate: formData.get("startDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      assigneeId: parsed.data.assigneeId || null,
      startDate: toDate(parsed.data.startDate),
      dueDate: toDate(parsed.data.dueDate),
    },
  });

  await logAudit({ entityType: "Task", entityId: taskId, action: "UPDATED", user: session });
  revalidateAircraft(existing.aircraftId);
  return { success: true };
}

export async function moveTask(taskId: string, status: "TODO" | "IN_PROGRESS" | "DONE", order: number) {
  const session = await requireSession();
  const existing = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await assertAircraftWrite(session, existing.aircraftId);

  await prisma.task.update({ where: { id: taskId }, data: { status, order } });

  if (existing.status !== status) {
    await logAudit({
      entityType: "Task",
      entityId: taskId,
      action: "STATUS_CHANGED",
      field: "status",
      oldValue: TASK_STATUS_LABEL[existing.status],
      newValue: TASK_STATUS_LABEL[status],
      user: session,
    });
  }

  revalidateAircraft(existing.aircraftId);
}

export async function deleteTask(taskId: string) {
  const session = await requireSession();
  const existing = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await assertAircraftWrite(session, existing.aircraftId);

  await prisma.task.delete({ where: { id: taskId } });
  await logAudit({ entityType: "Task", entityId: taskId, action: "DELETED", user: session });
  revalidateAircraft(existing.aircraftId);
}

export async function addChecklistItem(taskId: string, title: string) {
  const session = await requireSession();
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await assertAircraftWrite(session, task.aircraftId);
  if (!title.trim()) return;

  const last = await prisma.checklistItem.findFirst({ where: { taskId }, orderBy: { order: "desc" } });
  await prisma.checklistItem.create({
    data: { taskId, title: title.trim(), order: (last?.order ?? -1) + 1 },
  });
  revalidateAircraft(task.aircraftId);
}

export async function toggleChecklistItem(itemId: string, done: boolean) {
  const session = await requireSession();
  const item = await prisma.checklistItem.findUniqueOrThrow({ where: { id: itemId }, include: { task: true } });
  await assertAircraftWrite(session, item.task.aircraftId);

  await prisma.checklistItem.update({ where: { id: itemId }, data: { done } });
  revalidateAircraft(item.task.aircraftId);
}

export async function deleteChecklistItem(itemId: string) {
  const session = await requireSession();
  const item = await prisma.checklistItem.findUniqueOrThrow({ where: { id: itemId }, include: { task: true } });
  await assertAircraftWrite(session, item.task.aircraftId);

  await prisma.checklistItem.delete({ where: { id: itemId } });
  revalidateAircraft(item.task.aircraftId);
}

export async function addComment(taskId: string, body: string) {
  const session = await requireSession();
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await assertAircraftWrite(session, task.aircraftId);
  if (!body.trim()) return;

  await prisma.comment.create({ data: { taskId, authorId: session.id, body: body.trim() } });
  await logAudit({ entityType: "Task", entityId: taskId, action: "COMMENTED", user: session });
  revalidateAircraft(task.aircraftId);
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export async function uploadAttachment(taskId: string, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await assertAircraftWrite(session, task.aircraftId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione um arquivo" };
  if (file.size > MAX_ATTACHMENT_BYTES) return { error: "Arquivo maior que 10MB" };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, uniqueName), buffer);

  await prisma.attachment.create({
    data: {
      taskId,
      filename: file.name,
      url: `/uploads/${uniqueName}`,
      size: file.size,
      uploadedBy: session.id,
    },
  });

  await logAudit({ entityType: "Task", entityId: taskId, action: "ATTACHMENT_ADDED", newValue: file.name, user: session });
  revalidateAircraft(task.aircraftId);
  return { success: true };
}

export async function getTaskDetail(taskId: string) {
  await requireSession();
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      checklistItems: { orderBy: { order: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      attachments: { include: { uploader: true }, orderBy: { createdAt: "desc" } },
    },
  });
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "Task", entityId: taskId },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return { task, auditLogs };
}

export async function deleteAttachment(attachmentId: string) {
  const session = await requireSession();
  const attachment = await prisma.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
    include: { task: true },
  });
  await assertAircraftWrite(session, attachment.task.aircraftId);

  await prisma.attachment.delete({ where: { id: attachmentId } });
  revalidateAircraft(attachment.task.aircraftId);
}
