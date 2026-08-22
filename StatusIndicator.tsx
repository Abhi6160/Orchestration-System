import { cn } from "@/lib/utils";
import type { ModelStatus } from "@/lib/nexus/types";

const TONE: Record<ModelStatus, { dot: string; text: string; label: string }> = {
  available: { dot: "bg-success", text: "text-success", label: "Available" },
  "high-load": { dot: "bg-warning", text: "text-warning", label: "High Load" },
  "near-limit": { dot: "bg-warning", text: "text-warning", label: "Near Limit" },
  unavailable: { dot: "bg-destructive", text: "text-destructive", label: "Unavailable" },
};

export function StatusIndicator({
  status,
  label,
  pulse = true,
  className,
}: {
  status: ModelStatus;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  const tone = TONE[status];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex size-2">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-60",
              tone.dot,
            )}
          />
        )}
        <span className={cn("relative inline-flex size-2 rounded-full", tone.dot)} />
      </span>
      <span className={cn("text-mono-xs", tone.text)}>{label ?? tone.label}</span>
    </span>
  );
}
