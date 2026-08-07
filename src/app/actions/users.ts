"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireInternal } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import type { ActionState } from "./aircraft";

const BRAND_COLORS = ["#1f8fe0", "#14285e", "#0f766e", "#b45309", "#7c3aed", "#be185d", "#0891b2", "#4d7c0f"];

function colorFor(seed: string) {
  const idx = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0) % BRAND_COLORS.length;
  return BRAND_COLORS[idx];
}

const userSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  role: z.enum(["INTERNAL", "CLIENT"]),
});

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireInternal();

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Já existe um usuário com esse e-mail" };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
      color: colorFor(parsed.data.name),
    },
  });

  await logAudit({ entityType: "Aircraft", entityId: user.id, action: "USER_CREATED", newValue: user.email, user: session });
  revalidatePath("/users");
  return { success: true };
}

const renameSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome"),
});

export async function updateUserName(userId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireInternal();

  const parsed = renameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const user = await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  await logAudit({ entityType: "Aircraft", entityId: user.id, action: "USER_RENAMED", newValue: user.name, user: session });
  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await requireInternal();
  if (userId === session.id) throw new Error("Você não pode excluir sua própria conta");

  const user = await prisma.user.delete({ where: { id: userId } });
  await logAudit({ entityType: "Aircraft", entityId: userId, action: "USER_DELETED", newValue: user.email, user: session });
  revalidatePath("/users");
}

export async function setUserActive(userId: string, active: boolean) {
  const session = await requireInternal();
  await prisma.user.update({ where: { id: userId }, data: { active } });
  await logAudit({
    entityType: "Aircraft",
    entityId: userId,
    action: active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
    user: session,
  });
  revalidatePath("/users");
}
