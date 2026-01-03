import express from 'express';
import multer from 'multer';
import { UPLOADS_DIR } from '../config.js';
import { updateMonthlyRoutine, uploadMonthlyRoutineAttachment } from '../controllers/monthlyRoutineController.js';

const router = express.Router();

const hrUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOADS_DIR),
        filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
    })
});

router.post('/monthly-routines', updateMonthlyRoutine);
router.post('/monthly-routines/attachment', hrUpload.single('file'), uploadMonthlyRoutineAttachment);

export default router;
