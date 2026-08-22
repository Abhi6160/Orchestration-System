export function NexusLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="6" r="3" className="fill-primary" />
      <circle cx="6" cy="22" r="3" className="fill-violet" />
      <circle cx="26" cy="22" r="3" className="fill-primary/70" />
      <circle cx="16" cy="16" r="2.4" className="fill-foreground" />
      <g stroke="currentColor" strokeWidth="1.2" className="text-primary/60">
        <path d="M16 9v4.6M14 17.6 8.4 20.6M18 17.6l5.6 3M8.6 20.2 15 8.4M23.4 20.2 17 8.4M9 22h14" />
      </g>
    </svg>
  );
}
