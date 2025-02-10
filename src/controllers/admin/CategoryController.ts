import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../../utils/responseHandler"
import ErrorHandler from "../../config/GlobalerrorHandler";
import { CheckZodValidation } from "../../utils/helper";
import { createCategorySchema, deleteCategorySchema, getCategorySchema, updateCategorySchema } from "../../validations/admin_validation";
import {  createCategoryService, deleteCategoryService, updateCategoryService} from "../../services/admin/Categoryservice";
import { Category } from "../../models/CategorySchema";

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log("Request received:", req.body);
      if (!req.files || !(req.files as Express.MulterS3.File[]).length) {
        console.log("No files uploaded");
        return next(new ErrorHandler("At least one image is required", 400));
      }
      const imageUrls = (req.files as Express.MulterS3.File[]).map((file) => file.location);
      console.log("Image URLs:", imageUrls);
      const validated = CheckZodValidation({ ...req.body, images: imageUrls }, createCategorySchema, next);
      console.log("Validation result:", validated);
      const { category, description, images } = validated.data;
      const response = await createCategoryService(category, description, images,next);
      console.log("Service response:", response);
      sendResponse(res, 201, "Category Created Successfully", response);
    } catch (error: any) {
      console.error("Error occurred:", error);
      next(new ErrorHandler(error.message, 500)); // 500 for internal errors
    }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = getCategorySchema.safeParse(req.params);
        if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

        const { id } = validation.data;
        const category = await Category.findById(id);
        if (!category) return next(new ErrorHandler("Category not found", 404));

        sendResponse(res, 200, "Category retrieved successfully", category);
    } catch (error: any) {
        next(new ErrorHandler(error.message, 500));
    }
};

export const getAllCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await Category.find();
        sendResponse(res, 200, "Categories retrieved successfully", categories);
    } catch (error: any) {
        next(new ErrorHandler(error.message, 500));
    }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !(req.files as Express.MulterS3.File[]).length) {
      return next(new ErrorHandler("At least one image is required", 400));
    }

    const imageUrls = (req.files as Express.MulterS3.File[]).map((file) => file.location);
    const validation = updateCategorySchema.safeParse({ ...req.params, ...req.body, images: imageUrls });
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id, name, description, images } = validation.data;

    const response = await updateCategoryService(id, name, description, images, next);
    if (response) {
      sendResponse(res, 200, "Category updated successfully", response);
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = deleteCategorySchema.safeParse(req.params);
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;
    const response = await deleteCategoryService(id, next);

    if (response) {
      sendResponse(res, 200, response.message,response);
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};




