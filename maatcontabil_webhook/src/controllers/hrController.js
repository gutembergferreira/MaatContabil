import fs from 'fs';
import path from 'path';
import { getPool } from '../db/pool.js';
import { BASE_DIR } from '../config.js';

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

const buildVacationDue = (startDate) => {
    if (!startDate) return null;
    const base = new Date(startDate);
    if (Number.isNaN(base.getTime())) return null;
    const next = new Date(base);
    next.setFullYear(base.getFullYear() + 1);
    return next.toISOString().slice(0, 10);
};

const upsertEmployeeFromAdmission = async (adm, existingStatus) => {
    const pool = getPool();
    const cpfDigits = normalizeDigits(adm.cpf);
    const fallbackStatus = existingStatus || 'Ativo';
    const admissionDate = adm.expectedStartDate || new Date().toISOString().slice(0, 10);
    const vacationDue = buildVacationDue(admissionDate);
    const employeeId = adm.employeeId || adm.id;

    const query = `
        INSERT INTO employees (
            id, company_id, work_site_id, name, role, admission_date, status, salary, cpf, rg, pis,
            birth_date, birth_city, birth_state, nationality, mother_name, father_name, education_level, gender, marital_status,
            contract_type, weekly_hours, shift, expected_start_date,
            titulo_eleitor, titulo_eleitor_zone, titulo_eleitor_section, ctps, ctps_series, ctps_uf, reservista,
            email, phone,
            address_zip, address_street, address_number, address_complement, address_district, address_city, address_state, address,
            emergency_contact_name, emergency_contact_phone,
            bank_name, bank_agency, bank_account, bank_account_type,
            dependents_count, dependents_notes,
            vacation_due
        )
        VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
            $12,$13,$14,$15,$16,$17,$18,$19,$20,
            $21,$22,$23,$24,
            $25,$26,$27,$28,$29,$30,$31,
            $32,$33,
            $34,$35,$36,$37,$38,$39,$40,$41,
            $42,$43,
            $44,$45,$46,$47,
            $48,$49,
            $50
        )
        ON CONFLICT (id) DO UPDATE SET
            work_site_id = EXCLUDED.work_site_id,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            admission_date = EXCLUDED.admission_date,
            status = EXCLUDED.status,
            salary = EXCLUDED.salary,
            cpf = EXCLUDED.cpf,
            rg = EXCLUDED.rg,
            pis = EXCLUDED.pis,
            birth_date = EXCLUDED.birth_date,
            birth_city = EXCLUDED.birth_city,
            birth_state = EXCLUDED.birth_state,
            nationality = EXCLUDED.nationality,
            mother_name = EXCLUDED.mother_name,
            father_name = EXCLUDED.father_name,
            education_level = EXCLUDED.education_level,
            gender = EXCLUDED.gender,
            marital_status = EXCLUDED.marital_status,
            contract_type = EXCLUDED.contract_type,
            weekly_hours = EXCLUDED.weekly_hours,
            shift = EXCLUDED.shift,
            expected_start_date = EXCLUDED.expected_start_date,
            titulo_eleitor = EXCLUDED.titulo_eleitor,
            titulo_eleitor_zone = EXCLUDED.titulo_eleitor_zone,
            titulo_eleitor_section = EXCLUDED.titulo_eleitor_section,
            ctps = EXCLUDED.ctps,
            ctps_series = EXCLUDED.ctps_series,
            ctps_uf = EXCLUDED.ctps_uf,
            reservista = EXCLUDED.reservista,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            address_zip = EXCLUDED.address_zip,
            address_street = EXCLUDED.address_street,
            address_number = EXCLUDED.address_number,
            address_complement = EXCLUDED.address_complement,
            address_district = EXCLUDED.address_district,
            address_city = EXCLUDED.address_city,
            address_state = EXCLUDED.address_state,
            address = EXCLUDED.address,
            emergency_contact_name = EXCLUDED.emergency_contact_name,
            emergency_contact_phone = EXCLUDED.emergency_contact_phone,
            bank_name = EXCLUDED.bank_name,
            bank_agency = EXCLUDED.bank_agency,
            bank_account = EXCLUDED.bank_account,
            bank_account_type = EXCLUDED.bank_account_type,
            dependents_count = EXCLUDED.dependents_count,
            dependents_notes = EXCLUDED.dependents_notes,
            vacation_due = EXCLUDED.vacation_due,
            updated_at = CURRENT_TIMESTAMP
    `;
    await pool.query(query, [
        employeeId,
        adm.companyId,
        adm.workSiteId || null,
        adm.fullName,
        adm.role || 'Funcionario',
        admissionDate,
        fallbackStatus,
        adm.salary || 0,
        cpfDigits || adm.cpf,
        adm.rg || null,
        adm.pis || null,
        adm.birthDate || null,
        adm.birthCity || null,
        adm.birthState || null,
        adm.nationality || null,
        adm.motherName || null,
        adm.fatherName || null,
        adm.educationLevel || null,
        adm.gender || null,
        adm.maritalStatus || null,
        adm.contractType || null,
        adm.weeklyHours || null,
        adm.shift || null,
        adm.expectedStartDate || null,
        adm.tituloEleitor || null,
        adm.tituloEleitorZone || null,
        adm.tituloEleitorSection || null,
        adm.ctps || null,
        adm.ctpsSeries || null,
        adm.ctpsUf || null,
        adm.reservista || null,
        adm.email || null,
        adm.phone || null,
        adm.addressZip || null,
        adm.addressStreet || null,
        adm.addressNumber || null,
        adm.addressComplement || null,
        adm.addressDistrict || null,
        adm.addressCity || null,
        adm.addressState || null,
        adm.address || null,
        adm.emergencyContactName || null,
        adm.emergencyContactPhone || null,
        adm.bankName || null,
        adm.bankAgency || null,
        adm.bankAccount || null,
        adm.bankAccountType || null,
        adm.dependentsCount || null,
        adm.dependentsNotes || null,
        vacationDue
    ]);
};

