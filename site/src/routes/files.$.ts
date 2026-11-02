import { createFileRoute } from "@tanstack/react-router";

import { handleFile } from "@/features/submit/server/files.ts";

export const Route = createFileRoute("/files/$")({
  server: { handlers: { GET: ({ request, params }) => handleFile(request, params._splat ?? "") } },
});
