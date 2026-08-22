import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Info, Loader2, Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/nexus/AppShell";
import { ChatMessage } from "@/components/nexus/ChatMessage";
import { ContextMeter } from "@/components/nexus/ContextMeter";
import { HandoffAnimation } from "@/components/nexus/HandoffAnimation";
import { ModelGlyph } from "@/components/nexus/ModelCard";
import { getModel } from "@/lib/nexus/models";
import {
  CHAT_SEED,
  CLAUDE_PARTIAL,
  GEMINI_CONTINUATION,
  SECOND_USER_MESSAGE,
} from "@/lib/nexus/mock-service";
import type { Message } from "@/lib/nexus/types";
import { useHandoffSimulation } from "@/lib/nexus/use-handoff";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Research Assistant — NEXUS AI Chat" },
      {
        name: "description",
        content:
          "One continuous conversation across multiple AI models. Watch NEXUS AI hand off from Claude to Gemini mid-task without interrupting the user.",
      },
      { property: "og:title", content: "NEXUS AI Chat — Auto Mode" },
      {
        property: "og:description",
        content: "Automatic model routing with preserved context, task state and intent.",
      },
    ],
  }),
  component: ChatScreen,
});

function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(CHAT_SEED);
  const [draft, setDraft] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sim = useHandoffSimulation({
    activeModel: "claude",
    startContext: 42,
    onPhase: (phase, decision) => {
      if (phase === "complete") {
        setNotification(
          "Model handoff completed automatically. Your conversation continues without interruption.",
        );
      }
      if (phase === "done" && decision) {
        setMessages((prev) => [
          ...prev,
          {
            id: "m4",
            author: "assistant",
            content: GEMINI_CONTINUATION,
            createdAt: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            metadata: {
              model: decision.toModel,
              latencySeconds: 1.2,
              contextUsage: 24,
              confidence: "High",
            },
          },
        ]);
      }
    },
  });

  const activeModel = getModel(
    sim.phase === "done" && sim.decision ? sim.decision.toModel : "claude",
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sim.phase, sim.transferStage]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(t);
  }, [notification]);

  const runScenario = (text: string) => {
    setStarted(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${prev.length}`,
        author: "user",
        content: text,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    sim.start();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim() || SECOND_USER_MESSAGE;
    setDraft("");
    if (!started) runScenario(text);
    else {
      setMessages((prev) => [
        ...prev,
        {
          id: `u-${prev.length}`,
          author: "user",
          content: text,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: `a-${prev.length}`,
          author: "assistant",
          content:
            "Continuing on the same task envelope — the routing layer kept " +
            activeModel.name +
            " active because it still has capacity and matches this task type.",
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          metadata: {
            model: activeModel.id,
            latencySeconds: 1.1,
            contextUsage: 26,
            confidence: "High",
          },
        },
      ]);
    }
  };

  const processing = sim.running && sim.phase === "processing";

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/85 px-6 py-4 pl-14 backdrop-blur-md lg:pl-6">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Research Assistant</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-mono-xs text-primary">
                Auto Mode
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                Orchestrator Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden w-44 sm:block">
              <ContextMeter value={sim.contextUsage} label="Context" size="sm" />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
              <ModelGlyph name={activeModel.name} accent={activeModel.accent} />
              <div className="leading-tight">
                <p className="text-xs font-medium">{activeModel.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {processing ? "Processing…" : "Active"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {notification && (
          <div className="animate-slide-in mx-6 mt-4 flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-success" />
            <p className="text-sm text-foreground">{notification}</p>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {sim.running && (
              <div className="animate-rise space-y-4">
                {sim.phase === "processing" && (
                  <div className="flex gap-3">
                    <ModelGlyph name="Claude" accent="warning" />
                    <div className="max-w-2xl rounded-xl border border-border bg-surface px-4 py-3">
                      <p className="flex items-center gap-2 text-mono-xs text-warning">
                        <Loader2 className="size-3.5 animate-spin" /> Claude · Processing…
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {CLAUDE_PARTIAL}
                        <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
                      </p>
                      <div className="mt-4">
                        <ContextMeter value={sim.contextUsage} label="Claude context" size="sm" />
                      </div>
                    </div>
                  </div>
                )}

                {sim.phase === "threshold" && (
                  <div className="animate-rise flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
                    <Sparkles className="size-4 text-warning" />
                    <p className="text-sm text-warning">
                      Context capacity approaching limit — {Math.round(sim.contextUsage)}% of
                      Claude's window used.
                    </p>
                  </div>
                )}

                <HandoffAnimation
                  phase={sim.phase}
                  decision={sim.decision}
                  transferStage={sim.transferStage}
                  fromModelId="claude"
                />

                {sim.phase === "continuing" && sim.decision && (
                  <div className="animate-rise flex gap-3">
                    <ModelGlyph name="Gemini" accent="primary" />
                    <div className="rounded-xl border border-border bg-surface px-4 py-3">
                      <p className="flex items-center gap-2 text-mono-xs text-primary">
                        <Loader2 className="size-3.5 animate-spin" /> Gemini · Continuing your
                        task
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Resuming the architecture design at 68% completion — no restart, no
                        repeated questions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="border-t border-border bg-background/80 px-6 py-4 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="relative flex-1">
              <textarea
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  started
                    ? "Message NEXUS AI…"
                    : `Try: "${SECOND_USER_MESSAGE.slice(0, 58)}…"`
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    (e.currentTarget.form as HTMLFormElement).requestSubmit();
                  }
                }}
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
              />
              <button
                type="submit"
                disabled={sim.running}
                aria-label="Send message"
                className={cn(
                  "absolute bottom-2 right-2 inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90",
                  sim.running && "cursor-not-allowed opacity-40",
                )}
              >
                <Send className="size-4" />
              </button>
            </div>
            {sim.phase === "done" && (
              <button
                type="button"
                onClick={() => {
                  setMessages(CHAT_SEED);
                  setStarted(false);
                  sim.reset();
                }}
                className="rounded-xl border border-border bg-surface-2 px-3 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Reset demo
              </button>
            )}
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-[11px] text-muted-foreground">
            Auto mode selects and switches models for you. Simulated responses — no provider
            keys required.
          </p>
        </form>
      </div>
    </AppShell>
  );
}
