import { z } from "zod";

export const createCategorySchema = z.object({
  category: z
    .string()
    .min(2, { message: "Category must be at least 2 characters long" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" }),
  images: z.array(
    z.string().url({ message: "Each image must be a valid URL" })
  ),
});

export const getCategorySchema = z.object({
  id: z.string().min(8, { message: "Invalid category ID" }),
});

export const updateCategorySchema = z.object({
  id: z.string().min(8, { message: "Invalid category ID" }),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .optional(),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .optional(),
  images: z
    .array(z.string().url({ message: "Each image must be a valid URL" }))
    .optional(),
});

export const deleteCategorySchema = z.object({
  id: z.string().min(8, { message: "Invalid category ID" }),
});

export const createServiceSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Service name must be at least 2 characters long" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" }),
  images: z
    .array(z.string().url({ message: "Each image must be a valid URL" }))
    .nonempty({ message: "At least one image is required" }),
  category: z.string().min(8, { message: "Invalid category ID" }),
});

export const updateServiceSchema = z.object({
  id: z.string().length(24, { message: "Invalid service ID" }),
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().length(24).optional(),
});

export const deleteServiceSchema = z.object({
  id: z.string().length(24, { message: "Invalid service ID" }),
});

export const createActualServiceSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Service name must be at least 2 characters long" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" }),
  images: z
    .array(z.string().url({ message: "Each image must be a valid URL" }))
    .nonempty({ message: "At least one image is required" }),
  service: z.string().length(24, { message: "Invalid service ID" }),
  expert_is_trained_in: z.array(z.string()).optional(),
  service_excludes: z.array(z.string()).optional(),
  what_we_need_from_you: z
    .array(
      z.object({
        image: z.string().url({ message: "Image must be a valid URL" }),
        description: z
          .string()
          .min(5, {
            message: "Description must be at least 5 characters long",
          }),
      })
    )
    .optional(),
  options: z.array(z.string().length(24)).optional(),
});

export const getActualServiceSchema = z.object({
  id: z.string().length(24, { message: "Invalid Actual Service ID" }),
});

export const updateActualServiceSchema = z.object({
  id: z.string().length(24, { message: "Invalid Actual Service ID" }),
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  images: z.array(z.string().url()).optional(),
  service: z.string().length(24).optional(),
  expert_is_trained_in: z.array(z.string()).optional(),
  service_excludes: z.array(z.string()).optional(),
  what_we_need_from_you: z
    .array(
      z.object({
        image: z.string().url(),
        description: z.string().min(5),
      })
    )
    .optional(),
  options: z.array(z.string().length(24)).optional(),
});

export const deleteActualServiceSchema = z.object({
  id: z.string().length(24, { message: "Invalid Actual Service ID" }),
});

export const createServiceOptionSchema = z.object({
  actualService: z.string().min(8, { message: "Invalid Actual Service ID" }),
  name: z
    .string()
    .min(2, { message: "Option name must be at least 2 characters long" }),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(1, { message: "Price must be greater than zero" })
  ),
  discount_price: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().optional()
  ),
  duration: z.preprocess(
    (val) => Number(val),
    z.number().min(1, { message: "Duration must be at least 1 minute" })
  ),
  description: z.string().optional(),
  service_provider: z
    .string()
    .min(8, { message: "Invalid Service Provider ID" }),
  images: z
    .array(z.string().url({ message: "Each image must be a valid URL" }))
    .nonempty({ message: "At least one image is required" }),
});

export const getServiceOptionSchema = z.object({
  id: z.string().length(24, { message: "Invalid Service Option ID" }),
});

export const updateServiceOptionSchema = z.object({
  id: z.string().length(24, { message: "Invalid Service Option ID" }),
  actualService: z.string().length(24).optional(),
  name: z.string().min(2).optional(),
  price: z.number().min(1).optional(),
  discount_price: z.number().optional(),
  duration: z.number().min(1).optional(),
  description: z.string().optional(),
  service_provider: z.string().length(24).optional(),
  images: z.array(z.string().url()).optional(),
});

export const deleteServiceOptionSchema = z.object({
  id: z.string().length(24, { message: "Invalid Service Option ID" }),
});
