"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe a senha"),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { email, password, next } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) {
    return { error: "E-mail ou senha inválidos" };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "E-mail ou senha inválidos" };
  }

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    color: user.color,
  });

  redirect(next && next.startsWith("/") ? next : "/");
}
