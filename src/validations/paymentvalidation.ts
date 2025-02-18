import { z } from "zod";
export const PaymentValidationSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  booking: z.string(),
});

export const CallbackPaymentValidationSchema = z.object({
  transactionId:z.string(),
  status: z.string()
});
