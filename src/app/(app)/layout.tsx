import { requireSession } from "@/lib/auth";
import { getAccessibleAircraftIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const accessible = await getAccessibleAircraftIds(session);

  const aircraftList = await prisma.aircraft.findMany({
    where: { active: true, ...(accessible ? { id: { in: accessible } } : {}) },
    orderBy: { registration: "asc" },
    select: { id: true, registration: true, model: true },
  });

  return (
    <AppShell session={session} aircraftList={aircraftList}>
      {children}
    </AppShell>
  );
}
