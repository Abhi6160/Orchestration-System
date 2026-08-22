export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-gold-pale/80" aria-live="polite">
      <span>Nexus is thinking</span>
      <span className="flex items-end gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`size-1.5 rounded-full animate-think-dot ${
              i === 1 ? "bg-gold-bright" : "bg-neon"
            }`}
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
    </div>
  );
}

export default ThinkingIndicator;
