import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export const fetchSiteUrl = createServerFn({ method: "GET" }).handler((): string => env.SITE_URL);
