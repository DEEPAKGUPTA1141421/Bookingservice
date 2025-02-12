import express from "express";
import { findProviders } from "../controllers/findLocation";

const router = express.Router();

router.get("/find", findProviders);

export default router;
