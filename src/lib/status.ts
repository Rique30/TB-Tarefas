export type ExpiryStatus = "VENCIDO" | "VENCENDO" | "EM_DIA";

const DAY_MS = 1000 * 60 * 60 * 24;

export function daysUntil(date: Date, from: Date = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export function expiryStatus(dueDate: Date, warnDays = 30, from: Date = new Date()): ExpiryStatus {
  const diff = daysUntil(dueDate, from);
  if (diff < 0) return "VENCIDO";
  if (diff <= warnDays) return "VENCENDO";
  return "EM_DIA";
}

export const EXPIRY_STATUS_LABEL: Record<ExpiryStatus, string> = {
  VENCIDO: "Vencido",
  VENCENDO: "Vencendo em breve",
  EM_DIA: "Em dia",
};

export const EXPIRY_CATEGORY_LABEL: Record<string, string> = {
  PORTE_OBRIGATORIO: "Porte obrigatório",
  EQUIPAMENTO: "Equipamento",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Finalizado",
};

export const MAINTENANCE_STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

export const MAINTENANCE_TYPE_LABEL: Record<string, string> = {
  PROGRAMADA: "Programada",
  NAO_PROGRAMADA: "Não programada",
};

export function isTaskOverdue(dueDate: Date | null, status: string, from: Date = new Date()): boolean {
  if (!dueDate || status === "DONE") return false;
  return daysUntil(dueDate, from) < 0;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
