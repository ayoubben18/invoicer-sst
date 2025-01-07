import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "dotenv";
import postgres from "postgres";
import * as schema from "./schema";
import { Config } from "sst/node/config";
import { Redis } from "@upstash/redis";

config({ path: ".env.local" }); // or .env

const client = postgres(Config.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });

export const redis = new Redis({
  url: Config.UPSTASH_REDIS_REST_URL,
  token: Config.UPSTASH_REDIS_REST_TOKEN,
});
