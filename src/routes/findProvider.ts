import express from "express";
import { findProviders } from "../controllers/findLocation";
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";

const router = express.Router();

router.get("/find", isAuthenticated, authorizeRoles("user","admin"), findProviders);

export default router;
