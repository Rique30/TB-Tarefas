import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

/**
 * One-time setup endpoint: populates an empty database with the TB Aviation
 * team, sample aircraft, tasks, expiry items and maintenance events.
 * Refuses to run if the database already has any users, so it can't be used
 * to duplicate data. Requires the SESSION_SECRET as a bearer token.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (!secret || secret !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return NextResponse.json({ error: "database already has users, refusing to seed again" }, { status: 409 });
  }

  const summary = await seedDatabase(prisma);
  return NextResponse.json({ ok: true, summary });
}
