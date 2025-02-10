import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHandler"
import ErrorHandler from "../config/GlobalerrorHandler";
import { CheckZodValidation } from "../utils/helper";
import { createCategorySchema } from "../validations/admin_validation";
import { createCategoryService } from "../services/adminservice";

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !(req.files as Express.MulterS3.File[]).length) {
        return next(new ErrorHandler("At least one image is required", 400));
      }
      const imageUrls = (req.files as Express.MulterS3.File[]).map((file) => file.location);
      const validated = CheckZodValidation({ ...req.body, images: imageUrls }, createCategorySchema, next);
      const { category, description, images } = validated.data;
      const response = await createCategoryService(category, description, images);
      sendResponse(res, 201, "Category Created Successfully", response);
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500)); // 500 for internal errors
    }
};