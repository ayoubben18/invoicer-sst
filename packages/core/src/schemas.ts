import { z } from "zod";

export const addProductsProcessSchema = z.object({
  teamId: z.string(),
  prompt: z.string(),
  processId: z.string(),
});
