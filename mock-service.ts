import { MODELS, getModel } from "./models";
import type {
  ActivityEntry,
  ContextState,
  Conversation,
  HandoffEvent,
  Message,
  ModelId,
  OrchestrationCandidate,
  OrchestrationDecision,
  RoutingPreference,
  TaskState,
  UserIntent,
} from "./types";

/**
 * Simulated AI + orchestration services.
 *
 * Replace the bodies of these functions with real network calls to connect a
 * backend. Nothing in the UI reads provider SDKs directly.
 */

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let counter = 0;
export const uid = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${counter++}`;

export const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Score candidates the way the routing engine would, given a preference. */
export function scoreCandidates(
  activeModel: ModelId,
  preference: RoutingPreference = "balanced",
): OrchestrationCandidate[] {
  return MODELS.map((model) => {
    const remainingContext = (100 - model.contextUsage) / 100;
    const speed = 1 - Math.min(model.avgLatencyMs, 2500) / 2500;
    const cheapness = 1 - Math.min(model.costPer1kTokens, 0.02) / 0.02;
    const quality = model.reliability / 100;

    const weights: Record<RoutingPreference, [number, number, number, number]> = {
      "best-quality": [0.2, 0.1, 0.05, 0.65],
      "lowest-cost": [0.15, 0.1, 0.6, 0.15],
      "fastest-response": [0.15, 0.6, 0.1, 0.15],
      "largest-context": [0.65, 0.1, 0.05, 0.2],
      balanced: [0.3, 0.25, 0.15, 0.3],
    };
    const [wCtx, wSpeed, wCost, wQuality] = weights[preference];
    let score =
      remainingContext * wCtx + speed * wSpeed + cheapness * wCost + quality * wQuality;

    if (model.id === activeModel) score *= 0.25;
    if (model.status === "unavailable") score = 0;
    if (model.status === "high-load") score *= 0.6;

    return {
      modelId: model.id,
      contextUsage: model.contextUsage,
      status: model.id === activeModel ? "near-limit" : model.status,
      score: Math.round(score * 100),
    } satisfies OrchestrationCandidate;
  }).sort((a, b) => b.score - a.score);
}

export function buildDecision(
  activeModel: ModelId,
  preference: RoutingPreference = "balanced",
  trigger: OrchestrationDecision["trigger"] = "context-limit",
): OrchestrationDecision {
  const candidates = scoreCandidates(activeModel, preference);
  const winner = candidates[0] ?? {
    modelId: activeModel,
    contextUsage: 0,
    status: "available" as const,
    score: 0,
  };
  return {
    id: uid("decision"),
    trigger,
    fromModel: activeModel,
    toModel: winner.modelId,
    reason:
      "Large available context capacity + suitable reasoning capability for long-form technical research.",
    candidates,
    createdAt: new Date().toISOString(),
  };
}

export function buildHandoff(
  decision: OrchestrationDecision,
  progress: number,
): HandoffEvent {
  return {
    id: uid("handoff"),
    decision,
    preserved: {
      conversationContext: true,
      taskState: true,
      userIntent: true,
      keyDecisions: true,
    },
    progressBefore: progress,
    progressAfter: progress,
    durationMs: 1450,
  };
}

export const TRANSFER_STAGES = [
  { key: "conversation", label: "Conversation", detail: "Full transcript serialised" },
  { key: "context", label: "Context Extraction", detail: "Facts, references, preferences" },
  { key: "task", label: "Task State Preservation", detail: "Objective, steps, results" },
  { key: "intent", label: "Intent Preservation", detail: "Goal, constraints, output shape" },
  { key: "target", label: "Target Model", detail: "Context injected & verified" },
] as const;

/* ---------------------------------------------------------------- fixtures */

export const DEMO_TASK: TaskState = {
  objective: "Design a scalable healthcare AI architecture (edge + cloud)",
  completedSteps: [
    "Compared edge vs cloud inference trade-offs",
    "Established latency and privacy constraints",
    "Selected hybrid inference topology",
  ],
  pendingSteps: [
    "Define component communication protocols",
    "Specify failover and observability strategy",
  ],
  intermediateResults: [
    "Edge tier: triage + PHI redaction",
    "Cloud tier: heavy multimodal reasoning",
  ],
  progress: 68,
};

export const DEMO_CONTEXT: ContextState = {
  previousMessages: 14,
  importantFacts: [
    "Hospital network, 40 sites, intermittent connectivity",
    "PHI must not leave the facility unredacted",
    "Target inference latency under 200ms at the edge",
  ],
  references: ["HIPAA §164.312", "Prior benchmark table (msg 6)", "Deployment budget note"],
  userPreferences: ["Concise technical tone", "Prefer diagrams as text", "No vendor lock-in"],
  usage: 91,
};

export const DEMO_INTENT: UserIntent = {
  goal: "Produce a deployable architecture the team can review this week",
  constraints: ["Regulated data", "Hybrid connectivity", "Cost ceiling per site"],
  expectedOutput: "Component diagram + communication contract per link",
  priority: "High",
};

export const RECENT_ACTIVITY: ActivityEntry[] = [
  {
    id: "a1",
    time: "10:42",
    title: "Conversation started",
    detail: "Claude selected — long-context research task detected",
    tone: "primary",
  },
  {
    id: "a2",
    time: "10:46",
    title: "Context threshold detected",
    detail: "Orchestrator activated at 90% context capacity",
    tone: "warning",
  },
  {
    id: "a3",
    time: "10:46",
    title: "Gemini selected",
    detail: "Context transferred — 14 messages, task state, user intent",
    tone: "violet",
  },
  {
    id: "a4",
    time: "10:47",
    title: "Task continued successfully",
    detail: "Resumed at 68% progress with zero user intervention",
    tone: "success",
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    title: "Research Assistant",
    summary: "Edge vs cloud AI for healthcare, then full architecture design.",
    updatedAt: "2 min ago",
    messageCount: 16,
    models: ["claude", "gemini"],
    handoffs: 1,
  },
  {
    id: "c2",
    title: "Triage model evaluation",
    summary: "Benchmarking open models for on-prem inference.",
    updatedAt: "1 h ago",
    messageCount: 34,
    models: ["llama", "gpt"],
    handoffs: 2,
  },
  {
    id: "c3",
    title: "Compliance review draft",
    summary: "HIPAA control mapping for the hybrid deployment.",
    updatedAt: "Yesterday",
    messageCount: 21,
    models: ["claude"],
    handoffs: 0,
  },
  {
    id: "c4",
    title: "Cost modelling",
    summary: "Per-site inference cost projection across 40 facilities.",
    updatedAt: "2 days ago",
    messageCount: 12,
    models: ["gpt", "gemini", "llama"],
    handoffs: 3,
  },
];

export const PROJECTS = [
  {
    id: "p1",
    name: "Healthcare AI Platform",
    description: "Hybrid edge/cloud clinical assistant for a 40-site hospital network.",
    conversations: 9,
    models: ["claude", "gemini", "llama"] as ModelId[],
    progress: 68,
  },
  {
    id: "p2",
    name: "Ops Copilot",
    description: "Internal operations assistant with retrieval over runbooks.",
    conversations: 6,
    models: ["gpt", "llama"] as ModelId[],
    progress: 41,
  },
  {
    id: "p3",
    name: "Research Digest",
    description: "Weekly long-context literature synthesis pipeline.",
    conversations: 9,
    models: ["gemini", "claude"] as ModelId[],
    progress: 87,
  },
];

/* ------------------------------------------------------------ chat content */

export const CHAT_SEED: Message[] = [
  {
    id: "m1",
    author: "user",
    content:
      "Compare the advantages of edge AI and cloud AI for a healthcare application.",
    createdAt: "10:42",
  },
  {
    id: "m2",
    author: "assistant",
    content: `**Edge AI** keeps inference inside the facility.

