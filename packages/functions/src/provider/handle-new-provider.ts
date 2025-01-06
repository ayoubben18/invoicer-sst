import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log("Handling new provider flow", event);

  // Extract the new provider from the prompt

  // Extract all the products from the prompt

  // Insert all products since the provider is new

  // Send an invoice by passing all the product quanitites + names

  return {
    statusCode: 200,
    message: "Processed new provider",
  };
};
