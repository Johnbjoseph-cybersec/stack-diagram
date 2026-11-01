import { createFileRoute } from "@tanstack/react-router";

import { handleChallenge } from "@/features/submit/server/challenge.ts";

export const Route = createFileRoute("/api/challenge")({
  server: { handlers: { GET: ({ request }) => handleChallenge(request) } },
});
