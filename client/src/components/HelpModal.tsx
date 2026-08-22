import React from "react";
import { X, HelpCircle } from "lucide-react";

interface HelpModalProps {
  onClose: () => void;
}

const SHORTCUTS: [string, string][] = [
  ["Send message", "Ctrl / Cmd + Enter"],
  ["New chat", "Ctrl / Cmd + K"],
  ["Toggle this help panel", "Ctrl / Cmd + /"],
];

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-sm rounded-xl shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>Help & Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-container-high cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="p-4 space-y-2 text-xs">
          {SHORTCUTS.map(([label, keys]) => (
            <li
              key={label}
              className="flex items-center justify-between text-on-surface-variant"
            >
              <span>{label}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant font-mono text-[10px]">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
