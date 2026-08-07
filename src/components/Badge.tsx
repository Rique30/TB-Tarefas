import { clsx } from "clsx";

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  brand: "bg-brand-blue/10 text-brand-blue",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function expiryStatusTone(status: "VENCIDO" | "VENCENDO" | "EM_DIA"): Tone {
  if (status === "VENCIDO") return "danger";
  if (status === "VENCENDO") return "warning";
  return "success";
}

export function taskStatusTone(status: string): Tone {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "brand";
  return "neutral";
}

export function maintenanceStatusTone(status: string): Tone {
  if (status === "CONCLUIDA") return "success";
  if (status === "EM_ANDAMENTO") return "brand";
  return "neutral";
}
