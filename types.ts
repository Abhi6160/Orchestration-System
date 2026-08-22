/**
 * NEXUS AI — domain types.
 *
 * These interfaces are the contract between the UI layer and the service
 * layer. Today the services are simulated (see `mock-service.ts`); swapping in
 * a real backend means re-implementing those functions while keeping these
 * shapes identical.
 */

export type ModelId = "gpt" | "claude" | "gemini" | "llama";

export type ModelStatus = "available" | "high-load" | "near-limit" | "unavailable";

export type RoutingPreference =
  | "best-quality"
  | "lowest-cost"
  | "fastest-response"
  | "largest-context"
  | "balanced";

export interface Model {
  id: ModelId;
  name: string;
  provider: string;
  status: ModelStatus;
  /** Short headline capability, e.g. "Reasoning". */
  capability: string;
  capabilities: string[];
  /** Human readable context window, e.g. "200K". */
  contextWindow: string;
  contextTokens: number;
  /** Percentage 0-100 of the context window currently consumed. */
  contextUsage: number;
  /** Percentage 0-100 of provider capacity in use. */
  load: number;
  avgLatencyMs: number;
  costPer1kTokens: number;
  reliability: number;
  taskTypes: string[];
  recentRequests: number;
  accent: "primary" | "violet" | "success" | "warning";
}

export type MessageAuthor = "user" | "assistant" | "system";

export interface MessageMetadata {
  model?: ModelId;
  latencySeconds?: number;
  contextUsage?: number;
  confidence?: "High" | "Medium" | "Low";
}

export interface Message {
  id: string;
  author: MessageAuthor;
  content: string;
  createdAt: string;
  metadata?: MessageMetadata;
  /** Marks the inline orchestration event rendered inside the transcript. */
  handoffId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  messageCount: number;
  models: ModelId[];
  handoffs: number;
}

export interface TaskState {
  objective: string;
  completedSteps: string[];
  pendingSteps: string[];
  intermediateResults: string[];
  progress: number;
}

export interface ContextState {
  previousMessages: number;
  importantFacts: string[];
  references: string[];
  userPreferences: string[];
  usage: number;
}

export interface UserIntent {
  goal: string;
  constraints: string[];
  expectedOutput: string;
  priority: "Low" | "Normal" | "High";
}

export interface OrchestrationCandidate {
  modelId: ModelId;
  contextUsage: number;
  status: ModelStatus;
  score: number;
}

export interface OrchestrationDecision {
  id: string;
  trigger:
    | "context-limit"
    | "token-limit"
    | "usage-limit"
    | "model-unavailable"
    | "error";
  fromModel: ModelId;
  toModel: ModelId;
  reason: string;
  candidates: OrchestrationCandidate[];
  createdAt: string;
}

export interface HandoffEvent {
  id: string;
  decision: OrchestrationDecision;
  preserved: {
    conversationContext: boolean;
    taskState: boolean;
    userIntent: boolean;
    keyDecisions: boolean;
  };
  progressBefore: number;
  progressAfter: number;
  durationMs: number;
}

export interface ActivityEntry {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: "neutral" | "primary" | "violet" | "success" | "warning";
}
