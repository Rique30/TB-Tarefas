import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export async function logAudit(params: {
  entityType: "Task" | "ExpiryItem" | "MaintenanceEvent" | "Aircraft";
  entityId: string;
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  user: SessionUser;
}) {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      field: params.field,
      oldValue: params.oldValue ?? undefined,
      newValue: params.newValue ?? undefined,
      userId: params.user.id,
      userName: params.user.name,
    },
  });
}
