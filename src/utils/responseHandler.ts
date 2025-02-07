// responseHandler.ts
import { Response } from "express";

export interface SuccessResponse<T> {
    success: true;
    message: string;
    statusCode: number;
    data: T;
  }
  
  export interface ErrorResponse {
    success: false;
    message: string;
    statusCode: number;
  }
  
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
const InternalResponse = <T>(res: Response, response: ApiResponse<T>) => {
  if (response.success) {
    return res.status(200).json(response);
  }

  return res.status(response.statusCode).json(response);
};

export const sendResponse = <T>(res: Response,statusCode:number, message: string, data: T) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    statusCode,
    data,
  };
  return InternalResponse(res, response);
};

