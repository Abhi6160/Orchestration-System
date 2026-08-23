import { MessageCircle, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Conversation } from "@/lib/ai-service";

type Props = {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose?: () => void;
};

export function ChatHistory({ conversations, activeId, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const filtered = conversations.filter((c) =>
      c.title.toLowerCase().includes(query.toLowerCase()),
    );
    return (["Today", "Yesterday"] as const)
      .map((day) => ({ day, items: filtered.filter((c) => c.day === day) }))
      .filter((g) => g.items.length > 0);
  }, [conversations, query]);

  return (
    <section
      aria-label="Chat history"
      className="glass-panel flex h-full min-h-0 flex-col rounded-3xl p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base text-gold-gradient">Chat History</h2>
        <div className="flex items-center gap-1">
          <Search className="size-4 text-gold/70" aria-hidden="true" />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat history"
              className="grid size-8 place-items-center rounded-full border border-gold/25 text-gold lg:hidden"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <label className="sr-only" htmlFor="history-search">
        Search conversations
      </label>
      <input
        id="history-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search conversations"
        className="mt-3 w-full rounded-xl border border-gold/20 bg-ink/60 px-3 py-2 text-xs text-warm placeholder:text-muted-foreground focus:border-gold focus:outline-none"
      />

      <div className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto scrollbar-nexus pr-1">
        {groups.length === 0 && (
          <p className="pt-6 text-center text-xs text-muted-foreground">No conversations found.</p>
        )}
        {groups.map(({ day, items }) => (
          <div key={day}>
            <p className="px-2 pb-1 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              {day}
            </p>
            <ul className="space-y-1">
              {items.map((c) => {
                const active = c.id === activeId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      aria-current={active}
                      className={`flex w-full items-center gap-2 rounded-xl border-l-2 px-3 py-2.5 text-left text-xs transition-colors ${
                        active
                          ? "border-gold bg-crimson-dark/70 text-gold-pale"
                          : "border-transparent text-warm/85 hover:bg-crimson-dark/40 hover:text-gold-pale"
                      }`}
                    >
                      <MessageCircle
                        className={`size-3.5 shrink-0 ${active ? "text-neon-bright" : "text-gold/70"}`}
                      />
                      <span className="truncate">{c.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ChatHistory;
