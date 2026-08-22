import { useEffect, useRef } from "react";
import type { ChatMessageData } from "@/lib/ai-service";
import ChatMessage from "./ChatMessage";
import ThinkingIndicator from "./ThinkingIndicator";
import AIStatus from "./AIStatus";

type Props = {
  messages: ChatMessageData[];
  thinking: boolean;
};

export function ChatInterface({ messages, thinking }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  return (
    <section
      aria-label="Conversation with Nexus"
      className="glass-panel flex h-full min-h-0 flex-col rounded-3xl"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-display text-sm tracking-wide text-gold-gradient">
          Nexus intelligence session
        </p>
        <AIStatus />
      </div>
      <div className="h-px hairline-gold" />
      <ul className="min-h-0 flex-1 space-y-5 overflow-y-auto scrollbar-nexus p-4">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {thinking && (
          <li className="pl-12">
            <ThinkingIndicator />
          </li>
        )}
        <div ref={endRef} />
      </ul>
    </section>
  );
}

export default ChatInterface;
