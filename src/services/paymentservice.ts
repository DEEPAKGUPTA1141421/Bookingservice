import axios from "axios";
import ErrorHandler from "../config/GlobalerrorHandler";
import { Payment } from "../models/PaymentSchema";
import { initiatedPaymentType } from "../utils/GlobalTypescript";
import { generateTransactionId } from "../utils/helper";
import * as crypto from "crypto"; 

export const InitiatepaymentService = async (obj: initiatedPaymentType) => {
    try {
        const transactionId = generateTransactionId();
        const merchantId = process.env.PHONEPE_MERCHANT_ID;
        const merchantKey = process.env.PHONEPE_MERCHANT_KEY as string;
      const baseUrl = process.env.PHONEPE_BASE_URL;
      console.log("access value");
        const payment = new Payment({
          transactionId,
          merchantUserId: obj.userId,
          amount:obj.amount,
          status: "PENDING",
          user: obj.userId,
          booking: obj.booking,
          method:"upi"
        });
      await payment.save();
      console.log("save", payment);
        const payload = {
          merchantId,
          transactionId,
          amount: obj.amount, // In paise
          merchantUserId: obj.userId,
          redirectUrl: `${process.env.FRONTEND_REDIRECT_URL}?transactionId=${transactionId}`,
          callbackUrl: `http://localhost:4000/payment/callback`,
          paymentInstrument: { type: "PAY_PAGE" },
        };
      const payloadString = JSON.stringify(payload);
      console.log(payloadString);
      const checksum = crypto.createHmac("sha256", merchantKey).update(payloadString).digest("base64");
      console.log(checksum, "checksum");
      const response = await axios.post(`${baseUrl}`, payload, {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": `${checksum}###1`,
          },
        });
      console.log("check check",response);
        return response.data;
    }
    catch (error: any) {
        throw new ErrorHandler(error.message, 501);
    }
};

