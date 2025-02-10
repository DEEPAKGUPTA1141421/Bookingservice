import ErrorHandler from "../../config/GlobalerrorHandler";

import { NextFunction } from "express";
import { Service } from "../../models/CategorySchema";

export const createService = async (
  name: string,
  description: string,
  images: string[],
  category: string,
  next: NextFunction
) => {
  try {
    const newService = await Service.create({ name, description, images, category });
    if (newService) {
      return { id: newService._id };
    } else {
      return next(new ErrorHandler("Service could not be created", 500));
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getServiceById = async (id: string, next: NextFunction) => {
  try {
    const service = await Service.findById(id).populate("category");
    if (!service) {
      return next(new ErrorHandler("Service not found", 404));
    }
    return service;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const updateService = async (
  id: string,
  updates: Record<string, any>,
  next: NextFunction
) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedService) {
      return next(new ErrorHandler("Service not found", 404));
    }
    return updatedService;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const deleteService = async (id: string, next: NextFunction) => {
  try {
    const deletedService = await Service.findByIdAndDelete(id);
    if (!deletedService) {
      return next(new ErrorHandler("Service not found", 404));
    }
    return { message: "Service deleted successfully" };
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
