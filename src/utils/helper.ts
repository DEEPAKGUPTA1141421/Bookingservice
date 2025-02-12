import { NextFunction } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";

export const CheckZodValidation=(body:any,schema:any,next:NextFunction)=>{
  const validation=schema.safeParse(body);
  if(!validation.success){
    const errorMessage = validation.error.errors.map((err: any) => `${err.path.join(".")}: ${err.message}`) .join(", ");
    throw new ErrorHandler(errorMessage, 504)
  }
  return validation;
}


