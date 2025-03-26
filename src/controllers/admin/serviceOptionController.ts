import { Request, Response, NextFunction } from "express";
import {
  createServiceOptionSchema,
  updateServiceOptionSchema,
  deleteServiceOptionSchema,
  getServiceOptionSchema,
} from "../../validations/admin_validation";
import {
  createServiceOption,
  getServiceOptionById,
  updateServiceOption,
  deleteServiceOption,
} from "../../services/admin/serviceOptionService";
import ErrorHandler from "../../config/GlobalerrorHandler";
import { sendResponse } from "../../utils/responseHandler";

// Create Service Option
export const createServiceOptionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !(req.files as Express.MulterS3.File[]).length) {
      return next(new ErrorHandler("At least one image is required", 400));
    }
    const imageUrls = (req.files as Express.MulterS3.File[]).map((file) => file.location);

    const validation = createServiceOptionSchema.safeParse({ ...req.body, images: imageUrls });
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const {
      actualService,
      name,
      price,
      discount_price,
      duration,
      description,
      images,
      discount_type,
    } = validation.data;
    const response = await createServiceOption(actualService, name, price, discount_price, duration, description, images,discount_type, next);
    if (response) sendResponse(res, 201, "Service Option Created Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Read Service Option
export const getServiceOptionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("hello get hit",req.params);
    const validation = getServiceOptionSchema.safeParse(req.params);
    console.log("validation",validation);
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;
    const serviceOption = await getServiceOptionById(id, next);
    if (serviceOption) sendResponse(res, 200, "Service Option fetched successfully", serviceOption);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update Service Option
export const updateServiceOptionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = updateServiceOptionSchema.safeParse({ ...req.params, ...req.body });
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id, ...updates } = validation.data;
    const updatedServiceOption = await updateServiceOption(id, updates, next);
    if (updatedServiceOption) sendResponse(res, 200, "Service Option updated successfully", updatedServiceOption);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete Service Option
export const deleteServiceOptionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = deleteServiceOptionSchema.safeParse(req.params);
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;
    const response = await deleteServiceOption(id, next);
    if (response) sendResponse(res, 200, response.message,response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
