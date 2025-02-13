import mongoose from "mongoose";
import { Cart, CartItem } from "../models/CartSchema";
import { ServiceOption } from "../models/ActualServiceSchema";
import { addToCartSchema } from "../validations/cart_validations";
import ErrorHandler from "../config/GlobalerrorHandler";

// Add to Cart Logic

export const addToCart = async (body: any) => {
  const validation = addToCartSchema.safeParse(body);
  if (!validation.success) {
    throw new ErrorHandler("Validation error", 400);
  }

  const { serviceOptionId, quantity } = validation.data;
  const serviceOption = await ServiceOption.findById(serviceOptionId)
    .populate("actualService")
    .exec();

  if (!serviceOption || !serviceOption.actualService) {
    throw new ErrorHandler("Service Option not found", 404);
  }

  let cart = await Cart.findOne({ user: body._id });

  if (!cart) {
    cart = new Cart({
      user: body._id,
      items: [],
      total_price: 0,
      discount: 0,
      final_price: 0,
    });
  }

  const actualServiceId = serviceOption.actualService._id;
  const discountAmount = serviceOption.discount_price ?? 0;
  const finalItemPrice = serviceOption.price - discountAmount;

  // Convert serviceOptionId to a Mongoose ObjectId
  const serviceOptionObjectId = new mongoose.Types.ObjectId(serviceOptionId);

  const existingItem = cart.items.find((item) =>
    item.service_option.equals(serviceOptionObjectId)
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      service: actualServiceId,
      service_option: serviceOptionObjectId,
      quantity,
      price: finalItemPrice,
    } as any); // Cast to `any` to avoid TypeScript strict issues
  }

  cart.total_price = cart.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  cart.discount = cart.items.reduce((acc, item) => {
    const itemObj = item; // No need for .toObject()

    return acc + (serviceOption.price - itemObj.price) * itemObj.quantity;
  }, 0);

  cart.final_price = cart.total_price - cart.discount;

  await cart.save();
  return cart;
};

export const getCart = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId })
    .populate({
      path: "items.service_option",
      populate: { path: "actualService" },
    })
    .populate("items") // Ensure _id is populated for items
    .exec();

  if (!cart || cart.items.length === 0) {
    throw new ErrorHandler("Cart is empty", 404);
  }

  for (const item of cart.items) {
    const serviceOption = item.service_option as unknown as {
      price: number;
      discount_price?: number;
    };

    const discountPrice = serviceOption.discount_price ?? 0;

    await CartItem.findByIdAndUpdate(item._id, {
      price: serviceOption.price - discountPrice,
    });
  }

  return cart;
};

// Remove from Cart Logic
export const removeFromCart = async (userId: string, itemId: string) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new ErrorHandler("Cart not found", 404);
  }

  const itemIndex = cart.items.findIndex(
    (item) =>
      new mongoose.Types.ObjectId(String(item.service_option)).toString() ===
      itemId
  );

  if (itemIndex === -1) {
    throw new ErrorHandler("Item not found in cart", 404);
  }

  cart.items.splice(itemIndex, 1);

  cart.total_price = cart.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  cart.final_price = cart.total_price - (cart.discount ?? 0);
  await cart.save();

  return cart;
};
