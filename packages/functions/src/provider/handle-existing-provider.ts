import { Handler } from "aws-lambda";
import { publish } from "../../../core/src/publish";
export const handler: Handler = async (event) => {
  console.log("Handling existing provider flow", event);

  // Extract the old provider from the prompt

  // Extract all the products from the prompt

  // Insert provider + Send event for all the new Products to add them to the database
  //   in object
  //   {
  //     teamId: teamId,
  //     productsInfos: productsInfos,
  //     providerId: providerId,
  //   }

  // Send an invoice by passing all the product quanitites + names

  await publish("handleInsertProducts", {
    teamId: "123",
    productsInfos: [],
    providerId: "123",
  });

  return {
    statusCode: 200,
    message: "Processed existing provider",
  };
};
