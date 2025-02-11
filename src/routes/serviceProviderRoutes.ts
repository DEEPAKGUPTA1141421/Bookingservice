import express from "express";
import { createServiceProvider, getAllServiceProviders, getServiceProviderById, updateServiceProvider, deleteServiceProvider } from "../controllers/serviceprovider/serviceProviderController";

const router = express.Router();

router.post("/create", createServiceProvider);
router.get("/all", getAllServiceProviders);
router.get("/get/:id", getServiceProviderById);
router.put("/update/:id", updateServiceProvider);
router.delete("/delete/:id", deleteServiceProvider);

export default router;
