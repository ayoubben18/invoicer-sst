import { z } from "zod";
import { event } from "./event";

export const Events = {
  Extracted: event(
    "product.extracted",
    z.object({
      teamId: z.string(),
      productsInfos: z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.number().optional(),
        description: z.string(),
      }),
      providerId: z.string(),
    })
  ),
};
