import AIStatus from "./AIStatus";

export function Hero() {
  return (
    <div className="flex flex-col items-center px-4 text-center">
      <span className="rounded-full border border-neon/45 px-4 py-1.5 text-[10px] font-semibold tracking-[0.26em] text-neon-bright uppercase">
        Powered by advanced AI
      </span>
      <h1 className="mt-6 font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl lg:text-7xl">
        <span className="relative text-hero-gradient">
          <span
            className="absolute inset-0 -z-10 text-neon/30 blur-2xl"
            aria-hidden="true"
          >
            Welcome, I’m Nexus
          </span>
          <span className="block sm:inline">Welcome,</span>{" "}
          <span className="block sm:inline">I’m Nexus</span>
        </span>
      </h1>
      <p className="mt-5 max-w-xl text-sm text-muted-foreground sm:text-lg">
        Ask anything. Discover everything. Achieve more.
      </p>
      <AIStatus className="mt-6" />
    </div>
  );
}

export default Hero;
