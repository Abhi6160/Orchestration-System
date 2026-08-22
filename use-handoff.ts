import { useCallback, useEffect, useRef, useState } from "react";
import { buildDecision, buildHandoff, TRANSFER_STAGES } from "./mock-service";
import type { HandoffEvent, ModelId, OrchestrationDecision, RoutingPreference } from "./types";

export type HandoffPhase =
  | "idle"
  | "processing"
  | "threshold"
  | "evaluating"
  | "selected"
  | "transferring"
  | "complete"
  | "continuing"
  | "done";

export interface HandoffSimulation {
  phase: HandoffPhase;
  contextUsage: number;
  decision: OrchestrationDecision | null;
  handoff: HandoffEvent | null;
  transferStage: number;
  running: boolean;
  start: () => void;
  reset: () => void;
}

const CONTEXT_STEPS = [50, 58, 65, 72, 79, 85, 90];

/**
 * Drives the orchestration/handoff simulation timeline. Swapping in a real
 * backend means feeding these phases from server-sent events instead of timers.
 */
export function useHandoffSimulation({
  activeModel = "claude",
  preference = "balanced",
  startContext = 42,
  progress = 68,
  onPhase,
}: {
  activeModel?: ModelId;
  preference?: RoutingPreference;
  startContext?: number;
  progress?: number;
  onPhase?: (phase: HandoffPhase, decision: OrchestrationDecision | null) => void;
} = {}): HandoffSimulation {
  const [phase, setPhase] = useState<HandoffPhase>("idle");
  const [contextUsage, setContextUsage] = useState(startContext);
  const [decision, setDecision] = useState<OrchestrationDecision | null>(null);
  const [handoff, setHandoff] = useState<HandoffEvent | null>(null);
  const [transferStage, setTransferStage] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef(onPhase);
  phaseRef.current = onPhase;

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const go = useCallback(
    (next: HandoffPhase, currentDecision: OrchestrationDecision | null = null) => {
      setPhase(next);
      phaseRef.current?.(next, currentDecision);
    },
    [],
  );

  const reset = useCallback(() => {
    clear();
    setPhase("idle");
    setContextUsage(startContext);
    setDecision(null);
    setHandoff(null);
    setTransferStage(-1);
  }, [clear, startContext]);

  const start = useCallback(() => {
    clear();
    setContextUsage(startContext);
    setDecision(null);
    setHandoff(null);
    setTransferStage(-1);
    go("processing");

    let t = 600;
    CONTEXT_STEPS.forEach((value) => {
      at(t, () => setContextUsage(value));
      t += 550;
    });

    at(t, () => go("threshold"));
    t += 1000;

    at(t, () => go("evaluating"));
    t += 1400;

    const nextDecision = buildDecision(activeModel, preference);
    at(t, () => {
      setDecision(nextDecision);
      go("selected", nextDecision);
    });
    t += 1600;

    at(t, () => {
      go("transferring", nextDecision);
      setTransferStage(0);
    });
    TRANSFER_STAGES.forEach((_, index) => {
      t += 620;
      at(t, () => setTransferStage(index));
    });

    t += 800;
    at(t, () => {
      setHandoff(buildHandoff(nextDecision, progress));
      go("complete", nextDecision);
    });
    t += 1600;

    at(t, () => go("continuing", nextDecision));
    t += 2200;

    at(t, () => go("done", nextDecision));
  }, [activeModel, at, clear, go, preference, progress, startContext]);

  const running = phase !== "idle" && phase !== "done";

  return { phase, contextUsage, decision, handoff, transferStage, running, start, reset };
}

export const PHASE_ORDER: HandoffPhase[] = [
  "idle",
  "processing",
  "threshold",
  "evaluating",
  "selected",
  "transferring",
  "complete",
  "continuing",
  "done",
];

export const phaseIndex = (phase: HandoffPhase) => PHASE_ORDER.indexOf(phase);
