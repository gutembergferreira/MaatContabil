import express from 'express';
import { upsertCompany, deleteCompany } from '../controllers/companyController.js';

const router = express.Router();

router.post('/company', upsertCompany);
router.delete('/company/:id', deleteCompany);

export default router;
