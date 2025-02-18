import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import { CheckZodValidation } from "../utils/helper";
import { CallbackPaymentValidationSchema, PaymentValidationSchema } from "../validations/paymentvalidation";
import {  InitiatepaymentService } from "../services/paymentservice";
import { sendResponse } from "../utils/responseHandler";
import { Payment } from "../models/PaymentSchema";
export const Initiatepayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log("first");
    const validation = CheckZodValidation(req.body, PaymentValidationSchema, next);
    console.log("first 1");
       if (!validation.success) {
         next(new ErrorHandler(validation.error.errors, 400));
         return;
       }
       console.log(validation.data);
        const response = await InitiatepaymentService(validation.data);
        sendResponse(res, 201, "Initiated Successsfully", response);
    }
    catch (error:any) {
        next(new ErrorHandler(error.message, 501));
    }
};
export const HandleCallbackByPhonePay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { transactionId, status } = req.body;

    if (!transactionId)
      next(new ErrorHandler("Transaction ID is required", 403));

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      next(new ErrorHandler("Payment  Not Found", 403));
      return;
    }
    payment.status = status;
    await payment.save();
    res.json({ message: "Payment status updated successfully" });
  } catch (error:any) {
    next(new ErrorHandler(error.message, 501));
  }
};
export const getTranscationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
      const { transactionId } = req.params;

        if (!transactionId) {
            next(new ErrorHandler("Transaction ID is required", 403));
        }

      const payment = await Payment.findOne({ transactionId });
        if (!payment) {
          next(new ErrorHandler("Payment  Not Found", 403));
        }
        sendResponse(res, 201, "Result Success", payment);
    } catch (error:any) {
      next(new ErrorHandler(error.message, 501));
    }
}