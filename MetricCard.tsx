import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "violet" | "success" | "warning";
}) {
  const toneMap = {
    primary: "text-primary",
    violet: "text-violet",
    success: "text-success",
    warning: "text-warning",
  } as const;

  return (
    <div className="panel panel-hover group relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-mono-xs text-muted-foreground">{label}</p>
          <p className="mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={cn(
            "rounded-lg border border-border bg-surface-2 p-2 transition-colors group-hover:border-border-strong",
            toneMap[tone],
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}
