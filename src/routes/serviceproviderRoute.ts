import { Router } from "express";
import {
  createServiceProvider,
  getAllServiceProviders,
  getServiceProviderById,
  updateServiceProvider,
  deleteServiceProvider,
  getServiceProviderLocation,
} from "../controllers/serviceprovider/serviceProviderController";
import upload from "../middleware/upload";
const router = Router();
router.post("/create", upload.single("providerpicture"), createServiceProvider);
router.get("/all", getAllServiceProviders);
router.get("/get/:id", getServiceProviderById);
router.put(
  "/update/:id",
  upload.single("serviceproviderpicture"),
  updateServiceProvider
);
router.delete("/delete/:id", deleteServiceProvider);
router.get("/location/:id", getServiceProviderLocation);

export default router;
