import express from 'express';
import { sync } from '../controllers/syncController.js';

const router = express.Router();

router.get('/sync', sync);

export default router;
