export interface DbConfig {
    host: string;
    port: string;
    user: string;
    pass: string;
    dbName: string;
    ssl: boolean;
}

const API_URL = '/api';

export const isDbInitialized = (): boolean => true;

export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/status`);
        const data = await res.json();
        // Backend diz que está configurado se dbPool não for null
        return data.configured === true;
    } catch (e) {
        console.error('Backend offline ou inacessível:', e);
        return false;
    }
};

export const saveDbConfig = (config: DbConfig) => {
    // noop in legacy path
};

export const getDbConfig = (): DbConfig | null => null;

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
            message: 'Erro ao conectar com o servidor backend (maatcontabil_webhook). Verifique se ele está rodando na porta 3001.', 
            logs: ['Falha de conexao com o servidor', error.message || 'Erro desconhecido'] 
        };
    }
};

export const resetSystem = () => {
    window.location.reload();
};
