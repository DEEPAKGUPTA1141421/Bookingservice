import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema";
import ServiceProvider from "../models/ServiceProviderSchema ";

export interface IUser {
    _id: string;
    role: string;
    name: string;
    email: string;
}
// Define the types for the request object that includes the user
export interface IRequest extends Request {
  user?: IUser | null; // Add user as a property to the request
}

export const isAuthenticated = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization; // Get Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new ErrorHandler("Please Login To Access The Routes", 401));
      return;
    }

    const token = authHeader.split(" ")[1]; // Extract token from 'Bearer <token>'
    console.log("Extracted Token:", token);

    const decodedData = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as jwt.JwtPayload;
    console.log("Decoded Token Data:", decodedData);

    req.user =
      (await User.findById(decodedData.userId)) ||
      (await ServiceProvider.findById(decodedData.userId)); // Find user or service provider
    if (!req.user) {
      next(new ErrorHandler("User not found", 404));
      return;
    }

    next(); // Proceed to next middleware
  } catch (error) {
    console.log("Auth Error:", error);
    next(new ErrorHandler("Invalid or expired token", 401));
    return;
  }
};

export const authorizeRoles = (...Roles: string[]) => {
  return (req: IRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !Roles.includes(req.user.role)) {
      return next(new ErrorHandler(`${req.user?.role} is not allowed to do this thing`, 500));
    }
    return next();
  };
};
