# 🌉 ContextBridge — Multi-Model AI Orchestration System

ContextBridge is an intelligent multi-model orchestration workspace engineered to eliminate token degradation, high inference costs, and model lock-in. It dynamically monitors context consumption during complex workflows and synthesizes conversational state into structured transfer schemas across model boundaries (e.g., from Claude 3.5 Sonnet to Gemini 1.5 Pro) with zero loss of context.

---

## 🎯 The Problem

* **Context Window Degradation:** As technical conversations grow past 75–80% of an LLM's context window, instruction adherence drops, latency spikes, and hallucinations increase.
* **Model Lock-in & Pricing Inefficiency:** Simple tasks often consume high-tier model capacity when larger, cost-effective models (like Gemini 1.5/2.5 Pro) are better suited for large-context continuations.
* **Token Overhead on Transfer:** Naively copying raw message histories between LLMs consumes massive context on the receiving model.

---

## ⚡ Key Capabilities

* **Real-Time Token & Capacity Telemetry:** Live tracking of conversation token consumption against hard context window limits.
* **Proactive Context Warning (82% Threshold):** Triggers non-blocking alerts before severe context degradation occurs.
* **Structured Handoff Engine:** Compresses large context threads (e.g., 164,000+ tokens) down into a ~1.8k token structured handoff schema containing:
  * Overarching project goal
  * Key architectural decisions & constraints
  * File artifacts and technical specifications
  * Immediate next steps & pending action items
* **Interactive Handoff Review Modal:** Allows developers to inspect, edit, and approve the synthesized context payload before execution.
* **Provider Adapters:** Extensible adapter architecture supporting Google Gemini and Anthropic Claude with local mock simulation fallbacks.

---

## 🏗️ Architecture
Orchestration-System/
├── client/                      # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts        # Typed API client with fallback simulation
│   │   ├── components/          # Workspace UI, Context Meters, Review Modals
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript schema definitions
│   │   ├── App.tsx              # Workspace router & active session controller
│   │   └── main.tsx             # Application bootstrap
│   ├── package.json
│   └── vite.config.ts
│
├── server/                      # Backend Orchestrator (Express + TypeScript)
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts      # SQLite connection & schema init
│   │   │   └── seed.ts          # Default demo scenarios & conversation seeds
│   │   ├── providers/
│   │   │   ├── claudeAdapter.ts # Anthropic API integration
│   │   │   ├── geminiAdapter.ts # Google Gemini API integration
│   │   │   ├── handoffEngine.ts # Context compression & state synthesizer
│   │   │   └── types.ts         # Provider & schema contracts
│   │   ├── routes/
│   │   │   ├── conversations.ts # Thread management & active context endpoints
│   │   │   ├── handoffs.ts      # Handoff trigger, review, and migration routes
│   │   │   └── providers.ts     # Provider status & model telemetry
│   │   └── index.ts             # Express server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example
└── README.md
---

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express, TypeScript
* **Storage:** SQLite (`better-sqlite3`)
* **AI Providers:** Google Gemini API (`@google/genai`), Anthropic API (`@anthropic-ai/sdk`)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* `npm` or `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Abhi6160/Orchestration-System.git](https://github.com/Abhi6160/Orchestration-System.git)
   cd Orchestration-System
