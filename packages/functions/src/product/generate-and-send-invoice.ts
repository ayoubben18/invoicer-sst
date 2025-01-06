import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log("Generating and sending invoice");

  return {
    statusCode: 200,
    message: "Processed generate and send invoice",
  };
};
