import { notFound } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";

import { getViewer } from "@/lib/auth.ts";

/** A 404 rather than 401 or 403, so /admin looks like an unknown page to everyone else. */
export async function requireAdminOrNotFound() {
  const viewer = await getViewer(getRequest());
  if (!viewer?.isAdmin) {
    throw notFound();
  }
  return viewer;
}
