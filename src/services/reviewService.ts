import { Review } from "../models/ReviewSchema";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../validations/review_validation";
import { NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";

// ✅ Create Review
export const createReview = async (data: any, next: NextFunction) => {
  try {
    const validation = createReviewSchema.safeParse(data);
    if (!validation.success) {
      return next(new ErrorHandler(validation.error.errors[0].message, 400));
    }

    const newReview = await Review.create(validation.data);
    return newReview;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// ✅ Get All Reviews
export const getAllReviews = async (next: NextFunction) => {
  try {
    const reviews = await Review.find().populate(
      "actualService serviceOption serviceProvider user"
    );
    return reviews;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// ✅ Get Review by ID
export const getReviewById = async (id: string, next: NextFunction) => {
  try {
    const review = await Review.findById(id).populate(
      "actualService serviceOption serviceProvider user"
    );
    if (!review) {
      return next(new ErrorHandler("Review not found", 404));
    }
    return review;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// ✅ Update Review
export const updateReview = async (
  id: string,
  data: any,
  next: NextFunction
) => {
  try {
    const validation = updateReviewSchema.safeParse({ id, ...data });
    if (!validation.success) {
      return next(new ErrorHandler(validation.error.errors[0].message, 400));
    }

    const updatedReview = await Review.findByIdAndUpdate(id, validation.data, {
      new: true,
    });
    if (!updatedReview) {
      return next(new ErrorHandler("Review not found", 404));
    }
    return updatedReview;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// ✅ Delete Review
export const deleteReview = async (id: string, next: NextFunction) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(id);
    if (!deletedReview) {
      return next(new ErrorHandler("Review not found", 404));
    }
    return { message: "Review deleted successfully" };
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
