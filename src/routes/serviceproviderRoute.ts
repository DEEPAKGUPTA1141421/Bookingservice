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
  getTimingSlots,
  getAllLiveAndPastBookings,
  genericOptions,
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

router.post("/get-all-bookings", isAuthenticated, getAllLiveAndPastBookings);
router.delete("/delete/:id",isAuthenticated, deleteServiceProvider);
router.get("/location/:id",isAuthenticated, getServiceProviderLocation);

router.post("/create-availibility",isAuthenticated, createAvailability);
router.put("/update-availibility",isAuthenticated, updateAvailability);

router.post("/otpverification", isAuthenticated, reachedAtUserLocation);

router.post("/get-providers-within-radius", getProvidersWithinRadius);

router.post("/get-slots", getTimingSlots);
router.get("/generic-options",isAuthenticated, genericOptions);

export default router;
