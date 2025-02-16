import { z } from "zod";

export const faqValidationSchema = z.object({
  category: z.string().min(3, "Category must be at least 3 characters long"),
  faqs: z.array(
    z.object({
      question: z.string().min(5, "Question must be at least 5 characters long"),
      answer: z.string().min(5, "Answer must be at least 5 characters long"),
    })
  ),
});
