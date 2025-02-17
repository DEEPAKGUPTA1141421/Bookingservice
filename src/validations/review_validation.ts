import { z } from "zod";

export const createReviewSchema = z.object({
  actualService: z.string().length(24, { message: "Invalid Actual Service ID" }),
  serviceOption: z.string().length(24, { message: "Invalid Service Option ID" }),
  serviceProvider: z.string().length(24, { message: "Invalid Service Provider ID" }),
  user: z.string().length(24, { message: "Invalid User ID" }),
  rating: z.number().min(1).max(5, { message: "Rating must be between 1 and 5" }),
  comment: z.string().optional(),
});

export const updateReviewSchema = z.object({
  id: z.string().length(24, { message: "Invalid Review ID" }),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export const getReviewSchema = z.object({
  id: z.string().length(24, { message: "Invalid Review ID" }),
});

export const deleteReviewSchema = z.object({
  id: z.string().length(24, { message: "Invalid Review ID" }),
});
