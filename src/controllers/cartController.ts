import { NextFunction, Request, Response } from "express";
import * as cartService from "../services/cartService";
import { sendResponse } from "../utils/responseHandler";
import ErrorHandler from "../config/GlobalerrorHandler";

// Add to Cart
export const addToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await cartService.addToCart(req.body);
    sendResponse(res, 200, "Item added to cart", cart);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Get Cart
export const getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await cartService.getCart(req.params.id);
    sendResponse(res, 200, "Cart retrieved successfully", cart);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Remove from Cart
export const removeFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await cartService.removeFromCart(req.body._id, req.params.itemId);
    sendResponse(res, 200, "Item removed from cart", cart);
  } catch (error: any) {
    next(new ErrorHandler(error.message, 500));
  }
};
