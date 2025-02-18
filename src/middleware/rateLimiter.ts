import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Too many OTP requests, please try again later.",
});

export const bookingLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: "Too many booking attempts, please try again later.",
});

export const reviewLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 20,
  message: "Too many reviews submitted from this IP, try later.",
});
