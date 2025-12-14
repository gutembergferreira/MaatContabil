import React, { useState } from 'react';
import { Database, Server, Save, Play, CheckCircle, Terminal, Shield } from 'lucide-react';
import { DbConfig, initializeDatabase, saveDbConfig } from '../services/dbService';
import { POSTGRES_SCHEMA } from '../services/sqlSchema';

interface DatabaseSetupProps {
    onComplete: () => void;
}

const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onComplete }) => {
    const [config, setConfig] = useState<DbConfig>({
        host: 'localhost',
        port: '5432',
        user: 'postgres',
        pass: '',
        dbName: 'maat_contabil',
        ssl: false
    });
    
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [showSchema, setShowSchema] = useState(false);

    const handleRunSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('running');
        setLogs([]);
        
        saveDbConfig(config);
        
        const result = await initializeDatabase(config);
        
        setLogs(result.logs);
        if (result.success) {
            setStatus('success');
            setTimeout(() => {
                onComplete();
            }, 2000);
        } else {
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Panel: Config */}
                <div className="w-full md:w-1/2 p-8 border-r border-slate-100">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="bg-blue-600 p-2 rounded-lg text-white">
                                 <Database size={24} />
                             </div>
                             <h1 className="text-2xl font-bold text-slate-800">Ma'at Setup</h1>
                        </div>
                        <p className="text-slate-500 text-sm">Configure a conexão com o PostgreSQL para iniciar o sistema.</p>
                    </div>

                    <form onSubmit={handleRunSetup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Host</label>
                                <input required type="text" value={config.host} onChange={e => setConfig({...config, host: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="localhost" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Porta</label>
                                <input required type="text" value={config.port} onChange={e => setConfig({...config, port: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="5432" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Usuário</label>
                                <input required type="text" value={config.user} onChange={e => setConfig({...config, user: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="postgres" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Senha</label>
                                <input type="password" value={config.pass} onChange={e => setConfig({...config, pass: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="******" />
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Database Name</label>
                             <input required type="text" value={config.dbName} onChange={e => setConfig({...config, dbName: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="maat_contabil" />
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="ssl" checked={config.ssl} onChange={e => setConfig({...config, ssl: e.target.checked})} />
                            <label htmlFor="ssl" className="text-sm text-slate-600 cursor-pointer">Usar SSL/TLS</label>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={status === 'running' || status === 'success'}
                                className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all
                                    ${status === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
                                    ${status === 'running' ? 'opacity-70 cursor-wait' : ''}
                                `}
                            >
                                {status === 'running' ? (
                                    <> <Server size={18} className="animate-bounce" /> Conectando... </>
                                ) : status === 'success' ? (
                                    <> <CheckCircle size={18} /> Sistema Inicializado! </>
                                ) : (
                                    <> <Play size={18} /> Testar Conexão e Criar Tabelas </>
                                )}
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <button onClick={() => setShowSchema(!showSchema)} className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto">
                            <Terminal size={12} /> {showSchema ? 'Ocultar' : 'Ver'} Script SQL (Schema)
                        </button>
                    </div>
                </div>

                {/* Right Panel: Logs/Console */}
                <div className="w-full md:w-1/2 bg-slate-900 p-8 flex flex-col font-mono text-xs">
                    <div className="flex items-center gap-2 text-slate-400 mb-4 pb-2 border-b border-slate-700">
                        <Terminal size={16} /> Console de Instalação
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                        {showSchema ? (
                            <pre className="text-blue-300 whitespace-pre-wrap">{POSTGRES_SCHEMA}</pre>
                        ) : logs.length === 0 ? (
                            <div className="text-slate-600 italic">Aguardando início da configuração...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="text-green-400 border-l-2 border-slate-700 pl-2">
                                    {log}
                                </div>
                            ))
                        )}
                        {status === 'running' && <span className="text-green-400 animate-pulse">_</span>}
                    </div>

                    {status === 'success' && (
                        <div className="mt-4 p-3 bg-green-900/30 border border-green-800 rounded text-green-400 text-center animate-pulse">
                            Redirecionando para Login...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatabaseSetup;