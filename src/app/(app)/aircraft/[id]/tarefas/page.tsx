import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskBoard, type BoardTask } from "@/components/TaskBoard";

export default async function AircraftTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const session = await requireSession();
  const { id: aircraftId } = await params;
  const { task: openTaskId } = await searchParams;

  let canEdit = session.role === "INTERNAL";
  if (session.role === "CLIENT") {
    const grant = await prisma.aircraftAccess.findUnique({
      where: { userId_aircraftId: { userId: session.id, aircraftId } },
    });
    canEdit = !!grant?.canEdit;
  }

  const [tasks, teamMembers] = await Promise.all([
    prisma.task.findMany({
      where: { aircraftId },
      include: { assignee: true, checklistItems: true, comments: true, attachments: true },
      orderBy: { order: "asc" },
    }),
    prisma.user.findMany({ where: { role: "INTERNAL", active: true }, orderBy: { name: "asc" } }),
  ]);

  const boardTasks: BoardTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    order: t.order,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    startDate: t.startDate ? t.startDate.toISOString() : null,
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, color: t.assignee.color } : null,
    checklistItems: t.checklistItems.map((c) => ({ id: c.id, done: c.done })),
    comments: t.comments.map((c) => ({ id: c.id })),
    attachments: t.attachments.map((a) => ({ id: a.id })),
  }));

  return (
    <TaskBoard
      aircraftId={aircraftId}
      initialTasks={boardTasks}
      assigneeOptions={teamMembers.map((u) => ({ id: u.id, name: u.name, color: u.color }))}
      canEdit={canEdit}
      openTaskId={openTaskId}
    />
  );
}
