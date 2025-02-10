import { z } from "zod";

export const createCategorySchema = z.object({
  category: z.string().min(2, { message: "Category must be at least 2 characters long" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
  images: z
    .array(z.string().url({ message: "Each image must be a valid URL" }))
});
