import { Handler } from "aws-lambda";
import { addProductsProcessSchema } from "../../../core/src/schemas";
export const handler: Handler = async (event) => {
  const { teamId, prompt } = addProductsProcessSchema.parse(event);

  console.log("Identify new or old provider", teamId, prompt);

  return {
    statusCode: 200,
    type: "old",
  };
};
