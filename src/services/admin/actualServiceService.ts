
import { NextFunction } from "express";
import { ActualService } from "../../models/ActualServiceSchema";
import ErrorHandler from "../../config/GlobalerrorHandler";

// Create Actual Service
export const createActualService = async (name: string, description: string, images: string[], service: string, options: string[], next: NextFunction) => {
  try {
    const newActualService = await ActualService.create({ name, description, images, service, options });
    if (newActualService) {
      return { id: newActualService._id };
    } else {
      return next(new ErrorHandler("Actual Service could not be created", 500));
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Read Actual Service
export const getActualServiceById = async (id: string, next: NextFunction) => {
  try {
    const actualService = await ActualService.findById(id).populate("service").populate("options");
    if (!actualService) return next(new ErrorHandler("Actual Service not found", 404));
    return actualService;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Update Actual Service
export const updateActualService = async (id: string, updates: Partial<{ name: string; description: string; images: string[]; service: string; options: string[] }>, next: NextFunction) => {
  try {
    const updatedActualService = await ActualService.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedActualService) return next(new ErrorHandler("Actual Service not found", 404));
    return updatedActualService;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Delete Actual Service
export const deleteActualService = async (id: string, next: NextFunction) => {
  try {
    const deletedActualService = await ActualService.findByIdAndDelete(id);
    if (!deletedActualService) return next(new ErrorHandler("Actual Service not found", 404));
    return { message: "Actual Service deleted successfully" };
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
