import { getPool } from '../db/pool.js';
import { isUuid } from '../utils/ids.js';

export const upsertObligation = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const {
        id, name, nickname, department, responsible, expectedMinutes,
        monthlyDue, reminderDays, reminderType, nonBusinessRule, saturdayBusiness,
        competenceRule, requiresRobot, hasFine, alertGuide, active
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing obligation name' });
    const safeId = isUuid(id) ? id : null;
    try {
        const query = `
            INSERT INTO obligations (
                id, name, nickname, department, responsible, expected_minutes,
                monthly_due, reminder_days, reminder_type, non_business_rule, saturday_business,
                competence_rule, requires_robot, has_fine, alert_guide, active
            )
            VALUES (
                COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                nickname = EXCLUDED.nickname,
                department = EXCLUDED.department,
                responsible = EXCLUDED.responsible,
                expected_minutes = EXCLUDED.expected_minutes,
                monthly_due = EXCLUDED.monthly_due,
                reminder_days = EXCLUDED.reminder_days,
                reminder_type = EXCLUDED.reminder_type,
                non_business_rule = EXCLUDED.non_business_rule,
                saturday_business = EXCLUDED.saturday_business,
                competence_rule = EXCLUDED.competence_rule,
                requires_robot = EXCLUDED.requires_robot,
                has_fine = EXCLUDED.has_fine,
                alert_guide = EXCLUDED.alert_guide,
                active = EXCLUDED.active,
                updated_at = CURRENT_TIMESTAMP
        `;
        await pool.query(query, [
            safeId,
            name,
            nickname || null,
            department || null,
            responsible || null,
            expectedMinutes || null,
            monthlyDue ? JSON.stringify(monthlyDue) : null,
            reminderDays || null,
            reminderType || null,
            nonBusinessRule || null,
            saturdayBusiness === true,
            competenceRule || null,
            requiresRobot === true,
            hasFine === true,
            alertGuide !== false,
            active !== false
        ]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteObligation = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM obligations WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
