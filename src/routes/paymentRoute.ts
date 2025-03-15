import express from "express";
import { checkStatusPayment, getTranscationStatus, HandleCallbackByPhonePay, Initiatepayment } from "../controllers/paymentController";
import { isAuthenticated } from "../middleware/authorised";
const router = express.Router();

router.post("/pay",isAuthenticated, Initiatepayment);
router.post("/payment/callback", HandleCallbackByPhonePay);
//router.get("/payment/status/:transactionId", getTranscationStatus);
router.get("/status/:transactionId", checkStatusPayment);

export default router;
