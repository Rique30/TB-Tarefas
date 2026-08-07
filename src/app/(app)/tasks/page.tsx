import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getAccessibleAircraftIds } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge, taskStatusTone } from "@/components/Badge";
import { TASK_STATUS_LABEL, formatDate, isTaskOverdue } from "@/lib/status";
import { TasksFilterBar } from "@/components/TasksFilterBar";

export default async function GlobalTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ aircraft?: string; status?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const accessible = await getAccessibleAircraftIds(session);

  const [aircraftList, tasks] = await Promise.all([
    prisma.aircraft.findMany({
      where: { active: true, ...(accessible ? { id: { in: accessible } } : {}) },
      orderBy: { registration: "asc" },
    }),
    prisma.task.findMany({
      where: {
        ...(accessible ? { aircraftId: { in: accessible } } : {}),
        ...(params.aircraft ? { aircraftId: params.aircraft } : {}),
        ...(params.status ? { status: params.status as "TODO" | "IN_PROGRESS" | "DONE" } : {}),
      },
      include: { assignee: true, aircraft: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const grouped = new Map<string, { name: string; color: string; tasks: typeof tasks }>();
  for (const t of tasks) {
    const key = t.assignee?.id ?? "sem-responsavel";
    const name = t.assignee?.name ?? "Sem responsável";
    const color = t.assignee?.color ?? "#8a94a6";
    if (!grouped.has(key)) grouped.set(key, { name, color, tasks: [] });
    grouped.get(key)!.tasks.push(t);
  }
  const groups = [...grouped.values()].sort((a, b) => b.tasks.length - a.tasks.length);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Tarefas — visão por responsável</h1>
        <p className="text-sm text-muted mt-0.5">Quem está com o quê, em toda a frota.</p>
      </div>

      <TasksFilterBar aircraftOptions={aircraftList.map((a) => ({ id: a.id, label: `${a.registration} · ${a.model}` }))} />

      <div className="grid md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <div key={group.name} className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <span
                className="flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white shrink-0"
                style={{ backgroundColor: group.color }}
              >
                {group.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-foreground">{group.name}</span>
              <span className="text-xs text-muted ml-auto">{group.tasks.length} tarefa(s)</span>
            </div>
            <ul className="divide-y divide-border">
              {group.tasks.map((t) => {
                const overdue = isTaskOverdue(t.dueDate, t.status);
                return (
                  <li key={t.id}>
                    <Link
                      href={`/aircraft/${t.aircraftId}/tarefas?task=${t.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                        <p className="text-xs text-muted truncate">
                          {t.aircraft.registration}
                          {t.dueDate && <> · prazo {formatDate(t.dueDate)}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {overdue && <Badge tone="danger">Atrasada</Badge>}
                        <Badge tone={taskStatusTone(t.status)}>{TASK_STATUS_LABEL[t.status]}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="col-span-full text-center text-muted py-12">Nenhuma tarefa encontrada para os filtros selecionados.</p>
        )}
      </div>
    </div>
  );
}
