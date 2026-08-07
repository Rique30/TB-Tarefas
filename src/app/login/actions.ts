"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

const DEFAULT_EMAIL_DOMAIN = "tbaviation.com.br";

const schema = z.object({
  email: z.string().trim().min(1, "Informe seu usuário ou e-mail"),
  password: z.string().min(1, "Informe a senha"),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

/** Aceita tanto o e-mail completo quanto apenas a parte antes do "@" (ex: "ltavares"). */
function resolveLoginEmail(identifier: string) {
  const trimmed = identifier.toLowerCase().trim();
  return trimmed.includes("@") ? trimmed : `${trimmed}@${DEFAULT_EMAIL_DOMAIN}`;
}

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

  const user = await prisma.user.findUnique({ where: { email: resolveLoginEmail(email) } });
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
