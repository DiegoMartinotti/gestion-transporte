import express from 'express';
const router = express.Router();
import { geocode } from '../controllers/proxyController';

router.get('/geocode', geocode);

export default router;