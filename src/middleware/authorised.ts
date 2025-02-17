import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../config/GlobalerrorHandler";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema";

export interface IUser {
    _id: string;
    role: string;
    name: string;
    email: string;
}
// Define the types for the request object that includes the user
interface IRequest extends Request {
  user?: IUser | null; // Add user as a property to the request
}

export const isAuthenticated = async (req: IRequest, res: Response, next: NextFunction): Promise<void> => {
  const { token } = req.cookies;
  console.log("token", token);
  
  if (!token) {
    return next(new ErrorHandler("Please Login To Access The Routes", 404));
  }
  
  try {
    const decodeData = jwt.verify(token, process.env.JwtSecretKey as string) as jwt.JwtPayload; // Ensure the decoded token is typed properly
    req.user = await User.findById(decodeData.id); // Add user data to the request
    next();
  } catch (error) {
    next(new ErrorHandler("Invalid or expired token", 401));
  }
};

module.exports.authorizeRoles = (...Roles: string[]) => {
  return (req: IRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !Roles.includes(req.user.role)) {
      return next(new ErrorHandler(`${req.user?.role} is not allowed to do this thing`, 500));
    }
    return next();
  };
};
