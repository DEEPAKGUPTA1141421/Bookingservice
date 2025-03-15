import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import { CheckZodValidation } from "../utils/helper";
import {
  CallbackPaymentValidationSchema,
  PaymentValidationSchema,
} from "../validations/paymentvalidation";
import {
  InitiatepaymentService,
  checkPaymentStatusWithPhonePe,
  getPhonePeTransactionStatus,
} from "../services/paymentservice";
import { sendResponse } from "../utils/responseHandler";
import { Payment } from "../models/PaymentSchema";
import { Pay } from "twilio/lib/twiml/VoiceResponse";
import { Booking } from "../models/BookingSchema";
import { send } from "process";
import { ObjectId } from "mongoose";
import { IRequest } from "../middleware/authorised";

export const Initiatepayment = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("first");
    const validation = CheckZodValidation(
      req.body,
      PaymentValidationSchema,
      next
    );
    console.log("first 1");
    if (!validation.success) {
      console.log("just hit the failuer");
      next(new ErrorHandler(validation.error.errors, 400));
      return;
    }
    console.log(validation.data);
    const response = await InitiatepaymentService({ ...validation.data,userId:req.user?._id });
    console.log("response", response);
    sendResponse(res, 201, "Initiated Successsfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 501));
  }
};
export const HandleCallbackByPhonePay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("call back clalled by phone pe"); 
    const { transactionId, status } = req.body;

    if (!transactionId) {
      return next(new ErrorHandler("Transaction ID is required", 403));
    }
    console.log("call back clalled by phone pe till here"); 
    // Fetch the payment entry in DB
    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return next(new ErrorHandler("Payment Not Found", 404));
    }

    // Verify payment with PhonePe API
    const phonePeStatus = await getPhonePeTransactionStatus(transactionId);
    if (phonePeStatus.success) {
      payment.status = phonePeStatus.status;
      await payment.save();
      sendResponse(res, 200, "Payment status updated successfully", payment);
    } else {
      next(new ErrorHandler("Failed to verify transaction", 500));
    }
  } catch (error: any) {
    next(new ErrorHandler(error.message, 501));
  }
};

// API endpoint for the frontend to check payment status
export const checkStatusPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log("write place");
  const { transactionId } = req.params;
  console.log("transactionId",transactionId);
  const payment = await Payment.findOne({ 
  transactionId
  });
  if (!payment) {
    next(new ErrorHandler("Payment Not Initiated successful", 200));
    return;
  }

  const paymnetStatus = payment.status;
  if (paymnetStatus === "SUCCESS") {
    sendResponse(res, 200, "Payment already successful", payment);
    return;
  }

  try {
    const isSuccessful = await checkPaymentStatusWithPhonePe(transactionId);
    console.log("in try block", isSuccessful);
    if (isSuccessful) {
      // Update your database
      const findBooking = await Booking.findById(payment.booking);
      if(!findBooking){
        next(new ErrorHandler("Booking not found", 201));
        return;
      }
      const bookingStatus =  findBooking.status;
      console.log(findBooking);
      if (bookingStatus === "initiated") {
        findBooking.status = "pending";
        await findBooking.save();
      } else {
        next(new ErrorHandler("Booking already confirmed", 200));
        return;
      }
      payment.status = "SUCCESS";
      await payment.save();
      sendResponse(res, 200, "Payment successful", payment);
    } else {
      next(new ErrorHandler("Payment verification failed", 201));
    }
  } catch (error) {
    console.error("Payment status check error:", error);
    next(new ErrorHandler("Payment verification failed", 403));
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
  } catch (error: any) {
    next(new ErrorHandler(error.message, 501));
  }
};
