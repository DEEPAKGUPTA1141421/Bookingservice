import { Router } from "express";
import {
  createServiceProvider,
  getAllServiceProviders,
  getServiceProviderById,
  updateServiceProvider,
  deleteServiceProvider,
  getServiceProviderLocation,
  createAvailability,
  updateAvailability,
  reachedAtUserLocation,
  getProvidersWithinRadius,
} from "../controllers/serviceprovider/serviceProviderController";
import upload from "../middleware/upload";
import { isAuthenticated } from "../middleware/authorised";
const router = Router();
router.post("/create", upload.single("providerpicture"), createServiceProvider);
router.get("/all",isAuthenticated, getAllServiceProviders);
router.get("/get/:id",isAuthenticated, getServiceProviderById);
router.put(
  "/update/:id",
  isAuthenticated,
  upload.single("serviceproviderpicture"),
  updateServiceProvider
);
router.delete("/delete/:id",isAuthenticated, deleteServiceProvider);
router.get("/location/:id",isAuthenticated, getServiceProviderLocation);

router.post("/create-availibility", createAvailability);
router.put("/update-availibility", updateAvailability);

router.post("/otpverification", isAuthenticated, reachedAtUserLocation);

router.post("/get-providers-within-radius", getProvidersWithinRadius);

export default router;
