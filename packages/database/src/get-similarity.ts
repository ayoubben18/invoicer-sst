import { products, providers } from "@invoicer/database/schema";
import { cosineDistance, sql } from "drizzle-orm";
export const getProviderSimilarity = async (embedding: number[]) => {
  return sql<number>`1 - (${cosineDistance(providers.embedding, embedding)})`;
};

export const getProductSimilarity = async (embedding: number[]) => {
  return sql<number>`1 - (${cosineDistance(products.embedding, embedding)})`;
};
