import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  Gauge,
  Layers,
  MessageSquarePlus,
  MessagesSquare,
  PlayCircle,
  Settings,
  Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NexusLogo } from "./NexusLogo";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/chat", label: "New Chat", icon: MessageSquarePlus },
  { to: "/conversations", label: "Conversations", icon: MessagesSquare },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/models", label: "Models", icon: Boxes },
  { to: "/orchestration", label: "Orchestration", icon: Share2 },
  { to: "/usage", label: "Usage", icon: Layers },
  { to: "/settings", label: "Settings", icon: Settings },
];

const DEMO_NAV: NavItem[] = [
  { to: "/continuity", label: "Continuity Layer", icon: Layers },
  { to: "/demo", label: "Live Demo", icon: PlayCircle },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const renderItem = (item: NavItem) => {
    const active = pathname === item.to;
    return (
      <Link
        key={item.to}
        to={item.to}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          active
            ? "bg-sidebar-accent text-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
        )}
        <item.icon
          className={cn("size-4 shrink-0", active && "text-primary")}
          strokeWidth={1.8}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "z-30 flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <NexusLogo className="size-7 shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">NEXUS AI</p>
            <p className="truncate text-[10px] text-muted-foreground">
              Multiple AIs. One intelligence.
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        <div className="space-y-0.5">{PRIMARY_NAV.map(renderItem)}</div>
        <div className="mt-6">
          {!collapsed && (
            <p className="px-3 pb-2 text-mono-xs text-muted-foreground/70">Demonstration</p>
          )}
          <div className="space-y-0.5">{DEMO_NAV.map(renderItem)}</div>
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </button>

        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-sidebar-border bg-surface-2/60 p-2",
            collapsed && "justify-center border-transparent bg-transparent p-0",
          )}
        >
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet font-mono text-xs font-semibold text-background">
            DU
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">Demo User</p>
              <p className="truncate text-[10px] text-muted-foreground">SIH Prototype</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
