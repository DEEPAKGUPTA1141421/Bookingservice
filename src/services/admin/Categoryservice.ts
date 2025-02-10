import { NextFunction } from "express";
import ErrorHandler from "../../config/GlobalerrorHandler";
import { Category } from "../../models/CategorySchema";
import { ActualService } from "../../models/ActualServiceSchema";

export const createCategoryService = async (name: string,description: string, images:[string],next: NextFunction) => {
    try {
       const newCategory=await Category.create({name,description,images});
       if(newCategory){
        return { id: newCategory._id };
       }
       else{
        next(new ErrorHandler("Category could not be created", 500));
       }
    }
    catch (error:any) {
        next(new ErrorHandler(error.message, 500))
    }
}

export const updateCategoryService = async (
  id: string,
  name?: string,
  description?: string,
  images?: string[],
  next?: NextFunction
) => {
  try {
    const updates: Record<string, any> = {};
    if (name) updates.name = name.trim();
    if (description) updates.description = description.trim();
    if (images) updates.images = images;

    if (!Object.keys(updates).length) {
      return next ? next(new ErrorHandler("No updates provided", 400)) : null;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedCategory) {
      return next ? next(new ErrorHandler("Category not found", 404)) : null;
    }

    return { id: updatedCategory._id };
  } catch (error: any) {
    return next ? next(new ErrorHandler(error.message, 500)) : null;
  }
};

export const deleteCategoryService = async (id: string, next: NextFunction) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return next(new ErrorHandler("Category not found", 404));
    }
    return { message: "Category deleted successfully" };
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};


