import React from "react";
import {
  Plus,
  History,
  BookOpen,
  Settings,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Cpu,
  GitFork,
} from "lucide-react";
import type { Conversation } from "../types";
import { DocsModal } from "./DocsModal";
import { HelpModal } from "./HelpModal";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  isDemoMode?: boolean;
  currentTotalTokens?: number;
  currentContextLimit?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isDemoMode = true,
  currentTotalTokens = 0,
  currentContextLimit = 200000,
}) => {
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const tokensRemaining = Math.max(0, currentContextLimit - currentTotalTokens);
  const percentUsed = Math.min(
    100,
    Math.round((currentTotalTokens / (currentContextLimit || 200000)) * 100),
  );

  return (
    <>
      <nav className="w-[280px] h-screen fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col py-4 z-20 select-none">
        {/* Brand Header */}
        <div className="px-4 mb-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-xs">
            <GitFork className="w-4 h-4 text-on-primary rotate-90" />
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight text-primary leading-tight">
              ContextBridge
            </h1>
            <p className="text-xs text-on-surface-variant font-medium">
              AI Workspace
            </p>
          </div>
        </div>

        {/* Primary CTA - New Chat */}
        <div className="px-4 mb-4">
          <button
            onClick={onNewChat}
            className="w-full bg-primary text-on-primary hover:bg-neutral-800 active:bg-neutral-900 transition-colors flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium h-10 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-4">
          {/* Main Tabs */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">
              Conversations
            </div>
            <ul className="space-y-0.5 mt-1">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                const isClaude = conv.current_provider === "claude";

                return (
                  <li key={conv.id} className="group relative">
                    <button
                      onClick={() => onSelectConversation(conv.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left transition-all text-xs cursor-pointer ${
                        isActive
                          ? "bg-surface-container-high text-primary font-semibold border-r-2 border-primary"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isClaude ? "bg-secondary" : "bg-gemini-blue"
                          }`}
                        />
                        <span className="truncate">
                          {conv.title || "Untitled Conversation"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {conv.project_tag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant/80 font-normal">
                            {conv.project_tag}
                          </span>
                        )}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => onDeleteConversation(conv.id, e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onDeleteConversation(conv.id, e as any);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-error transition-opacity rounded cursor-pointer"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3 h-3 text-on-surface-variant hover:text-error" />
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Secondary Links */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">
              Workspace
            </div>
            <ul className="space-y-0.5 mt-1 text-xs">
              <li>
                <button
                  onClick={onNewChat}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors text-left cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-on-surface-variant" />
                  <span>Empty Workspace</span>
                </button>
              </li>
              <li>
                <a
                  href="#history"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                >
                  <History className="w-4 h-4 text-on-surface-variant" />
                  <span>Recent Handoffs</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => setIsDocsOpen(true)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors text-left cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-on-surface-variant" />
                  <span>Handoff Engine Docs</span>
                </button>
              </li>
              <li>
                <a
                  href="#settings"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                >
                  <Settings className="w-4 h-4 text-on-surface-variant" />
                  <span>Provider Settings</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Mode Indicator & Links */}
        <div className="px-3 mt-auto border-t border-outline-variant pt-3 space-y-2">
          <div className="px-2 py-1.5 rounded bg-surface-container-high/60 border border-outline-variant/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">Adapter Layer</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-surface-container-lowest text-on-surface-variant border border-outline-variant/50">
              {isDemoMode ? "Demo / Simulation" : "Live APIs"}
            </span>
          </div>

          <ul className="space-y-0.5 text-xs text-on-surface-variant">
            <li>
              <button
                onClick={() => setIsHelpOpen(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-container transition-colors text-left cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-on-surface-variant" />
                <span>Help & Shortcuts</span>
              </button>
            </li>
            <li>
              <div
                className="flex items-center justify-between px-2 py-1.5"
                title={`${tokensRemaining.toLocaleString()} tokens left in this chat`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-on-surface-variant">
                    {percentUsed}% context used
                  </span>
                </span>
                <span className="text-[10px] text-on-surface-variant/60">
                  v1.0.0
                </span>
              </div>
            </li>
          </ul>
        </div>
      </nav>

      {isDocsOpen && <DocsModal onClose={() => setIsDocsOpen(false)} />}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </>
  );
};
