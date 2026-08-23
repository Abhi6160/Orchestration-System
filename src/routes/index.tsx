import { createFileRoute } from "@tanstack/react-router";
import { NexusApp } from "@/components/NexusApp";

export const Route = createFileRoute("/")({
  component: NexusApp,
});
