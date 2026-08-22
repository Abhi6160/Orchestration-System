import { ChevronDown, Menu, UserRound } from "lucide-react";
import NexusLogo3D from "./NexusLogo3D";

type Props = {
  onLogin: () => void;
  onProfile: () => void;
  onMenu: () => void;
  profileOpen: boolean;
  user: string | null;
};

export function Navbar({ onLogin, onProfile, onMenu, profileOpen, user }: Props) {
  return (
    <header className="relative z-30 flex items-center justify-between gap-4 px-4 py-5 sm:px-8 lg:px-12">
      <a href="/" className="flex items-center gap-3 rounded-xl" aria-label="Nexus.ai home">
        <NexusLogo3D size={58} />
        <span className="flex flex-col leading-none">
          <span className="relative font-display text-2xl font-bold tracking-tight text-gold-gradient sm:text-3xl">
            <span className="absolute inset-0 -z-10 blur-lg text-neon/40" aria-hidden="true">
              Nexus.ai
            </span>
            Nexus.ai
          </span>
          <span className="mt-1 hidden text-[11px] tracking-wide text-muted-foreground sm:block">
            Your AI Intelligence Companion
          </span>
        </span>
      </a>

      <nav className="flex items-center gap-3 sm:gap-4">
        {!user && (
          <button
            type="button"
            onClick={onLogin}
            className="hidden rounded-full border border-gold/45 bg-linear-to-b from-crimson-dark/60 to-ink px-6 py-2.5 text-sm font-medium text-gold transition-all duration-200 hover:border-gold-bright hover:text-gold-bright hover:shadow-neon hover:scale-[1.03] sm:inline-flex"
          >
            Login
          </button>
        )}
        <button
          type="button"
          onClick={onProfile}
          aria-label="Open profile"
          aria-expanded={profileOpen}
          className="hidden items-center gap-2 rounded-full border border-gold/45 bg-linear-to-b from-crimson-dark/60 to-ink py-2 pr-4 pl-2 text-sm font-medium text-gold transition-all duration-200 hover:border-gold-bright hover:shadow-neon sm:inline-flex"
        >
          <span className="grid size-8 place-items-center rounded-full border border-gold/50 bg-ink text-gold">
            <UserRound className="size-4" />
          </span>
          {user ? user.split("@")[0] : "Profile"}
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="grid size-11 place-items-center rounded-xl border border-gold/30 bg-ink/50 text-gold transition-all duration-200 hover:border-gold-bright hover:shadow-neon"
        >
          <Menu className="size-6 drop-shadow-[0_0_6px_var(--neon)]" />
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
