import { Plus, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Attachment } from "@/lib/ai-service";
import { uid } from "@/lib/ai-service";
import AttachmentMenu, { type AttachmentAction } from "./AttachmentMenu";
import VoiceInput from "./VoiceInput";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  attachments: Attachment[];
  onAdd: (a: Attachment) => void;
  onRemove: (id: string) => void;
  onCamera: () => void;
  notify: (msg: string) => void;
  compact?: boolean;
};

const IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
const FILE_TYPES =
  ".pdf,.txt,.doc,.docx,.csv,application/pdf,text/plain,text/csv,application/msword";

export function AIInput({
  value,
  onChange,
  onSubmit,
  attachments,
  onAdd,
  onRemove,
  onCamera,
  notify,
  compact = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => () => recognitionRef.current?.stop?.(), []);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    const Ctor =
      (globalThis as any).SpeechRecognition ??
      (globalThis as any).webkitSpeechRecognition;
    if (!Ctor) {
      notify("Voice input isn't supported in this browser.");
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e: any) => {
        const text = Array.from(e.results as ArrayLike<any>)
          .map((r: any) => r[0].transcript)
          .join(" ");
        onChange(text.trim());
      };
      rec.onerror = () => {
        setListening(false);
        notify("Voice input failed. Please check microphone permissions.");
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      notify("Voice input couldn't start in this browser.");
    }
  };

  const handleAction = (action: AttachmentAction) => {
    if (action === "image") imageRef.current?.click();
    else if (action === "file") fileRef.current?.click();
    else if (action === "camera") onCamera();
    else if (action === "voice") toggleVoice();
    else if (action === "screenshot") captureScreen();
  };

  const captureScreen = async () => {
    const media = navigator.mediaDevices as any;
    if (!media?.getDisplayMedia) {
      notify("Screen capture isn't supported on this device/browser.");
      return;
    }
    try {
      const stream: MediaStream = await media.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => setTimeout(r, 220));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      track?.stop();
      stream.getTracks().forEach((t) => t.stop());
      onAdd({
        id: uid(),
        kind: "image",
        name: "screenshot.png",
        previewUrl: canvas.toDataURL("image/png"),
      });
    } catch {
      notify("Screen capture was cancelled or unavailable.");
    }
  };

  const onPick = (kind: "image" | "file") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      notify("That file is too large (20MB maximum).");
      return;
    }
    const preview = kind === "image" ? URL.createObjectURL(file) : undefined;
    onAdd({
      id: uid(),
      kind,
      name: file.name,
      ...(preview ? { previewUrl: preview } : {}),
    });
  };

  return (
    <div className={`relative w-full ${compact ? "" : "max-w-[650px]"} mx-auto`}>
      {attachments.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-xl border border-gold/30 bg-ink/70 py-1.5 pr-1.5 pl-2 text-xs text-warm"
            >
              {a.previewUrl ? (
                <img
                  src={a.previewUrl}
                  alt={a.name}
                  className="size-9 rounded-lg border border-gold/25 object-cover"
                />
              ) : (
                <span className="grid size-9 place-items-center rounded-lg border border-gold/25 text-gold">
                  ⎙
                </span>
              )}
              <span className="max-w-[9rem] truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                aria-label={`Remove ${a.name}`}
                className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-crimson-dark/70 hover:text-neon-bright"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {listening && (
        <p className="mb-2 text-center text-xs tracking-[0.2em] text-neon-bright uppercase">
          Listening...
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="console-surface relative flex h-[62px] items-center gap-2 rounded-full px-2.5"
      >
        <span className="pointer-events-none absolute inset-x-10 -top-px h-px hairline-gold" />
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Open attachments"
          aria-expanded={menuOpen}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/60 text-gold transition-all duration-200 hover:border-gold-bright hover:text-gold-bright hover:shadow-neon"
        >
          <Plus className="size-5" />
        </button>

        <label className="sr-only" htmlFor="nexus-ask">
          Ask Nexus anything
        </label>
        <input
          id="nexus-ask"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask anything here....."
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-warm placeholder:text-muted-foreground focus:outline-none sm:text-base"
        />

        {value.trim() && (
          <button
            type="submit"
            aria-label="Send message"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/40 text-gold transition-colors hover:border-gold-bright hover:text-gold-bright"
          >
            <SendHorizontal className="size-4" />
          </button>
        )}
        <VoiceInput active={listening} onToggle={toggleVoice} />

        <AttachmentMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onSelect={handleAction}
        />
      </form>

      <input
        ref={imageRef}
        type="file"
        accept={IMAGE_TYPES}
        onChange={onPick("image")}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={fileRef}
        type="file"
        accept={FILE_TYPES}
        onChange={onPick("file")}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

export default AIInput;
