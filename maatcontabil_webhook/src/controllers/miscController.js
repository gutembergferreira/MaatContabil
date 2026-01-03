import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import { CERTS_DIR } from '../config.js';
import { createUploadUrl } from '../services/s3Client.js';

export const getCep = async (req, res) => {
    const { cep } = req.params;
    const cleanCep = String(cep || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) return res.status(400).json({ error: 'CEP invalido' });
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, {
            timeout: 8000,
            validateStatus: () => true
        });
        if (response.status >= 400) {
            throw new Error('ViaCEP falhou');
        }
        if (response.data?.erro) return res.status(404).json({ error: 'CEP nao encontrado' });
        return res.json(response.data);
    } catch (e) {
        try {
            const fallback = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
                timeout: 8000,
                validateStatus: () => true
            });
            if (fallback.status >= 400) {
                return res.status(502).json({ error: 'Falha ao consultar CEP' });
            }
            return res.json({
                cep: fallback.data?.cep || cleanCep,
                logradouro: fallback.data?.street || '',
                bairro: fallback.data?.neighborhood || '',
                localidade: fallback.data?.city || '',
                uf: fallback.data?.state || ''
            });
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Falha ao consultar CEP';
            return res.status(500).json({ error: message });
        }
    }
};

export const createPix = async (req, res) => {
    const { clientId, clientSecret, pixKey, amount, protocol, requestData } = req.body;
    const crtPath = path.join(CERTS_DIR, 'certificado.crt');
    const keyPath = path.join(CERTS_DIR, 'chave.key');
    if (!fs.existsSync(crtPath) || !fs.existsSync(keyPath)) return res.status(400).json({ error: 'Certificados nÇœo encontrados.' });
    try {
        const agent = new https.Agent({ cert: fs.readFileSync(crtPath), key: fs.readFileSync(keyPath) });
        const auth = await axios.post('https://cdpj.partners.bancointer.com.br/oauth/v2/token', new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: 'cob.write', grant_type: 'client_credentials' }), { httpsAgent: agent });
        const cleanCpf = (requestData.cpf || '').replace(/\D/g, '');
        const cob = await axios.post('https://cdpj.partners.bancointer.com.br/pix/v2/cob', {
            calendario: { expiracao: 3600 },
            devedor: { cpf: cleanCpf, name: requestData.name },
            valor: { original: amount.toFixed(2) },
            chave: pixKey,
            solicitacaoPagador: `Servico ${protocol}`
        }, { httpsAgent: agent, headers: { Authorization: `Bearer ${auth.data.access_token}` } });
        res.json({ txid: cob.data.txid, pixCopiaECola: cob.data.pixCopiaECola });
    } catch (error) {
        res.status(500).json({ error: 'Falha Inter', details: error.response?.data });
    }
};

export const uploadCert = (req, res) => {
    if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR);
    if (req.files['crt']) fs.renameSync(req.files['crt'][0].path, path.join(CERTS_DIR, 'certificado.crt'));
    if (req.files['key']) fs.renameSync(req.files['key'][0].path, path.join(CERTS_DIR, 'chave.key'));
    res.json({ success: true });
};

export const createPresignedUpload = async (req, res) => {
    const { key, contentType } = req.body || {};
    if (!key || !contentType) {
        return res.status(400).json({ error: 'Missing key or contentType' });
    }
    try {
        const data = await createUploadUrl({ key, contentType });
        return res.json({ success: true, ...data });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
