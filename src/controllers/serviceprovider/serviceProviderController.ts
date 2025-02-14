import { Request, Response, NextFunction } from "express";
import { createServiceProviderService, getAllServiceProvidersService, getServiceProviderByIdService, updateServiceProviderService, deleteServiceProviderService, getLocationFromProviderService } from "../../services/serviceprovider/serviceproviderservice";
import { sendResponse } from "../../utils/responseHandler";
import { CheckZodValidation } from "../../utils/helper";
import ErrorHandler from "../../config/GlobalerrorHandler";
import { createServiceProviderSchema, updateServiceProviderSchema } from "../../validations/service_provider_validation";

// Create a new service provider
export const createServiceProvider = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  try {
    console.log(req.file); 
    const profilePicture = req.file as Express.MulterS3.File | undefined;
    if (!profilePicture || !profilePicture.location) {
        next(new ErrorHandler("At least one image is required", 400));
        return;
    }
    console.log(req.body);  
    const validation = CheckZodValidation({ ...req.body, image: profilePicture.location }, createServiceProviderSchema, next);
    if (!validation.success) {
       next(new ErrorHandler("validation failed", 500));
      return;
    }
    const response = await createServiceProviderService(validation.data, next);
    sendResponse(res, 201, "Service Provider Created Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get all service providers
export const getAllServiceProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getAllServiceProvidersService(next);
    sendResponse(res, 200, "Service Providers retrieved successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get a single service provider by ID
export const getServiceProviderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getServiceProviderByIdService(req.params.id, next);
    sendResponse(res, 200, "Service Provider retrieved successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update a service provider
export const updateServiceProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profilePicture = req.file as Express.MulterS3.File | undefined;
    if (!profilePicture || !profilePicture.location) {
      next(new ErrorHandler("At least one image is required", 400));
      return;
    }
    const validation = CheckZodValidation({ ...req.body,image:profilePicture.location }, updateServiceProviderSchema, next);
    if (!validation.success) return;
    const response = await updateServiceProviderService(req.params.id, validation.data, next);
    sendResponse(res, 200, "Service Provider Updated Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete a service provider
export const deleteServiceProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await deleteServiceProviderService(req.params.id, next);
    sendResponse(res, 200, "Service Provider Deleted Successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};


export const getServiceProviderLocation = async (req: Request,res: Response,next: NextFunction):Promise<void> => {
  const { id } = req.params;
  try {
    const location = await getLocationFromProviderService(id);
    if (!location) {
      sendResponse(res,200,"Service Provider Location retrieved successfully",location);  
      return;
    }
  next(new ErrorHandler("Service Provider Location not found", 404));
  } catch (error:any) {
    next(new ErrorHandler(error.message, 404));
  }
};