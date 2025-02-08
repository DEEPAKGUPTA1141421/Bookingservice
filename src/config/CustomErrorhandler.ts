import { Request, Response, NextFunction } from "express";
import ErrorHandler from "./GlobalerrorHandler"; // Ensure the correct path

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  if (err.name === "CastError") {
    err = new ErrorHandler(`Resource not found. Invalid ${err.path}`, 400);
  }

  if (err.code === 11000) {
    err = new ErrorHandler(
      `Duplicate key error: ${Object.keys(err.keyValue)} already exists.`,
      400
    );
  }

  if (err.name === "JsonWebTokenError") {
    err = new ErrorHandler("Invalid token. Please try again.", 401);
  }

  if (err.name === "TokenExpiredError") {
    err = new ErrorHandler("Token expired. Please login again.", 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    statusCode: err.statusCode,
  });
};
