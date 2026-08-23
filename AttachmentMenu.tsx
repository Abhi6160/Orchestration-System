import { Camera, FileText, Image as ImageIcon, Mic, MonitorUp } from "lucide-react";
import { useEffect, useRef } from "react";

export type AttachmentAction = "image" | "file" | "camera" | "screenshot" | "voice";

const ITEMS: Array<{ id: AttachmentAction; label: string; Icon: typeof ImageIcon }> = [
  { id: "image", label: "Add image", Icon: ImageIcon },
  { id: "file", label: "Upload file", Icon: FileText },
  { id: "camera", label: "Camera", Icon: Camera },
  { id: "screenshot", label: "Screenshot", Icon: MonitorUp },
  { id: "voice", label: "Voice input", Icon: Mic },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (action: AttachmentAction) => void;
};

export function AttachmentMenu({ open, onClose, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Attachment options"
      className="glass-panel absolute bottom-full left-2 z-40 mb-3 w-[min(15rem,calc(100vw-2.5rem))] origin-bottom-left animate-rise-in rounded-2xl p-2"
    >
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="menuitem"
          onClick={() => {
            onSelect(id);
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-warm transition-colors hover:bg-crimson-dark/60 hover:text-gold-pale"
        >
          <Icon className="size-4 shrink-0 text-gold" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default AttachmentMenu;
