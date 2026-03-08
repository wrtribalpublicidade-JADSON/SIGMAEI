import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, School } from 'lucide-react';
import { TEXT_HERO, TEXT_H1, TEXT_BODY, INPUT_STYLE, BTN_PRIMARY_STYLE } from '../utils/styles';
import { supabase } from '../services/supabase';

interface LoginProps {
  onShowRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onShowRegister }) => {
  const { showNotification, activateDemoMode, authLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If the background context auth fails, reset the local loading state
  useEffect(() => {
    if (!authLoading) setLoading(false);
  }, [authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);

    if (!supabase) {
      showNotification('Conexão com o banco de dados não disponível. Verifique as configurações.', 'error');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showNotification(error.message.includes('Invalid') ? 'E-mail ou senha incorretos' : 'Erro ao acessar o sistema', 'error');
      setLoading(false);
    } else {
      showNotification('Acesso liberado!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden relative">
      {/* 
        🎨 DESIGN COMMITMENT: Asymmetric Tension (60/40) 
        - Left: Massive Typography + Brand (60%)
        - Right: Functional Login (40%)
      */}

      {/* Left Side - Brand & Visuals */}
      <div className="hidden lg:flex lg:w-[60%] bg-slate-900 relative items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] animate-float-delayed" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-float" />

        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <div className="relative z-10 p-12 max-w-2xl">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-50 text-xs font-bold tracking-widest uppercase font-display">Sistema de Gestão Escolar</span>
          </div>

          <h1 className={`${TEXT_HERO} text-white mb-6 leading-[0.9]`}>
            Simplifique a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Educação.</span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 font-sans">
            Gerencie turmas, avaliações e relatórios com uma plataforma desenhada para a eficiência pedagógica e segurança de ponta a ponta.
          </p>

          {/* Floating Abstract Cards */}
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-80 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl -rotate-6 animate-float-delayed hidden xl:block">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><School size={20} /></div>
              <div><div className="h-2 w-24 bg-white/20 rounded mb-1" /><div className="h-2 w-16 bg-white/10 rounded" /></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-white/5 rounded" />
              <div className="h-2 w-5/6 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center p-8 lg:p-16 relative bg-white/60 backdrop-blur-3xl">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex lg:hidden items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><GraduationCap size={24} /></div>
              <span className="font-display font-bold text-xl text-slate-900">SIGMAEI</span>
            </div>
            <h2 className={`${TEXT_H1} mb-2`}>Bem-vindo</h2>
            <p className={TEXT_BODY}>Entre com seu e-mail e senha para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors peer-focus:text-emerald-500" />
                <input
                  type="email"
                  required
                  placeholder="Seu e-mail institucional"
                  className={`${INPUT_STYLE} pl-12 h-14 bg-slate-50 border-transparent focus:bg-white`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors peer-focus:text-emerald-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className={`${INPUT_STYLE} pl-12 h-14 bg-slate-50 border-transparent focus:bg-white`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${BTN_PRIMARY_STYLE} w-full h-14 text-base shadow-emerald-500/25 hover:shadow-emerald-500/40 relative flex items-center justify-center disabled:opacity-70`}
            >
              {loading ? (
                <>Processando <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
              ) : (
                <>Acessar Plataforma <ArrowRight className="w-5 h-5 ml-1" /></>
              )}
            </button>

            <div className="text-center mt-4 flex flex-col items-center gap-4">
              <button
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                onClick={onShowRegister}
              >
                Não tem uma conta? Cadastre-se
              </button>

              <div className="w-full flex items-center justify-center gap-4 py-1 opacity-60">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-display tracking-widest">ou acesso livre</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <button
                type="button"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 bg-slate-100/50 hover:bg-slate-200 py-2.5 px-6 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm"
                onClick={activateDemoMode}
              >
                <School size={16} className="text-emerald-600" />
                Acessar Modo Demonstração
              </button>
            </div>
          </form>

          <p className="mt-8 text-xs text-slate-400 text-center font-sans tracking-wide">
            © 2026 SIGMAEI - Sistema de Gestão Escolar
          </p>
        </div>
      </div>
    </div>
  );
};
