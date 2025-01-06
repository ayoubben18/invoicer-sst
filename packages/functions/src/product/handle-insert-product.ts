import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log(event);

  return {
    statusCode: 200,
    message: "Processed insert product",
  };
};
