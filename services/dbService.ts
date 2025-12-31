import { POSTGRES_SCHEMA } from './sqlSchema';
import { getApiUrl } from './apiConfig';

export interface DbConfig {
    host: string;
    port: string;
    user: string;
    pass: string;
    dbName: string;
    ssl: boolean;
}

let dbConfigCache: DbConfig | null = null;

export const isDbInitialized = (): boolean => true;

export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        // Tenta conectar com timeout curto para não travar a UI
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const res = await fetch(`${getApiUrl()}/status`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) return false;
        
        const data = await res.json();
        return data.configured === true;
    } catch (e) {
        console.warn('Backend offline ou inacessível. Rodando em modo Demo/Offline.', e);
        return false;
    }
};

export const saveDbConfig = (config: DbConfig) => {
    dbConfigCache = config;
};

export const getDbConfig = (): DbConfig | null => dbConfigCache;

export const loadDbConfigFromServer = async (): Promise<DbConfig | null> => {
    try {
        const res = await fetch(`${getApiUrl()}/db-config`);
        if (!res.ok) return dbConfigCache;
        const data = await res.json();
        if (!data || !data.host) return dbConfigCache;
        dbConfigCache = {
            host: data.host,
            port: data.port || '5432',
            user: '',
            pass: '',
            dbName: data.dbName || '',
            ssl: !!data.ssl
        };
        return dbConfigCache;
    } catch {
        return dbConfigCache;
    }
};

export const initializeDatabase = async (config: DbConfig): Promise<{success: boolean, message: string, logs: string[]}> => {
    try {
        const response = await fetch(`${getApiUrl()}/setup-db`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        let data: any = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = text ? { success: false, message: text, logs: [] } : { success: false, message: 'Resposta vazia do servidor', logs: [] };
        }
        
        if (data.success) {
            return { success: true, message: 'Banco de dados configurado com sucesso!', logs: ['Conectado ao Backend', 'Schema executado', 'Tabelas criadas'] };
        } else {
            return { success: false, message: data.message, logs: data.logs || [] };
        }
    } catch (error: any) {
        return { 
            success: false, 
            message: 'ERRO CRITICO: Nao foi possivel conectar ao servidor Backend.', 
            logs: [
                `Falha ao tentar: POST ${getApiUrl()}/setup-db`,
                `Erro técnico: ${error.message}`,
                'Certifique-se de que o backend (maatcontabil_webhook) esta rodando e sem erros.'
            ] 
        };
    }
};

export const resetSystem = () => {
    window.location.reload();
};
