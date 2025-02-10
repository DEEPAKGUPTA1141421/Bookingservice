import ErrorHandler from "../config/GlobalerrorHandler";

export const CheckZodValidation=(body:any,schema:any,next:any)=>{
  const validation=schema.safeParse(body);
  if(!validation.success){
    const errorMessage = validation.error.errors.map((err:any) => err.message).join(", ");
    return next(new ErrorHandler(errorMessage,504))
  }
  return validation;
}
