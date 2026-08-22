import { useId } from "react";

type Props = {
  size?: number;
  className?: string;
  withOrbit?: boolean;
};

/**
 * Layered SVG AI emblem: metallic gold bevelled "N" over a dark core with
 * deep-red internal illumination and a neon/gold orbital ring.
 */
export function NexusLogo3D({ size = 56, className = "", withOrbit = true }: Props) {
  const id = useId().replace(/:/g, "");

  return (
    <span
      className={`group/logo relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full bg-neon/25 blur-xl animate-glow-breathe" />
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="relative animate-idle-float transition-transform duration-500 ease-out [transform-style:preserve-3d] group-hover/logo:[transform:perspective(600px)_rotateX(4deg)_rotateY(-5deg)_scale(1.04)]"
      >
        <defs>
          <radialGradient id={`core-${id}`} cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="var(--crimson)" stopOpacity="0.9" />
            <stop offset="55%" stopColor="var(--blood)" />
            <stop offset="100%" stopColor="var(--ink)" />
          </radialGradient>
          <linearGradient id={`metal-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--gold-pale)" />
            <stop offset="28%" stopColor="var(--gold-bright)" />
            <stop offset="52%" stopColor="var(--gold)" />
            <stop offset="72%" stopColor="var(--gold-warm)" />
            <stop offset="100%" stopColor="var(--crimson)" />
          </linearGradient>
          <linearGradient id={`face-${id}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="var(--charcoal)" />
            <stop offset="45%" stopColor="var(--ink-2)" />
            <stop offset="100%" stopColor="var(--blood)" />
          </linearGradient>
          <linearGradient id={`sheen-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--warm)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--warm)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--warm)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--gold-bright)" />
            <stop offset="35%" stopColor="var(--gold)" stopOpacity="0.15" />
            <stop offset="60%" stopColor="var(--neon)" />
            <stop offset="100%" stopColor="var(--gold-warm)" stopOpacity="0.2" />
          </linearGradient>
          <filter id={`soft-${id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <clipPath id={`clip-${id}`}>
            <path d="M34 86V34h13l26 30V34h13v52H73L47 56v30z" />
          </clipPath>
        </defs>

        {/* dark core disc */}
        <circle cx="60" cy="60" r="40" fill={`url(#core-${id})`} />
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke="var(--gold)"
          strokeOpacity="0.35"
          strokeWidth="1"
        />

        {/* neural pathways inside the core */}
        <g stroke="var(--neon)" strokeOpacity="0.35" strokeWidth="0.8" fill="none">
          <path d="M26 70q22 12 44-4t26-18" />
          <path d="M30 46q20-10 38 2t24 6" />
        </g>
        <g fill="var(--gold-bright)" opacity="0.8">
          <circle cx="34" cy="64" r="1.4" />
          <circle cx="88" cy="52" r="1.2" />
          <circle cx="62" cy="30" r="1.1" />
        </g>

        {/* extrusion / depth of the N */}
        <path
          d="M34 86V34h13l26 30V34h13v52H73L47 56v30z"
          transform="translate(3.5 3.5)"
          fill="var(--ink)"
          opacity="0.85"
        />
        <path
          d="M34 86V34h13l26 30V34h13v52H73L47 56v30z"
          transform="translate(2 2)"
          fill="var(--crimson-dark)"
        />

        {/* face + bevelled gold edge */}
        <path d="M34 86V34h13l26 30V34h13v52H73L47 56v30z" fill={`url(#face-${id})`} />
        <path
          d="M34 86V34h13l26 30V34h13v52H73L47 56v30z"
          fill="none"
          stroke={`url(#metal-${id})`}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* inner red illumination + travelling metallic sheen */}
        <g clipPath={`url(#clip-${id})`}>
          <ellipse
            cx="60"
            cy="88"
            rx="30"
            ry="14"
            fill="var(--neon)"
            opacity="0.35"
            filter={`url(#soft-${id})`}
          />
          <rect
            x="-60"
            y="20"
            width="40"
            height="80"
            fill={`url(#sheen-${id})`}
            transform="rotate(14 60 60)"
          >
            <animate
              attributeName="x"
              values="-60;130"
              dur="6s"
              repeatCount="indefinite"
            />
          </rect>
        </g>

        {/* orbital ring */}
        {withOrbit && (
          <g className="origin-center animate-ring-spin">
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="20"
              fill="none"
              stroke={`url(#ring-${id})`}
              strokeWidth="2.4"
              strokeLinecap="round"
              transform="rotate(-24 60 60)"
            />
            <circle cx="110" cy="46" r="2.2" fill="var(--gold-bright)" />
            <circle cx="12" cy="74" r="1.8" fill="var(--neon-bright)" />
          </g>
        )}
      </svg>
    </span>
  );
}

export default NexusLogo3D;