export const upsertAdmission = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const {
        id, companyId, clientId, status, fullName, cpf, rg, birthDate, birthCity, birthState, nationality,
        motherName, fatherName, educationLevel, gender, maritalStatus, role, contractType, weeklyHours, shift,
        salary, workSiteId, expectedStartDate, pis, tituloEleitor, tituloEleitorZone, tituloEleitorSection,
        ctps, ctpsSeries, ctpsUf, reservista, email, phone, addressZip, addressStreet, addressNumber,
        addressComplement, addressDistrict, addressCity, addressState, address, emergencyContactName,
        emergencyContactPhone, bankName, bankAgency, bankAccount, bankAccountType, dependentsCount, dependentsNotes
    } = req.body;
    const now = new Date().toISOString();

    try {
        const existing = await pool.query('SELECT id FROM hr_admissions WHERE id = $1', [id]);
        const isNew = existing.rows.length === 0;

        const query = `
            INSERT INTO hr_admissions (
                id, company_id, client_id, status, full_name, cpf, rg, birth_date, birth_city, birth_state,
                nationality, mother_name, father_name, education_level, gender, marital_status, role, contract_type,
                weekly_hours, shift, salary, work_site_id, expected_start_date, pis, titulo_eleitor,
                titulo_eleitor_zone, titulo_eleitor_section, ctps, ctps_series, ctps_uf, reservista, email, phone,
                address_zip, address_street, address_number, address_complement, address_district, address_city,
                address_state, address, emergency_contact_name, emergency_contact_phone, bank_name, bank_agency,
                bank_account, bank_account_type, dependents_count, dependents_notes
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18,
                $19, $20, $21, $22, $23, $24, $25,
                $26, $27, $28, $29, $30, $31, $32, $33,
                $34, $35, $36, $37, $38, $39,
                $40, $41, $42, $43, $44, $45,
                $46, $47, $48, $49
            )
            ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            full_name = EXCLUDED.full_name,
            cpf = EXCLUDED.cpf,
            rg = EXCLUDED.rg,
            birth_date = EXCLUDED.birth_date,
            birth_city = EXCLUDED.birth_city,
            birth_state = EXCLUDED.birth_state,
            nationality = EXCLUDED.nationality,
            mother_name = EXCLUDED.mother_name,
            father_name = EXCLUDED.father_name,
            education_level = EXCLUDED.education_level,
            gender = EXCLUDED.gender,
            marital_status = EXCLUDED.marital_status,
            role = EXCLUDED.role,
            contract_type = EXCLUDED.contract_type,
            weekly_hours = EXCLUDED.weekly_hours,
            shift = EXCLUDED.shift,
            salary = EXCLUDED.salary,
            work_site_id = EXCLUDED.work_site_id,
            expected_start_date = EXCLUDED.expected_start_date,
            pis = EXCLUDED.pis,
            titulo_eleitor = EXCLUDED.titulo_eleitor,
            titulo_eleitor_zone = EXCLUDED.titulo_eleitor_zone,
            titulo_eleitor_section = EXCLUDED.titulo_eleitor_section,
            ctps = EXCLUDED.ctps,
            ctps_series = EXCLUDED.ctps_series,
            ctps_uf = EXCLUDED.ctps_uf,
            reservista = EXCLUDED.reservista,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            address_zip = EXCLUDED.address_zip,
            address_street = EXCLUDED.address_street,
            address_number = EXCLUDED.address_number,
            address_complement = EXCLUDED.address_complement,
            address_district = EXCLUDED.address_district,
            address_city = EXCLUDED.address_city,
            address_state = EXCLUDED.address_state,
            address = EXCLUDED.address,
            emergency_contact_name = EXCLUDED.emergency_contact_name,
            emergency_contact_phone = EXCLUDED.emergency_contact_phone,
            bank_name = EXCLUDED.bank_name,
            bank_agency = EXCLUDED.bank_agency,
            bank_account = EXCLUDED.bank_account,
            bank_account_type = EXCLUDED.bank_account_type,
            dependents_count = EXCLUDED.dependents_count,
            dependents_notes = EXCLUDED.dependents_notes,
            updated_at = CURRENT_TIMESTAMP
        `;
        await pool.query(query, [
            id, companyId, clientId, status, fullName, cpf, rg, birthDate, birthCity, birthState,
            nationality, motherName, fatherName, educationLevel, gender, maritalStatus, role, contractType,
            weeklyHours, shift, salary, workSiteId, expectedStartDate, pis, tituloEleitor,
            tituloEleitorZone, tituloEleitorSection, ctps, ctpsSeries, ctpsUf, reservista, email, phone,
            addressZip, addressStreet, addressNumber, addressComplement, addressDistrict, addressCity, addressState,
            address, emergencyContactName, emergencyContactPhone, bankName, bankAgency, bankAccount, bankAccountType,
            dependentsCount, dependentsNotes
        ]);

        if (status === 'Validado' || status === 'Finalizado') {
            const cpfDigits = normalizeDigits(cpf);
            const employeeLookup = await pool.query(
                `SELECT id, status FROM employees WHERE regexp_replace(cpf, '\\D', '', 'g') = $1 LIMIT 1`,
                [cpfDigits]
            );
            const existingEmployee = employeeLookup.rows[0];
            await upsertEmployeeFromAdmission(
                {
                    id,
                    employeeId: existingEmployee?.id,
                    companyId,
                    workSiteId,
                    fullName,
                    role,
                    expectedStartDate,
                    salary,
                    cpf,
                    rg,
                    pis,
                    birthDate,
                    birthCity,
                    birthState,
                    nationality,
                    motherName,
                    fatherName,
                    educationLevel,
                    gender,
                    maritalStatus,
                    contractType,
                    weeklyHours,
                    shift,
                    tituloEleitor,
                    tituloEleitorZone,
                    tituloEleitorSection,
                    ctps,
                    ctpsSeries,
                    ctpsUf,
                    reservista,
                    email,
                    phone,
                    addressZip,
                    addressStreet,
                    addressNumber,
                    addressComplement,
                    addressDistrict,
                    addressCity,
                    addressState,
                    address,
                    emergencyContactName,
                    emergencyContactPhone,
                    bankName,
                    bankAgency,
                    bankAccount,
                    bankAccountType,
                    dependentsCount,
                    dependentsNotes
                },
                existingEmployee?.status
            );
        }

        if (isNew) {
            const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
            for (const admin of admins.rows) {
                await pool.query(
                    'INSERT INTO notifications (id, user_id, title, message, is_read, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, false, $4)',
                    [admin.id, 'Nova admissao', `Nova solicitacao de admissao para ${fullName}.`, now]
                );
            }
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const upsertHrRequest = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, employeeId, companyId, clientId, type, status, details } = req.body;
    try {
        const query = `
            INSERT INTO hr_requests (id, employee_id, company_id, client_id, type, status, details)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, details = EXCLUDED.details, updated_at = CURRENT_TIMESTAMP
        `;
        await pool.query(query, [id, employeeId, companyId, clientId, type, status, details]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const upsertHrFeedback = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, targetId, fieldName, message, resolved } = req.body;
    try {
        const query = `
            INSERT INTO hr_field_feedback (id, target_id, field_name, message, resolved)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET resolved = EXCLUDED.resolved
        `;
        await pool.query(query, [id, targetId, fieldName, message, resolved]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const createWorksite = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, companyId, name, description } = req.body;
    try {
        await pool.query('INSERT INTO work_sites (id, company_id, name, description) VALUES ($1, $2, $3, $4)', [id, companyId, name, description]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const upsertEmployee = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const {
        id, companyId, workSiteId, name, role, admissionDate, status, salary, cpf, rg, pis,
        birthDate, birthCity, birthState, nationality, motherName, fatherName, educationLevel, gender, maritalStatus,
        contractType, weeklyHours, shift, expectedStartDate,
        tituloEleitor, tituloEleitorZone, tituloEleitorSection, ctps, ctpsSeries, ctpsUf, reservista,
        email, phone,
        addressZip, addressStreet, addressNumber, addressComplement, addressDistrict, addressCity, addressState, address,
        emergencyContactName, emergencyContactPhone,
        bankName, bankAgency, bankAccount, bankAccountType,
        dependentsCount, dependentsNotes,
        vacationDue
    } = req.body;
    try {
        const query = `
            INSERT INTO employees (
                id, company_id, work_site_id, name, role, admission_date, status, salary, cpf, rg, pis,
                birth_date, birth_city, birth_state, nationality, mother_name, father_name, education_level, gender, marital_status,
                contract_type, weekly_hours, shift, expected_start_date,
                titulo_eleitor, titulo_eleitor_zone, titulo_eleitor_section, ctps, ctps_series, ctps_uf, reservista,
                email, phone,
                address_zip, address_street, address_number, address_complement, address_district, address_city, address_state, address,
                emergency_contact_name, emergency_contact_phone,
                bank_name, bank_agency, bank_account, bank_account_type,
                dependents_count, dependents_notes,
                vacation_due
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
                $12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,
                $25,$26,$27,$28,$29,$30,$31,
                $32,$33,
                $34,$35,$36,$37,$38,$39,$40,$41,
                $42,$43,
                $44,$45,$46,$47,
                $48,$49,
                $50
            )
            ON CONFLICT (id) DO UPDATE SET
                work_site_id = EXCLUDED.work_site_id,
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                admission_date = EXCLUDED.admission_date,
                status = EXCLUDED.status,
                salary = EXCLUDED.salary,
                cpf = EXCLUDED.cpf,
                rg = EXCLUDED.rg,
                pis = EXCLUDED.pis,
                birth_date = EXCLUDED.birth_date,
                birth_city = EXCLUDED.birth_city,
                birth_state = EXCLUDED.birth_state,
                nationality = EXCLUDED.nationality,
                mother_name = EXCLUDED.mother_name,
                father_name = EXCLUDED.father_name,
                education_level = EXCLUDED.education_level,
                gender = EXCLUDED.gender,
                marital_status = EXCLUDED.marital_status,
                contract_type = EXCLUDED.contract_type,
                weekly_hours = EXCLUDED.weekly_hours,
                shift = EXCLUDED.shift,
                expected_start_date = EXCLUDED.expected_start_date,
                titulo_eleitor = EXCLUDED.titulo_eleitor,
                titulo_eleitor_zone = EXCLUDED.titulo_eleitor_zone,
                titulo_eleitor_section = EXCLUDED.titulo_eleitor_section,
                ctps = EXCLUDED.ctps,
                ctps_series = EXCLUDED.ctps_series,
                ctps_uf = EXCLUDED.ctps_uf,
                reservista = EXCLUDED.reservista,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                address_zip = EXCLUDED.address_zip,
                address_street = EXCLUDED.address_street,
                address_number = EXCLUDED.address_number,
                address_complement = EXCLUDED.address_complement,
                address_district = EXCLUDED.address_district,
                address_city = EXCLUDED.address_city,
                address_state = EXCLUDED.address_state,
                address = EXCLUDED.address,
                emergency_contact_name = EXCLUDED.emergency_contact_name,
                emergency_contact_phone = EXCLUDED.emergency_contact_phone,
                bank_name = EXCLUDED.bank_name,
                bank_agency = EXCLUDED.bank_agency,
                bank_account = EXCLUDED.bank_account,
                bank_account_type = EXCLUDED.bank_account_type,
                dependents_count = EXCLUDED.dependents_count,
                dependents_notes = EXCLUDED.dependents_notes,
                vacation_due = EXCLUDED.vacation_due,
                updated_at = CURRENT_TIMESTAMP
        `;
        await pool.query(query, [
            id, companyId, workSiteId, name, role, admissionDate, status, salary, cpf, rg, pis,
            birthDate, birthCity, birthState, nationality, motherName, fatherName, educationLevel, gender, maritalStatus,
            contractType, weeklyHours, shift, expectedStartDate,
            tituloEleitor, tituloEleitorZone, tituloEleitorSection, ctps, ctpsSeries, ctpsUf, reservista,
            email, phone,
            addressZip, addressStreet, addressNumber, addressComplement, addressDistrict, addressCity, addressState, address,
            emergencyContactName, emergencyContactPhone,
            bankName, bankAgency, bankAccount, bankAccountType,
            dependentsCount, dependentsNotes,
            vacationDue
        ]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const upsertTimeSheet = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, employeeId, companyId, periodStart, periodEnd, status, approvedBy, approvedAt, signedAt } = req.body;
    try {
        await pool.query(
            `INSERT INTO time_sheets (id, employee_id, company_id, period_start, period_end, status, approved_by, approved_at, signed_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (id) DO UPDATE SET
                period_start = EXCLUDED.period_start,
                period_end = EXCLUDED.period_end,
                status = EXCLUDED.status,
                approved_by = EXCLUDED.approved_by,
                approved_at = EXCLUDED.approved_at,
                signed_at = EXCLUDED.signed_at,
                updated_at = CURRENT_TIMESTAMP`,
            [id, employeeId, companyId, periodStart, periodEnd, status, approvedBy || null, approvedAt || null, signedAt || null]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const upsertTimeEntry = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, timeSheetId, entryDate, schedule, workHours, punches, situations, notes } = req.body;
    try {
        await pool.query(
            `INSERT INTO time_entries (id, time_sheet_id, entry_date, schedule, work_hours, punches, situations, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (id) DO UPDATE SET
                schedule = EXCLUDED.schedule,
                work_hours = EXCLUDED.work_hours,
                punches = EXCLUDED.punches,
                situations = EXCLUDED.situations,
                notes = EXCLUDED.notes,
                updated_at = CURRENT_TIMESTAMP`,
            [id, timeSheetId, entryDate, schedule || null, workHours || null, JSON.stringify(punches || []), JSON.stringify(situations || []), notes || null]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const addTimeComment = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, timeEntryId, authorId, authorRole, message, createdAt } = req.body;
    try {
        await pool.query(
            `INSERT INTO time_comments (id, time_entry_id, author_id, author_role, message, created_at)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, timeEntryId, authorId, authorRole, message || '', createdAt || new Date().toISOString()]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const approveTimeSheet = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { timeSheetId, approvedBy } = req.body;
    try {
        await pool.query(
            `UPDATE time_sheets SET status = 'Aprovado', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [approvedBy || null, timeSheetId]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const signTimeSheet = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { timeSheetId } = req.body;
    try {
        await pool.query(
            `UPDATE time_sheets SET status = 'Assinado', signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [timeSheetId]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const upsertPayroll = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, employeeId, companyId, competence, status } = req.body;
    try {
        await pool.query(
            `INSERT INTO payrolls (id, employee_id, company_id, competence, status)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (id) DO UPDATE SET
                competence = EXCLUDED.competence,
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP`,
            [id, employeeId, companyId, competence, status || 'Disponivel']
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const uploadHrAttachment = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id, entityType, entityId, uploadedBy, name } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Arquivo nŽŸo enviado.' });
    try {
        const fileUrl = `/uploads/${req.file.filename}`;
        const fileName = name || req.file.originalname;
        const query = `
            INSERT INTO request_attachments (id, entity_type, entity_id, file_name, file_url, uploaded_by)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(query, [id, entityType, entityId, fileName, fileUrl, uploadedBy || null]);
        res.json({
            success: true,
            attachment: {
                id,
                entityType,
                entityId,
                name: fileName,
                url: fileUrl,
                uploadedBy,
                createdAt: new Date().toISOString()
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const getHrAttachmentFile = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT file_url as url, file_name as name FROM request_attachments WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Arquivo nÇœo encontrado' });
        const { url, name } = result.rows[0];
        const safeUrl = typeof url === 'string' ? url.replace(/^\/+/, '') : '';
        const filePath = path.join(BASE_DIR, safeUrl);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo nÇœo encontrado' });
        res.setHeader('Content-Disposition', `inline; filename="${name || 'arquivo'}"`);
        return res.sendFile(filePath);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
