import express from 'express';
import { getAddressCordinate, getAddressFromCoordinates, getDistanceTime } from '../controllers/locationController';

const router = express.Router();

router.post('/get-address', getAddressFromCoordinates);
router.get('/getCordinate',getAddressCordinate)
router.get("/getDistanceTime",getDistanceTime)

export default router;
