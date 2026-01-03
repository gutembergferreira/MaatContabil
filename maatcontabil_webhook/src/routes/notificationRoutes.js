import express from 'express';
import { markRead, upsertNotifications, updateNotification, deleteNotification } from '../controllers/notificationController.js';

const router = express.Router();

router.post('/notifications/read', markRead);
router.post('/notifications', upsertNotifications);
router.put('/notifications/:id', updateNotification);
router.delete('/notifications/:id', deleteNotification);

export default router;
