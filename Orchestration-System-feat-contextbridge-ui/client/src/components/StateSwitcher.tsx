import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Check } from 'lucide-react';
import type { DemoStateId } from '../types';

interface StateSwitcherProps {
  currentState: DemoStateId;
  onSelectState: (state: DemoStateId) => void;
}

export const StateSwitcher: React.FC<StateSwitcherProps> = ({
  currentState,
  onSelectState
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const states: { id: DemoStateId; label: string; tag: string }[] = [
    { id: 'empty', label: '1. Empty Chat', tag: 'State 1' },
    { id: 'active_claude', label: '2. Active Claude', tag: 'State 2' },
    { id: 'context_warning', label: '3. Context Warning (82%)', tag: 'State 3' },
    { id: 'handoff_preview', label: '4. Handoff Preview', tag: 'State 4' },
    { id: 'gemini_continuation', label: '5. Gemini Continuation', tag: 'State 5' }
  ];

  if (isCollapsed) {
    return (
      <div className="fixed top-2.5 right-6 z-40">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/90 text-white text-[10px] font-medium shadow-md hover:bg-neutral-900 transition-all border border-neutral-700 cursor-pointer"
          title="Open Demo UI State Switcher"
        >
          <Layers className="w-3 h-3 text-amber-400" />
          <span>Demo States</span>
          <Eye className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-2.5 right-6 z-40 flex items-center gap-1.5 bg-neutral-900/95 text-white p-1 rounded-xl shadow-lg border border-neutral-700/80 backdrop-blur-xs select-none animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-1 px-2 text-[10px] font-semibold text-neutral-400 border-r border-neutral-700">
        <Layers className="w-3 h-3 text-amber-400" />
        <span className="hidden sm:inline">Stitch States</span>
      </div>

      <div className="flex items-center gap-1">
        {states.map((s) => {
          const isActive = currentState === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectState(s.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-xs'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {isActive && <Check className="w-2.5 h-2.5 text-neutral-900" />}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setIsCollapsed(true)}
        className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors ml-1 cursor-pointer"
        title="Minimize demo switcher"
      >
        <EyeOff className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
