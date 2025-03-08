import express from 'express';
import { getAddressCordinate, getDistanceTime, getSeggestion } from '../controllers/locationController';
import { getStatesByCountry, getCitiesByState } from "../controllers/locationController";
import { authorizeRoles, isAuthenticated } from '../middleware/authorised';

const router = express.Router();

router.get("/getCordinate",getAddressCordinate);
router.get("/getDistanceTime",isAuthenticated,authorizeRoles("user"),getDistanceTime)
router.post("/autocomplete", getSeggestion);
router.get("/states/:countryCode", getStatesByCountry);
router.get("/cities/:countryCode/:stateCode", getCitiesByState);

export default router;
