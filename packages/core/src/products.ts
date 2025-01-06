import { z } from "zod";
import { event } from "./event";

export const Events = {
  Extracted: event(
    "product.extracted",
    z.object({
      teamId: z.string(),
      productsInfos: z.array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          description: z.string(),
        })
      ),
      providerId: z.string(),
    })
  ),
};
