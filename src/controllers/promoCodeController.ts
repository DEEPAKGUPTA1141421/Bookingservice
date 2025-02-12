import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import { CheckZodValidation } from "../utils/helper";
import { createPromoCodeSchema, updatePromoCodeSchema } from "../validations/promoCodeValidation";
import { PromoCode } from "../models/CartSchema";


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

// Apply Promo Code
export const applyPromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, amount } = req.body;
    const promoCode = await PromoCode.findOne({ code, active: true });
    if (!promoCode) {
      return next(new ErrorHandler("Invalid or inactive promo code", 400));
    }

    // Check for min order value
    if (amount < promoCode.minimum_booking_amount) {
      return next(new ErrorHandler("Order amount is less than minimum required for this promo", 400));
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.rate_type === "flat") {
      discount = Math.min(amount, promoCode.max_discount_amount || amount);
    } else if (promoCode.rate_type === "percentage") {
      discount = (amount * promoCode.rate) / 100;
      discount = Math.min(discount, promoCode.max_discount_amount || discount);
    }

    res.status(200).json({
      success: true,
      message: "Promo Code Applied Successfully",
      discount: discount,
    });
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
