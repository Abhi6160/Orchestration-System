import type { Model, ModelId, RoutingPreference } from "./types";

/**
 * Model registry. In production this would be fetched from the orchestration
 * backend (`GET /api/models`) — the shape stays the same.
 */
export const MODELS: Model[] = [
  {
    id: "gpt",
    name: "GPT",
    provider: "OpenAI",
    status: "available",
    capability: "Reasoning",
    capabilities: ["Reasoning", "Code generation", "Structured output", "Tool use"],
    contextWindow: "128K",
    contextTokens: 128_000,
    contextUsage: 45,
    load: 38,
    avgLatencyMs: 1400,
    costPer1kTokens: 0.01,
    reliability: 99.4,
    taskTypes: ["Analysis", "Code", "Planning", "Summarisation"],
    recentRequests: 412,
    accent: "success",
  },
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    status: "high-load",
    capability: "Long Context",
    capabilities: ["Long context", "Technical writing", "Reasoning", "Safety"],
    contextWindow: "200K",
    contextTokens: 200_000,
    contextUsage: 90,
    load: 82,
    avgLatencyMs: 1800,
    costPer1kTokens: 0.012,
    reliability: 99.1,
    taskTypes: ["Research", "Long-form writing", "Review", "Architecture"],
    recentRequests: 588,
    accent: "warning",
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google DeepMind",
    status: "available",
    capability: "Multimodal",
    capabilities: ["Multimodal", "Very long context", "Reasoning", "Retrieval"],
    contextWindow: "1M",
    contextTokens: 1_000_000,
    contextUsage: 20,
    load: 24,
    avgLatencyMs: 1200,
    costPer1kTokens: 0.007,
    reliability: 98.8,
    taskTypes: ["Research", "Vision", "Architecture", "Data analysis"],
    recentRequests: 301,
    accent: "primary",
  },
  {
    id: "llama",
    name: "Llama",
    provider: "Meta · Self-hosted",
    status: "available",
    capability: "Open Model",
    capabilities: ["Open weights", "Private inference", "Fast drafts"],
    contextWindow: "128K",
    contextTokens: 128_000,
    contextUsage: 30,
    load: 46,
    avgLatencyMs: 900,
    costPer1kTokens: 0.001,
    reliability: 97.2,
    taskTypes: ["Drafting", "Classification", "Summarisation"],
    recentRequests: 176,
    accent: "violet",
  },
];

export const MODEL_MAP: Record<ModelId, Model> = MODELS.reduce(
  (acc, model) => ({ ...acc, [model.id]: model }),
  {} as Record<ModelId, Model>,
);

export const getModel = (id: ModelId): Model => MODEL_MAP[id];

export const ROUTING_PREFERENCES: {
  id: RoutingPreference;
  label: string;
  description: string;
}[] = [
  {
    id: "best-quality",
    label: "Best Quality",
    description: "Always prefer the highest scoring model for the detected task.",
  },
  {
    id: "lowest-cost",
    label: "Lowest Cost",
    description: "Prefer cheaper models while quality stays above threshold.",
  },
  {
    id: "fastest-response",
    label: "Fastest Response",
    description: "Optimise for lowest measured p50 latency.",
  },
  {
    id: "largest-context",
    label: "Largest Context",
    description: "Prefer the largest available remaining context window.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Weighs quality, latency, cost and remaining context equally.",
  },
];

export const STATUS_LABEL: Record<Model["status"], string> = {
  available: "Available",
  "high-load": "High Load",
  "near-limit": "Near Limit",
  unavailable: "Unavailable",
};
