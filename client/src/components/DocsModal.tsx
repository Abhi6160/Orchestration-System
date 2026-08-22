import React, { useEffect, useState } from "react";
import { X, BookOpen, Loader2 } from "lucide-react";
import { api } from "../api/client";

interface DocsModalProps {
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ onClose }) => {
  const [markdown, setMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getDocs()
      .then((res) => setMarkdown(res.markdown))
      .catch(() => setMarkdown("Failed to load documentation."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-lg max-h-[80vh] rounded-xl shadow-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Handoff Engine Docs</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-container-high cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-on-surface-variant">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : markdown}
        </div>
      </div>
    </div>
  );
};
