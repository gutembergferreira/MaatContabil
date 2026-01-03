import { getPool } from '../db/pool.js';
import { isUuid } from '../utils/ids.js';
import { ensureMonthlyRoutines } from '../services/monthlyRoutines.js';

export const upsertCompany = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const {
        id, name, cnpj, address, contact,
        legalName, tradeName, nickname, active, taxRegime, companyGroup, honorarium, companyCode,
        addressStreet, addressNumber, addressComplement, addressZip, addressDistrict, addressCity, addressState,
        stateRegistration, stateRegistrationDate, stateRegistrationUf, stateExempt,
        nire, otherIdentifiers, phones, website, municipalRegistration, municipalRegistrationDate,
        notes, tags, contacts, obligations
    } = req.body;
    const safeId = isUuid(id) ? id : null;
    const safeName = name || legalName || tradeName || '';
    const safeContact = contact || phones || '';
    try {
        const query = `
            INSERT INTO companies (
                id, name, cnpj, address, contact_info,
                legal_name, trade_name, nickname, active, tax_regime, company_group, honorarium, company_code,
                address_street, address_number, address_complement, address_zip, address_district, address_city, address_state,
                state_registration, state_registration_date, state_registration_uf, state_exempt,
                nire, other_identifiers, phones, website, municipal_registration, municipal_registration_date,
                notes, tags, contacts, obligations
            )
            VALUES (
                COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5,
                $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24,
                $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                cnpj = EXCLUDED.cnpj,
                address = EXCLUDED.address,
                contact_info = EXCLUDED.contact_info,
                legal_name = EXCLUDED.legal_name,
                trade_name = EXCLUDED.trade_name,
                nickname = EXCLUDED.nickname,
                active = EXCLUDED.active,
                tax_regime = EXCLUDED.tax_regime,
                company_group = EXCLUDED.company_group,
                honorarium = EXCLUDED.honorarium,
                company_code = EXCLUDED.company_code,
                address_street = EXCLUDED.address_street,
                address_number = EXCLUDED.address_number,
                address_complement = EXCLUDED.address_complement,
                address_zip = EXCLUDED.address_zip,
                address_district = EXCLUDED.address_district,
                address_city = EXCLUDED.address_city,
                address_state = EXCLUDED.address_state,
                state_registration = EXCLUDED.state_registration,
                state_registration_date = EXCLUDED.state_registration_date,
                state_registration_uf = EXCLUDED.state_registration_uf,
                state_exempt = EXCLUDED.state_exempt,
                nire = EXCLUDED.nire,
                other_identifiers = EXCLUDED.other_identifiers,
                phones = EXCLUDED.phones,
                website = EXCLUDED.website,
                municipal_registration = EXCLUDED.municipal_registration,
                municipal_registration_date = EXCLUDED.municipal_registration_date,
                notes = EXCLUDED.notes,
                tags = EXCLUDED.tags,
                contacts = EXCLUDED.contacts,
                obligations = EXCLUDED.obligations,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `;
        const result = await pool.query(query, [
            safeId,
            safeName,
            cnpj || '',
            address || '',
            safeContact,
            legalName || null,
            tradeName || null,
            nickname || null,
            active !== undefined ? !!active : true,
            taxRegime || null,
            companyGroup || null,
            honorarium || null,
            companyCode || null,
            addressStreet || null,
            addressNumber || null,
            addressComplement || null,
            addressZip || null,
            addressDistrict || null,
            addressCity || null,
            addressState || null,
            stateRegistration || null,
            stateRegistrationDate || null,
            stateRegistrationUf || null,
            stateExempt !== undefined ? !!stateExempt : false,
            nire || null,
            otherIdentifiers || null,
            phones || null,
            website || null,
            municipalRegistration || null,
            municipalRegistrationDate || null,
            notes || null,
            tags || null,
            contacts ? JSON.stringify(contacts) : null,
            obligations ? JSON.stringify(obligations) : null
        ]);
        await ensureMonthlyRoutines(result.rows[0]?.id, obligations || []);
        res.json({ success: true, id: result.rows[0]?.id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteCompany = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM companies WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
