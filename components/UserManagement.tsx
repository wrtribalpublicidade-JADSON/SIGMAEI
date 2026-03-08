import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { UserRole } from '../types';
import { Users, UserPlus, Shield, UserCog, School, Save, Trash2, Pencil, X, Mail, AlertTriangle, RefreshCw, Key, Check, BookOpen, Loader2, Eye, EyeOff } from 'lucide-react';
import { TEXT_H1, TEXT_BODY, CARD_STYLE, INPUT_STYLE, LABEL_STYLE, BTN_PRIMARY_STYLE, BTN_SECONDARY_STYLE, GLASS_EFFECT } from '../utils/styles';
import { supabase, supabaseUrl, supabaseKey } from '../services/supabase';
import { createClient } from '@supabase/supabase-js';



export const UserManagement: React.FC = () => {
    const { showNotification, currentUser, seedDemoData } = useApp();

    // Access Control: Only Admin can see this page
    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Shield className="w-16 h-16 mb-4 text-slate-300" />
                <p className="text-lg">Acesso restrito a administradores.</p>
            </div>
        );
    }

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [currentUserData, setCurrentUserData] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [newUserData, setNewUserData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'teacher' as UserRole
    });

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) {
            showNotification('Erro ao carregar usuários.', 'error');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user: any) => {
        setCurrentUserData({ ...user });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentUserData.role) {
            showNotification('Selecione uma função.', 'error');
            return;
        }

        const originalUsers = [...users];
        const updatedUserId = currentUserData.id;

        // 1. Optimistic Update Local State
        setUsers(prev => prev.map(u => u.id === updatedUserId ? { ...u, role: currentUserData.role } : u));
        setIsEditing(false);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: currentUserData.role })
                .eq('id', updatedUserId);

            if (error) throw error;
            showNotification('Usuário atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Error updating user role:', error);
            setUsers(originalUsers); // Rollback
            showNotification('Erro ao atualizar usuário no banco de dados.', 'error');
        }
    };

    const handleCreateUser = async () => {
        if (!newUserData.name || !newUserData.email || !newUserData.password) {
            showNotification('Preencha todos os campos obrigatórios.', 'error');
            return;
        }

        if (newUserData.password.length < 6) {
            showNotification('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Utilizamos um cliente secundário para NÃO deslogar o admin atual
            const authClient = createClient(supabaseUrl, supabaseKey, {
                auth: { persistSession: false }
            });

            const { data, error } = await authClient.auth.signUp({
                email: newUserData.email,
                password: newUserData.password,
                options: {
                    data: {
                        name: newUserData.name,
                        role: newUserData.role
                    }
                }
            });

            if (error) throw error;

            showNotification('Usuário cadastrado com sucesso!', 'success');
            setIsCreating(false);
            setNewUserData({ name: '', email: '', password: '', role: 'teacher' });

            // Aguardar um pouco para o trigger do banco criar o perfil
            setTimeout(fetchUsers, 1500);

        } catch (error: any) {
            console.error('Error creating user:', error);
            showNotification(`Erro ao cadastrar usuário: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Atenção: Apenas administradores do banco de dados podem deletar contas Auth no momento. Esta ação removerá apenas o perfil do banco. Continuar?')) {
            const originalUsers = [...users];

            // 1. Optimistic Update Local State
            setUsers(prev => prev.filter(u => u.id !== id));

            try {
                const { error } = await supabase.from('profiles').delete().eq('id', id);
                if (error) throw error;
                showNotification('Perfil removido com sucesso.', 'success');
            } catch (error) {
                console.error('Error removing profile:', error);
                setUsers(originalUsers); // Rollback
                showNotification('Erro ao remover perfil do banco de dados.', 'error');
            }
        }
    };

    const handleResetSystem = async () => {
        if (window.confirm('ATENÇÃO: Isso irá apagar TODOS os dados locais e restaurar turmas/escolas mockup. Não afetará os usuários do Supabase. Deseja continuar?')) {
            await seedDemoData();
            showNotification('Dados locais restaurados para demonstração.', 'success');
        }
    }

    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/50 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2 border border-slate-200">
                        <Shield size={12} /> Administração
                    </div>
                    <h1 className={`${TEXT_H1} text-3xl md:text-4xl`}>
                        Gestão de <span className="text-slate-600">Usuários</span>
                    </h1>
                    <p className={`${TEXT_BODY} text-lg max-w-2xl mt-2`}>
                        Controle de acesso, permissões e configurações do sistema.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleResetSystem}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100 hover:bg-red-100 transition-colors"
                    >
                        <AlertTriangle size={14} /> Resetar Infos Locais
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className={`${BTN_PRIMARY_STYLE} flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md border-transparent`}
                    >
                        <UserPlus size={18} /> Novo Usuário
                    </button>
                </div>
            </div>

            <div className={`${GLASS_EFFECT} rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-6 border-b border-slate-100">Usuário</th>
                                <th className="p-6 border-b border-slate-100">Função</th>
                                <th className="p-6 border-b border-slate-100">Status</th>
                                <th className="p-6 border-b border-slate-100 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {loading && !isCreating ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
                                        Carregando usuários...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">
                                        Nenhum usuário encontrado na base de dados (profiles).
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700">{user.name}</div>
                                                <div className="text-xs text-slate-400 truncate max-w-[150px]">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            user.role === 'pedagogue' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                user.role === 'manager' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                            {user.role === 'admin' && <Shield size={10} />}
                                            {user.role === 'pedagogue' && <BookOpen size={10} />}
                                            {(user.role === 'manager' || user.role === 'teacher') && <School size={10} />}
                                            {user.role === 'admin' ? 'Administrador' : user.role === 'pedagogue' ? 'Coordenação' : user.role === 'manager' ? 'Diretor/Gestor' : 'Professor(a)'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-100`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Ativo
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Perfil">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Perfil">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: EDITAR / CRIAR USUÁRIO */}
            {(isEditing || isCreating) && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {isEditing ? <UserCog className="text-blue-500" /> : <UserPlus className="text-emerald-500" />}
                                {isEditing ? 'Editar Função' : 'Novo Cadastro de Usuário'}
                            </h3>
                            <button
                                onClick={() => { setIsEditing(false); setIsCreating(false); }}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {isCreating ? (
                                <>
                                    <div>
                                        <label className={LABEL_STYLE}>Nome Completo</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                className={`${INPUT_STYLE} pl-10`}
                                                placeholder="Ex: João da Silva"
                                                value={newUserData.name}
                                                onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_STYLE}>E-mail Institucional</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="email"
                                                className={`${INPUT_STYLE} pl-10`}
                                                placeholder="exemplo@sigmaei.com"
                                                value={newUserData.email}
                                                onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_STYLE}>Senha de Acesso</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className={`${INPUT_STYLE} pl-10 pr-10`}
                                                placeholder="Mínimo 6 caracteres"
                                                value={newUserData.password}
                                                onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                                            />
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className={LABEL_STYLE}>Usuário</label>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <img src={`https://ui-avatars.com/api/?name=${currentUserData.name}&background=random`} alt="" className="w-10 h-10 rounded-full" />
                                        <div>
                                            <div className="font-bold text-slate-700">{currentUserData.name}</div>
                                            <div className="text-xs text-slate-400">{currentUserData.email}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={LABEL_STYLE}>Função / Perfil (Acesso)</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <select
                                        className={`${INPUT_STYLE} pl-10 border-blue-200 bg-blue-50/20`}
                                        value={isCreating ? newUserData.role : currentUserData.role}
                                        onChange={e => isCreating
                                            ? setNewUserData({ ...newUserData, role: e.target.value as UserRole })
                                            : setCurrentUserData({ ...currentUserData, role: e.target.value as UserRole })
                                        }
                                    >
                                        <option value="teacher">Professor(a)</option>
                                        <option value="coordinator">Coordenação</option>
                                        <option value="manager">Diretor/Gestor</option>
                                        <option value="admin">Administrador Geral</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => { setIsEditing(false); setIsCreating(false); }}
                                className={BTN_SECONDARY_STYLE}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={isCreating ? handleCreateUser : handleSave}
                                className={`${BTN_PRIMARY_STYLE} ${isCreating ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <><Check size={18} /> {isCreating ? 'Cadastrar Usuário' : 'Salvar Alteração'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

