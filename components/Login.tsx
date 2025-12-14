import React, { useState } from 'react';
import { User, Lock, ArrowRight, Scale } from 'lucide-react';

interface LoginProps {
    onLogin: (role: 'admin' | 'client') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Simulated Auth Logic
        if (email === 'admin@maat.com' && password === 'admin') {
            onLogin('admin');
        } else if (email.includes('@') && password === '123') {
            onLogin('client');
        } else {
            setError('Credenciais inválidas. Tente admin@maat.com / admin');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Left Side - Image/Brand */}
            <div className="w-full md:w-1/2 bg-slate-900 relative flex items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="relative z-10 text-center text-white">
                     <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-900/50">
                         <Scale size={48} className="text-white" />
                     </div>
                     <h1 className="text-5xl font-bold font-serif mb-4 tracking-wide">Ma'at Contábil</h1>
                     <p className="text-slate-400 text-lg font-light tracking-widest uppercase">Equilíbrio • Verdade • Justiça</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold text-slate-800">Bem-vindo</h2>
                        <p className="text-slate-500 mt-2">Acesse sua área exclusiva</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                    placeholder="seu@email.com"
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
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                        >
                            Entrar no Sistema
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                        </button>
                    </form>
                    
                    <p className="text-center text-xs text-slate-400 mt-8">
                        &copy; {new Date().getFullYear()} Ma'at Contábil System. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;