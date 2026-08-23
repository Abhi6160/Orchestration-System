import { useState } from "react";
import { X } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

const TOGGLES = [
  { id: "motion", label: "Ambient network animation", initial: true },
  { id: "sound", label: "Interface sound cues", initial: false },
  { id: "stream", label: "Stream responses token by token", initial: true },
  { id: "memory", label: "Remember conversation context", initial: true },
];

export function SettingsPanel({ open, onClose }: Props) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.id, t.initial])),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/80 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="glass-panel w-full max-w-md animate-rise-in rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="font-display text-xl text-gold-gradient">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="grid size-9 place-items-center rounded-full border border-gold/25 text-gold hover:border-gold-bright"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="my-4 h-px hairline-gold" />

        <ul className="space-y-3">
          {TOGGLES.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4">
              <span className="text-sm text-warm">{t.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={state[t.id]}
                aria-label={t.label}
                onClick={() => setState((s) => ({ ...s, [t.id]: !s[t.id] }))}
                className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                  state[t.id] ? "border-gold bg-crimson/70" : "border-gold/25 bg-ink"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4.5 rounded-full transition-all ${
                    state[t.id] ? "left-5.5 bg-gold-bright" : "left-0.5 bg-muted-foreground"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-muted-foreground">
          Nexus intelligence core v2.4 — preferences are stored locally for this demo.
        </p>
      </div>
    </div>
  );
}

export default SettingsPanel;
