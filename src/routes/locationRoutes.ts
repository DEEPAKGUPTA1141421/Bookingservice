import express from 'express';
import { getAddressCordinate, getDistanceTime, getSeggestion } from '../controllers/locationController';
import { getStatesByCountry, getCitiesByState } from "../controllers/locationController";
import { apiLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.use(apiLimiter);

router.get('/getCordinate',getAddressCordinate)
router.get("/getDistanceTime",getDistanceTime)
router.get("/autocomplete", getSeggestion);
router.get("/states/:countryCode", getStatesByCountry);
router.get("/cities/:countryCode/:stateCode", getCitiesByState);

export default router;
