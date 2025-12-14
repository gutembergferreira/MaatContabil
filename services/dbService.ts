import { POSTGRES_SCHEMA } from './sqlSchema';

export interface DbConfig {
    host: string;
    port: string;
    user: string;
    pass: string;
    dbName: string;
    ssl: boolean;
}

const DB_INITIALIZED_KEY = 'maat_db_initialized';
const DB_CONFIG_KEY = 'maat_db_config';
const API_URL = 'http://localhost:3001/api';

export const isDbInitialized = (): boolean => {
    return localStorage.getItem(DB_INITIALIZED_KEY) === 'true';
};

export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        // Tenta conectar com timeout curto para não travar a UI
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const res = await fetch(`${API_URL}/status`, { signal: controller.signal });
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
    localStorage.setItem(DB_INITIALIZED_KEY, 'true');
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
};

export const getDbConfig = (): DbConfig | null => {
    const saved = localStorage.getItem(DB_CONFIG_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing DB config', e);
            return null;
        }
    }
    return null;
};

export const initializeDatabase = async (config: DbConfig): Promise<{success: boolean, message: string, logs: string[]}> => {
    try {
        const response = await fetch(`${API_URL}/setup-db`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        const data = await response.json();
        
        if (data.success) {
            saveDbConfig(config);
            return { success: true, message: 'Banco de dados configurado com sucesso!', logs: ['Conectado ao Backend', 'Schema executado', 'Tabelas criadas'] };
        } else {
            return { success: false, message: data.message, logs: data.logs || [] };
        }
    } catch (error: any) {
        return { 
            success: false, 
            message: 'ERRO CRÍTICO: Não foi possível conectar ao servidor Backend (Porta 3001).', 
            logs: [
                'Falha ao tentar: POST http://localhost:3001/api/setup-db',
                `Erro técnico: ${error.message}`,
                'Certifique-se de que o terminal do backend (maatcontabil_webhook) está rodando e sem erros.'
            ] 
        };
    }
};

export const resetSystem = () => {
    localStorage.removeItem(DB_INITIALIZED_KEY);
    localStorage.removeItem(DB_CONFIG_KEY);
    window.location.reload();
};