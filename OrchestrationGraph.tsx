import { cn } from "@/lib/utils";

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  tone?: "primary" | "violet" | "warning" | "success" | "neutral";
  width?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  /** Route the edge around the diagram instead of straight. */
  curve?: number;
  dashed?: boolean;
}

const NODE_H = 34;

const TONE_CLASS = {
  primary: "fill-[oklch(0.674_0.166_259.5_/_0.14)] stroke-[oklch(0.674_0.166_259.5_/_0.6)]",
  violet: "fill-[oklch(0.606_0.226_292.6_/_0.14)] stroke-[oklch(0.606_0.226_292.6_/_0.6)]",
  warning: "fill-[oklch(0.769_0.163_70.1_/_0.12)] stroke-[oklch(0.769_0.163_70.1_/_0.55)]",
  success: "fill-[oklch(0.723_0.192_149.6_/_0.12)] stroke-[oklch(0.723_0.192_149.6_/_0.55)]",
  neutral: "fill-[oklch(0.234_0.02_265)] stroke-[oklch(1_0_0_/_0.12)]",
} as const;

export function OrchestrationGraph({
  nodes,
  edges,
  activeNodes,
  activeEdges,
  height = 640,
  width = 760,
  className,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeNodes?: string[];
  activeEdges?: string[];
  height?: number;
  width?: number;
  className?: string;
}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const active = new Set(activeNodes ?? []);
  const activeE = new Set(activeEdges ?? []);

  const path = (edge: GraphEdge) => {
    const a = byId.get(edge.from);
    const b = byId.get(edge.to);
    if (!a || !b) return "";
    const ax = a.x;
    const ay = a.y + (b.y > a.y ? NODE_H / 2 : -NODE_H / 2);
    const bx = b.x;
    const by = b.y + (b.y > a.y ? -NODE_H / 2 : NODE_H / 2);
    if (edge.curve) {
      return `M ${ax} ${ay} C ${ax + edge.curve} ${ay + (by - ay) * 0.35}, ${bx + edge.curve} ${by - (by - ay) * 0.35}, ${bx} ${by}`;
    }
    return `M ${ax} ${ay} C ${ax} ${ay + (by - ay) / 2}, ${bx} ${by - (by - ay) / 2}, ${bx} ${by}`;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full", className)}
      role="img"
      aria-label="Orchestration decision flow"
    >
      <defs>
        <linearGradient id="edge-active" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.674 0.166 259.5)" />
          <stop offset="100%" stopColor="oklch(0.606 0.226 292.6)" />
        </linearGradient>
      </defs>

      {edges.map((edge, i) => {
        const key = `${edge.from}->${edge.to}`;
        const isActive = activeE.has(key);
        const d = path(edge);
        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              strokeWidth={isActive ? 1.6 : 1}
              stroke={isActive ? "url(#edge-active)" : "oklch(1 0 0 / 0.12)"}
              strokeDasharray={edge.dashed ? "4 5" : undefined}
            />
            {isActive && (
              <path
                d={d}
                fill="none"
                stroke="oklch(0.674 0.166 259.5)"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeDasharray="3 21"
                className="animate-flow"
              />
            )}
          </g>
        );
      })}

      {nodes.map((node) => {
        const w = node.width ?? 170;
        const isActive = active.has(node.id);
        return (
          <g key={node.id} className="transition-opacity">
            <rect
              x={node.x - w / 2}
              y={node.y - NODE_H / 2}
              width={w}
              height={NODE_H}
              rx={8}
              className={cn(
                TONE_CLASS[node.tone ?? "neutral"],
                "transition-all duration-300",
              )}
              strokeWidth={isActive ? 1.6 : 1}
              style={
                isActive
                  ? { filter: "drop-shadow(0 0 10px oklch(0.674 0.166 259.5 / 0.45))" }
                  : undefined
              }
            />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              className={cn(
                "text-[11px]",
                isActive ? "fill-[oklch(0.984_0.003_247.858)]" : "fill-[oklch(0.711_0.035_256.8)]",
              )}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
