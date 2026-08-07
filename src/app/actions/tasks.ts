"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { assertAircraftWrite } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { TASK_STATUS_LABEL } from "@/lib/status";
import { assertDocumentFile, readUploadedFile } from "@/lib/uploads";
import type { ActionState } from "./aircraft";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Informe um título"),
  description: z.string().trim().optional(),
  assigneeIds: z.array(z.string()).default([]),
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
    assigneeIds: formData.getAll("assigneeIds"),
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
      assignees: { connect: parsed.data.assigneeIds.map((id) => ({ id })) },
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

/** Same as createTask, but reads the aircraft from the form itself for use on the global /tasks page. */
export async function createGlobalTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const aircraftId = formData.get("aircraftId");
  if (typeof aircraftId !== "string" || !aircraftId) return { error: "Selecione uma aeronave" };
  return createTask(aircraftId, _prev, formData);
}

export async function updateTask(taskId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const existing = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await assertAircraftWrite(session, existing.aircraftId);

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assigneeIds: formData.getAll("assigneeIds"),
    startDate: formData.get("startDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      assignees: { set: parsed.data.assigneeIds.map((id) => ({ id })) },
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

export async function uploadAttachment(taskId: string, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  await assertAircraftWrite(session, task.aircraftId);

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Selecione um arquivo" };
  const fileError = assertDocumentFile(file);
  if (fileError) return { error: fileError };

  const { data, mimeType, size } = await readUploadedFile(file);

  await prisma.attachment.create({
    data: {
      taskId,
      filename: file.name,
      mimeType,
      data,
      size,
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
      attachments: {
        select: { id: true, filename: true, size: true, createdAt: true, uploader: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "Task", entityId: taskId },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return {
    task: {
      ...task,
      attachments: task.attachments.map((a) => ({ ...a, url: `/api/files/task/${a.id}` })),
    },
    auditLogs,
  };
}

export async function deleteAttachment(attachmentId: string) {
  const session = await requireSession();
  const attachment = await prisma.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
    select: { task: { select: { aircraftId: true } } },
  });
  await assertAircraftWrite(session, attachment.task.aircraftId);

  await prisma.attachment.delete({ where: { id: attachmentId } });
  revalidateAircraft(attachment.task.aircraftId);
}
