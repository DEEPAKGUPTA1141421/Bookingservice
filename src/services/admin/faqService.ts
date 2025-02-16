import { NextFunction } from "express";
import { FaqModel, IFaq } from "../../models/FaqsSchema";
import ErrorHandler from "../../config/GlobalerrorHandler";

// Define a type for creating a new FAQ, excluding Mongoose document properties
type CreateFaqDTO = {
  category: string;
  faqs: { question: string; answer: string }[];
};

export const createFaq = async (data: CreateFaqDTO, next: NextFunction) => {
  try {
    const newFaq = await FaqModel.create(data);
    return newFaq;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Get all categories with FAQs
export const getAllFaqs = async (next: NextFunction) => {
  try {
    const faqs = await FaqModel.find();
    return faqs;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Get FAQs by category
export const getFaqsByCategory = async (
  category: string,
  next: NextFunction
) => {
  try {
    const faqs = await FaqModel.findOne({ category });
    if (!faqs) return next(new ErrorHandler("FAQ category not found", 404));
    return faqs;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Add new FAQ to an existing category
export const addFaqToCategory = async (
  category: string,
  faq: { question: string; answer: string },
  next: NextFunction
) => {
  try {
    const updatedFaq = await FaqModel.findOneAndUpdate(
      { category },
      { $push: { faqs: faq } },
      { new: true }
    );
    if (!updatedFaq)
      return next(new ErrorHandler("FAQ category not found", 404));
    return updatedFaq;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Update a specific FAQ
export const updateFaq = async (
  category: string,
  question: string,
  newAnswer: string,
  next: NextFunction
) => {
  try {
    const updatedFaq = await FaqModel.findOneAndUpdate(
      { category, "faqs.question": question },
      { $set: { "faqs.$.answer": newAnswer } },
      { new: true }
    );
    if (!updatedFaq) return next(new ErrorHandler("FAQ not found", 404));
    return updatedFaq;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Delete an FAQ from a category
export const deleteFaq = async (
  category: string,
  question: string,
  next: NextFunction
) => {
  try {
    const updatedFaq = await FaqModel.findOneAndUpdate(
      { category },
      { $pull: { faqs: { question } } },
      { new: true }
    );
    if (!updatedFaq) return next(new ErrorHandler("FAQ not found", 404));
    return updatedFaq;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Delete an entire category
export const deleteCategory = async (category: string, next: NextFunction) => {
  try {
    const deletedCategory = await FaqModel.findOneAndDelete({ category });
    if (!deletedCategory)
      return next(new ErrorHandler("FAQ category not found", 404));
    return { message: "FAQ category deleted successfully" };
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
