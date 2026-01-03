import { safeQuery } from '../utils/safeQuery.js';
import { getPool } from '../db/pool.js';

export const sync = async (req, res) => {
    if (!getPool()) return res.status(500).json({ error: 'DB not connected' });
    try {
        const companies = await safeQuery(`SELECT id,
            COALESCE(NULLIF(name, ''), legal_name, trade_name) as name,
            cnpj,
            address,
            COALESCE(NULLIF(contact_info, ''), phones) as contact,
            legal_name as "legalName",
            trade_name as "tradeName",
            nickname,
            active,
            tax_regime as "taxRegime",
            company_group as "companyGroup",
            honorarium,
            company_code as "companyCode",
            address_street as "addressStreet",
            address_number as "addressNumber",
            address_complement as "addressComplement",
            address_zip as "addressZip",
            address_district as "addressDistrict",
            address_city as "addressCity",
            address_state as "addressState",
            state_registration as "stateRegistration",
            state_registration_date as "stateRegistrationDate",
            state_registration_uf as "stateRegistrationUf",
            state_exempt as "stateExempt",
            nire,
            other_identifiers as "otherIdentifiers",
            phones,
            website,
            municipal_registration as "municipalRegistration",
            municipal_registration_date as "municipalRegistrationDate",
            notes,
            tags,
            contacts,
            obligations
            FROM companies`);
        const users = await safeQuery('SELECT id, full_name as name, email, password_hash as password, role, company_id as "companyId", cpf, photo_url as "photoUrl" FROM users');
        const reqTypes = await safeQuery('SELECT id, name, base_price as price FROM request_types');
        const docCats = await safeQuery('SELECT name FROM document_categories WHERE active = true');
        const requests = await safeQuery('SELECT sr.*, rt.name as type FROM service_requests sr LEFT JOIN request_types rt ON sr.request_type_id = rt.id');
        const attachments = await safeQuery('SELECT id, entity_type as "entityType", entity_id as "entityId", file_name as name, file_url as url, uploaded_by as "uploadedBy", created_at as "createdAt" FROM request_attachments');
        const documents = await safeQuery(`SELECT id,
            title,
            category,
            reference_date as date,
            file_url as url,
            status,
            payment_status as "paymentStatus",
            amount,
            competence,
            company_id as "companyId",
            request_id as "requestId",
            created_at as "createdAt"
            FROM documents`);
        const chat = await safeQuery('SELECT entity_id as "entityId", sender_name as sender, role, message as text, created_at as timestamp FROM chat_messages');
        const notifs = await safeQuery('SELECT id, user_id as "userId", title, message, is_read as read, created_at as timestamp FROM notifications');
        const obligations = await safeQuery(`SELECT id,
            name,
            nickname,
            department,
            responsible,
            expected_minutes as "expectedMinutes",
            monthly_due as "monthlyDue",
            reminder_days as "reminderDays",
            reminder_type as "reminderType",
            non_business_rule as "nonBusinessRule",
            saturday_business as "saturdayBusiness",
            competence_rule as "competenceRule",
            requires_robot as "requiresRobot",
            has_fine as "hasFine",
            alert_guide as "alertGuide",
            active
            FROM obligations
            ORDER BY name`);
        const routines = await safeQuery(`SELECT mr.id,
            mr.company_id as "companyId",
            c.name as "companyName",
            mr.obligation_id as "obligationId",
            mr.obligation_name as "obligationName",
            mr.department,
            mr.competence,
            mr.deadline,
            mr.status,
            mr.created_at as "createdAt",
            mr.updated_at as "updatedAt"
            FROM monthly_routines mr
            LEFT JOIN companies c ON c.id = mr.company_id`);

        const workSites = await safeQuery('SELECT id, company_id as "companyId", name, description FROM work_sites');
        const employees = await safeQuery(`SELECT id,
            company_id as "companyId",
            work_site_id as "workSiteId",
            name,
            role,
            admission_date as "admissionDate",
            status,
            salary,
            cpf,
            rg,
            pis,
            birth_date as "birthDate",
            birth_city as "birthCity",
            birth_state as "birthState",
            nationality,
            mother_name as "motherName",
            father_name as "fatherName",
            education_level as "educationLevel",
            gender,
            marital_status as "maritalStatus",
            contract_type as "contractType",
            weekly_hours as "weeklyHours",
            shift,
            expected_start_date as "expectedStartDate",
            titulo_eleitor as "tituloEleitor",
            titulo_eleitor_zone as "tituloEleitorZone",
            titulo_eleitor_section as "tituloEleitorSection",
            ctps,
            ctps_series as "ctpsSeries",
            ctps_uf as "ctpsUf",
            reservista,
            email,
            phone,
            address_zip as "addressZip",
            address_street as "addressStreet",
            address_number as "addressNumber",
            address_complement as "addressComplement",
            address_district as "addressDistrict",
            address_city as "addressCity",
            address_state as "addressState",
            address,
            emergency_contact_name as "emergencyContactName",
            emergency_contact_phone as "emergencyContactPhone",
            bank_name as "bankName",
            bank_agency as "bankAgency",
            bank_account as "bankAccount",
            bank_account_type as "bankAccountType",
            dependents_count as "dependentsCount",
            dependents_notes as "dependentsNotes",
            vacation_due as "vacationDue"
            FROM employees`);
        const timeSheets = await safeQuery('SELECT id, employee_id as "employeeId", company_id as "companyId", period_start as "periodStart", period_end as "periodEnd", status, approved_by as "approvedBy", approved_at as "approvedAt", signed_at as "signedAt", created_at as "createdAt", updated_at as "updatedAt" FROM time_sheets');
        const timeEntries = await safeQuery('SELECT id, time_sheet_id as "timeSheetId", entry_date as "entryDate", schedule, work_hours as "workHours", punches, situations, notes, updated_at as "updatedAt" FROM time_entries');
        const timeComments = await safeQuery('SELECT id, time_entry_id as "timeEntryId", author_id as "authorId", author_role as "authorRole", message, created_at as "createdAt" FROM time_comments');
        const payrolls = await safeQuery('SELECT id, employee_id as "employeeId", company_id as "companyId", competence, status, created_at as "createdAt", updated_at as "updatedAt" FROM payrolls');
        const hrAdmissions = await safeQuery(`
            SELECT 
                id, company_id as "companyId", client_id as "clientId", status, 
                full_name as "fullName", cpf, rg, birth_date as "birthDate",
                birth_city as "birthCity", birth_state as "birthState", nationality,
                mother_name as "motherName", father_name as "fatherName", education_level as "educationLevel",
                gender, marital_status as "maritalStatus", role, contract_type as "contractType",
                weekly_hours as "weeklyHours", shift, salary, work_site_id as "workSiteId", 
                expected_start_date as "expectedStartDate", pis, titulo_eleitor as "tituloEleitor",
                titulo_eleitor_zone as "tituloEleitorZone", titulo_eleitor_section as "tituloEleitorSection",
                ctps, ctps_series as "ctpsSeries", ctps_uf as "ctpsUf", reservista,
                email, phone, address_zip as "addressZip", address_street as "addressStreet",
                address_number as "addressNumber", address_complement as "addressComplement",
                address_district as "addressDistrict", address_city as "addressCity", address_state as "addressState",
                address, emergency_contact_name as "emergencyContactName", emergency_contact_phone as "emergencyContactPhone",
                bank_name as "bankName", bank_agency as "bankAgency", bank_account as "bankAccount",
                bank_account_type as "bankAccountType", dependents_count as "dependentsCount",
                dependents_notes as "dependentsNotes", created_at as "createdAt", updated_at as "updatedAt" 
            FROM hr_admissions
        `);
        const hrRequests = await safeQuery('SELECT id, employee_id as "employeeId", company_id as "companyId", client_id as "clientId", type, status, details, created_at as "createdAt", updated_at as "updatedAt" FROM hr_requests');
        const fieldFeedback = await safeQuery('SELECT id, target_id as "targetId", field_name as "fieldName", message, resolved FROM hr_field_feedback');

        res.json({
            companies: companies.rows,
            users: users.rows,
            requestTypes: reqTypes.rows,
            categories: docCats.rows.map((r) => r.name),
            requests: requests.rows,
            attachments: attachments.rows,
            documents: documents.rows,
            chat: chat.rows,
            notifications: notifs.rows,
            obligations: obligations.rows,
            routines: routines.rows,
            workSites: workSites.rows,
            employees: employees.rows,
            timeSheets: timeSheets.rows,
            timeEntries: timeEntries.rows,
            timeComments: timeComments.rows,
            payrolls: payrolls.rows,
            hrAdmissions: hrAdmissions.rows,
            hrRequests: hrRequests.rows,
            fieldFeedback: fieldFeedback.rows
        });
    } catch (e) {
        console.error('Sync Error:', e);
        res.status(500).json({ error: e.message });
    }
};
