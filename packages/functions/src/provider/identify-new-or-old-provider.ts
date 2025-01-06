import { Handler } from "aws-lambda";
import { addProductsProcessSchema } from "../../../core/src/schemas";
import { determineNewOrOldProvider } from "@invoicer/core/src/services/llm-calls/determine-new-or-old";

export const handler: Handler = async (event) => {
  const { teamId, prompt } = addProductsProcessSchema.parse(event);

  const result = await determineNewOrOldProvider(prompt);

  console.log(result);

  return {
    statusCode: 200,
    type: result.type,
    prompt,
  };
};
