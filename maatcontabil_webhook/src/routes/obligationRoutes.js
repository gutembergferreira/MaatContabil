import express from 'express';
import { upsertObligation, deleteObligation } from '../controllers/obligationController.js';

const router = express.Router();

router.post('/obligations', upsertObligation);
router.delete('/obligations/:id', deleteObligation);

export default router;
