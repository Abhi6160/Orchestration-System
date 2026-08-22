import { useEffect } from "react";
import {
  History,
  Home,
  Info,
  LogIn,
  LogOut,
  Plus,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import NexusLogo3D from "./NexusLogo3D";

export type DrawerAction =
  | "new-chat"
  | "home"
  | "history"
  | "profile"
  | "settings"
  | "about"
  | "login"
  | "logout";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (action: DrawerAction) => void;
  user: string | null;
};

export function NavigationDrawer({ open, onClose, onSelect, user }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const items: Array<{ id: DrawerAction; label: string; Icon: typeof Home; accent?: boolean }> = [
    { id: "new-chat", label: "New Chat", Icon: Plus, accent: true },
    { id: "home", label: "Home", Icon: Home },
    { id: "history", label: "Chat History", Icon: History },
    { id: "profile", label: "Profile", Icon: UserRound },
    { id: "settings", label: "Settings", Icon: Settings },
    { id: "about", label: "About Nexus.ai", Icon: Info },
  ];

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`glass-panel fixed top-0 right-0 z-50 flex h-full w-[min(20rem,86vw)] flex-col rounded-l-3xl p-5 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <NexusLogo3D size={36} withOrbit={false} />
            <span className="font-display text-lg text-gold-gradient">Nexus.ai</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid size-9 place-items-center rounded-full border border-gold/25 text-gold hover:border-gold-bright"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="my-4 h-px hairline-gold" />

        <nav className="flex flex-col gap-1">
          {items.map(({ id, label, Icon, accent }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-crimson-dark/60 ${
                accent ? "text-neon-bright" : "text-warm hover:text-gold-pale"
              }`}
            >
              <Icon className={`size-5 ${accent ? "text-neon" : "text-gold"}`} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto sm:hidden">
          <div className="mb-3 h-px hairline-gold" />
          <button
            type="button"
            onClick={() => onSelect(user ? "logout" : "login")}
            className="flex w-full items-center gap-3 rounded-xl border border-gold/40 px-3 py-3 text-sm text-gold"
          >
            {user ? <LogOut className="size-5" /> : <LogIn className="size-5" />}
            {user ? "Logout" : "Login"}
          </button>
        </div>
      </aside>
    </>
  );
}

export default NavigationDrawer;
