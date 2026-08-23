import { Check, Copy, UserRound } from "lucide-react";
import { useState } from "react";
import type { ChatMessageData } from "@/lib/ai-service";
import NexusLogo3D from "./NexusLogo3D";

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  if (isUser) {
    return (
      <li className="flex animate-rise-in items-start justify-end gap-3">
        <div className="max-w-[min(30rem,80%)] rounded-2xl rounded-tr-sm border border-neon/30 bg-linear-to-br from-crimson-dark/80 to-ink px-4 py-3">
          {message.attachments?.length ? (
            <ul className="mb-2 flex flex-wrap gap-2">
              {message.attachments.map((a) => (
                <li key={a.id}>
                  {a.previewUrl ? (
                    <img
                      src={a.previewUrl}
                      alt={a.name}
                      className="size-16 rounded-lg border border-gold/30 object-cover"
                    />
                  ) : (
                    <span className="rounded-lg border border-gold/30 px-2 py-1 text-xs text-gold-pale">
                      {a.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm whitespace-pre-wrap text-warm">{message.text}</p>
          <p className="mt-1 text-right text-[10px] text-gold/60">{message.time}</p>
        </div>
        <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full border border-gold/40 bg-ink text-gold">
          <UserRound className="size-4" />
        </span>
      </li>
    );
  }

  return (
    <li className="flex animate-rise-in items-start gap-3">
      <NexusLogo3D size={38} withOrbit={false} className="mt-1" />
      <div className="glass-panel max-w-[min(36rem,86%)] rounded-2xl rounded-tl-sm px-4 py-3">
        <p className="text-xs tracking-wide text-gold">Nexus</p>
        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-warm">
          {message.text}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{message.time}</span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy response"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:text-gold"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>
    </li>
  );
}

export default ChatMessage;
