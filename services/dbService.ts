import { POSTGRES_SCHEMA } from './sqlSchema';

export interface DbConfig {
    host: string;
    port: string;
    user: string;
    pass: string;
    dbName: string;
    ssl: boolean;
}

const DB_CONFIG_KEY = 'maat_db_config';
const DB_INITIALIZED_KEY = 'maat_db_initialized';

export const getDbConfig = (): DbConfig | null => {
    const data = localStorage.getItem(DB_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
};

export const isDbInitialized = (): boolean => {
    return localStorage.getItem(DB_INITIALIZED_KEY) === 'true';
};

export const saveDbConfig = (config: DbConfig) => {
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
};

export const initializeDatabase = async (config: DbConfig): Promise<{success: boolean, message: string, logs: string[]}> => {
    // This function simulates the Backend process of connecting to Postgres and running the Schema
    const logs: string[] = [];
    const log = (msg: string) => logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

    return new Promise((resolve) => {
        log(`Tentando conexão com postgres://${config.user}:***@${config.host}:${config.port}/${config.dbName}...`);
        
        setTimeout(() => {
            if (!config.host || !config.user) {
                log('ERRO: Credenciais inválidas.');
                resolve({ success: false, message: 'Dados incompletos', logs });
                return;
            }

            log('Conexão TCP estabelecida.');
            log('Autenticando usuário...');
            
            setTimeout(() => {
                log('Autenticação OK.');
                log('Verificando existência do Database...');
                log(`Database '${config.dbName}' não encontrado. Criando...`);
                log(`Database '${config.dbName}' criado com sucesso.`);
                
                log('Iniciando criação de Schema (Tabelas)...');
                
                // Simulate running the SQL commands
                const commands = [
                    'CREATE TABLE companies...',
                    'CREATE TABLE users...',
                    'CREATE TABLE service_requests...',
                    'CREATE TABLE documents...',
                    'INSERT INTO users (admin default)...'
                ];

                let delay = 0;
                commands.forEach((cmd, idx) => {
                    setTimeout(() => {
                        log(`Executando: ${cmd}`);
                        if (idx === commands.length - 1) {
                            log('Migração concluída com sucesso.');
                            log('Usuário Admin Padrão Criado: admin@maat.com / admin');
                            
                            localStorage.setItem(DB_INITIALIZED_KEY, 'true');
                            resolve({ success: true, message: 'Banco de Dados Configurado!', logs });
                        }
                    }, delay);
                    delay += 400;
                });

            }, 1000);
        }, 1000);
    });
};

export const resetSystem = () => {
    localStorage.removeItem(DB_CONFIG_KEY);
    localStorage.removeItem(DB_INITIALIZED_KEY);
    window.location.reload();
};