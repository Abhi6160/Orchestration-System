import { ArrowDown, Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModel } from "@/lib/nexus/models";
import { TRANSFER_STAGES } from "@/lib/nexus/mock-service";
import type { OrchestrationDecision } from "@/lib/nexus/types";
import type { HandoffPhase } from "@/lib/nexus/use-handoff";
import { phaseIndex } from "@/lib/nexus/use-handoff";
import { ModelGlyph } from "./ModelCard";
import { ModelSelector } from "./ModelSelector";

const CHECKS = [
  "Context preserved",
  "Task state preserved",
  "User intent preserved",
  "Conversation continued",
];

export function HandoffAnimation({
  phase,
  decision,
  transferStage,
  fromModelId,
}: {
  phase: HandoffPhase;
  decision: OrchestrationDecision | null;
  transferStage: number;
  fromModelId: string;
}) {
  const index = phaseIndex(phase);
  if (index < phaseIndex("evaluating")) return null;

  const from = getModel(fromModelId as never);
  const to = decision ? getModel(decision.toModel) : null;

  return (
    <section
      aria-live="polite"
      className="animate-rise relative overflow-hidden rounded-xl border border-violet/30 bg-surface/80 p-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet to-transparent"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-violet/40 bg-violet/10 text-violet">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-mono-xs text-violet">Orchestrator Activated</p>
            <p className="text-sm text-muted-foreground">
              {index < phaseIndex("selected")
                ? "Evaluating available models…"
                : index < phaseIndex("complete")
                  ? `Transferring context to ${to?.name}`
                  : "Handoff complete"}
            </p>
          </div>
        </div>
        {index < phaseIndex("complete") && (
          <Loader2 className="size-4 animate-spin text-violet" />
        )}
      </div>

      <div className="mt-5">
        <ModelSelector
          selectedId={index >= phaseIndex("selected") ? (decision?.toModel ?? null) : null}
          activeId={fromModelId as never}
          evaluating={index === phaseIndex("evaluating")}
        />
      </div>

      {decision && index >= phaseIndex("selected") && (
        <div className="animate-rise mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-medium text-primary">{to?.name} selected</p>
          <p className="mt-1 text-xs text-muted-foreground">Reason: {decision.reason}</p>
        </div>
      )}

      {index >= phaseIndex("transferring") && (
        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
          <ol className="space-y-1.5">
            {TRANSFER_STAGES.map((stage, i) => {
              const state =
                index > phaseIndex("transferring") || transferStage > i
                  ? "done"
                  : transferStage === i
                    ? "active"
                    : "pending";
              return (
                <li key={stage.key}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-300",
                      state === "done" && "border-success/30 bg-success/5",
                      state === "active" && "border-violet/50 bg-violet/10 shadow-glow",
                      state === "pending" && "border-border bg-surface-2/40 opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-full border text-[10px]",
                        state === "done"
                          ? "border-success/50 text-success"
                          : state === "active"
                            ? "border-violet/60 text-violet"
                            : "border-border text-muted-foreground",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="size-3" />
                      ) : state === "active" ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{stage.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {stage.detail}
                      </p>
                    </div>
                  </div>
                  {i < TRANSFER_STAGES.length - 1 && (
                    <div className="flex justify-start pl-[1.4rem]">
                      <ArrowDown
                        className={cn(
                          "size-3",
                          transferStage > i ? "text-violet" : "text-border-strong",
                        )}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="hidden md:flex md:flex-col md:items-center md:gap-2">
            <ModelGlyph name={from.name} accent={from.accent} />
            <span className="h-16 w-px bg-gradient-to-b from-warning via-violet to-primary" />
            {to && <ModelGlyph name={to.name} accent={to.accent} />}
          </div>

          <div
            className={cn(
              "rounded-lg border p-4 transition-opacity",
              index >= phaseIndex("complete")
                ? "border-success/30 bg-success/5 opacity-100"
                : "border-border bg-surface-2/40 opacity-40",
            )}
          >
            <p className="flex items-center gap-2 text-mono-xs text-success">
              <ShieldCheck className="size-3.5" /> Handoff Complete
            </p>
            <ul className="mt-3 space-y-2">
              {CHECKS.map((check, i) => (
                <li
                  key={check}
                  className="flex items-center gap-2 text-xs"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <Check className="size-3.5 text-success" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
