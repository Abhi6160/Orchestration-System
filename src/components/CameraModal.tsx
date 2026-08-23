import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Attachment } from "@/lib/ai-service";
import { uid } from "@/lib/ai-service";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (a: Attachment) => void;
};

export function CameraModal({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is unavailable on this device/browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        setError("Camera access is unavailable on this device/browser.");
      }
    };
    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture({
      id: uid(),
      kind: "image",
      name: "camera-capture.png",
      previewUrl: canvas.toDataURL("image/png"),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Camera"
        className="glass-panel w-full max-w-lg animate-rise-in rounded-3xl p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-gold-gradient">Camera</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="grid size-9 place-items-center rounded-full border border-gold/25 text-gold hover:border-gold-bright"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gold/25 bg-ink">
          {error ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{error}</p>
          ) : (
            <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover" />
          )}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gold/25 px-5 py-2 text-sm text-warm transition-colors hover:border-gold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={!!error}
            className="rounded-full border border-gold/60 bg-linear-to-b from-crimson-dark/70 to-ink px-5 py-2 text-sm text-gold transition-all hover:border-gold-bright hover:shadow-neon disabled:opacity-40"
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
}

export default CameraModal;
