
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import { Registration } from './components/Registration';
import { Assessment } from './components/Assessment';
import { Reports } from './components/Reports';
import { ClassDiary } from './components/ClassDiary';
import { Login } from './components/Login';
import Register from './components/Register';
import { UserManagement } from './components/UserManagement';
import { LayoutDashboard, PenTool, BarChart3, Menu, X, GraduationCap, BookOpen, CheckCircle, AlertCircle, AlertTriangle, Info, LogOut, UserCog, ArrowRight } from 'lucide-react';
import { UserRole } from './types';

import {
  TEXT_H1, TEXT_H2, TEXT_H3, TEXT_BODY, TEXT_SMALL, TEXT_LABEL,
  SIDEBAR_STYLE, SIDEBAR_ITEM_STYLE, SIDEBAR_ITEM_ACTIVE, SIDEBAR_ITEM_INACTIVE,
  CARD_STYLE
} from './utils/styles';

class ErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h1>
          <p className="text-slate-600 mb-6 max-w-md">Ocorreu um erro inesperado na interface. Tente atualizar a página.</p>
          <button onClick={() => window.location.reload()} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-transform active:scale-95">Atualizar Sistema</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SidebarItem = ({ icon: Icon, label, to, onClick }: { icon: any, label: string, to: string, onClick?: () => void }) => {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${SIDEBAR_ITEM_STYLE} ${active ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_INACTIVE}`}
    >
      <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-emerald-200' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span>{label}</span>
    </Link>
  );
};

const DashboardHome = () => {
  const { currentUser } = useApp();
  const role = currentUser?.role;

  // Define accessible modules
  const canAccessRegistration = role === 'admin' || role === 'manager' || role === 'coordinator';
  const canAccessUsers = role === 'admin';

  return (
    <div className="p-8 md:p-12 animate-in fade-in zoom-in duration-500 max-w-7xl mx-auto">
      <header className="mb-12 text-center md:text-left relative">
        <div className="absolute top-0 right-0 hidden md:block opacity-10 pointer-events-none">
          <GraduationCap size={200} />
        </div>
        <h2 className={`${TEXT_H1} text-4xl mb-3`}>
          Bem-vindo, <span className="text-emerald-600">{currentUser?.name}</span>
        </h2>
        <p className={`${TEXT_BODY} max-w-xl text-lg`}>
          Selecione um módulo abaixo para iniciar suas atividades de gestão e monitoramento.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {canAccessRegistration && (
          <Link to="/cadastros" className={CARD_STYLE}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <PenTool />
            </div>
            <h3 className={TEXT_H3}>Cadastros</h3>
            <p className={`${TEXT_SMALL} mt-1`}>Escolas, turmas e alunos</p>
          </Link>
        )}
        <Link to="/lancamentos" className={CARD_STYLE}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-100/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <LayoutDashboard />
          </div>
          <h3 className={TEXT_H3}>Avaliações</h3>
          <p className={`${TEXT_SMALL} mt-1`}>Lançamento de habilidades</p>
        </Link>
        <Link to="/diario" className={CARD_STYLE}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <BookOpen />
          </div>
          <h3 className={TEXT_H3}>Diário de Classe</h3>
          <p className={`${TEXT_SMALL} mt-1`}>Frequência e Rotina</p>
        </Link>
        <Link to="/relatorios" className={CARD_STYLE}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <BarChart3 />
          </div>
          <h3 className={TEXT_H3}>Relatórios</h3>
          <p className={`${TEXT_SMALL} mt-1`}>Análise gráfica e impressões</p>
        </Link>
        {canAccessUsers && (
          <Link to="/usuarios" className={CARD_STYLE}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <UserCog />
            </div>
            <h3 className={TEXT_H3}>Usuários</h3>
            <p className={`${TEXT_SMALL} mt-1`}>Gestão de acesso</p>
          </Link>
        )}
      </div>
    </div>
  );
};

