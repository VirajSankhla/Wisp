import { createFileRoute } from "@tanstack/react-router";
import { WispApp } from "@/components/wisp/app-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <WispApp />;
}
