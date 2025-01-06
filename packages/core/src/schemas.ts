import { z } from "zod";

export const addProductsProcessSchema = z.object({
  teamId: z.number(),
  prompt: z.string(),
});
