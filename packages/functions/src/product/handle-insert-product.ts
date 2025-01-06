import { EventHandler } from "sst/node/event-bus";
import { Events } from "@invoicer/core/src/products";
import { getProductSimilarity } from "@invoicer/database/get-similarity";
import { embedText } from "@invoicer/core/services/llm-calls/embeddings";
import { eq, gte } from "drizzle-orm";
import { products } from "@invoicer/database/schema";
import { db } from "@invoicer/database/index";
export const handler = EventHandler(Events.Extracted, async (event) => {
  const productEmbedding = await embedText(
    `Name: ${event.properties.productsInfos.name}, Description: ${event.properties.productsInfos.description}`
  );

  const similarity = await getProductSimilarity(productEmbedding);

  const [existingProduct] = await db
    .select()
    .from(products)
    .where(gte(similarity, 0.7))
    .limit(1);

  if (existingProduct) {
    await db
      .update(products)
      .set({
        quantity:
          event.properties.productsInfos.quantity + existingProduct.quantity,
      })
      .where(eq(products.id, existingProduct.id));
  } else {
    await db.insert(products).values({
      team_id: event.properties.teamId,
      name: event.properties.productsInfos.name,
      description: event.properties.productsInfos.description,
      quantity: event.properties.productsInfos.quantity,
      price: event.properties.productsInfos.price ?? null,
      provider_id: event.properties.providerId,
      embedding: productEmbedding,
    });
  }
});
