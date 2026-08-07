import { clsx } from "clsx";

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "neutral" | "danger" | "warning" | "success" | "brand";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "text-foreground",
    danger: "text-danger",
    warning: "text-warning",
    success: "text-success",
    brand: "text-brand-blue",
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {Icon && <Icon className={clsx("size-4", toneClasses[tone])} />}
      </div>
      <span className={clsx("text-2xl font-semibold", toneClasses[tone])}>{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
