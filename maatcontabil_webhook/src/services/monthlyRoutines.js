import { getPool } from '../db/pool.js';
import { isUuid } from '../utils/ids.js';
import { getCompetenceKey, parseDueDay } from '../utils/routineUtils.js';
import { notifyUsers } from './notifications.js';

export const ensureMonthlyRoutines = async (companyId, obligationIds) => {
    const pool = getPool();
    if (!pool || !companyId || !Array.isArray(obligationIds) || obligationIds.length === 0) return;
    const now = new Date();
    const competence = getCompetenceKey(now);
    const monthKey = String(now.getMonth() + 1);
    const year = now.getFullYear();
    const month = now.getMonth();
    const idValues = obligationIds.filter((item) => isUuid(item));
    const nameValues = obligationIds.filter((item) => !isUuid(item));

    let obligationsRes;
    if (idValues.length > 0 && nameValues.length > 0) {
        obligationsRes = await pool.query(
            `SELECT id, name, department, monthly_due
             FROM obligations
             WHERE id = ANY($1::uuid[]) OR name = ANY($2::text[])`,
            [idValues, nameValues]
        );
    } else if (idValues.length > 0) {
        obligationsRes = await pool.query(
            'SELECT id, name, department, monthly_due FROM obligations WHERE id = ANY($1::uuid[])',
            [idValues]
        );
    } else {
        obligationsRes = await pool.query(
            'SELECT id, name, department, monthly_due FROM obligations WHERE name = ANY($1::text[])',
            [nameValues]
        );
    }

    for (const obligation of obligationsRes.rows) {
        const monthlyDue = obligation.monthly_due || {};
        const dueValue = monthlyDue[monthKey];
        if (!dueValue || String(dueValue).toLowerCase().includes('nao')) continue;
        const day = parseDueDay(dueValue);
        if (!day) continue;
        const deadline = new Date(year, month, day);
        const insertRes = await pool.query(
            `INSERT INTO monthly_routines (id, company_id, obligation_id, obligation_name, department, competence, deadline, status)
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, 'Pendente')
             ON CONFLICT (company_id, obligation_id, competence) DO NOTHING
             RETURNING id`,
            [companyId, obligation.id, obligation.name, obligation.department || null, competence, deadline]
        );
        if (insertRes.rowCount > 0) {
            const adminRes = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
            const adminIds = adminRes.rows.map((row) => row.id);
            await notifyUsers(
                adminIds,
                'Nova obrigacao mensal',
                `Obrigacao ${obligation.name} gerada para a competencia ${competence}.`
            );
        }
    }
};
