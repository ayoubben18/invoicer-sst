import { Handler } from "aws-lambda";
import { z } from "zod";
import { Events } from "@invoicer/core/user";
const schema = z.object({
  productId: z.string(),
});

export const handler: Handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log("body", body);
  const { productId } = schema.parse(body);

  // verify authorization

  await Events.CallUser.publish({ productId });
};
