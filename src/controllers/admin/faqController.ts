import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../../utils/responseHandler";
import { faqValidationSchema } from "../../validations/faq_validation";
import {
  createFaq,
  getAllFaqs,
  getFaqsByCategory,
  addFaqToCategory,
  updateFaq,
  deleteFaq,
  deleteCategory,
} from "../../services/admin/faqService";
import ErrorHandler from "../../config/GlobalerrorHandler";
import { IFaq } from "../../models/FaqsSchema";
import redisClient from "../../config/redisCache";

type CreateFaqDTO = {
  category: string;
  faqs: { question: string; answer: string }[];
};

export const createFaqController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = faqValidationSchema.safeParse(req.body);
    if (!validation.success)
      return next(new ErrorHandler(validation.error.errors[0].message, 400));

    // Use CreateFaqDTO instead of Omit<IFaq, "_id">
    const faqData: CreateFaqDTO = {
      category: validation.data.category,
      faqs: validation.data.faqs,
    };

    const response = await createFaq(faqData, next);
    sendResponse(res, 201, "FAQ category created successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const getAllFaqsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cachedFaqs = await redisClient.get("faqs");
    if (cachedFaqs) {
      sendResponse(
        res,
        200,
        "FAQs retrieved from cache",
        JSON.parse(cachedFaqs)
      );
      return;
    }

    const response = await getAllFaqs(next);

    // Cache for 15 minutes
    await redisClient.setex("faqs", 900, JSON.stringify(response));

    sendResponse(res, 200, "FAQs fetched successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const getFaqsByCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category } = req.params;

    // Check cache
    const cachedFaqs = await redisClient.get(`faqs:${category}`);
    if (cachedFaqs) {
      sendResponse(
        res,
        200,
        "FAQs retrieved from cache",
        JSON.parse(cachedFaqs)
      );
      return;
    }

    const response = await getFaqsByCategory(category, next);
    if (!response) return next(new ErrorHandler("Category not found", 404));

    // Cache for 15 minutes
    await redisClient.setex(`faqs:${category}`, 900, JSON.stringify(response));

    sendResponse(res, 200, "FAQs fetched successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const addFaqToCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const { question, answer } = req.body;
    if (!question || !answer)
      return next(new ErrorHandler("Question and answer are required", 400));

    const response = await addFaqToCategory(
      category,
      { question, answer },
      next
    );
    if (!response) return next(new ErrorHandler("Category not found", 404));

    sendResponse(res, 200, "FAQ added successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const updateFaqController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, question } = req.params;
    const { answer } = req.body;
    if (!answer) return next(new ErrorHandler("Answer is required", 400));

    const response = await updateFaq(category, question, answer, next);
    if (!response)
      return next(new ErrorHandler("Category or Question not found", 404));

    sendResponse(res, 200, "FAQ updated successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const deleteFaqController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, question } = req.params;
    const response = await deleteFaq(category, question, next);
    if (!response)
      return next(new ErrorHandler("Category or Question not found", 404));

    sendResponse(res, 200, "FAQ deleted successfully", response);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

export const deleteCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const response = await deleteCategory(category, next);
    if (!response) return next(new ErrorHandler("Category not found", 404));

    sendResponse(res, 200, "Category deleted successfully", next);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
