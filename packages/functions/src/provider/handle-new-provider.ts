import { embedText } from "@invoicer/core/src/services/llm-calls/embeddings";
import { extractProducts } from "@invoicer/core/src/services/llm-calls/extract-products";
import { extractProvider } from "@invoicer/core/src/services/llm-calls/extract-provider";
import { db } from "@invoicer/database/src";
import {
  Product,
  products as productsTable,
  providers,
} from "@invoicer/database/src/schema";
import { Handler } from "aws-lambda";
export const handler: Handler = async (event) => {
  const [provider, products] = await Promise.all([
    extractProvider(event.prompt),
    extractProducts(event.prompt),
  ]);

  const providerEmbeddings = await embedText(
    `Name: ${provider.name}, Category: ${provider.category}, Description: ${provider.description}`
  );

  const productsToInsert: Pick<
    Product,
    "name" | "description" | "quantity" | "price" | "team_id" | "embedding"
  >[] = await Promise.all(
    products.map(async (product) => ({
      embedding: await embedText(
        `Name: ${product.name}, Description: ${product.description}`
      ),
      team_id: event.teamId,
      description: product.description,
      name: product.name,
      quantity: parseInt(String(product.quantity)),
      price: product.price ?? null,
    }))
  );

  await db.transaction(async (tx) => {
    const [insertedProvider] = await tx
      .insert(providers)
      .values({
        team_id: event.teamId,
        name: provider.name,
        category: provider.category,
        description: provider.description,
        email: provider.email,
        identity_card: provider.identity_card,
        phone_number: provider.phone_number,
        embedding: providerEmbeddings,
      })
      .returning({ id: providers.id });

    await tx.insert(productsTable).values(
      productsToInsert.map((product) => ({
        ...product,
        provider_id: insertedProvider.id,
      }))
    );
    console.log("inserted products");
  });

  return {
    statusCode: 200,
    message: "Processed new provider",
  };
};
