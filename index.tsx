import { createFileRoute } from "@tanstack/react-router";
import NexusApp from "@/components/NexusApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus.ai — Your AI Intelligence Companion" },
      {
        name: "description",
        content:
          "Nexus.ai is a futuristic AI command center: ask anything by text, voice, image or file and get intelligent answers from the Nexus core.",
      },
      { property: "og:title", content: "Nexus.ai — Your AI Intelligence Companion" },
      {
        property: "og:description",
        content:
          "A premium AI command center. Ask anything. Discover everything. Achieve more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <NexusApp />;
}
