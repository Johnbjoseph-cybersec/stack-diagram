import { neon } from "@neondatabase/serverless";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema.ts";

export const getDb = () =>
  drizzle({ client: neon(env.DATABASE_URL), schema, casing: "snake_case" });

export type Db = ReturnType<typeof getDb>;
