import { useEffect, useRef } from "react";
import { History, LogOut, Palette, Settings, UserRound } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  user: string | null;
  onSettings: () => void;
  onHistory: () => void;
  onLogout: () => void;
  onLogin: () => void;
};

export function ProfileMenu({
  open,
  onClose,
  user,
  onSettings,
  onHistory,
  onLogout,
  onLogin,
}: Props) {
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

  const item =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-warm transition-colors hover:bg-crimson-dark/60 hover:text-gold-pale";

  return (
    <div
      ref={ref}
      className="glass-panel absolute top-20 right-4 z-40 w-60 animate-rise-in rounded-2xl p-2 sm:right-8 lg:right-12"
      role="menu"
      aria-label="Profile menu"
    >
      <p className="px-3 pt-2 pb-1 text-[10px] tracking-[0.22em] text-gold uppercase">
        Profile
      </p>
      <p className="truncate px-3 pb-2 text-xs text-muted-foreground">
        {user ?? "Not signed in"}
      </p>
      <div className="mb-1 h-px hairline-gold" />
      <button type="button" role="menuitem" className={item} onClick={onClose}>
        <UserRound className="size-4 text-gold" /> My Account
      </button>
      <button type="button" role="menuitem" className={item} onClick={onSettings}>
        <Settings className="size-4 text-gold" /> Settings
      </button>
      <button type="button" role="menuitem" className={item} onClick={onHistory}>
        <History className="size-4 text-gold" /> Chat History
      </button>
      <button type="button" role="menuitem" className={item} onClick={onSettings}>
        <Palette className="size-4 text-gold" /> Appearance
      </button>
      <div className="my-1 h-px hairline-gold" />
      {user ? (
        <button type="button" role="menuitem" className={item} onClick={onLogout}>
          <LogOut className="size-4 text-neon" /> Logout
        </button>
      ) : (
        <button type="button" role="menuitem" className={item} onClick={onLogin}>
          <LogOut className="size-4 text-neon" /> Login
        </button>
      )}
    </div>
  );
}

export default ProfileMenu;
