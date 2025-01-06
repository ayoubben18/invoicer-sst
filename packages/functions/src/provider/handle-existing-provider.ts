import { Events } from "../../../core/src/products";
import { Handler } from "aws-lambda";

import { extractProvider } from "@invoicer/core/src/services/llm-calls/extract-provider";
import { extractProducts } from "@invoicer/core/src/services/llm-calls/extract-products";
import { embedText } from "@invoicer/core/services/llm-calls/embeddings";
import { providers } from "@invoicer/database/schema";
import { db } from "@invoicer/database/src";
import { getProviderSimilarity } from "@invoicer/database/src/get-similarity";
import { gte } from "drizzle-orm";
export const handler: Handler = async (event) => {
  console.log("Handling existing provider flow", event);

  const [provider, products] = await Promise.all([
    extractProvider(event.prompt),
    extractProducts(event.prompt),
  ]);

  console.log(provider);

  const providerEmbeddings = await embedText(
    `Name: ${provider.name}, Category: ${provider.category}, Description: ${provider.description}`
  );

  const similarity = await getProviderSimilarity(providerEmbeddings);

  const [existingProvider] = await db
    .select()
    .from(providers)
    .where(gte(similarity, 0.7))
    .limit(1);

  if (!existingProvider) {
    throw new Error("No existing provider found");
  }

  for (const product of products) {
    await Events.Extracted.publish({
      teamId: event.teamId,
      productsInfos: product,
      providerId: existingProvider.id,
    });
  }

  return {
    statusCode: 200,
    message: "Processed existing provider",
  };
};
