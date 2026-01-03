import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';

import { UPLOADS_DIR } from './config.js';
import swaggerUi from 'swagger-ui-express';
import { rateLimit } from './middlewares/rateLimit.js';
import { authMiddleware } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { openApiSpec } from './docs/openapi.js';

import setupRoutes from './routes/setupRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import obligationRoutes from './routes/obligationRoutes.js';
import monthlyRoutineRoutes from './routes/monthlyRoutineRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import authRoutes from './routes/authRoutes.js';
import miscRoutes from './routes/miscRoutes.js';

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', rateLimit());
app.use('/api', authMiddleware);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use('/api', authRoutes);
app.use('/api', setupRoutes);
app.use('/api', syncRoutes);
app.use('/api', notificationRoutes);
app.use('/api', companyRoutes);
app.use('/api', obligationRoutes);
app.use('/api', monthlyRoutineRoutes);
app.use('/api', hrRoutes);
app.use('/api', miscRoutes);

app.use(errorHandler);

export default app;
