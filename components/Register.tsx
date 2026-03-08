import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import {
    GraduationCap,
    Mail,
    Lock,
    User,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Loader2,
    ShieldCheck
} from 'lucide-react';

interface RegisterProps {
    onBackToLogin: () => void;
    showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Register: React.FC<RegisterProps> = ({ onBackToLogin, showNotification }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !name) {
            showNotification('Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        setLoading(true);

        if (!supabase) {
            showNotification('Conexão com o banco de dados não disponível. Verifique as configurações.', 'error');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name.trim(),
                        role: 'teacher'
                    }
                }
            });

            if (error) throw error;

            if (data.session) {
                showNotification('Conta criada com sucesso! Bem-vindo.', 'success');
            } else {
                setSuccess(true);
                showNotification('Cadastro realizado! Verifique seu e-mail.', 'success');
            }
        } catch (error: any) {
            showNotification(error.message || 'Erro ao criar conta', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white">
                <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-200/50 scale-110">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Quase lá!</h2>
                        <p className="text-slate-500 text-lg">
                            Enviamos um link de confirmação para <span className="font-semibold text-slate-800">{email}</span>.
                        </p>
                    </div>
                    <button
                        onClick={onBackToLogin}
                        className="w-full py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex overflow-hidden relative">
            {/* 
        🎨 DESIGN COMMITMENT: Asymmetric Tension (90/10)
        - Extreme Focus: Text shifted to the extreme left/right to create visual tension.
        - Geometry: Sharp 0px borders for inputs combined with organic 32px corners for containers.
      */}

            {/* Left Side - The Brand Experience (10% Extreme Sidebar) */}
            <div className="hidden lg:flex w-[8%] bg-slate-900 flex-col items-center py-12 justify-between border-r border-slate-800">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <GraduationCap className="w-6 h-6" />
                </div>
                <div className="rotate-180 [writing-mode:vertical-lr] text-slate-500 font-bold tracking-[0.3em] opacity-30 text-xs">
                    © 2026 SIGMAEI
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row relative">
                {/* Right Gradient Background (Subtle Visual Interest) */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-50/30 to-transparent pointer-events-none" />

                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 py-12 relative z-10 max-w-2xl">
                    <button
                        onClick={onBackToLogin}
                        className="group flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors mb-12 w-fit font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar ao login
                    </button>

                    <header className="space-y-4 mb-12 animate-in slide-in-from-left duration-700">
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                            A nova era da <span className="text-emerald-500 italic">gestão</span> escolar.
                        </h1>
                        <p className="text-slate-500 text-xl font-medium max-w-md">
                            Junte-se a centenas de educadores que estão transformando a educação infantil.
                        </p>
                    </header>

                    <form onSubmit={handleRegister} className="space-y-6 animate-in slide-in-from-bottom duration-1000 delay-200">
                        <div className="grid gap-6">
                            <div className="relative group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-2 z-20 group-focus-within:text-emerald-500 transition-colors">
                                    Seu nome completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium"
                                        placeholder="Como devemos chamar você?"
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-2 z-20 group-focus-within:text-emerald-500 transition-colors">
                                    E-mail Institucional
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-2 z-20 group-focus-within:text-emerald-500 transition-colors">
                                    Sua Senha Mestra
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium"
                                        placeholder="No mínimo 6 caracteres"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 px-6 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 shadow-2xl shadow-slate-900/10 group overflow-hidden relative"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span className="relative z-10 uppercase tracking-tight">Criar minha conta</span>
                                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" />
                                    </>
                                )}
                                <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
                            </button>
                        </div>

                        <p className="text-center text-slate-400 text-xs font-medium px-4">
                            Ao criar uma conta, você concorda com nossos termos de uso e política de privacidade.
                        </p>
                    </form>
                </div>

                {/* Vertical Decorative Bar (Asymmetric Split) */}
                <div className="hidden lg:block w-[1px] bg-slate-100 h-2/3 my-auto" />

                {/* Info/Stats Section (Asymmetric Balance 30%) */}
                <div className="hidden lg:flex lg:w-[30%] flex-col justify-center p-12 bg-slate-50/50 space-y-12">


                    <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-12">
                        <div className="space-y-1">
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">100%</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguro (SSL)</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">BNCC</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Integrado</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
