import { NextFunction, Request, Response } from "express";
import {
  getAvailableSlotsSchema,
  BookSlotValidationSchema,
} from "../validations/slotValidation";
import * as slotService from "../services/slotService";
import { sendResponse } from "../utils/responseHandler";
import ErrorHandler from "../config/GlobalerrorHandler";
import { CheckZodValidation } from "../utils/helper";

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  try {
    const validated = CheckZodValidation(req.body, getAvailableSlotsSchema,next);
;    if (!validated.success) { 
      next(new ErrorHandler("Validation failed", 500));
    }
    const providers = await slotService.getAvailableSlots(validated.data);
    if (!providers) {
      // fecth providers from redis and return
      sendResponse(res, 302, "No available slots", providers);
    }
    else {  
       sendResponse(res, 200, "Available slots retrieved successfully", providers);
    }
  } catch (error:any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const bookSlot = async (req: Request, res: Response,next: NextFunction):Promise<void>=>{
  try {
    const validation = CheckZodValidation(req.body, BookSlotValidationSchema, next);
    if (!validation && !validation.success) {
      next(new ErrorHandler(validation.error.errors,400));
    }
    const response = await slotService.bookSlot(validation.data);
    if (!response) {
      sendResponse(res, 201, "Slot Given To SomeOne Else Better Luck Next Time", response);
    }
    else {
       sendResponse(
         res,
         201,
         "Booked Initiated SuccessFully",
         response
       );
    }
  } catch (error:any) {
    next(new ErrorHandler(error.message, 500));
  }
};
