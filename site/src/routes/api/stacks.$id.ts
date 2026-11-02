import { createFileRoute } from "@tanstack/react-router";

import { handleDelete } from "@/features/submit/server/delete.ts";

export const Route = createFileRoute("/api/stacks/$id")({
  server: { handlers: { DELETE: ({ request, params }) => handleDelete(request, params.id) } },
});
