import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Loader2 } from 'lucide-react';
import type { ProviderId } from '../types';
import { getProviderMeta } from '../lib/providerMeta';

interface ComposerProps {
  currentProvider: ProviderId;
  totalTokens: number;
  contextLimit: number;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onSimulateTokens?: (tokens: number) => void;
}

export const Composer: React.FC<ComposerProps> = ({
  currentProvider,
  totalTokens,
  contextLimit,
  onSendMessage,
  isLoading,
  onSimulateTokens
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const meta = getProviderMeta(currentProvider);
  const limit = contextLimit || meta.contextWindow;
  const percent = Math.min(100, Math.round((totalTokens / limit) * 100));
  const isHighContext = percent >= 80;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Color selection for context bar
  const barColor = isHighContext ? 'bg-amber-500' : meta.barColor;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-4 px-6 flex justify-center z-10 select-none">
      <div className="w-full max-w-[800px] flex flex-col gap-2">
        {/* Context Usage Bar */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${barColor}`}
              style={{ width: `${Math.max(2, percent)}%` }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[10px] font-mono font-medium ${
                isHighContext ? 'text-amber-700 font-semibold' : 'text-on-surface-variant'
              }`}
            >
              {percent}% Context ({totalTokens.toLocaleString()} / {limit.toLocaleString()} tokens)
            </span>

            {/* Simulated limit helper toggle for testing */}
            {onSimulateTokens && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSimulateTokens(164000)}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/50 cursor-pointer"
                  title="Simulate 82% context warning"
                >
                  82% Warning
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateTokens(25000)}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/50 cursor-pointer"
                  title="Simulate normal load"
                >
                  Reset 12%
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Input Box */}
        <div
          className={`relative bg-surface-container-lowest border rounded-xl shadow-xs transition-all border-outline-variant ${meta.ring}`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={`Message ${meta.displayName}...`}
            rows={1}
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none py-3.5 pl-4 pr-24 text-xs text-primary placeholder:text-on-surface-variant custom-scrollbar min-h-[46px] max-h-[180px] leading-relaxed"
          />

          <div className="absolute right-2.5 bottom-2 flex items-center gap-1.5">
            <button
              type="button"
              className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
              title="Attach context file or prompt"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                input.trim() && !isLoading
                  ? meta.sendBg
                  : 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed'
              }`}
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="text-center">
          <span className="text-[10px] text-on-surface-variant/60">
            ContextBridge synthesizes context across model boundaries. Always verify critical implementation details.
          </span>
        </div>
      </div>
    </div>
  );
};
