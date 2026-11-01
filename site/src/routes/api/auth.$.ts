import { createFileRoute } from "@tanstack/react-router";

import { handleAuthProxy } from "@/lib/auth.ts";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthProxy(request),
      POST: ({ request }) => handleAuthProxy(request),
    },
  },
});
