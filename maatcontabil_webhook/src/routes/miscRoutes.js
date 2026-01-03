import express from 'express';
import fs from 'fs';
import multer from 'multer';
import { CERTS_DIR } from '../config.js';
import { getCep, createPix, uploadCert, createPresignedUpload } from '../controllers/miscController.js';

const router = express.Router();

if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
}
const upload = multer({ dest: CERTS_DIR });

router.get('/cep/:cep', getCep);
router.post('/pix', createPix);
router.post('/upload-cert', upload.fields([{ name: 'crt' }, { name: 'key' }]), uploadCert);
router.post('/uploads/presign', createPresignedUpload);

export default router;
