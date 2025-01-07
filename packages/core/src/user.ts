import { z } from "zod";
import { event } from "./event";

export const Events = {
  CallUser: event("user.call-user", z.object({ productId: z.string() })),
};
