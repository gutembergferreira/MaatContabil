import React, { useState } from 'react';
import { User, Lock, ArrowRight, Scale, AlertCircle } from 'lucide-react';
import { loginUser } from '../services/mockData';
import { User as UserType } from '../types';

interface LoginProps {
    onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const user = await loginUser(email, password);
            if (user) {
                onLogin(user);
            } else {
                setError('Falha no login. Verifique credenciais ou conexão com banco.');
            }
        } catch (err) {
            setError('Erro ao conectar ao servidor backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Left Side */}
            <div className="w-full md:w-1/2 bg-slate-900 relative flex items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-blue-900 to-black"></div>
                <div className="relative z-10 text-center text-white">
                     <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-900/50">
                         <Scale size={48} className="text-white" />
                     </div>
                     <h1 className="text-5xl font-bold font-serif mb-4 tracking-wide">Ma'at Contábil</h1>
                     <p className="text-slate-400 text-lg font-light tracking-widest uppercase">Sistema 100% Integrado DB</p>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Bem-vindo</h2>
                        <p className="text-slate-500 mt-2">Acesse com seu usuario e senha.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email ou CPF</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                                <input 
                                    type="text" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Digite seu email ou CPF"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Digite sua senha"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loading ? 'Conectando...' : 'Entrar no Sistema'}
                            {!loading && <ArrowRight size={18}/>}
                        </button>
                    </form>
                    
                    <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