const NotificationToasts = () => {
  const { notifications } = useApp();
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`
                        pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-xl border-l-4 animate-in slide-in-from-right-10 fade-in duration-300 backdrop-blur-md
                        ${n.type === 'success' ? 'bg-white/90 border-emerald-500 text-slate-800' : ''}
                        ${n.type === 'error' ? 'bg-white/90 border-rose-500 text-slate-800' : ''}
                        ${n.type === 'warning' ? 'bg-white/90 border-amber-500 text-slate-800' : ''}
                        ${n.type === 'info' ? 'bg-white/90 border-blue-500 text-slate-800' : ''}
                    `}
        >
          <div className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : ''}
                        ${n.type === 'error' ? 'bg-rose-100 text-rose-600' : ''}
                        ${n.type === 'warning' ? 'bg-amber-100 text-amber-600' : ''}
                        ${n.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
                    `}>
            {n.type === 'success' && <CheckCircle size={18} />}
            {n.type === 'error' && <AlertCircle size={18} />}
            {n.type === 'warning' && <AlertTriangle size={18} />}
            {n.type === 'info' && <Info size={18} />}
          </div>
          <div>
            <p className="font-medium text-sm font-sans">{n.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout, authLoading, showNotification } = useApp();

  // The app will now show a subtle loader while background checks complete to avoid Login bounce.

  const [showRegister, setShowRegister] = useState(false);

  // Only show the global loading screen if we don't have a user yet.
  // This prevents the screen from "flashing" during background auth refreshes.
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse gap-3">
          <GraduationCap className="w-12 h-12 text-emerald-500" />
          <p className="text-slate-500 text-sm font-medium">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <NotificationToasts />
        {showRegister ? (
          <Register
            onBackToLogin={() => setShowRegister(false)}
            showNotification={showNotification}
          />
        ) : (
          <Login
            onShowRegister={() => setShowRegister(true)}
          />
        )}
      </>
    );
  }

  const role = currentUser.role;
  const canAccessRegistration = role === 'admin' || role === 'manager' || role === 'coordinator';
  const canAccessUsers = role === 'admin';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative selection:bg-emerald-200">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-3xl animate-float" />
      </div>

      <NotificationToasts />

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-300 ease-in-out backdrop-blur-sm ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside className={`
        ${SIDEBAR_STYLE}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        print:hidden
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100/50 lg:border-none">
          <div className="flex items-center gap-3 text-slate-800 font-bold text-xl">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shadow-sm">
              <GraduationCap className="w-6 h-6 flex-shrink-0" />
            </div>
            <div className="flex flex-col">
              <span className="leading-none font-display tracking-tight">SIGMAEI</span>
              <span className="text-[0.6rem] leading-none text-slate-400 font-sans font-medium mt-1">SISTEMA DE GESTÃO</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display opacity-80">
            Principal
          </div>
          <SidebarItem
            icon={LayoutDashboard}
            label="Início"
            to="/"
            onClick={() => setMobileMenuOpen(false)}
          />

          {canAccessRegistration && (
            <SidebarItem
              icon={PenTool}
              label="Cadastros"
              to="/cadastros"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <div className="px-4 py-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display opacity-80">
            Pedagógico
          </div>

          <SidebarItem
            icon={BookOpen}
            label="Diário de Classe"
            to="/diario"
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarItem
            icon={LayoutDashboard}
            label="Avaliações"
            to="/lancamentos"
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarItem
            icon={BarChart3}
            label="Relatórios"
            to="/relatorios"
            onClick={() => setMobileMenuOpen(false)}
          />

          {canAccessUsers && (
            <>
              <div className="px-4 py-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display opacity-80">
                Sistema
              </div>
              <SidebarItem
                icon={UserCog}
                label="Usuários"
                to="/usuarios"
                onClick={() => setMobileMenuOpen(false)}
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100/50 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold font-display text-sm shadow-md">
              {(currentUser?.name || 'U').charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-700 truncate font-display">{currentUser?.name || 'Educação'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">{role === 'manager' ? 'Gestor' : role === 'coordinator' ? 'Coordenação' : role === 'teacher' ? 'Professor(a)' : 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold transition-all border border-transparent hover:border-rose-100"
          >
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-10">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between no-print sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-700 text-lg flex items-center gap-2 font-display">
            <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
              <GraduationCap className="w-4 h-4" />
            </div>
            SIGMAEI
          </span>
          <div className="w-10"></div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-0">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/cadastros" element={canAccessRegistration ? <Registration /> : <Navigate to="/" />} />
            <Route path="/diario" element={<ClassDiary />} />
            <Route path="/lancamentos" element={<Assessment />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/usuarios" element={canAccessUsers ? <UserManagement /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};


export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
