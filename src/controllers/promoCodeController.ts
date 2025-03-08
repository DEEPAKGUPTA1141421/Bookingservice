import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import { CheckZodValidation } from "../utils/helper";
import { createPromoCodeSchema, updatePromoCodeSchema } from "../validations/promoCodeValidation";
import { PromoCode } from "../models/CartSchema";
import moment from "moment";
import { Booking } from "../models/BookingSchema";
import { sendResponse } from "../utils/responseHandler";
import { IRequest } from "../middleware/authorised";


// Create Promo Code
export const createPromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = CheckZodValidation(req.body, createPromoCodeSchema, next);
    if (!validation.success) return;
    const response = await PromoCode.create(validation.data);
    res.status(201).json({ success: true, message: "Promo Code Created Successfully", data: response });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get all Promo Codes
export const getPromoCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promoCodes = await PromoCode.find();
    res.status(200).json({ success: true, data: promoCodes });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get Promo Code by ID
export const getPromoCodeById = async (req: Request, res: Response, next: NextFunction) => {
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
export const updatePromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = CheckZodValidation(req.body, updatePromoCodeSchema, next);
    if (!validation.success) return;
    const updatedPromoCode = await PromoCode.findByIdAndUpdate(
      req.params.id,
      validation.data,
      { new: true }
    );
    if (!updatedPromoCode) {
      return next(new ErrorHandler("Promo Code not found", 404));
    }
    res.status(200).json({ success: true, message: "Promo Code Updated Successfully", data: updatedPromoCode });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Delete Promo Code
export const deletePromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deletedPromoCode = await PromoCode.findByIdAndDelete(req.params.id);
    if (!deletedPromoCode) {
      return next(new ErrorHandler("Promo Code not found", 404));
    }
    res.status(200).json({ success: true, message: "Promo Code Deleted Successfully" });
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
});
// Apply Promo Code
export const applyPromoCode = async (req: IRequest, res: Response, next: NextFunction):Promise<void> => {
  try {
    console.log("hit use now");
    const { promoCode, bookingId } = req.body;
    console.log(promoCode, bookingId);

     // Check if booking exists
    const booking = await Booking.findById(bookingId);
     if (!booking)
     {
       res
         .status(404)
         .json({ error: pc_errors().booking_not_found, success: false });
       return;
       }

     // Check if promo code exists and is active
     const promo = await PromoCode.findOne({ code: promoCode, active: true });
     if (!promo) {
       res.status(400).json({ error: pc_errors().unavailable, success: false });
        return;
     }

     // Check if promo is expired
     if (promo.expiry_date && moment().isAfter(moment(promo.expiry_date))) {
       res.status(400).json({ error: pc_errors().unavailable, success: false });
       return;
     }

     // Convert paisa to rupees
     const minBookingAmountInRupees = promo.minimum_booking_amount
       ? parseFloat(promo.minimum_booking_amount) / 100
       : 0;
     const maxDiscountAmountInRupees = promo.max_discount_amount
       ? parseFloat(promo.max_discount_amount) / 100
       : Infinity;

     // Check minimum booking amount
     if (
       minBookingAmountInRupees > 0 &&
       parseFloat(booking.actualPrice) < minBookingAmountInRupees
     ) {
       next(new ErrorHandler(pc_errors().min_amt_required, 200));
     }

     // Check total available usage per user
     const userPromoUsage = await Booking.countDocuments({
       user:req.user?._id,
       appliedPromo: promoCode,
     });
     if (promo&& promo.total_available_per_user&&userPromoUsage >= promo.total_available_per_user ) {
       res.status(400).json({ error: pc_errors().limit_exceeded,success:false });
       return;
     }

     // Check limit per period (weekly, monthly, yearly)
     if (promo.limit_per_period) {
       let periodStart;
       if (promo.period === "weekly") periodStart = moment().startOf("week");
       else if (promo.period === "monthly")
         periodStart = moment().startOf("month");
       else if (promo.period === "yearly")
         periodStart = moment().startOf("year");
       if (periodStart) {
           const promoUsageInPeriod = await Booking.countDocuments({
             user:req.user?._id,
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

     // Calculate discount
     let discountAmount;
     const baseAmount =
       promo.applicable_on === "base"
         ? booking.actualPrice
         : booking.finalPrice;

     if (promo.rate_type === "flat") {
       discountAmount = promo.rate;
     } else if (promo.rate_type === "percentage") {
       discountAmount = (parseFloat(baseAmount) * promo.rate) / 100;
     }

     // Ensure discount doesn't exceed max discount amount
     if (!discountAmount) {
       next(new ErrorHandler("Discount is Unavailable", 500));
       return;
     }
     discountAmount = Math.min(discountAmount, maxDiscountAmountInRupees);

     // Apply discount to the final price
     const updatedFinalPrice = parseFloat(booking.finalPrice) - discountAmount;

     // Update booking with promo code
     booking.promoCode = promo._id;
     booking.promoDiscount = discountAmount.toString();
     await booking.save();

     res.status(200).json({
       message: "Promo code applied successfully",
       discount: discountAmount,
       newFinalPrice: updatedFinalPrice,
       success:true
     });
   } catch (error) {
    console.error("Error applying promo code:", error);
     res.status(500).json({ error: "Internal server error" });
   }
};


