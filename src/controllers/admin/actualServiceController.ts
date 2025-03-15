import { Request, Response, NextFunction } from "express";
import {
  createActualServiceSchema,
  updateActualServiceSchema,
  deleteActualServiceSchema,
  getActualServiceSchema,
} from "../../validations/admin_validation";
import {
  createActualService,
  getActualServiceById,
  updateActualService,
  deleteActualService,
} from "../../services/admin/actualServiceService";
import ErrorHandler from "../../config/GlobalerrorHandler";
import { sendResponse } from "../../utils/responseHandler";
import { ActualService } from "../../models/ActualServiceSchema";

// Create Actual Service
export const createActualServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("here to fun");
    if (!req.files || !(req.files as Express.MulterS3.File[]).length) {
      return next(new ErrorHandler("At least one image is required", 400));
    }

    const imageUrls = (req.files as Express.MulterS3.File[]).map(
      (file) => file.location
    );

    console.log("data patch", imageUrls);

    const validation = createActualServiceSchema.safeParse({
      ...req.body,
      images: imageUrls,
    });

   console.log("Validation:", validation);
   console.log(
     "Errors:",
     validation.error?.format?.() || validation.error?.message
   );

    if (!validation.success) {
      return next(new ErrorHandler(validation.error.errors[0].message, 400));
    }

    const { name, description, images, service } = validation.data;

    // Ensure these fields exist if needed
    const expert_is_trained_in = req.body.expert_is_trained_in || [];
    const service_excludes = req.body.service_excludes || [];
    const what_we_need_from_you = req.body.what_we_need_from_you || [];

    const response = await createActualService(
      name,
      description,
      images,
      service,
      expert_is_trained_in,
      service_excludes,
      what_we_need_from_you,
      next
    );

    if (response) {
      sendResponse(res, 201, "Actual Service Created Successfully", response);
      return;
    }
  } catch (error: any) {
    console.log("error", error.message);
    next(new ErrorHandler(error.message, 500));
  }
};

// Read Actual Service
export const getActualServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = getActualServiceSchema.safeParse(req.params);
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;
    const actualService = await getActualServiceById(id, next);
    if (actualService)
      sendResponse(
        res,
        200,
        "Actual Service fetched successfully",
        actualService
      );
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update Actual Service
export const updateActualServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = updateActualServiceSchema.safeParse({
      ...req.params,
      ...req.body,
    });

    if (!validation.success) {
      return next(new ErrorHandler(validation.error.errors[0].message, 400));
    }

    const { id, name, description, images, service } = validation.data;

    // Provide defaults if schema does not include these fields
    const expert_is_trained_in = req.body.expert_is_trained_in || [];
    const service_excludes = req.body.service_excludes || [];
    const what_we_need_from_you = req.body.what_we_need_from_you || [];

    const updates: Partial<{
      name: string;
      description: string;
      images: string[];
      service: string;
      expert_is_trained_in: string[];
      service_excludes: string[];
      what_we_need_from_you: { image: string; description: string }[];
    }> = {};

    if (name) updates.name = name.trim();
    if (description) updates.description = description.trim();
    if (images) updates.images = images;
    if (service) updates.service = service;
    if (expert_is_trained_in)
      updates.expert_is_trained_in = expert_is_trained_in;
    if (service_excludes) updates.service_excludes = service_excludes;
    if (what_we_need_from_you)
      updates.what_we_need_from_you = what_we_need_from_you;

    const updatedActualService = await updateActualService(id, updates, next);
    if (updatedActualService) {
      sendResponse(
        res,
        200,
        "Actual Service updated successfully",
        updatedActualService
      );
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete Actual Service
export const deleteActualServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = deleteActualServiceSchema.safeParse(req.params);
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;
    const response = await deleteActualService(id, next);
    if (response) sendResponse(res, 200, response.message, response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const getAllServiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("hitting service controller");
    const response = await ActualService.find({});

    if (response) {
      sendResponse(res, 200, "List Of Serrvice", response);
      return;
    } else {
      sendResponse(res, 200, "No Service Available", []);
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
