import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ThumbsUp, 
  Terminal
} from 'lucide-react';
import type { Message, ProviderId } from '../types';
import { getProviderMeta } from '../lib/providerMeta';

interface MessageBubbleProps {
  message: Message;
  currentProvider?: ProviderId;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [liked, setLiked] = useState(false);

  const isUser = message.role === 'user';
  const meta = getProviderMeta(message.provider);
  const ProviderIcon = meta.icon;

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Helper to parse markdown-like code blocks and tables from content
  const renderFormattedContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+([a-zA-Z0-9_.-]+))?\n([\s\S]*?)```/g;
    
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(renderTextWithFormatting(textBefore, `text-${lastIndex}`));
      }

      const lang = match[1] || 'code';
      const filename = match[2] || (lang === 'yaml' ? 'timeline.yml' : `${lang}-snippet.${lang}`);
      const code = match[3];
      const codeId = `code-${match.index}`;

      parts.push(
        <div key={codeId} className="bg-[#111827] rounded-lg overflow-hidden my-3 border border-outline-variant/30 text-xs shadow-xs">
          <div className="bg-[#1f2937] px-3.5 py-2 flex justify-between items-center border-b border-gray-700/80">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-mono text-[11px] font-medium text-gray-300">{filename}</span>
            </div>
            <button
              onClick={() => handleCopyCode(code, codeId)}
              className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-gray-700/60 transition-colors cursor-pointer"
            >
              {copiedCode === codeId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto custom-scrollbar font-mono text-[12px] leading-relaxed text-gray-200 bg-[#111827]">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parts.push(renderTextWithFormatting(remainingText, `text-${lastIndex}`));
    }

    return parts;
  };

  // Helper for text formatting (headings, lists, bold, tables)
  const renderTextWithFormatting = (text: string, keyPrefix: string) => {
    // Check if text contains a markdown table
    if (text.includes('|') && text.includes('---')) {
      const lines = text.split('\n');
      const tableLines: string[] = [];
      const nonTableBefore: string[] = [];
      const nonTableAfter: string[] = [];
      let inTable = false;
      let tableDone = false;

      for (const line of lines) {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          inTable = true;
          tableLines.push(line);
        } else if (inTable && !tableDone) {
          tableDone = true;
          nonTableAfter.push(line);
        } else if (!inTable) {
          nonTableBefore.push(line);
        } else {
          nonTableAfter.push(line);
        }
      }

      if (tableLines.length >= 3) {
        return (
          <div key={keyPrefix} className="space-y-3">
            {nonTableBefore.length > 0 && renderParagraphs(nonTableBefore.join('\n'), `${keyPrefix}-before`)}
            <div className="overflow-x-auto my-3 rounded-lg border border-outline-variant/60">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-surface-container font-semibold text-primary border-b border-outline-variant/60">
                  <tr>
                    {tableLines[0]
                      .split('|')
                      .filter((c) => c.trim().length > 0)
                      .map((col, idx) => (
                        <th key={idx} className="px-3 py-2">
                          {col.trim()}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 bg-surface-container-lowest">
                  {tableLines.slice(2).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-surface-container-low/50">
                      {row
                        .split('|')
                        .filter((c) => c.trim().length > 0)
                        .map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 text-on-surface-variant">
                            {cell.trim().startsWith('**') ? (
                              <strong className="text-primary">{cell.trim().replace(/\*\*/g, '')}</strong>
                            ) : (
                              cell.trim()
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {nonTableAfter.length > 0 && renderParagraphs(nonTableAfter.join('\n'), `${keyPrefix}-after`)}
          </div>
        );
      }
    }

    return renderParagraphs(text, keyPrefix);
  };

  const renderParagraphs = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    return (
      <div key={keyPrefix} className="space-y-2">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-semibold text-sm text-primary mt-3 mb-1">
                {trimmed.replace('### ', '')}
              </h3>
            );
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.substring(2);
            return (
              <li key={idx} className="ml-4 list-disc text-xs text-on-surface-variant leading-relaxed">
                {renderInlineStyles(itemText)}
              </li>
            );
          }

          if (/^\d+\.\s/.test(trimmed)) {
            const match = trimmed.match(/^(\d+)\.\s(.*)/);
            if (match) {
              return (
                <div key={idx} className="ml-2 flex items-start gap-1.5 text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-semibold text-primary shrink-0">{match[1]}.</span>
                  <span>{renderInlineStyles(match[2])}</span>
                </div>
              );
            }
          }

          return (
            <p key={idx} className="text-xs text-primary leading-relaxed">
              {renderInlineStyles(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderInlineStyles = (str: string) => {
    // Replace **bold** with <strong> and `code` with <code>
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-[11px] px-1 py-0.5 rounded bg-surface-container text-primary border border-outline-variant/50">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // User Message Layout
  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1 w-full">
        <div className="bg-surface-container-low px-4 py-3 rounded-xl rounded-tr-xs border border-outline-variant max-w-[85%] shadow-2xs">
          <p className="text-xs text-primary leading-relaxed">{message.content}</p>
        </div>
        <span className="text-[10px] text-on-surface-variant/70 mr-1 font-medium">You</span>
      </div>
    );
  }

  // Assistant Message Layout (Claude or Gemini)
  return (
    <div className="flex items-start gap-2.5 max-w-[92%] w-full">
      {/* Provider Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${meta.iconBg} ${meta.iconText}`}
      >
        <ProviderIcon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Assistant Content Box */}
        <div className="bg-surface-container-lowest px-4 py-3.5 rounded-xl rounded-tl-xs border border-outline-variant shadow-2xs">
          {renderFormattedContent(message.content)}
        </div>

        {/* Message Metadata & Quick Actions */}
        <div className="flex items-center justify-between ml-1 text-[10px] text-on-surface-variant/70">
          <div className="flex items-center gap-1.5 font-medium">
            <span className={`${meta.badgeText} font-semibold`}>
              {meta.displayName}
            </span>
            {message.tokens > 0 && (
              <span>• {message.tokens.toLocaleString()} tokens</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setLiked(!liked)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                liked ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
              title="Helpful response"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={handleCopyMessage}
              className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
              title="Copy message"
            >
              {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
