import express from 'express';
import { getAddressCordinate, getDistanceTime, getSeggestion } from '../controllers/locationController';
import { getStatesByCountry, getCitiesByState } from "../controllers/locationController";

const router = express.Router();

router.get('/getCordinate',getAddressCordinate)
router.get("/getDistanceTime",getDistanceTime)
router.get("/autocomplete", getSeggestion);
router.get("/states/:countryCode", getStatesByCountry);
router.get("/cities/:countryCode/:stateCode", getCitiesByState);

export default router;
