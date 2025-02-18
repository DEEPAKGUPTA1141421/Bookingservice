import express from "express";
import { getTranscationStatus, HandleCallbackByPhonePay, Initiatepayment } from "../controllers/paymentController";
const router = express.Router();

router.post("/pay", Initiatepayment);
router.post("/payment/callback", HandleCallbackByPhonePay);
router.get("/payment/status/:transactionId", getTranscationStatus);

export default router;
