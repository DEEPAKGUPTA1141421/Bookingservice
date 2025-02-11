import express from 'express';
import { getAddressCordinate, getAddressFromCoordinates, getDistanceTime } from '../controllers/locationController';
import { getStatesByCountry, getCitiesByState } from "../controllers/locationController";

const router = express.Router();

router.post('/get-address', getAddressFromCoordinates);
router.get('/getCordinate',getAddressCordinate)
router.get("/getDistanceTime",getDistanceTime)

router.get("/states/:countryCode", getStatesByCountry);
router.get("/cities/:countryCode/:stateCode", getCitiesByState);

export default router;
