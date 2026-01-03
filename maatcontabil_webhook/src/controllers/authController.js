import { getPool } from '../db/pool.js';
import { createToken } from '../services/tokenStore.js';

export const login = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ message: 'DB Disconnected' });
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT id, full_name as name, email, role, company_id as "companyId", cpf FROM users WHERE email = $1 AND password_hash = $2', [email, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const token = createToken(user);
            return res.json({ success: true, user, token });
        }

        const cpfDigits = String(email || '').replace(/\D/g, '');
        if (cpfDigits.length >= 11) {
            const employeeRes = await pool.query(
                `SELECT e.id, e.company_id as "companyId", e.name, e.cpf, e.status,
                        COALESCE(e.birth_date, a.birth_date) as "birthDate",
                        to_char(COALESCE(e.birth_date, a.birth_date), 'DDMMYYYY') as "birthDateBr",
                        to_char(COALESCE(e.birth_date, a.birth_date), 'YYYYMMDD') as "birthDateIso"
                 FROM employees e
                 LEFT JOIN hr_admissions a ON regexp_replace(a.cpf, '\\D', '', 'g') = regexp_replace(e.cpf, '\\D', '', 'g')
                 WHERE regexp_replace(e.cpf, '\\D', '', 'g') = $1
                   AND e.status NOT IN ('Inativo', 'Desligado')
                 ORDER BY e.updated_at DESC NULLS LAST
                 LIMIT 1`,
                [cpfDigits]
            );
            if (employeeRes.rows.length > 0) {
                const employee = employeeRes.rows[0];
                const passDigits = String(password || '').replace(/\D/g, '');
                const birthDigits = String(employee.birthDate || '').replace(/\D/g, '');
                const birthBr = String(employee.birthDateBr || '').replace(/\D/g, '');
                const birthIso = String(employee.birthDateIso || '').replace(/\D/g, '');
                const isBirthMatch = passDigits && (
                    passDigits === birthDigits ||
                    passDigits === birthBr ||
                    passDigits === birthIso
                );
                if (isBirthMatch && employee.status !== 'Desligado' && employee.status !== 'Inativo') {
                    const user = {
                        id: employee.id,
                        name: employee.name,
                        email: '',
                        role: 'employee',
                        companyId: employee.companyId,
                        cpf: employee.cpf,
                        employeeId: employee.id
                    };
                    const token = createToken(user);
                    return res.json({ success: true, user, token });
                }
            }
        }

        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
