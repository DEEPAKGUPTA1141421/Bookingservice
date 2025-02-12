import express from "express";
import { createServiceProvider, getAllServiceProviders, getServiceProviderById, updateServiceProvider, deleteServiceProvider } from "../controllers/serviceprovider/serviceProviderController";
import upload from "../middleware/upload";

const router = express.Router();

router.post("/create", upload.single("providerpicture"),  createServiceProvider);
router.get("/all", getAllServiceProviders);
router.get("/get/:id", getServiceProviderById);
router.put(
  "/update/:id",
  upload.single("serviceproviderpicture"),
  updateServiceProvider
);
router.delete("/delete/:id", deleteServiceProvider);

export default router;
