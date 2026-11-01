import { createFileRoute } from "@tanstack/react-router";

import { handleStackOg } from "@/features/og/server/og.ts";

export const Route = createFileRoute("/og/s/$id")({
  server: { handlers: { GET: ({ request, params }) => handleStackOg(request, params.id) } },
});
