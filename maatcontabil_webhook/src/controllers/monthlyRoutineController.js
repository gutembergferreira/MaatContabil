import { getPool } from '../db/pool.js';
import { notifyUsers } from '../services/notifications.js';

export const updateMonthlyRoutine = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Missing routine data' });
    try {
        await pool.query(
            `UPDATE monthly_routines SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [status, id]
        );
        const routineRes = await pool.query(
            `SELECT mr.company_id as "companyId", mr.obligation_name as "obligationName", mr.competence, c.name as "companyName"
             FROM monthly_routines mr
             LEFT JOIN companies c ON c.id = mr.company_id
             WHERE mr.id = $1`,
            [id]
        );
        if (routineRes.rows.length > 0) {
            const routine = routineRes.rows[0];
            const clientRes = await pool.query(
                `SELECT id FROM users WHERE role = 'client' AND company_id = $1`,
                [routine.companyId]
            );
            const adminRes = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
            const clientIds = clientRes.rows.map((row) => row.id);
            const adminIds = adminRes.rows.map((row) => row.id);
            const message = `Obrigacao ${routine.obligationName} (${routine.companyName || 'Empresa'}) - ${routine.competence}: ${status}.`;
            await notifyUsers([...clientIds, ...adminIds], 'Status de obrigacao atualizado', message);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const uploadMonthlyRoutineAttachment = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { routineId, companyId, category, title, referenceDate } = req.body;
    if (!routineId || !category) return res.status(400).json({ error: 'Missing routine or category' });
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado.' });
    try {
        const routineRes = await pool.query(
            'SELECT obligation_name as "obligationName", competence, company_id as "companyId" FROM monthly_routines WHERE id = $1',
            [routineId]
        );
        const routine = routineRes.rows[0] || {};
        const effectiveCompanyId = companyId || routine.companyId;
        const fileUrl = `/uploads/${req.file.filename}`;
        const fileName = req.file.originalname;
        const docTitle = title || `${routine.obligationName || 'Obrigacao'} - ${routine.competence || ''}`.trim();
        const docDate = referenceDate || new Date().toISOString().split('T')[0];

        const docQuery = `
            INSERT INTO documents (
                id, title, category, reference_date, file_url, status, payment_status, amount, competence, company_id, request_id
            )
            VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, 'Enviado', 'N/A', NULL, $5, $6, NULL
            )
        `;
        await pool.query(docQuery, [
            docTitle,
            category,
            docDate,
            fileUrl,
            routine.competence || null,
            effectiveCompanyId
        ]);

        const attachQuery = `
            INSERT INTO request_attachments (id, entity_type, entity_id, file_name, file_url, uploaded_by)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
            RETURNING id
        `;
        const attachResult = await pool.query(attachQuery, [
            'monthly_routine',
            routineId,
            fileName,
            fileUrl,
            null
        ]);

        res.json({
            success: true,
            attachment: {
                id: attachResult.rows[0]?.id,
                entityType: 'monthly_routine',
                entityId: routineId,
                name: fileName,
                url: fileUrl
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
