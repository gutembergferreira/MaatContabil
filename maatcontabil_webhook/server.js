const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const multer = require('multer'); // Para upload de certificados
const { runMigration } = require('../maatcontabil_dbtools/migrator');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Configuração de Upload para Certificados
const upload = multer({ dest: 'certs/' });

// Estado em memória da conexão DB (para a sessão atual do servidor)
let dbConfigCache = null;

// --- ROTA 1: Setup do Banco de Dados ---
app.post('/api/setup-db', async (req, res) => {
    const config = req.body;
    try {
        await runMigration(config);
        dbConfigCache = config; // Salva para uso nas outras rotas
        res.json({ success: true, message: 'Banco configurado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, logs: [error.toString()] });
    }
});

// --- ROTA 2: Upload de Certificados Inter ---
// Salva como 'certificado.crt' e 'chave.key' na pasta certs
app.post('/api/upload-cert', upload.fields([{ name: 'crt' }, { name: 'key' }]), (req, res) => {
    try {
        if (req.files['crt']) {
            fs.renameSync(req.files['crt'][0].path, path.join(__dirname, 'certs', 'certificado.crt'));
        }
        if (req.files['key']) {
            fs.renameSync(req.files['key'][0].path, path.join(__dirname, 'certs', 'chave.key'));
        }
        res.json({ success: true, message: 'Certificados salvos no servidor.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao salvar arquivos.' });
    }
});

// --- ROTA 3: Gerar PIX (Real) ---
app.post('/api/pix', async (req, res) => {
    const { clientId, clientSecret, pixKey, amount, protocol, requestData } = req.body;
    
    const crtPath = path.join(__dirname, 'certs', 'certificado.crt');
    const keyPath = path.join(__dirname, 'certs', 'chave.key');

    if (!fs.existsSync(crtPath) || !fs.existsSync(keyPath)) {
        return res.status(400).json({ error: 'Certificados não encontrados no servidor. Faça o upload nas configurações.' });
    }

    try {
        const agent = new https.Agent({
            cert: fs.readFileSync(crtPath),
            key: fs.readFileSync(keyPath)
        });

        const INTER_URL = 'https://cdpj.partners.bancointer.com.br';

        // 1. Auth
        console.log('Autenticando no Inter...');
        const auth = await axios.post(`${INTER_URL}/oauth/v2/token`, 
            new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                scope: 'boleto-cobranca.read boleto-cobranca.write',
                grant_type: 'client_credentials'
            }), { httpsAgent: agent }
        );
        
        const token = auth.data.access_token;

        // 2. Create Charge
        console.log('Gerando Cobrança...');
        const cob = await axios.post(`${INTER_URL}/pix/v2/cob`, {
            calendario: { expiracao: 3600 },
            devedor: {
                cpf: requestData.cpf || '111.111.111-11', // Dados reais viriam do cadastro do usuário
                nome: requestData.name || 'Cliente Maat'
            },
            valor: { original: amount.toFixed(2) },
            chave: pixKey,
            solicitacaoPagador: `Serviço ${protocol}`
        }, {
            httpsAgent: agent,
            headers: { Authorization: `Bearer ${token}` }
        });

        res.json({
            txid: cob.data.txid,
            pixCopiaECola: cob.data.pixCopiaECola
        });

    } catch (error) {
        console.error('Erro Inter:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erro na comunicação com o Banco Inter', 
            details: error.response?.data 
        });
    }
});

// --- ROTA 4: Webhook (Recebe callback do Inter) ---
app.post('/webhook/pix', (req, res) => {
    const pixList = req.body.pix;
    console.log('--- WEBHOOK RECEBIDO ---');
    console.log(JSON.stringify(req.body, null, 2));

    if (pixList) {
        // Aqui você conectaria no PG para atualizar o status
        // const client = new pg.Client(dbConfigCache)...
        // await client.query('UPDATE service_requests SET status = ... WHERE txid = ...')
    }

    res.status(200).send('OK');
});

// Start
if (!fs.existsSync('certs')){
    fs.mkdirSync('certs');
}

app.listen(PORT, () => {
    console.log(`Servidor Maat Contábil rodando na porta ${PORT}`);
    console.log(`Pasta de Webhook: ${__dirname}`);
});