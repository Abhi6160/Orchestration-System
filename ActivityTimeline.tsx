import { cn } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/nexus/types";

const TONE = {
  neutral: "border-border bg-surface-2 text-muted-foreground",
  primary: "border-primary/40 bg-primary/15 text-primary",
  violet: "border-violet/40 bg-violet/15 text-violet",
  success: "border-success/40 bg-success/15 text-success",
  warning: "border-warning/40 bg-warning/15 text-warning",
} as const;

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  return (
    <ol className="relative space-y-1">
      <span
        aria-hidden
        className="absolute left-[3.85rem] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-violet/30 to-success/40"
      />
      {entries.map((entry, index) => (
        <li
          key={entry.id}
          className="animate-rise group relative flex gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-surface-2/60"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <span className="w-12 shrink-0 pt-0.5 text-right font-mono text-xs text-muted-foreground">
            {entry.time}
          </span>
          <span
            className={cn(
              "relative z-10 mt-1 inline-flex size-3 shrink-0 items-center justify-center rounded-full border",
              TONE[entry.tone],
            )}
          >
            <span className="size-1 rounded-full bg-current" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{entry.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{entry.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
