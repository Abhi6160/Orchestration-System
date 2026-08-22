import { Activity, Gauge, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/nexus/models";
import type { Model } from "@/lib/nexus/types";
import { StatusIndicator } from "./StatusIndicator";
import { ContextMeter } from "./ContextMeter";

export function ModelGlyph({
  name,
  accent,
  className,
}: {
  name: string;
  accent: Model["accent"];
  className?: string;
}) {
  const tone = {
    primary: "text-primary border-primary/35 bg-primary/10",
    violet: "text-violet border-violet/35 bg-violet/10",
    success: "text-success border-success/35 bg-success/10",
    warning: "text-warning border-warning/35 bg-warning/10",
  }[accent];
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-semibold",
        tone,
        className,
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function ModelCard({
  model,
  selected,
  compact,
  onSelect,
}: {
  model: Model;
  selected?: boolean;
  compact?: boolean;
  onSelect?: (model: Model) => void;
}) {
  const interactive = Boolean(onSelect);
  const Wrapper = interactive ? "button" : "div";

  return (
    <Wrapper
      {...(interactive
        ? { type: "button" as const, onClick: () => onSelect?.(model), "aria-pressed": selected }
        : {})}
      className={cn(
        "panel panel-hover w-full p-4 text-left",
        selected && "border-primary/60 shadow-glow",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ModelGlyph name={model.name} accent={model.accent} />
          <div>
            <p className="text-sm font-semibold leading-tight">{model.name}</p>
            <p className="text-xs text-muted-foreground">{model.provider}</p>
          </div>
        </div>
        <StatusIndicator status={model.status} label={STATUS_LABEL[model.status]} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="size-3.5" /> {model.capability}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono">
          <Activity className="size-3.5" /> {model.contextWindow} context
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono">
          <Zap className="size-3.5" /> {(model.avgLatencyMs / 1000).toFixed(1)}s
        </span>
      </div>

      {!compact && (
        <div className="mt-4 space-y-2">
          <ContextMeter value={model.contextUsage} label="Context used" size="sm" />
          <ContextMeter value={model.load} label="Current load" size="sm" />
        </div>
      )}
    </Wrapper>
  );
}
