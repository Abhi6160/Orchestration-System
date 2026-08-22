import { Mic } from "lucide-react";

const BARS = [0.4, 0.75, 1, 0.6, 0.9, 0.5, 0.8];

type Props = {
  active: boolean;
  onToggle: () => void;
};

/** Animated waveform / microphone control for the AI console. */
export function VoiceInput({ active, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={active ? "Stop voice input" : "Start voice input"}
      aria-pressed={active}
      className={`group grid size-11 shrink-0 place-items-center rounded-full border transition-all duration-200 ${
        active
          ? "border-neon-bright bg-crimson-dark/70 shadow-neon"
          : "border-gold/30 bg-ink/60 hover:border-gold"
      }`}
    >
      <span className="flex h-5 items-end gap-[2px]" aria-hidden="true">
        {BARS.map((h, i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full ${
              active
                ? i % 2 === 0
                  ? "bg-neon-bright"
                  : "bg-gold-bright"
                : i % 2 === 0
                  ? "bg-red-deep"
                  : "bg-gold/70"
            }`}
            style={{
              height: `${h * 100}%`,
              animation: active
                ? `glow-breathe ${0.6 + i * 0.12}s ease-in-out ${i * 0.05}s infinite`
                : undefined,
            }}
          />
        ))}
      </span>
      <Mic className="sr-only" />
    </button>
  );
}

export default VoiceInput;
