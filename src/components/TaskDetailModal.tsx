"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Trash2, Paperclip, Download, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge, taskStatusTone } from "@/components/Badge";
import { formatDateTime, TASK_STATUS_LABEL } from "@/lib/status";
import {
  updateTask,
  deleteTask,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  addComment,
  uploadAttachment,
  deleteAttachment,
  getTaskDetail,
} from "@/app/actions/tasks";
import type { ActionState } from "@/app/actions/aircraft";
import type { BoardTask } from "@/components/TaskBoard";

type TaskDetail = Awaited<ReturnType<typeof getTaskDetail>>;

const initialState: ActionState = {};

export function TaskDetailModal({
  task,
  assigneeOptions,
  canEdit,
  onClose,
}: {
  task: BoardTask;
  assigneeOptions: { id: string; name: string; color: string }[];
  canEdit: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, startLoading] = useTransition();

  useEffect(() => {
    startLoading(async () => {
      const d = await getTaskDetail(task.id);
      setDetail(d);
    });
  }, [task.id]);

  const boundUpdate = updateTask.bind(null, task.id);
  const [updateState, updateFormAction, updatePending] = useActionState(boundUpdate, initialState);

  return (
    <Modal open onClose={onClose} title={task.title} wide>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Badge tone={taskStatusTone(task.status)}>{TASK_STATUS_LABEL[task.status]}</Badge>
          {canEdit && (
            <button
              onClick={() => {
                if (confirm("Excluir esta tarefa?")) {
                  deleteTask(task.id);
                  onClose();
                }
              }}
              className="ml-auto flex items-center gap-1 text-xs text-danger hover:underline"
            >
              <Trash2 className="size-3.5" />
              Excluir tarefa
            </button>
          )}
        </div>

        <form action={updateFormAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Título</span>
            <input
              name="title"
              defaultValue={task.title}
              disabled={!canEdit}
              required
              className="rounded-lg border border-border px-3 py-2 text-sm disabled:bg-background disabled:text-muted"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Descrição</span>
            <textarea
              name="description"
              defaultValue={task.description ?? ""}
              disabled={!canEdit}
              rows={3}
              className="rounded-lg border border-border px-3 py-2 text-sm resize-none disabled:bg-background disabled:text-muted"
            />
          </label>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Responsável</span>
              <select
                name="assigneeId"
                defaultValue={task.assignee?.id ?? ""}
                disabled={!canEdit}
                className="rounded-lg border border-border px-3 py-2 text-sm bg-surface disabled:bg-background disabled:text-muted"
              >
                <option value="">Sem responsável</option>
                {assigneeOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Início</span>
              <input
                type="date"
                name="startDate"
                defaultValue={task.startDate ? task.startDate.slice(0, 10) : ""}
                disabled={!canEdit}
                className="rounded-lg border border-border px-3 py-2 text-sm disabled:bg-background disabled:text-muted"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Prazo</span>
              <input
                type="date"
                name="dueDate"
                defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                disabled={!canEdit}
                className="rounded-lg border border-border px-3 py-2 text-sm disabled:bg-background disabled:text-muted"
              />
            </label>
          </div>
          {updateState.error && <p className="text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">{updateState.error}</p>}
          {canEdit && (
            <button
              type="submit"
              disabled={updatePending}
              className="self-start rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-1.5 hover:bg-brand-navy transition-colors disabled:opacity-60"
            >
              {updatePending ? "Salvando..." : "Salvar alterações"}
            </button>
          )}
        </form>

        {loading && !detail && (
          <div className="flex items-center justify-center py-6 text-muted gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Carregando detalhes...
          </div>
        )}

        {detail && (
          <>
            <ChecklistSection taskId={task.id} items={detail.task.checklistItems} canEdit={canEdit} />
            <AttachmentsSection taskId={task.id} attachments={detail.task.attachments} canEdit={canEdit} />
            <CommentsSection taskId={task.id} comments={detail.task.comments} canEdit={canEdit} />
            <AuditSection logs={detail.auditLogs} />
          </>
        )}
      </div>
    </Modal>
  );
}

function ChecklistSection({
  taskId,
  items,
  canEdit,
}: {
  taskId: string;
  items: { id: string; title: string; done: boolean }[];
  canEdit: boolean;
}) {
  const [localItems, setLocalItems] = useState(items);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = localItems.filter((i) => i.done).length;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Checklist</h3>
        {localItems.length > 0 && (
          <span className="text-xs text-muted">
            {done}/{localItems.length}
          </span>
        )}
      </div>
      {localItems.length > 0 && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-3">
          <div className="h-full bg-brand-blue" style={{ width: `${(done / localItems.length) * 100}%` }} />
        </div>
      )}
      <ul className="flex flex-col gap-1.5">
        {localItems.map((item) => (
          <li key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.done}
              disabled={!canEdit}
              onChange={(e) => {
                setLocalItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: e.target.checked } : i)));
                toggleChecklistItem(item.id, e.target.checked);
              }}
              className="size-4 accent-[var(--brand-blue)]"
            />
            <span className={`text-sm flex-1 ${item.done ? "line-through text-muted" : "text-foreground"}`}>{item.title}</span>
            {canEdit && (
              <button
                onClick={() => {
                  setLocalItems((prev) => prev.filter((i) => i.id !== item.id));
                  deleteChecklistItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = inputRef.current?.value.trim();
            if (!value) return;
            const tempId = `temp-${Date.now()}`;
            setLocalItems((prev) => [...prev, { id: tempId, title: value, done: false }]);
            if (inputRef.current) inputRef.current.value = "";
            addChecklistItem(taskId, value);
          }}
        >
          <input
            ref={inputRef}
            placeholder="Novo item do checklist"
            className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background">
            Adicionar
          </button>
        </form>
      )}
    </section>
  );
}

