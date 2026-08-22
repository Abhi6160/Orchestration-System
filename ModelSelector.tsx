import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELS, STATUS_LABEL } from "@/lib/nexus/models";
import type { ModelId } from "@/lib/nexus/types";
import { ContextMeter } from "./ContextMeter";
import { ModelGlyph } from "./ModelCard";

export function ModelSelector({
  selectedId,
  activeId,
  evaluating,
}: {
  selectedId: ModelId | null;
  activeId?: ModelId;
  evaluating?: boolean;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {MODELS.map((model, i) => {
        const isActive = model.id === activeId;
        const isSelected = model.id === selectedId;
        const status = isActive ? "near-limit" : model.status;
        return (
          <li
            key={model.id}
            className={cn(
              "animate-rise relative rounded-lg border p-3 transition-all duration-300",
              isSelected
                ? "border-primary/60 bg-primary/10 shadow-glow"
                : isActive
                  ? "border-warning/40 bg-warning/5"
                  : "border-border bg-surface-2/50",
              evaluating && !isSelected && "animate-pulse",
              selectedId && !isSelected && "opacity-55",
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {isSelected && (
              <CheckCircle2 className="absolute right-2.5 top-2.5 size-4 text-primary" />
            )}
            <div className="flex items-center gap-2.5">
              <ModelGlyph name={model.name} accent={model.accent} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{model.name}</p>
                <p
                  className={cn(
                    "text-[11px]",
                    status === "available"
                      ? "text-success"
                      : status === "unavailable"
                        ? "text-destructive"
                        : "text-warning",
                  )}
                >
                  {STATUS_LABEL[status]}
                </p>
              </div>
            </div>
            <ContextMeter
              className="mt-3"
              size="sm"
              label="Context capacity"
              value={model.contextUsage}
            />
          </li>
        );
      })}
    </ul>
  );
}