- Latency stays under ~200ms, which matters for triage and bedside decision support.
- PHI never leaves the hospital network, simplifying HIPAA scope.
- Clinical workflows survive connectivity loss between sites.
- Constraint: limited accelerator memory caps model size and batch throughput.

**Cloud AI** provides capacity instead of proximity.

- Access to frontier multimodal models for imaging and long-form reasoning.
- Elastic scaling for retrospective cohort analysis and overnight batch jobs.
- Centralised model governance, versioning and audit trails.
- Constraint: egress of regulated data requires redaction, BAAs and encryption in transit.

**Recommendation:** a hybrid topology — an edge tier for real-time, PHI-bearing inference and a cloud tier for heavy reasoning over redacted or de-identified payloads.`,
    createdAt: "10:43",
    metadata: {
      model: "claude",
      latencySeconds: 1.8,
      contextUsage: 42,
      confidence: "High",
    },
  },
];

export const SECOND_USER_MESSAGE =
  "Now design a scalable architecture for the system and explain how the components communicate.";

export const CLAUDE_PARTIAL = `Starting from the hybrid topology we agreed on, the system splits into four planes.

**1. Edge inference plane** — one appliance per facility running the triage model plus a PHI redaction filter. It answers locally and`;

export const GEMINI_CONTINUATION = `**1. Edge inference plane** — one appliance per facility running the triage model plus a PHI redaction filter. It answers locally and enqueues anything it cannot resolve.

**2. Cloud reasoning plane** — multimodal and long-context models operating only on redacted payloads, behind a per-tenant policy gateway.

**3. Control plane** — model registry, routing policy, quota accounting and audit log. Every inference carries a decision record.

**4. Data plane** — a per-site store with an outbox that replicates de-identified records once connectivity allows.

**How the components communicate**

| Link | Protocol | Contract |
| --- | --- | --- |
| Client → Edge | gRPC over mTLS | \`Infer(request) → response, decision_id\` |
| Edge → Cloud | Async queue (at-least-once) | Redacted payload + task envelope |
| Cloud → Control | Event stream | Usage, latency, limit signals |
| Control → Routers | Config push | Model availability + priority |

The task envelope is the important piece: it carries the conversation context, task state and user intent, so any plane — or any model — can resume the work exactly where the previous one stopped.`;

export const GEMINI_TYPING_NOTE =
  "Continuing your task — resuming the architecture design at 68% completion.";

export function modelAccentVar(id: ModelId) {
  const model = getModel(id);
  return model.accent;
}
