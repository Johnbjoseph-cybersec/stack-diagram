import { createFileRoute } from "@tanstack/react-router";

import { handleHomeOg } from "@/features/og/server/og.ts";

export const Route = createFileRoute("/og/home")({
  server: { handlers: { GET: ({ request }) => handleHomeOg(request) } },
});
