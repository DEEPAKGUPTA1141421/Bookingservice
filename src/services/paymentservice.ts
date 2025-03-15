import axios from "axios";
import ErrorHandler from "../config/GlobalerrorHandler";
import { Payment } from "../models/PaymentSchema";
import { initiatedPaymentType } from "../utils/GlobalTypescript";
import { generateTransactionId } from "../utils/helper";
import * as crypto from "crypto";

export const InitiatepaymentService = async (obj: initiatedPaymentType) => {
  try {
    console.log(
      "access value",
      process.env.PHONEPE_MERCHANT_ID,
      process.env.PHONEPE_MERCHANT_KEY,
      process.env.PHONEPE_BASE_URL
    );

    const transactionId = generateTransactionId();
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_MERCHANT_KEY as string;
    const saltIndex = "1";

    // Save payment to database
    const payment = new Payment({
      transactionId,
      merchantUserId: obj.userId,
      amount: obj.amount,
      status: "PENDING",
      user: obj.userId,
      booking: obj.booking,
      method: "upi",
    });
    await payment.save();

    // Create the payload
    const payload = {
      merchantId: merchantId,
      merchantTransactionId: transactionId,
      amount: obj.amount * 100, // PhonePe expects amount in paise
      merchantUserId: obj.userId,
      redirectUrl: `mynewapp://BookingSuccess?transactionId=${transactionId}`,
      redirectMode: "POST",
      callbackUrl: `${
        process.env.BACKEND_URL || "http://192.168.60.18:4000"
      }/payment/callback`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Convert payload to base64
    const payloadString = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadString).toString("base64");

    // Generate checksum using SHA256
    const string = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + saltIndex;

    // Make API request to PhonePe sandbox
    const response = await axios.post(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      {
        request: base64Payload,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
      }
    );

    console.log("PhonePe API Response:", JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    console.error(
      "PhonePe Payment Error:",
      error.response?.data || error.message
    );
    throw new ErrorHandler(error.message, 501);
  }
};

export const getPhonePeTransactionStatus = async (transactionId: string) => {
  try {
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const merchantKey = process.env.PHONEPE_MERCHANT_KEY as string;
    const baseUrl = process.env.PHONEPE_BASE_URL;

    const payload = {
      merchantId,
      transactionId,
    };

    const payloadString = JSON.stringify(payload);
    const checksum = crypto
      .createHmac("sha256", merchantKey)
      .update(payloadString)
      .digest("base64");
     console.log("transcatio Id", transactionId);
     const response = await axios.get(
      `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay/status/${transactionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": `${checksum}###1`,
        },
      }
     );
    
    console.log("response", response);

    return response.data;
  } catch (error: any) {
    console.error("Error verifying payment status:", error);
    return { success: false };
  }
};

export const checkPaymentStatusWithPhonePe = async (
  merchantTransactionId: string
) => {
  try {
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_MERCHANT_KEY; // Ensure this is correctly set in env
    const saltIndex = "1"; // PhonePe's default salt index

    if (!merchantId || !saltKey) {
      throw new Error("Missing PhonePe merchant credentials.");
    }

    // String to hash for verification
    console.log("PhonePe Status API Response:");
    const stringToHash = `/pg/v1/status/${merchantId}/${merchantTransactionId}${saltKey}`;
    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");
    const checksum = `${sha256}###${saltIndex}`;

    // Call PhonePe's status API
    const url = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
      },
    });

    console.log("PhonePe Status API Response:", response.data);

    // Check response format and payment status
    if (response.data.success && response.data.code === "PAYMENT_SUCCESS") {
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(
      "Payment status check failed:",
      error.response?.data || error.message
    );
    throw new Error("Payment verification failed");
  }
};
