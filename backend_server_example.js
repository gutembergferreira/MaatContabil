/**
 * ARQUIVO DE EXEMPLO: SERVIDOR BACKEND (Node.js)
 * 
 * Este arquivo não roda no navegador. Ele deve ser executado em um servidor (ou localmente com Node.js).
 * Motivo: A API do Banco Inter exige autenticação mTLS (Certificados) que navegadores não suportam diretamente via JS.
 * 
 * Como usar:
 * 1. Instale dependências: npm install express axios https fs cors body-parser
 * 2. Coloque seus arquivos 'certificado.crt' e 'chave.key' na mesma pasta.
 * 3. Rode: node backend_server_example.js
 * 4. Use o Ngrok para expor a porta 3001: ngrok http 3001
 */

const express = require('express');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // Permite chamadas do seu Frontend React
app.use(bodyParser.json());

// --- CONFIGURAÇÃO DO INTER ---
const INTER_API_URL = 'https://cdpj.partners.bancointer.com.br'; // Produção
const CLIENT_ID = 'SEU_CLIENT_ID_AQUI';
const CLIENT_SECRET = 'SEU_CLIENT_SECRET_AQUI';
const CHAVE_PIX = 'SUA_CHAVE_PIX';

// Carrega Certificados
const agent = new https.Agent({
  cert: fs.readFileSync('./certificado.crt'),
  key: fs.readFileSync('./chave.key'),
  // passphrase: 'sua_senha' // Se a chave tiver senha
});

// --- ROTA 1: Gerar Cobrança (Chamada pelo seu Frontend React) ---
app.post('/api/gerar-pix', async (req, res) => {
    try {
        // 1. Obter Token OAuth
        const authResponse = await axios.post(`${INTER_API_URL}/oauth/v2/token`, 
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                scope: 'boleto-cobranca.read boleto-cobranca.write',
                grant_type: 'client_credentials'
            }), 
            { httpsAgent: agent }
        );
        const accessToken = authResponse.data.access_token;

        // 2. Criar Cobrança Imediata
        const cobResponse = await axios.post(`${INTER_API_URL}/pix/v2/cob`, {
            calendario: { expiracao: 3600 },
            devedor: {
                cpf: req.body.cpf,
                nome: req.body.nome
            },
            valor: { original: req.body.valor.toFixed(2) },
            chave: CHAVE_PIX,
            solicitacaoPagador: "Serviço Contábil"
        }, {
            httpsAgent: agent,
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Retorna para o Frontend o TXID e o Copia e Cola
        res.json({
            txid: cobResponse.data.txid,
            pixCopiaECola: cobResponse.data.pixCopiaECola
        });

    } catch (error) {
        console.error('Erro API Inter:', error.response?.data || error.message);
        res.status(500).json({ error: 'Falha ao gerar Pix' });
    }
});

// --- ROTA 2: Receber Webhook (Chamada pelo Banco Inter) ---
app.post('/webhook/pix', (req, res) => {
    const notifications = req.body.pix; // Array de pagamentos recebidos
    
    if (notifications) {
        notifications.forEach(pix => {
            console.log(`[WEBHOOK] Pagamento recebido! TxId: ${pix.txid}, Valor: ${pix.valor}, E2E: ${pix.endToEndId}`);
            
            // AQUI VOCÊ ATUALIZA O STATUS NO SEU BANCO DE DADOS
            // Ex: db.requests.update({ txid: pix.txid }, { status: 'PAGO' });
        });
    }

    res.status(200).send('OK'); // Responda 200 rápido para o Inter não reenviar
});

app.listen(3001, () => {
    console.log('Servidor Backend rodando na porta 3001');
    console.log('Configure o Webhook no Inter para: https://seu-ngrok.app/webhook/pix');
});