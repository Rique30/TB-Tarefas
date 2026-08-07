"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const aircraftSchema = z.object({
  registration: z.string().trim().min(2, "Informe a matrícula").toUpperCase(),
  model: z.string().trim().min(1, "Informe o modelo"),
  nickname: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ActionState = { error?: string; success?: boolean };

export async function createAircraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireInternal();
  const parsed = aircraftSchema.safeParse({
    registration: formData.get("registration"),
    model: formData.get("model"),
    nickname: formData.get("nickname") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existing = await prisma.aircraft.findUnique({ where: { registration: parsed.data.registration } });
  if (existing) return { error: "Já existe uma aeronave com essa matrícula" };

  const aircraft = await prisma.aircraft.create({ data: parsed.data });
  await logAudit({ entityType: "Aircraft", entityId: aircraft.id, action: "CREATED", user: session });

  revalidatePath("/aircraft");
  revalidatePath("/");
  return { success: true };
}

export async function updateAircraft(aircraftId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireInternal();
  const parsed = aircraftSchema.safeParse({
    registration: formData.get("registration"),
    model: formData.get("model"),
    nickname: formData.get("nickname") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.aircraft.update({ where: { id: aircraftId }, data: parsed.data });
  await logAudit({ entityType: "Aircraft", entityId: aircraftId, action: "UPDATED", user: session });

  revalidatePath("/aircraft");
  revalidatePath(`/aircraft/${aircraftId}`);
  return { success: true };
}

export async function setAircraftActive(aircraftId: string, active: boolean) {
  const session = await requireInternal();
  await prisma.aircraft.update({ where: { id: aircraftId }, data: { active } });
  await logAudit({
    entityType: "Aircraft",
    entityId: aircraftId,
    action: active ? "REACTIVATED" : "ARCHIVED",
    user: session,
  });
  revalidatePath("/aircraft");
  revalidatePath("/");
}
