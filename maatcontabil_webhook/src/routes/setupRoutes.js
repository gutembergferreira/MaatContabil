import express from 'express';
import { setupDb, status, getAppSettings, setAppSettings, getDbConfig } from '../controllers/setupController.js';

const router = express.Router();

router.post('/setup-db', setupDb);
router.get('/status', status);
router.get('/app-settings', getAppSettings);
router.post('/app-settings', setAppSettings);
router.get('/db-config', getDbConfig);

export default router;
