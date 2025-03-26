import { Request, Response, NextFunction } from "express";
import {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from "../services/reviewService";
import { sendResponse } from "../utils/responseHandler";
import {
  getReviewSchema,
  deleteReviewSchema,
} from "../validations/review_validation";
import ErrorHandler from "../config/GlobalerrorHandler";
import { createRedisClient } from "../config/redisCache";

// ✅ Create Review Controller
export const createReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await createReview(req.body, next);
    if (response)
      sendResponse(res, 201, "Review created successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// ✅ Get All Reviews Controller
export const getAllReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cachedReviews = await createRedisClient().get("reviews");
    if (cachedReviews) {
      sendResponse(
        res,
        200,
        "Reviews retrieved from cache",
        JSON.parse(cachedReviews)
      );
      return;
    }

    const response = await getAllReviews(next);

    // Cache for 15 minutes
    await createRedisClient().setex("reviews", 900, JSON.stringify(response));

    sendResponse(res, 200, "Reviews fetched successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// ✅ Get Review by ID Controller
export const getReviewByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validation = getReviewSchema.safeParse(req.params);
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const { id } = validation.data;

    // Check cache
    const cachedReview = await createRedisClient().get(`review:${id}`);
    if (cachedReview) {
      sendResponse(
        res,
        200,
        "Review retrieved from cache",
        JSON.parse(cachedReview)
      );
      return;
    }

    const response = await getReviewById(id, next);
    if (!response) return next(new ErrorHandler("Review not found", 404));

    // Cache for 10 minutes
    await createRedisClient().setex(
      `review:${id}`,
      600,
      JSON.stringify(response)
    );

    sendResponse(res, 200, "Review fetched successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// ✅ Update Review Controller
export const updateReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await updateReview(req.params.id, req.body, next);
    if (response)
      sendResponse(res, 200, "Review updated successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// ✅ Delete Review Controller
export const deleteReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = deleteReviewSchema.safeParse(req.params);
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    const response = await deleteReview(validation.data.id, next);
    if (response) sendResponse(res, 200, response.message, response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};


