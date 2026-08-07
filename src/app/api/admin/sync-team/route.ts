import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// One-off endpoint to bring the production team roster up to date without
// re-running the full seed script (which would duplicate demo tasks/expiry
// items, since those use plain `create`, not `upsert`). Remove after use.
const SYNC_TOKEN = "tb-team-sync-2026-08-07";

const NEW_TEAM = [
  { name: "Gabriela Pereira", email: "gpereira@tbaviation.com.br", color: "#db2777" },
  { name: "Caio Chiavelli", email: "cchiavelli@tbaviation.com.br", color: "#7c3aed" },
  { name: "Thomas Antonelli", email: "tantonelli@tbaviation.com.br", color: "#0369a1" },
  { name: "Henrique Cuin", email: "hcuin@tbaviation.com.br", color: "#ca8a04" },
  { name: "Matheus Gonzalez", email: "mgonzalez@tbaviation.com.br", color: "#059669" },
  { name: "Rafael Braz", email: "rbraz@tbaviation.com.br", color: "#9333ea" },
  { name: "Rafael Henrique Leonardi", email: "rleonardi@tbaviation.com.br", color: "#dc2626" },
];

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== SYNC_TOKEN) return new Response("Forbidden", { status: 403 });

  const passwordHash = await bcrypt.hash("1234", 10);
  const created: string[] = [];
  for (const member of NEW_TEAM) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: { name: member.name, email: member.email, passwordHash, role: "INTERNAL", color: member.color },
    });
    created.push(user.email);
  }

  const deactivated = await prisma.user.updateMany({
    where: { email: "henriquets.2628@gmail.com" },
    data: { active: false },
  });

  return Response.json({ created, deactivatedCount: deactivated.count });
}
