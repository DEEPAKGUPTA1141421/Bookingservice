import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema";
import ServiceProvider from "../models/ServiceProviderSchema ";
import { Admin } from "../models/AdminSchema";

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ErrorHandler("Please login to access this route", 401));
    }

    const token = authHeader.split(" ")[1]; // Extract token
    console.log("Extracted Token:", token);

    let decodedData;
    try {
      decodedData = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as jwt.JwtPayload;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(
          new ErrorHandler("Session expired. Please log in again.", 401)
        );
      } else if (error.name === "JsonWebTokenError") {
        return next(
          new ErrorHandler("Invalid token. Please log in again.", 401)
        );
      } else {
        return next(new ErrorHandler("Authentication failed.", 401));
      }
    }

    console.log("Decoded Token Data:", decodedData);

    req.user =
      (await User.findById(decodedData.userId)) ||
      (await ServiceProvider.findById(decodedData.userId)) ||
      (await Admin.findById(decodedData.userId));

    if (!req.user) {
      console.log("User not found");
      return next(new ErrorHandler("User not found", 404));
    }

    console.log("Control transferred to next middleware");
    next(); // Proceed to next middleware
  } catch (error) {
    console.log("Auth Error:", error);
    return next(new ErrorHandler("Authentication error", 500));
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
