import { z } from "zod";
export const PaymentValidationSchema = z.object({
  amount: z.number(),
  booking: z.string()
});

export const CallbackPaymentValidationSchema = z.object({
  transactionId: z.string(),
  status: z.string(),
});
