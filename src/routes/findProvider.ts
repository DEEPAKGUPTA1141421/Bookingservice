import express from "express";
import { findProviders } from "../controllers/findLocation";
import { apiLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.use(apiLimiter);

router.get("/find", findProviders);

export default router;
