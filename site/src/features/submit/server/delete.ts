import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { clientKey } from "@/lib/client-key.ts";
import { safeEqual, sha256 } from "@/lib/crypto.ts";
import { getDb } from "@/lib/db/client.ts";
import { stacks } from "@/lib/db/schema.ts";
import { deleteStackFiles } from "@/lib/storage.ts";

import { catchErrors, fail } from "./http.ts";
import { STACK_ID } from "./stack-id.ts";

export async function handleDelete(request: Request, id: string): Promise<Response> {
  return catchErrors(async () => {
    const limit = await env.ACTION_LIMITER.limit({
      key: await clientKey(request, env.IP_HASH_SECRET),
    });
    if (!limit.success) {
      return fail(429, "Too many requests. Try again in a minute");
    }
    const deleteKey = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
    if (!deleteKey) {
      return fail(401, "Send the delete key as a Bearer token");
    }
    const db = getDb();
    const [row] = STACK_ID.test(id)
      ? await db
          .select({ deleteKeyHash: stacks.deleteKeyHash })
          .from(stacks)
          .where(eq(stacks.id, id))
      : [];
    if (!row || !safeEqual(await sha256(deleteKey), row.deleteKeyHash)) {
      return fail(404, "No post matches this id and delete key");
    }
    await db.delete(stacks).where(eq(stacks.id, id));
    await deleteStackFiles(env.BUCKET, id);
    return new Response(null, { status: 204 });
  });
}
