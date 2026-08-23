import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

type Node = { x: number; y: number; r: number; gold: boolean; delay: number };

function buildNetwork(count: number, seed = 7) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const nodes: Node[] = Array.from({ length: count }, (_, i) => {
    const x = rand() * 100;
    const depth = rand();
    return {
      x,
      y: 18 + depth * 78 + Math.sin(x / 9) * 6,
      r: 0.35 + depth * 0.9,
      gold: i % 9 === 0,
      delay: rand() * 5,
    };
  });
  const links: Array<[Node, Node, number]> = [];
  nodes.forEach((a, i) => {
    nodes.slice(i + 1).forEach((b) => {
      const d = Math.hypot(a.x - b.x, (a.y - b.y) / 2.4);
      if (d < 11) links.push([a, b, d]);
    });
  });
  return { nodes, links };
}

/** Full-screen cinematic backdrop + lower neural-network environment. */
export function NeuralBackground() {
  const isMobile = useIsMobile();
  const { nodes, links } = useMemo(() => buildNetwork(isMobile ? 46 : 110), [isMobile]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      {/* atmospheric layers */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,var(--crimson-dark)_0%,transparent_55%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_15%_35%,var(--blood)_0%,transparent_60%)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_88%_20%,var(--blood)_0%,transparent_62%)] opacity-70" />
      <div className="absolute inset-0 micro-grid opacity-40" />
      <div className="absolute inset-0 scanlines opacity-30" />

      {/* distant red planetary arcs */}
      <div className="absolute -top-24 left-[14%] hidden size-72 rounded-full border border-neon/25 opacity-40 blur-[1px] md:block" />
      <div className="absolute top-4 right-[10%] hidden size-56 rounded-full border border-neon/30 opacity-50 blur-[1px] md:block" />

      {/* neural network occupies the lower ~42% */}
      <div className="absolute inset-x-0 bottom-0 h-[42vh] animate-drift">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="size-full"
          role="presentation"
        >
          <defs>
            <linearGradient id="nb-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--neon)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--crimson)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <g stroke="url(#nb-line)" strokeWidth="0.12">
            {links.map(([a, b, d], i) => (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                opacity={0.55 - d / 30}
              />
            ))}
          </g>
          {nodes.map((n, i) => (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill={n.gold ? "var(--gold-bright)" : "var(--neon-bright)"}
              style={{
                animation: `glow-breathe ${5 + (i % 5)}s ease-in-out ${n.delay}s infinite`,
                filter: "drop-shadow(0 0 1.4px currentColor)",
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink via-ink/70 to-transparent" />
      </div>

      <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-ink to-transparent" />
    </div>
  );
}

export default NeuralBackground;
