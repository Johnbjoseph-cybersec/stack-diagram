import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { clientKey } from "@/lib/client-key.ts";
import { getDb } from "@/lib/db/client.ts";

import { GalleryInput, httpError, strictInput } from "./params.ts";
import { listStacks, topTechs } from "./stacks.ts";

const PAGE_SIZE = 24;

export const fetchGallery = createServerFn({ method: "GET" })
  .validator(strictInput(GalleryInput))
  .handler(async ({ data }) => {
    const { success } = await env.READ_LIMITER.limit({
      key: await clientKey(getRequest(), env.IP_HASH_SECRET),
    });
    if (!success) {
      throw httpError(429, "Too many requests");
    }
    const db = getDb();
    const [page, { techs, total }] = await Promise.all([
      listStacks(db, { ...data, limit: PAGE_SIZE }),
      topTechs(db),
    ]);
    const siteUrl: string = env.SITE_URL;
    return { ...page, techs, total, siteUrl };
  });
