import { Request, Response, NextFunction } from "express";
import { createActualServiceSchema, updateActualServiceSchema, deleteActualServiceSchema, getActualServiceSchema } from "../../validations/admin_validation";
import { createActualService, getActualServiceById, updateActualService, deleteActualService } from "../../services/admin/actualServiceService";
import ErrorHandler from "../../config/GlobalerrorHandler";
import { sendResponse } from "../../utils/responseHandler";

// Create Actual Service
export const createActualServiceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !(req.files as Express.MulterS3.File[]).length) {
      return next(new ErrorHandler("At least one image is required", 400));
    }
    const imageUrls = (req.files as Express.MulterS3.File[]).map((file) => file.location);
    
    const validation = createActualServiceSchema.safeParse({ ...req.body, images: imageUrls });
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { name, description, images, service } = validation.data as { name: string; description: string; images: string[]; service: string;};
    const response = await createActualService(name, description, images, service, next);
    if (response) sendResponse(res, 201, "Actual Service Created Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Read Actual Service
export const getActualServiceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = getActualServiceSchema.safeParse(req.params);
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;
    const actualService = await getActualServiceById(id, next);
    if (actualService) sendResponse(res, 200, "Actual Service fetched successfully", actualService);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update Actual Service
export const updateActualServiceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = updateActualServiceSchema.safeParse({ ...req.params, ...req.body });
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id, name, description, images, service } = validation.data;
    const updates: Partial<{ name: string; description: string; images: string[]; service: string;}> = {};

    if (name) updates.name = name.trim();
    if (description) updates.description = description.trim();
    if (images) updates.images = images;
    if (service) updates.service = service;
    // if (options) updates.options = options;

    const updatedActualService = await updateActualService(id, updates, next);
    if (updatedActualService) sendResponse(res, 200, "Actual Service updated successfully", updatedActualService);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete Actual Service
export const deleteActualServiceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = deleteActualServiceSchema.safeParse(req.params);
    if (!validation.success) return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;
    const response = await deleteActualService(id, next);
    if (response) sendResponse(res, 200, response.message,response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
