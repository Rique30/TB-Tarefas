"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MessageSquare, Paperclip, CheckSquare } from "lucide-react";
import { clsx } from "clsx";
import { moveTask } from "@/app/actions/tasks";
import { TASK_STATUS_LABEL, formatDate, isTaskOverdue } from "@/lib/status";
import { NewTaskModal } from "@/components/TaskFormModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { useSyncedState } from "@/lib/useSyncedState";

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  order: number;
  dueDate: string | null;
  startDate: string | null;
  assignees: { id: string; name: string; color: string }[];
  checklistItems: { id: string; done: boolean }[];
  comments: { id: string }[];
  attachments: { id: string }[];
};

const COLUMNS: { key: BoardTask["status"]; label: string }[] = [
  { key: "TODO", label: TASK_STATUS_LABEL.TODO },
  { key: "IN_PROGRESS", label: TASK_STATUS_LABEL.IN_PROGRESS },
  { key: "DONE", label: TASK_STATUS_LABEL.DONE },
];

export function TaskBoard({
  aircraftId,
  initialTasks,
  assigneeOptions,
  canEdit,
  openTaskId,
}: {
  aircraftId: string;
  initialTasks: BoardTask[];
  assigneeOptions: { id: string; name: string; color: string }[];
  canEdit: boolean;
  openTaskId?: string;
}) {
  const [tasks, setTasks] = useSyncedState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(openTaskId ?? null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = useMemo(() => {
    const grouped: Record<string, BoardTask[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of tasks) grouped[t.status].push(t);
    for (const key of Object.keys(grouped)) grouped[key].sort((a, b) => a.order - b.order);
    return grouped;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!canEdit) return;
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overId = String(over.id);
    const overIsColumn = COLUMNS.some((c) => c.key === overId);
    const overTask = tasks.find((t) => t.id === overId);
    const targetStatus = overIsColumn ? (overId as BoardTask["status"]) : overTask?.status ?? activeTask.status;

    setTasks((prev) => {
      const withoutActive = prev.filter((t) => t.id !== activeTask.id);
      const columnTasks = withoutActive.filter((t) => t.status === targetStatus).sort((a, b) => a.order - b.order);
      let insertIndex = columnTasks.length;
      if (!overIsColumn && overTask) {
        insertIndex = columnTasks.findIndex((t) => t.id === overTask.id);
        if (insertIndex === -1) insertIndex = columnTasks.length;
      }
      columnTasks.splice(insertIndex, 0, { ...activeTask, status: targetStatus });
      const reOrdered = columnTasks.map((t, i) => ({ ...t, order: i }));
      const others = withoutActive.filter((t) => t.status !== targetStatus);
      const next = [...others, ...reOrdered];

      const movedTask = reOrdered.find((t) => t.id === activeTask.id)!;
      startTransition(() => {
        moveTask(movedTask.id, movedTask.status, movedTask.order);
      });

      return next;
    });
  }

  const activeTask = tasks.find((t) => t.id === activeId);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              status={col.key}
              label={col.label}
              tasks={columns[col.key]}
              onTaskClick={setSelectedTaskId}
              headerAction={
                col.key === "TODO" && canEdit ? (
                  <NewTaskModal aircraftId={aircraftId} assigneeOptions={assigneeOptions} />
                ) : undefined
              }
            />
          ))}
        </div>
        <DragOverlay>{activeTask ? <TaskCard task={activeTask} onClick={() => {}} dragging /> : null}</DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          assigneeOptions={assigneeOptions}
          canEdit={canEdit}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
  onTaskClick,
  headerAction,
}: {
  status: string;
  label: string;
  tasks: BoardTask[];
  onTaskClick: (id: string) => void;
  headerAction?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col gap-2 bg-background rounded-xl p-2.5 min-h-[200px]">
      <div className="flex items-center justify-between px-1.5">
        <h3 className="text-sm font-semibold text-foreground">
          {label} <span className="text-muted font-normal">({tasks.length})</span>
        </h3>
        {headerAction}
      </div>
      <div ref={setNodeRef} className={clsx("flex flex-col gap-2 min-h-[80px] rounded-lg transition-colors p-1", isOver && "bg-brand-blue/5")}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onClick }: { task: BoardTask; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}

function TaskCard({ task, onClick, dragging }: { task: BoardTask; onClick: () => void; dragging?: boolean }) {
  const overdue = isTaskOverdue(task.dueDate ? new Date(task.dueDate) : null, task.status);
  const doneCount = task.checklistItems.filter((c) => c.done).length;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left bg-surface border border-border rounded-lg p-3 hover:border-brand-blue transition-colors cursor-grab active:cursor-grabbing",
        dragging && "shadow-xl rotate-1"
      )}
    >
      <p className="text-sm font-medium text-foreground">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        {task.dueDate && (
          <span className={clsx("flex items-center gap-1", overdue && "text-danger font-medium")}>
            <Calendar className="size-3" />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.checklistItems.length > 0 && (
          <span className="flex items-center gap-1">
            <CheckSquare className="size-3" />
            {doneCount}/{task.checklistItems.length}
          </span>
        )}
        {task.comments.length > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            {task.comments.length}
          </span>
        )}
        {task.attachments.length > 0 && (
          <span className="flex items-center gap-1">
            <Paperclip className="size-3" />
            {task.attachments.length}
          </span>
        )}
      </div>
      {task.assignees.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {task.assignees.map((a) => (
              <span
                key={a.id}
                title={a.name}
                className="flex size-5 items-center justify-center rounded-full text-[9px] font-semibold text-white shrink-0 ring-2 ring-surface"
                style={{ backgroundColor: a.color }}
              >
                {a.name.slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted truncate">{task.assignees.map((a) => a.name).join(", ")}</span>
        </div>
      )}
    </button>
  );
}

export { COLUMNS };
