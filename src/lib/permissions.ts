import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

/** Returns null for internal users (full access), or the list of aircraft ids a client may see. */
export async function getAccessibleAircraftIds(session: SessionUser): Promise<string[] | null> {
  if (session.role === "INTERNAL") return null;
  const grants = await prisma.aircraftAccess.findMany({
    where: { userId: session.id },
    select: { aircraftId: true },
  });
  return grants.map((g) => g.aircraftId);
}

export async function assertAircraftRead(session: SessionUser, aircraftId: string) {
  if (session.role === "INTERNAL") return true;
  const grant = await prisma.aircraftAccess.findUnique({
    where: { userId_aircraftId: { userId: session.id, aircraftId } },
  });
  if (!grant) throw new Error("Acesso negado a esta aeronave");
  return true;
}

export async function assertAircraftWrite(session: SessionUser, aircraftId: string) {
  if (session.role === "INTERNAL") return true;
  const grant = await prisma.aircraftAccess.findUnique({
    where: { userId_aircraftId: { userId: session.id, aircraftId } },
  });
  if (!grant || !grant.canEdit) throw new Error("Acesso somente leitura para esta aeronave");
  return true;
}

export function assertInternal(session: SessionUser) {
  if (session.role !== "INTERNAL") throw new Error("Acao restrita a equipe interna");
}
