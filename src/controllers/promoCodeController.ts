import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import { CheckZodValidation } from "../utils/helper";
import {
  createPromoCodeSchema,
  updatePromoCodeSchema,
} from "../validations/promoCodeValidation";
import { PromoCode } from "../models/CartSchema";
import moment from "moment";
import { Booking } from "../models/BookingSchema";
import { sendResponse } from "../utils/responseHandler";
import { IRequest } from "../middleware/authorised";

// Create Promo Code
export const createPromoCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = CheckZodValidation(
      req.body,
      createPromoCodeSchema,
      next
    );
    if (!validation.success) return;
    const response = await PromoCode.create(validation.data);
    res.status(201).json({
      success: true,
      message: "Promo Code Created Successfully",
      data: response,
    });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get all Promo Codes
export const getPromoCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const promoCodes = await PromoCode.find({ typeofPromoCode: "direct" }, {
      _id:1,code:1,description:1,tnc:1,rate:1,rate_type:1
    }).lean();
    res.status(200).json({ success: true, data: promoCodes });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get Promo Code by ID
export const getPromoCodeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return next(new ErrorHandler("Promo Code not found", 404));
    }
    res.status(200).json({ success: true, data: promoCode });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Update Promo Code
export const updatePromoCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = CheckZodValidation(
      req.body,
      updatePromoCodeSchema,
      next
    );
    if (!validation.success) return;
    const updatedPromoCode = await PromoCode.findByIdAndUpdate(
      req.params.id,
      validation.data,
      { new: true }
    );
    if (!updatedPromoCode) {
      return next(new ErrorHandler("Promo Code not found", 404));
    }
    res.status(200).json({
      success: true,
      message: "Promo Code Updated Successfully",
      data: updatedPromoCode,
    });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete Promo Code
export const deletePromoCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deletedPromoCode = await PromoCode.findByIdAndDelete(req.params.id);
    if (!deletedPromoCode) {
      return next(new ErrorHandler("Promo Code not found", 404));
    }
    res
      .status(200)
      .json({ success: true, message: "Promo Code Deleted Successfully" });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

const pc_errors = (params = "") => ({
  booking_not_found: "Booking not found",
  unavailable: "Promo code not available",
  min_amt_required: `Promo code not applicable - Minimum booking amount of INR ${params} required`,
  limit_exceeded:
    "Promo code not applicable - Total promo codes limit exceeded for the user",
  max_amt_redeemed: "Promo code not applicable - Max amount already redeemed",
  invalid_day: "Promo code not applicable today.",
  invalid_discount: "Discount invalid.",
  limit_per_period: "Exceed_Limit_Per_Period",
  expired: "Promo Code has Expired",
});
// Apply Promo Code
export const applyPromoCode = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("Promo Code API hit");

    const { promoCode, bookingId } = req.body;
    console.log("Received PromoCode:", promoCode, "BookingId:", bookingId);

    // Fetch booking details
    const booking = await Booking.findById(bookingId);
    console.log(booking);
    if (!booking) {
      res
        .status(404)
        .json({ error: pc_errors().booking_not_found, success: false });
      return;
    }

    // Fetch active promo code
    const promo = await PromoCode.findOne({ code: promoCode, active: true });
    if (!promo) {
      res.status(400).json({ error: pc_errors().unavailable, success: false });
      return;
    }

    if (booking.promoCode) {
      console.log("Removing existing promo before applying new one");
      await Booking.updateOne(
        { _id: booking._id },
        {
          $inc: { finalPrice: booking.promoDiscount },
          $unset: { promoCode: "", promoDiscount: 0 },
        }
      );
    }

    // Check if promo code is expired
    if (promo.expiry_date && moment().isAfter(moment(promo.expiry_date))) {
      res.status(400).json({ error: pc_errors().expired, success: false });
      return;
    }

    // Convert paisa to rupees for better calculations
    const minBookingAmountInRupees = promo.minimum_booking_amount
      ? promo.minimum_booking_amount 
      : 0;
    const maxDiscountAmountInRupees = promo.max_discount_amount
      ? promo.max_discount_amount
      : Infinity;

    // Ensure booking meets minimum amount requirement
    console.log(
      minBookingAmountInRupees,
      maxDiscountAmountInRupees,
      booking.finalPrice
    );
    if (
      minBookingAmountInRupees > 0 &&
      booking.finalPrice < minBookingAmountInRupees
    ) {
      return next(new ErrorHandler(pc_errors().min_amt_required, 400));
    }

    // Check user's usage of the promo code
    const userPromoUsage = await Booking.countDocuments({
      user: req.user?._id,
      appliedPromo: promoCode,
    });

    if (
      promo.total_available_per_user &&
      userPromoUsage >= promo.total_available_per_user
    ) {
      res
        .status(400)
        .json({ error: pc_errors().limit_exceeded, success: false });
      return;
    }

    // Check promo code usage limit per period (weekly, monthly, yearly)
    if (promo.limit_per_period) {
      let periodStart;
      if (promo.period === "weekly") periodStart = moment().startOf("week");
      else if (promo.period === "monthly")
        periodStart = moment().startOf("month");
      else if (promo.period === "yearly")
        periodStart = moment().startOf("year");

      if (periodStart) {
        const promoUsageInPeriod = await Booking.countDocuments({
          user: req.user?._id,
          appliedPromo: promoCode,
          createdAt: { $gte: periodStart.toDate() },
        });

        if (promoUsageInPeriod >= promo.limit_per_period) {
          res
            .status(400)
            .json({ error: pc_errors().limit_per_period, success: false });
          return;
        }
      }
    }

    // Determine the base amount on which discount is applicable
    let baseAmount = booking.finalPrice; // Default to final price
    if (promo.applicable_on === "base") {
      baseAmount = booking.actualPrice; // Use base price when applicable
    }

    // Calculate discount based on rate type
    let discountAmount = 0;
    if (promo.rate_type === "flat") {
      console.log("flat",promo.rate)
      discountAmount = promo.rate; // Convert paisa to rupees
    } else if (promo.rate_type === "percentage") {
      console.log("percentage baseAmount", baseAmount);
      discountAmount = (baseAmount * promo.rate) / 100;
      console.log("percentage", promo.rate, discountAmount);
    }

    // Ensure discount does not exceed maximum allowed discount
    discountAmount = Math.min(discountAmount, maxDiscountAmountInRupees);

    if (!discountAmount || discountAmount <= 0) {
      return next(new ErrorHandler("Invalid discount amount", 400));
    }

    // Apply discount to the final price
    console.log("discountAmount", discountAmount);
    const updatedFinalPrice = booking.finalPrice - discountAmount;
    console.log("updatedFinalPrice", updatedFinalPrice);
    // Update booking with promo code and discount
    booking.promoCode = promo._id;
    booking.promoDiscount = discountAmount;
    booking.finalPrice = updatedFinalPrice; // Update final price
    await booking.save();

    res.status(200).json({
      message: "Promo code applied successfully",
      discount: discountAmount,
      newFinalPrice: updatedFinalPrice,
      success: true,
    });
  } catch (error) {
    console.error("Error applying promo code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
