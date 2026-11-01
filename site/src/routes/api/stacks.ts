import { createFileRoute } from "@tanstack/react-router";

import { handleList } from "@/features/gallery/server/list.ts";
import { handleSubmit } from "@/features/submit/server/submit.ts";

export const Route = createFileRoute("/api/stacks")({
  server: {
    handlers: {
      GET: ({ request }) => handleList(request),
      POST: ({ request }) => handleSubmit(request),
    },
  },
});
