import { Events } from "../../../core/src/products";
import { Handler } from "aws-lambda";

import { extractProvider } from "@invoicer/core/src/services/llm-calls/extract-provider";
import { extractProducts } from "@invoicer/core/src/services/llm-calls/extract-products";

export const handler: Handler = async (event) => {
  console.log("Handling existing provider flow", event);

  const [provider, products] = await Promise.all([
    extractProvider(event.prompt),
    extractProducts(event.prompt),
  ]);

  console.log("Provider", provider);
  console.log("Products", products);

  await Events.Extracted.publish({
    teamId: "123",
    productsInfos: [],
    providerId: "123",
  });

  return {
    statusCode: 200,
    message: "Processed existing provider",
  };
};
