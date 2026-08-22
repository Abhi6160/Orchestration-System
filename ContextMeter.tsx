import { cn } from "@/lib/utils";

function toneFor(value: number) {
  if (value >= 88) return "bg-destructive";
  if (value >= 70) return "bg-warning";
  return "bg-primary";
}

export function ContextMeter({
  value,
  label = "Context",
  showValue = true,
  size = "md",
  className,
}: {
  value: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-mono-xs text-muted-foreground">{label}</span>}
          {showValue && (
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                clamped >= 88
                  ? "text-destructive"
                  : clamped >= 70
                    ? "text-warning"
                    : "text-foreground",
              )}
            >
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-2",
          size === "sm" ? "h-1" : "h-1.5",
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", toneFor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  tone = "primary",
}: {
  value: number;
  className?: string;
  tone?: "primary" | "violet" | "success";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const bg =
    tone === "violet" ? "bg-violet" : tone === "success" ? "bg-success" : "bg-primary";
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", bg)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
