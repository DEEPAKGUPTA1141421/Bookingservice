import ErrorHandler from "../config/GlobalerrorHandler";
import { Category } from "../models/CategorySchema";

export const createCategoryService = async (name: string,description: string, images:[string]) => {
    try {
       const newCategory=await Category.create({name,description,images});
       if(newCategory){
        return { id: newCategory._id };
       }
       else{
        throw new ErrorHandler("Category could not be created", 500);
       }
    }
    catch (error:any) {
        throw new ErrorHandler(error.message, 500);
    }
}