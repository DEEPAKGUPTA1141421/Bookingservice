import express from 'express';
import { getAddressFromCoordinates } from '../controllers/locationController';

const router = express.Router();

router.post('/get-address', getAddressFromCoordinates);

export default router;
