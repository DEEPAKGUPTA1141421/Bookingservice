import { Request, Response } from "express";
import { Cart } from "../models/CartSchema";
import { ServiceOption } from "../models/ActualServiceSchema";
import { addToCartSchema } from "../validations/cart_validations";
import mongoose from "mongoose";

// Add to Cart
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = addToCartSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: validation.error.errors });
      return;
    }

    const { serviceOptionId, quantity } = validation.data;

    const serviceOption = await ServiceOption.findById(serviceOptionId)
      .populate("actualService")
      .exec();

    if (!serviceOption || !serviceOption.actualService) {
      res.status(404).json({ message: "Service Option not found" });
      return;
    }

    let cart = await Cart.findOne({ user: req.body._id });

    if (!cart) {
      cart = new Cart({
        user: req.body._id,
        items: [],
        total_price: 0,
        discount: 0,
        final_price: 0,
      });
    }

    // Ensure actualService has an _id field
    const actualServiceId = (
      serviceOption.actualService as { _id: mongoose.Types.ObjectId }
    )._id;

    if (!actualServiceId) {
      res.status(500).json({ message: "Invalid service data" });
      return;
    }

    const discountPrice = serviceOption.discount_price ?? 0;
    const itemPrice = serviceOption.price - discountPrice;

    // Check if item already exists in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.service_option.toString() === serviceOptionId
    );

    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        service: actualServiceId,
        service_option: serviceOptionId,
        quantity,
        price: itemPrice,
      });
    }

    // Calculate total and final prices
    cart.total_price = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    cart.final_price = cart.total_price;

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// Get Cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ user: req.body._id })
      .populate({
        path: "items.service_option",
        populate: { path: "actualService" },
      })
      .lean();

    if (!cart || cart.items.length === 0) {
      res.status(404).json({ message: "Cart is empty" });
      return;
    }

    // Ensure `discount_price` does not cause issues
    cart.items.forEach((item) => {
      const serviceOption = item.service_option as {
        price: number;
        discount_price?: number;
      };
      const discountPrice = serviceOption?.discount_price ?? 0;
      item.price = serviceOption.price - discountPrice;
    });

    res.status(200).json({ cart });
  } catch (error) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

export const removeFromCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.body._id });

    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    console.log(cart.items); // Debugging step

    const itemIndex = cart.items.findIndex(
      (item) =>
        new mongoose.Types.ObjectId(String(item.service_option)).toString() ===
        itemId
    );

    if (itemIndex === -1) {
      res.status(404).json({ message: "Item not found in cart" });
      return;
    }

    cart.items.splice(itemIndex, 1);

    // Recalculate total and final prices
    cart.total_price = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    cart.final_price = cart.total_price - (cart.discount ?? 0);

    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
