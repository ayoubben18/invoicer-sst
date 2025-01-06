import { Handler } from "aws-lambda";
import { extractProvider } from "@invoicer/core/src/services/llm-calls/extract-provider";
import { extractProducts } from "@invoicer/core/src/services/llm-calls/extract-products";
import { embedText } from "@invoicer/core/src/services/llm-calls/embeddings";
import { db } from "@invoicer/database/src";
import {
  providers,
  products as productsTable,
  Product,
} from "@invoicer/database/src/schema";
import { Config } from "sst/node/config";
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
      quantity: product.quantity,
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

    console.log(insertedProvider);

    console.log(productsToInsert);

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
