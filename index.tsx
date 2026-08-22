import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  MessagesSquare,
  Repeat,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/nexus/AppShell";
import { TopBar } from "@/components/nexus/TopBar";
import { MetricCard } from "@/components/nexus/MetricCard";
import { ModelCard } from "@/components/nexus/ModelCard";
import { ActivityTimeline } from "@/components/nexus/ActivityTimeline";
import { StatusIndicator } from "@/components/nexus/StatusIndicator";
import { MODELS } from "@/lib/nexus/models";
import { RECENT_ACTIVITY } from "@/lib/nexus/mock-service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS AI — Multiple AIs. One continuous intelligence." },
      {
        name: "description",
        content:
          "NEXUS AI is an orchestration layer above multiple AI models: automatic routing, automatic failover, and full context preservation across model handoffs.",
      },
      { property: "og:title", content: "NEXUS AI — Orchestration Dashboard" },
      {
        property: "og:description",
        content:
          "One interface, multiple AI models, automatic handoffs with preserved context and task state.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell>
      <TopBar
        title="Good morning, Demo User"
        subtitle="Your AI workspace is ready."
        actions={
          <>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessagesSquare className="size-4" /> New Conversation
            </Link>
            <Link
              to="/settings"
              aria-label="Profile"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              <UserRound className="size-4" />
            </Link>
          </>
        }
      />

      <div className="space-y-6 p-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active Models" value="4" hint="All providers reachable" icon={Boxes} />
          <MetricCard
            label="Conversations"
            value="24"
            hint="Across 3 projects"
            icon={MessagesSquare}
            tone="violet"
          />
          <MetricCard
            label="Successful Handoffs"
            value="7"
            hint="Zero user interventions"
            icon={Repeat}
            tone="warning"
          />
          <MetricCard
            label="Context Preserved"
            value="100%"
            hint="Across every handoff"
            icon={ShieldCheck}
            tone="success"
          />
        </section>

        <section className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-mono-xs text-muted-foreground">Orchestrator</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="relative inline-flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-success" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight">ONLINE</h2>
                <span className="rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-mono-xs text-success">
                  Auto routing
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Monitoring token limits, context capacity, latency and provider availability
                in real time.
              </p>
            </div>
            <Link
              to="/orchestration"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              Orchestration engine <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {MODELS.map((model) => (
              <ModelCard key={model.id} model={model} compact />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Recent Activity</h2>
              <StatusIndicator status="available" label="Live" />
            </div>
            <div className="mt-4">
              <ActivityTimeline entries={RECENT_ACTIVITY} />
            </div>
          </div>

          <div className="panel flex flex-col justify-between p-6">
            <div>
              <p className="text-mono-xs text-muted-foreground">Continuity guarantee</p>
              <p className="mt-3 text-lg font-medium leading-snug">
                The model changes.
                <br />
                <span className="text-primary">The user's work does not.</span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Every handoff carries the conversation transcript, task state, key decisions
                and user intent to the next model — mid-task, without a restart.
              </p>
            </div>
            <div className="mt-6 grid gap-2">
              <Link
                to="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet px-3.5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Activity className="size-4" /> Run live orchestration demo
              </Link>
              <Link
                to="/continuity"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                Inspect continuity layer
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
