import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModel } from "@/lib/nexus/models";
import type { Message } from "@/lib/nexus/types";
import { ModelGlyph } from "./ModelCard";
import { Markdownish } from "./Markdownish";

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.author === "user";
  const model = message.metadata?.model ? getModel(message.metadata.model) : null;

  return (
    <article className={cn("animate-rise flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="mt-0.5">
          {model ? (
            <ModelGlyph name={model.name} accent={model.accent} />
          ) : (
            <span className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 font-mono text-xs">
              NX
            </span>
          )}
        </div>
      )}

      <div className={cn("max-w-2xl", isUser && "order-first")}>
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "border-primary/25 bg-primary/10 text-foreground"
              : "border-border bg-surface",
          )}
        >
          {isUser ? <p>{message.content}</p> : <Markdownish text={message.content} />}
        </div>

        {message.metadata && model && (
          <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <dt className="text-mono-xs">Model</dt>
              <dd className="font-medium text-foreground">{model.name}</dd>
            </div>
            {message.metadata.latencySeconds != null && (
              <div className="flex items-center gap-1.5">
                <dt className="text-mono-xs">Latency</dt>
                <dd className="font-mono text-foreground">
                  {message.metadata.latencySeconds.toFixed(1)}s
                </dd>
              </div>
            )}
            {message.metadata.contextUsage != null && (
              <div className="flex items-center gap-1.5">
                <dt className="text-mono-xs">Context</dt>
                <dd className="font-mono text-foreground">
                  {Math.round(message.metadata.contextUsage)}%
                </dd>
              </div>
            )}
            {message.metadata.confidence && (
              <div className="flex items-center gap-1.5">
                <dt className="text-mono-xs">Confidence</dt>
                <dd className="font-medium text-success">{message.metadata.confidence}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {isUser && (
        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-muted-foreground">
          <User className="size-4" strokeWidth={1.8} />
        </span>
      )}
    </article>
  );
}
