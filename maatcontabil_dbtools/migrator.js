import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Agora recebemos a classe 'Client' como argumento, removendo a necessidade de importar 'pg' aqui
export async function runMigration(dbConfig, Client) {
    console.log('--- Iniciando Migração de Banco de Dados ---');
    
    // 1. Conecta no banco 'postgres' padrão para checar/criar o banco alvo
    const clientRoot = new Client({
        user: dbConfig.user,
        host: dbConfig.host,
        password: dbConfig.pass,
        port: dbConfig.port,
        database: 'postgres' // Conecta no default
    });

    try {
        await clientRoot.connect();
        
        // Verifica se o banco existe
        const res = await clientRoot.query(`SELECT 1 FROM pg_database WHERE datname = '${dbConfig.dbName}'`);
        if (res.rowCount === 0) {
            console.log(`Banco '${dbConfig.dbName}' não existe. Criando...`);
            await clientRoot.query(`CREATE DATABASE "${dbConfig.dbName}"`);
            console.log('Banco criado com sucesso.');
        } else {
            console.log(`Banco '${dbConfig.dbName}' já existe.`);
        }
    } catch (err) {
        console.error('Erro ao conectar no Postgres raiz:', err.message);
        throw err;
    } finally {
        await clientRoot.end();
    }

    // 2. Conecta no banco alvo para criar tabelas
    const clientTarget = new Client({
        user: dbConfig.user,
        host: dbConfig.host,
        password: dbConfig.pass,
        port: dbConfig.port,
        database: dbConfig.dbName
    });

    try {
        await clientTarget.connect();
        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executando Schema SQL...');
        await clientTarget.query(sql);
        console.log('Tabelas criadas/verificadas com sucesso.');
        
        return { success: true, message: 'Migração concluída com sucesso.' };
    } catch (err) {
        console.error('Erro na migração:', err);
        throw err;
    } finally {
        await clientTarget.end();
    }
}