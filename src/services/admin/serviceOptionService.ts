
import { NextFunction } from "express";
import { ServiceOption } from "../../models/ActualServiceSchema";
import ErrorHandler from "../../config/GlobalerrorHandler";
import { convertStringToObjectId } from "../../utils/helper";
import { CodeStarNotifications } from "aws-sdk";

// Create Service Option
export const createServiceOption = async (
  actualService: string,
  name: string,
  price: number,
  discount_price: number | undefined,
  duration: number,
  description: string | undefined,
  images: string[],
  discount_type: string,
  next: NextFunction
) => {
  try {
    console.log("Crossing Validation", discount_type);
    const newServiceOption = await ServiceOption.create({
      actualService,
      name,
      price,
      discount_price,
      duration,
      description,
      images,
      discount_type,
    });
    if (newServiceOption) {
      return { id: newServiceOption._id };
    } else {
      return next(new ErrorHandler("Service Option could not be created", 500));
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Read Service Option by ID
export const getServiceOptionById = async (id: string, next: NextFunction) => {
  try {
    console.log("in service getServiceOptionById", id);
    const serviceOption = await ServiceOption.find({ actualService:convertStringToObjectId(id)});
    if (!serviceOption) return next(new ErrorHandler("Service Option not found", 404));
    return serviceOption;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Update Service Option
export const updateServiceOption = async (
  id: string,
  updates: Partial<{ actualService: string; name: string; price: number; discount_price: number; duration: number; description: string; service_provider: string; images: string[] }>,
  next: NextFunction
) => {
  try {
    const updatedServiceOption = await ServiceOption.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedServiceOption) return next(new ErrorHandler("Service Option not found", 404));
    return updatedServiceOption;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Delete Service Option
export const deleteServiceOption = async (id: string, next: NextFunction) => {
  try {
    const deletedServiceOption = await ServiceOption.findByIdAndDelete(id);
    if (!deletedServiceOption) return next(new ErrorHandler("Service Option not found", 404));
    return { message: "Service Option deleted successfully" };
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
