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
router.get("/all", getAllServiceProviders);
router.get("/get",isAuthenticated, getServiceProviderById);
router.put(
  "/update",
  isAuthenticated,
  upload.single("serviceproviderpicture"),
  updateServiceProvider
);
router.delete("/delete/:id",isAuthenticated, deleteServiceProvider);
router.get("/location/:id",isAuthenticated, getServiceProviderLocation);

router.post("/create-availibility",isAuthenticated, createAvailability);
router.put("/update-availibility",isAuthenticated, updateAvailability);

router.post("/otpverification", isAuthenticated, reachedAtUserLocation);

router.post("/get-providers-within-radius", getProvidersWithinRadius);

export default router;