function AttachmentsSection({
  taskId,
  attachments,
  canEdit,
}: {
  taskId: string;
  attachments: { id: string; filename: string; url: string; size: number; uploader: { name: string } | null; createdAt: Date }[];
  canEdit: boolean;
}) {
  const [localAttachments, setLocalAttachments] = useState(attachments);
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground mb-2">Anexos</h3>
      <ul className="flex flex-col gap-1.5">
        {localAttachments.map((a) => (
          <li key={a.id} className="flex items-center gap-2 group">
            <Paperclip className="size-3.5 text-muted shrink-0" />
            <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-brand-blue hover:underline truncate flex-1">
              {a.filename}
            </a>
            <span className="text-xs text-muted shrink-0">{(a.size / 1024).toFixed(0)} KB</span>
            {canEdit && (
              <button
                onClick={() => {
                  setLocalAttachments((prev) => prev.filter((x) => x.id !== a.id));
                  deleteAttachment(a.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-opacity"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
        {localAttachments.length === 0 && <p className="text-sm text-muted">Nenhum anexo.</p>}
      </ul>
      {canEdit && (
        <form
          className="mt-2 flex gap-2 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            const file = fileRef.current?.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.set("file", file);
            startUpload(async () => {
              await uploadAttachment(taskId, fd);
              if (fileRef.current) fileRef.current.value = "";
            });
          }}
        >
          <input ref={fileRef} type="file" className="text-xs flex-1" />
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5 rotate-180" />}
            Enviar
          </button>
        </form>
      )}
    </section>
  );
}

function CommentsSection({
  taskId,
  comments,
  canEdit,
}: {
  taskId: string;
  comments: { id: string; body: string; createdAt: Date; author: { name: string; color: string } | null }[];
  canEdit: boolean;
}) {
  const [localComments, setLocalComments] = useState(comments);
  const textRef = useRef<HTMLTextAreaElement>(null);

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground mb-2">Comentários</h3>
      <ul className="flex flex-col gap-3">
        {localComments.map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <span
              className="flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-white shrink-0"
              style={{ backgroundColor: c.author?.color ?? "#8a94a6" }}
            >
              {(c.author?.name ?? "?").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">
                <span className="font-medium text-foreground">{c.author?.name ?? "Usuário"}</span> · {formatDateTime(c.createdAt)}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
            </div>
          </li>
        ))}
        {localComments.length === 0 && <p className="text-sm text-muted">Nenhum comentário ainda.</p>}
      </ul>
      {canEdit && (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = textRef.current?.value.trim();
            if (!value) return;
            setLocalComments((prev) => [
              ...prev,
              { id: `temp-${Date.now()}`, body: value, createdAt: new Date(), author: { name: "Você", color: "#1f8fe0" } },
            ]);
            if (textRef.current) textRef.current.value = "";
            addComment(taskId, value);
          }}
        >
          <textarea
            ref={textRef}
            rows={2}
            placeholder="Escreva um comentário..."
            className="rounded-lg border border-border px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button type="submit" className="self-start rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background">
            Comentar
          </button>
        </form>
      )}
    </section>
  );
}

function AuditSection({ logs }: { logs: { id: string; action: string; field: string | null; oldValue: string | null; newValue: string | null; userName: string | null; createdAt: Date }[] }) {
  if (logs.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground mb-2">Histórico</h3>
      <ul className="flex flex-col gap-1.5 text-xs text-muted">
        {logs.map((log) => (
          <li key={log.id}>
            <span className="font-medium text-foreground">{log.userName ?? "Sistema"}</span> · {describeAudit(log)} ·{" "}
            {formatDateTime(log.createdAt)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function describeAudit(log: { action: string; field: string | null; oldValue: string | null; newValue: string | null }) {
  switch (log.action) {
    case "CREATED":
      return "criou a tarefa";
    case "UPDATED":
      return "atualizou a tarefa";
    case "STATUS_CHANGED":
      return `mudou o status de "${log.oldValue}" para "${log.newValue}"`;
    case "COMMENTED":
      return "comentou";
    case "ATTACHMENT_ADDED":
      return `anexou "${log.newValue}"`;
    case "DELETED":
      return "excluiu a tarefa";
    default:
      return log.action.toLowerCase();
  }
}
