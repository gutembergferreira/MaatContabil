import app from './app.js';
import { PORT } from './config.js';
import { DATABASE_URL } from './config.js';
import { initDbConnection, initDbConnectionFromUrl, loadDbConfig } from './db/pool.js';

export const startServer = () => {
    if (DATABASE_URL) {
        initDbConnectionFromUrl(DATABASE_URL);
    } else {
        const config = loadDbConfig();
        if (config) {
            try {
                initDbConnection(config);
            } catch (e) {
                console.error('Falha ao iniciar conexao com banco:', e.message);
            }
        }
    }
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
};

startServer();
