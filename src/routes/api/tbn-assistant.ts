import { createFileRoute } from "@tanstack/react-router";
import { handleTbnAssistant } from "@/lib/tbn-ai.server";

export const Route = createFileRoute("/api/tbn-assistant")({
  server: { handlers: { POST: ({ request }) => handleTbnAssistant(request) } },
});