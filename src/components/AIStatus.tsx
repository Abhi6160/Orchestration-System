export function AIStatus({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-gold/25 bg-ink/60 px-3 py-1 text-[10px] font-medium tracking-[0.22em] text-gold uppercase ${className}`}
    >
      <span className="size-1.5 rounded-full bg-neon animate-status-pulse" />
      Nexus online
    </span>
  );
}

export default AIStatus;
