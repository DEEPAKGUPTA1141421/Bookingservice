import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../../utils/responseHandler";
import {
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
} from "../../validations/admin_validation";
import {
  createService,
  getServiceById,
  updateService,
  deleteService,
} from "../../services/admin/serviceService";
import ErrorHandler from "../../config/GlobalerrorHandler";
import redisClient from "../../config/redisCache";

export const createServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || !(req.files as Express.MulterS3.File[]).length) {
      return next(new ErrorHandler("At least one image is required", 400));
    }
    const imageUrls = (req.files as Express.MulterS3.File[]).map(
      (file) => file.location
    );

    const validation = createServiceSchema.safeParse({
      ...req.body,
      images: imageUrls,
    });
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { name, description, images, category } = validation.data;
    const response = await createService(
      name,
      description,
      images,
      category,
      next
    );

    if (response) {
      sendResponse(res, 201, "Service Created Successfully", response);
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const getServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validation = deleteServiceSchema.safeParse(req.params);
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;

    // Check cache
    const cachedService = await redisClient.get(`service:${id}`);
    if (cachedService) {
      sendResponse(
        res,
        200,
        "Service retrieved from cache",
        JSON.parse(cachedService)
      );
      return;
    }

    const response = await getServiceById(id, next);
    if (!response) return next(new ErrorHandler("Service not found", 404));

    // Cache for 10 minutes
    await redisClient.setex(`service:${id}`, 600, JSON.stringify(response));

    sendResponse(res, 200, "Service fetched successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const updateServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = updateServiceSchema.safeParse({
      ...req.params,
      ...req.body,
    });
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id, ...updates } = validation.data;
    const response = await updateService(id, updates, next);

    if (response) {
      sendResponse(res, 200, "Service updated successfully", response);
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const deleteServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = deleteServiceSchema.safeParse(req.params);
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;
    const response = await deleteService(id, next);

    if (response) {
      sendResponse(res, 200, response.message, response);
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
