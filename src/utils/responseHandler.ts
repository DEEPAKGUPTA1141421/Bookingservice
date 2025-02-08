// responseHandler.ts
import { Response } from "express";

export interface SuccessResponse<T> {
    success: true;
    message: string;
    data: T;
  }
  
  export interface ErrorResponse {
    success: false;
    message: string;
    statusCode: number;
  }
  
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
const InternalResponse = <T>(res: Response,statusCode:number, response: ApiResponse<T>) => {
  if (response.success) {
    return res.status(statusCode).json(response);
  }

  return res.status(statusCode).json(response);
};

export const sendResponse = <T>(res: Response,statusCode:number, message: string, data: T) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return InternalResponse(res,statusCode, response);
};

