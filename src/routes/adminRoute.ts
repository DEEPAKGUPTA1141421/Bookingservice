import express from "express";
import upload from "../middleware/upload";
import { createCategory } from "../controllers/adminController";

const router = express.Router();

router.post("/create-category",upload.array("categoryImages"),createCategory);

export default router;
