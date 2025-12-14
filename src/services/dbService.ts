export interface DbConfig {
    host: string;
    port: string;
    user: string;
    pass: string;
    dbName: string;
    ssl: boolean;
}

const DB_INITIALIZED_KEY = 'maat_db_initialized';
const API_URL = 'http://localhost:3001/api';

export const isDbInitialized = (): boolean => {
    return localStorage.getItem(DB_INITIALIZED_KEY) === 'true';
};

export const saveDbConfig = (config: DbConfig) => {
    // In a real app, we might store connection string in backend env, 
    // here we just persist state that setup is done.
    localStorage.setItem(DB_INITIALIZED_KEY, 'true');
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
            localStorage.setItem(DB_INITIALIZED_KEY, 'true');
            return { success: true, message: 'Banco de dados configurado com sucesso!', logs: ['Conectado ao Backend', 'Schema executado', 'Tabelas criadas'] };
        } else {
            return { success: false, message: data.message, logs: data.logs || [] };
        }
    } catch (error) {
        return { 
            success: false, 
            message: 'Erro ao conectar com o servidor backend (maatcontabil_webhook). Verifique se ele está rodando na porta 3001.', 
            logs: ['Falha de conexão com localhost:3001'] 
        };
    }
};

export const resetSystem = () => {
    localStorage.removeItem(DB_INITIALIZED_KEY);
    window.location.reload();
};