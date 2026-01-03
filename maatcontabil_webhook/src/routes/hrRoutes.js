import express from 'express';
import multer from 'multer';
import { UPLOADS_DIR } from '../config.js';
import {
    upsertAdmission,
    upsertHrRequest,
    upsertHrFeedback,
    createWorksite,
    upsertEmployee,
    upsertTimeSheet,
    upsertTimeEntry,
    addTimeComment,
    approveTimeSheet,
    signTimeSheet,
    upsertPayroll,
    uploadHrAttachment,
    getHrAttachmentFile
} from '../controllers/hrController.js';

const router = express.Router();

const hrUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOADS_DIR),
        filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
    })
});

router.post('/hr/admission', upsertAdmission);
router.post('/hr/request', upsertHrRequest);
router.post('/hr/feedback', upsertHrFeedback);
router.post('/hr/worksite', createWorksite);
router.post('/hr/employee', upsertEmployee);
router.post('/hr/time-sheet', upsertTimeSheet);
router.post('/hr/time-entry', upsertTimeEntry);
router.post('/hr/time-comment', addTimeComment);
router.post('/hr/time-approve', approveTimeSheet);
router.post('/hr/time-sign', signTimeSheet);
router.post('/hr/payroll', upsertPayroll);
router.post('/hr/attachment', hrUpload.single('file'), uploadHrAttachment);
router.get('/hr/attachment/file/:id', getHrAttachmentFile);

export default router;
