
import React, { useState, useMemo } from 'react';
import { useApp } from '../context';
import { School, ClassRoom, Student } from '../types';
import {
  PlusCircle,
  School as SchoolIcon,
  Users,
  UserPlus,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Trash2,
  MapPin,
  Phone,
  User,
  Hash,
  Building2,
  Clock,
  BookOpen,
  Layers,
  Pencil,
  X,
  Search,
  MoreVertical,
  Calendar,
  CreditCard,
  ChevronRight,
  Filter,
  Printer,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCPF, validateCPF } from '../utils/cpf';
import {
  TEXT_H1,
  TEXT_H2,
  TEXT_BODY,
  TEXT_SMALL,
  TEXT_LABEL,
  INPUT_STYLE,
  LABEL_STYLE,
  BTN_PRIMARY_STYLE
} from '../utils/styles';

export const Registration: React.FC = () => {
  const { schools, classes, students, addSchool, removeSchool, updateSchool, addClass, addClasses, removeClass, updateClass, addStudent, addStudents, removeStudent, updateStudent, showNotification, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'school' | 'class' | 'student'>('student');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // Form States
  const [schoolForm, setSchoolForm] = useState<Partial<School>>({});
  const [classForm, setClassForm] = useState<Partial<ClassRoom>>({ year: new Date().getFullYear(), shift: 'Matutino' });
  const [studentForm, setStudentForm] = useState<Partial<Student>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof Student, string>>>({});

  // Import States
  const [isImportMode, setIsImportMode] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<Partial<Student>[]>([]);
  const [isClassImportMode, setIsClassImportMode] = useState(false);
  const [previewClasses, setPreviewClasses] = useState<Partial<ClassRoom>[]>([]);

  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return '-';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    return `${years}a ${months}m`;
  };

  const availableStages = useMemo(() => {
    const defaultStages = ['Berçário', 'Creche I', 'Creche II', 'Pré I', 'Pré II'];
    const registeredStages = classes.map(c => c.stage).filter(Boolean);
    return Array.from(new Set([...defaultStages, ...registeredStages])).sort();
  }, [classes]);

  // Filters for lists
  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredClasses = (classForm.schoolId ? classes.filter(c => c.schoolId === classForm.schoolId) : classes)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredStudents = students.filter(s => s.classId === studentForm.classId)
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- SCHOOL LOGIC ---
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name || schoolForm.name.trim().length < 3) {
      showNotification('O nome da escola deve ter pelo menos 3 caracteres.', 'error');
      return;
    }
    if (!schoolForm.code || !/^\d+$/.test(schoolForm.code)) {
      showNotification('O Código INEP é obrigatório e deve ser numérico.', 'error');
      return;
    }

    if (schoolForm.id) {
      updateSchool(schoolForm as School);
      showNotification('Escola atualizada com sucesso!', 'success');
    } else {
      addSchool({ ...schoolForm, id: crypto.randomUUID() } as School);
      showNotification('Escola cadastrada com sucesso!', 'success');
    }
    setSchoolForm({});
  };

  // --- CLASS LOGIC ---
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.schoolId || !classForm.name || !classForm.stage) {
      showNotification('Preencha os campos obrigatórios (*).', 'error');
      return;
    }
    if (classForm.id) {
      updateClass(classForm as ClassRoom);
      showNotification('Turma atualizada!', 'success');
    } else {
      addClass({ ...classForm, id: crypto.randomUUID() } as ClassRoom);
      showNotification('Turma cadastrada!', 'success');
    }
    setClassForm({ schoolId: classForm.schoolId, year: new Date().getFullYear(), shift: 'Matutino' });
  };

  // --- STUDENT LOGIC ---
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof Student, string>> = {};

    if (!studentForm.classId) newErrors.classId = 'Selecione a turma';
    if (!studentForm.name) newErrors.name = 'Nome completo é obrigatório';
    if (!studentForm.birthDate) newErrors.birthDate = 'Data de nascimento obrigatória';
    if (studentForm.cpf && !validateCPF(studentForm.cpf)) newErrors.cpf = 'CPF inválido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showNotification('Verifique os campos obrigatórios.', 'error');
      return;
    }
    setErrors({});
    if (studentForm.id) {
      updateStudent(studentForm as Student);
      showNotification('Estudante atualizado!', 'success');
    } else {
      const count = students.filter(s => s.classId === studentForm.classId).length;
      addStudent({ ...studentForm, id: crypto.randomUUID(), listNumber: count + 1 } as Student);
      showNotification('Estudante matriculado!', 'success');
    }
    setStudentForm({ classId: studentForm.classId });
  };

  // Excel Logic (Keep existing functionality)
  const processExcelDate = (cell: any): string => {
    if (!cell) return '';
    if (cell instanceof Date) return cell.toISOString().split('T')[0];
    if (typeof cell === 'string' && cell.includes('/')) {
      const parts = cell.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  const handleStudentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const processed = json.map((row: any) => ({
        name: row['Nome'] || row['Estudante'] || row['Aluno'],
        birthDate: processExcelDate(row['Data de Nascimento'] || row['Nascimento'] || row['Data'])
      })).filter(s => s.name);
      setPreviewStudents(processed);
      showNotification(`${processed.length} registros encontrados.`, 'info');
    } catch (error) { showNotification('Erro ao ler planilha.', 'error'); }
  };

  const confirmStudentImport = () => {
    if (!studentForm.classId || previewStudents.length === 0) return;
    const currentCount = students.filter(s => s.classId === studentForm.classId).length;
    const newStudents = previewStudents.map((s, index) => ({
      id: crypto.randomUUID(),
      classId: studentForm.classId!,
      name: String(s.name!),
      birthDate: s.birthDate || new Date().toISOString().split('T')[0],
      listNumber: currentCount + index + 1
    }));
    addStudents(newStudents);
    setPreviewStudents([]);
    setIsImportMode(false);
    showNotification('Importação concluída!', 'success');
  };

  const handleClassFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const processed = json.map((row: any) => ({
        code: String(row['Código'] || row['Cod'] || ''),
        name: String(row['Nome'] || row['Turma'] || ''),
        stage: String(row['Etapa'] || ''),
        hours: String(row['Horário'] || ''),
        teacher: 'A Definir',
        shift: 'Matutino' as const,
        year: new Date().getFullYear()
      })).filter(c => c.name);
      setPreviewClasses(processed);
    } catch (error) { showNotification('Erro ao ler planilha.', 'error'); }
  };

  const confirmClassImport = () => {
    if (!classForm.schoolId || previewClasses.length === 0) return;
    const newClasses = previewClasses.map(c => ({
      ...c,
      id: crypto.randomUUID(),
      schoolId: classForm.schoolId!,
    } as ClassRoom));
    addClasses(newClasses);
    setPreviewClasses([]);
    setIsClassImportMode(false);
    showNotification('Turmas importadas!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-20">

      {/* Page Header */}
      <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistema de Gestão
            </div>
            <h1 className={`${TEXT_H1} text-4xl md:text-5xl mb-2`}>
              Cadastros<span className="text-emerald-600">.</span>
            </h1>
            <p className={`${TEXT_BODY} text-lg max-w-2xl`}>
              Gerencie a estrutura organizacional da sua rede de ensino.
            </p>
          </div>

          {/* Tab Switcher - Floating Pill Design */}
          <div className="bg-white p-1.5 rounded-2xl flex items-center shadow-xl shadow-slate-200/50 border border-slate-100 relative max-w-md w-full md:w-auto">
            {(['school', 'class', 'student'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                  className={`
                      relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 z-10 flex-1 md:flex-none flex items-center justify-center gap-2
                      ${isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                    `}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm -z-10 animate-in zoom-in-95 duration-200" />
                  )}
                  {tab === 'school' && <Building2 className={`w-4 h-4 ${isActive ? 'fill-emerald-200 text-emerald-600' : ''}`} />}
                  {tab === 'class' && <Users className={`w-4 h-4 ${isActive ? 'fill-emerald-200 text-emerald-600' : ''}`} />}
                  {tab === 'student' && <UserPlus className={`w-4 h-4 ${isActive ? 'fill-emerald-200 text-emerald-600' : ''}`} />}
                  <span>{tab === 'school' ? 'Escolas' : tab === 'class' ? 'Turmas' : 'Alunos'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="space-y-8">

        {/* FORM SIDE */}
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-1000 delay-150">

          {/* STUDENT FORM (NEW LAYOUT) */}
          {activeTab === 'student' ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 via-teal-500 to-cyan-500" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className={TEXT_H2}>Matrícula Rápida</h2>
                  <p className={TEXT_LABEL}>Nova inscrição de aluno no sistema</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
                  <button onClick={() => setIsImportMode(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!isImportMode ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Manual</button>
                  <button onClick={() => setIsImportMode(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isImportMode ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Excel</button>
                </div>
              </div>

              {!isImportMode ? (
                <form onSubmit={handleSaveStudent} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* 1. TURMA (3 cols) */}
                  <div className="md:col-span-6 xl:col-span-3 space-y-1.5">
                    <label className={LABEL_STYLE}>Turma</label>
                    <div className="relative group">
                      <select
                        className={`${INPUT_STYLE} appearance-none ${errors.classId ? '!border-red-500 !focus:border-red-500 !focus:ring-red-200' : ''}`}
                        value={studentForm.classId || ''}
                        onChange={e => {
                          setStudentForm({ ...studentForm, classId: e.target.value });
                          if (errors.classId) setErrors({ ...errors, classId: undefined });
                        }}
                      >
                        <option value="">Selecione...</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} - {schools.find(s => s.id === c.schoolId)?.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {errors.classId && <span className="text-xs text-red-500 font-bold ml-1">{errors.classId}</span>}
                  </div>

                  {/* 2. NOME (4 cols) */}
                  <div className="md:col-span-6 xl:col-span-4 space-y-1.5">
                    <label className={LABEL_STYLE}>Nome Completo</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <User size={16} className="text-slate-400" />
                      </div>
                      <input
                        placeholder="Nome do Estudante"
                        className={`${INPUT_STYLE} pl-11 ${errors.name ? '!border-red-500 !focus:border-red-500 !focus:ring-red-200' : ''}`}
                        value={studentForm.name || ''}
                        onChange={e => {
                          setStudentForm({ ...studentForm, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: undefined });
                        }}
                      />
                    </div>
                    {errors.name && <span className="text-xs text-red-500 font-bold ml-1">{errors.name}</span>}
                  </div>

                  {/* 3. NASCIMENTO (2 cols) */}
                  <div className="md:col-span-4 xl:col-span-2 space-y-1.5">
                    <label className={LABEL_STYLE}>Nascimento</label>
                    <div className="relative group">
                      <input
                        type="date"
                        className={`${INPUT_STYLE} pr-10 ${errors.birthDate ? '!border-red-500 !focus:border-red-500 !focus:ring-red-200' : ''}`}
                        value={studentForm.birthDate || ''}
                        onChange={e => {
                          setStudentForm({ ...studentForm, birthDate: e.target.value });
                          if (errors.birthDate) setErrors({ ...errors, birthDate: undefined });
                        }}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Calendar size={16} className="text-slate-400" />
                      </div>
                    </div>
                    {errors.birthDate && <span className="text-xs text-red-500 font-bold ml-1">{errors.birthDate}</span>}
                  </div>

                  {/* 4. CPF (2 cols) */}
                  <div className="md:col-span-4 xl:col-span-2 space-y-1.5">
                    <label className={LABEL_STYLE}>CPF</label>
                    <div className="relative group">
                      <input
                        placeholder="000.000.000-00"
                        className={`${INPUT_STYLE} font-mono text-center ${errors.cpf ? '!border-red-500 !focus:border-red-500 !focus:ring-red-200' : ''}`}
                        maxLength={14}
                        value={studentForm.cpf || ''}
                        onChange={e => {
                          const formatted = formatCPF(e.target.value);
                          setStudentForm({ ...studentForm, cpf: formatted });
                          if (errors.cpf) setErrors({ ...errors, cpf: undefined });
                        }}
                      />
                    </div>
                    {errors.cpf && <span className="text-xs text-red-500 font-bold ml-1">{errors.cpf}</span>}
                  </div>

                  {/* 5. BUTTON (1 col / auto) */}
                  <div className="md:col-span-4 xl:col-span-1 pt-6">
                    <button type="submit" className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn">
                      <PlusCircle size={20} className="group-hover/btn:rotate-90 transition-transform" />
                      <span className="xl:hidden">Matricular</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Importação em Massa</h3>
                    <p className={`${TEXT_SMALL} mt-1 max-w-md mx-auto`}>Selecione um arquivo Excel (.xlsx) contendo as colunas Nome e Data de Nascimento.</p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <label className="btn-secondary cursor-pointer">
                      Escolher Arquivo
                      <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleStudentFileUpload} />
                    </label>
                    {previewStudents.length > 0 && (
                      <button onClick={confirmStudentImport} className={`${BTN_PRIMARY_STYLE} bg-emerald-600 h-10`}>
                        Importar {previewStudents.length} Alunos
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // EXISTING FORM FOR SCHOOL/CLASS
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {activeTab === 'school' && 'Nova Unidade'}
                    {activeTab === 'class' && 'Nova Turma'}
                  </h2>
                  <p className={TEXT_LABEL}>Preencha os dados</p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                  {(schoolForm.id || classForm.id) && (
                    <button
                      onClick={() => { setSchoolForm({}); setClassForm({ year: new Date().getFullYear() }); setStudentForm({}); }}
                      className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}

                  {activeTab === 'class' && (
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setIsClassImportMode(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!isClassImportMode ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Manual</button>
                      <button onClick={() => setIsClassImportMode(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isClassImportMode ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Excel</button>
                    </div>
                  )}
                </div>
              </div>

              {/* --- TAB: SCHOOL FORM --- */}
              {activeTab === 'school' && (
                <form onSubmit={handleSaveSchool} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* 1. NOME DA ESCOLA (Full width) */}
                  <div className="md:col-span-12 space-y-1.5">
                    <label className={LABEL_STYLE}>Nome da Instituição</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Building2 size={16} className="text-slate-400" />
                      </div>
                      <input
                        required
                        placeholder="Ex: E.M. Estrela do Saber"
                        className={`${INPUT_STYLE} pl-11`}
                        value={schoolForm.name || ''}
                        onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 2. INEP (4 cols) */}
                  <div className="md:col-span-6 xl:col-span-4 space-y-1.5">
                    <label className={LABEL_STYLE}>INEP / Código</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Hash size={16} className="text-slate-400" />
                      </div>
                      <input
                        required
                        placeholder="00000000"
                        className={`${INPUT_STYLE} font-mono tracking-wider pl-11`}
                        maxLength={8}
                        value={schoolForm.code || ''}
                        onChange={e => setSchoolForm({ ...schoolForm, code: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>

                  {/* 3. TELEFONE (4 cols) */}
                  <div className="md:col-span-6 xl:col-span-4 space-y-1.5">
                    <label className={LABEL_STYLE}>Telefone</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Phone size={16} className="text-slate-400" />
                      </div>
                      <input
                        placeholder="(00) 0000-0000"
                        className={`${INPUT_STYLE} pl-11`}
                        value={schoolForm.contact || ''}
                        onChange={e => setSchoolForm({ ...schoolForm, contact: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 4. ENDEREÇO (4 cols) - Adjusted for layout balance */}
                  <div className="md:col-span-12 xl:col-span-4 space-y-1.5">
                    <label className={LABEL_STYLE}>Endereço</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <MapPin size={16} className="text-slate-400" />
                      </div>
                      <input
                        placeholder="Endereço Completo"
                        className={`${INPUT_STYLE} pl-11`}
                        value={schoolForm.address || ''}
                        onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 5. GESTÃO (6 cols each) */}
                  <div className="md:col-span-6 space-y-1.5">
                    <label className={LABEL_STYLE}>Direção</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <User size={16} className="text-slate-400" />
                      </div>
                      <input
                        placeholder="Nome do Diretor(a)"
                        className={`${INPUT_STYLE} pl-11`}
                        value={schoolForm.director || ''}
                        onChange={e => setSchoolForm({ ...schoolForm, director: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-6 space-y-1.5">
                    <label className={LABEL_STYLE}>Coordenação</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <User size={16} className="text-slate-400" />
                      </div>
                      <input
                        placeholder="Nome do Coordenador(a)"
                        className={`${INPUT_STYLE} pl-11`}
                        value={schoolForm.coordinator || ''}
                        onChange={e => setSchoolForm({ ...schoolForm, coordinator: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* BUTTON */}
                  <div className="md:col-span-12 pt-4">
                    <button type="submit" className={`${BTN_PRIMARY_STYLE} w-full`}>
                      {schoolForm.id ? 'Salvar Alterações' : 'Cadastrar Escola'}
                    </button>
                  </div>
                </form>
              )}

              {/* --- TAB: CLASS FORM --- */}
              {activeTab === 'class' && (
                <div className="space-y-6">

                  {!isClassImportMode ? (
                    <form onSubmit={handleSaveClass} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* 1. ESCOLA (Full width) */}
                      <div className="md:col-span-12 space-y-1.5">
                        <label className={LABEL_STYLE}>Escola Vinculada</label>
                        <div className="relative group">
                          <select
                            required
                            className={`${INPUT_STYLE} appearance-none`}
                            value={classForm.schoolId || ''}
                            onChange={e => setClassForm({ ...classForm, schoolId: e.target.value })}
                          >
                            <option value="">Selecione a Escola...</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* 2. NOME DA TURMA (6 cols) */}
                      <div className="md:col-span-6 space-y-1.5">
                        <label className={LABEL_STYLE}>Nome da Turma</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Users size={16} className="text-slate-400" />
                          </div>
                          <input
                            required
                            placeholder="Ex: Creche II A"
                            className={`${INPUT_STYLE} pl-11`}
                            value={classForm.name || ''}
                            onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* 3. ETAPA (6 cols) */}
                      <div className="md:col-span-6 space-y-1.5">
                        <label className={LABEL_STYLE}>Etapa de Ensino</label>
                        <div className="relative group">
                          <select
                            required
                            className={`${INPUT_STYLE} appearance-none`}
                            value={classForm.stage || ''}
                            onChange={e => setClassForm({ ...classForm, stage: e.target.value })}
                          >
                            <option value="">Selecione...</option>
                            {availableStages.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* 4. TURNO (6 cols) */}
                      <div className="md:col-span-6 space-y-1.5">
                        <label className={LABEL_STYLE}>Turno</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Clock size={16} className="text-slate-400" />
                          </div>
                          <select
                            className={`${INPUT_STYLE} pl-11 appearance-none`}
                            value={classForm.shift || 'Matutino'}
                            onChange={e => setClassForm({ ...classForm, shift: e.target.value as any })}
                          >
                            <option value="Matutino">Matutino</option>
                            <option value="Vespertino">Vespertino</option>
                            <option value="Integral">Integral</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* 5. ANO LETIVO (6 cols) */}
                      <div className="md:col-span-6 space-y-1.5">
                        <label className={LABEL_STYLE}>Ano Letivo</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Calendar size={16} className="text-slate-400" />
                          </div>
                          <input
                            type="number"
                            className={`${INPUT_STYLE} pl-11`}
                            value={classForm.year || ''}
                            onChange={e => setClassForm({ ...classForm, year: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-12 pt-4">
                        <button type="submit" className={`${BTN_PRIMARY_STYLE} w-full`}>
                          {classForm.id ? 'Atualizar Turma' : 'Criar Nova Turma'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-4">
                        <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-2 mb-2">
                          <FileSpreadsheet className="w-4 h-4" /> Instruções
                        </h4>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                          A planilha deve conter as colunas: <strong>Código, Nome, Etapa, Horário</strong>. O sistema irá ignorar linhas sem nome.
                        </p>
                      </div>

                      <select required className={`${INPUT_STYLE} mb-4`} value={classForm.schoolId || ''} onChange={e => setClassForm({ ...classForm, schoolId: e.target.value })}>
                        <option value="">Selecione a Escola de Destino...</option>
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>

                      <label className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-emerald-50/50 hover:border-emerald-300 transition-all cursor-pointer group">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Clique para selecionar</p>
                        <p className="text-xs text-slate-400 mt-1">Arquivos .xlsx ou .xls</p>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleClassFileUpload} />
                      </label>

                      {previewClasses.length > 0 && (
                        <button onClick={confirmClassImport} className={`${BTN_PRIMARY_STYLE} w-full bg-emerald-600`}>
                          Confirmar Importação de {previewClasses.length} Turmas
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Helper Section - Only for School/Class */}
          {activeTab !== 'student' && (
            <div className="bg-white/50 border border-slate-200 p-6 rounded-2xl backdrop-blur-sm">
              <h4 className="font-bold text-slate-700 text-xs flex items-center gap-2 mb-3 tracking-widest uppercase">
                <AlertCircle className="w-4 h-4 text-emerald-500" /> Dicas Úteis
              </h4>
              <ul className="text-xs text-slate-500 space-y-2.5 list-none">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  <span>Mantenha o <strong>Código INEP</strong> sempre atualizado para garantir a validade dos relatórios oficiais.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  <span>Ao excluir uma turma, os alunos vinculados perderão a enturmação, mas não serão excluídos do sistema.</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* LIST SIDE */}
        <div className="space-y-6">

          {activeTab === 'student' ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">

              {/* 1. SEARCH & INFO ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    placeholder="Pesquisar por nome, CPF ou matrícula..."
                    className="w-full h-16 pl-14 pr-32 rounded-3xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-slate-600 font-medium placeholder:text-slate-400 text-sm transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {filteredStudents.length} Alunos
                  </div>
                </div>
                <div className="lg:col-span-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 flex items-center gap-4 text-emerald-800 text-xs leading-relaxed shadow-sm">
                  <div className="bg-emerald-100 p-2 rounded-full shrink-0 text-emerald-600"><AlertCircle size={18} /></div>
                  <p>Mantenha o <strong>Código INEP</strong> atualizado para garantir a validade dos relatórios oficiais.</p>
                </div>
              </div>

              {/* 2. TABLE CARD */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header / Filters */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Filtrar:</span>
                    <button className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shrink-0">Todas as Turmas</button>
                    <button className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shrink-0">
                      Status: Ativos <ChevronDown size={14} className="text-slate-400" />
                    </button>
                  </div>
                  <div className="flex gap-2 self-end md:self-auto">
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><Filter size={18} /></button>
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><Printer size={18} /></button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5 w-20 text-center">#</th>
                        <th className="px-8 py-5">Nome do Aluno</th>
                        <th className="px-8 py-5">Nascimento / CPF</th>
                        <th className="px-8 py-5 text-center">Idade</th>
                        <th className="px-8 py-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5 text-center">
                            <span className="text-xs font-mono font-bold text-slate-300">{String(s.listNumber || idx + 1).padStart(2, '0')}</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`
                                      w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold
                                      ${idx % 3 === 0 ? 'bg-indigo-100 text-indigo-600' : ''}
                                      ${idx % 3 === 1 ? 'bg-emerald-100 text-emerald-600' : ''}
                                      ${idx % 3 === 2 ? 'bg-amber-100 text-amber-600' : ''}
                                   `}>
                                {s.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm">{s.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Matrícula: {new Date().getFullYear()}-{String(idx + 1).padStart(3, '0')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">
                                {s.birthDate ? new Date(s.birthDate).toLocaleDateString() : '-'}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 font-mono">{s.cpf || '---.---.--- - --'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="inline-flex px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                              {calculateAge(s.birthDate)} Anos
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 text-slate-300">
                              <button onClick={() => { setStudentForm(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={16} /></button>
                              <button onClick={() => removeStudent(s.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredStudents.length === 0 && (
                  <div className="py-20 text-center text-slate-400">
                    Nenhum aluno encontrado para os filtros selecionados.
                  </div>
                )}

                {/* Footer / Pagination */}
                <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Mostrando 1-{Math.min(10, filteredStudents.length)} de {filteredStudents.length}
                  </span>
                  {filteredStudents.length > 0 && (
                    <div className="flex items-center gap-2 select-none">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-colors"><ArrowLeft size={16} /></button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-200 text-xs font-bold">1</button>
                      {filteredStudents.length > 10 && <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-bold">2</button>}
                      {filteredStudents.length > 20 && <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-bold">3</button>}
                      {filteredStudents.length > 30 && <span className="w-8 h-8 flex items-center justify-center text-slate-300">...</span>}
                      {filteredStudents.length > 100 && <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-bold">12</button>}
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-colors"><ArrowRight size={16} /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. SYSTEM STATUS FOOTER */}
              <div className="flex justify-center py-4 opacity-0 animate-in fade-in duration-1000 delay-500 fill-mode-forwards">
                <div className="inline-flex items-center gap-6 px-8 py-3 rounded-full bg-white border border-slate-200 shadow-sm text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Cadastros Ativos</span>
                  <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Backup Diário OK</span>
                  <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Version 2.4.0</span>
                </div>
              </div>
            </div>
          ) : (
            // EXISTING LIST LAYOUT FOR SCHOOL/CLASS
            <>
              {/* Search & Filter Bar - Floating */}
              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col md:flex-row items-center gap-2 sticky top-8 z-20 backdrop-blur-xl bg-white/80 supports-[backdrop-filter]:bg-white/60">
                {/* Search Input */}
                <div className="relative flex-1 w-full group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder={`Pesquisar ${activeTab === 'school' ? 'escolas' : 'turmas'}...`}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Count Badge */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 hidden md:flex">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {activeTab === 'school' && `${filteredSchools.length} Unidades`}
                    {activeTab === 'class' && `${filteredClasses.length} Turmas`}
                  </span>
                </div>
              </div>

              {/* --- LIST: SCHOOLS --- */}
              {activeTab === 'school' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-700">
                  {filteredSchools.map((school, i) => (
                    <div key={school.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1 bg-white shadow-sm border border-slate-100 rounded-lg p-1">
                          <button onClick={() => { setSchoolForm(school); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-md transition-colors"><Pencil size={14} /></button>
                          {isAdmin && <button onClick={() => removeSchool(school.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold border border-emerald-100"><SchoolIcon size={20} /></div>
                        <div>
                          <h3 className="font-bold text-slate-900 leading-snug pr-8">{school.name}</h3>
                          <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-200">INEP: {school.code}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-slate-500 border-t border-slate-50 pt-3 mt-2">
                        <p className="flex items-center gap-2 truncate"><MapPin size={12} className="text-emerald-500/50" /> {school.address || 'Sem endereço'}</p>
                        <p className="flex items-center gap-2 truncate"><Phone size={12} className="text-emerald-500/50" /> {school.contact || 'Sem contato'}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><User size={10} /> {school.director?.split(' ')[0] || 'S/D'}</div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div>Coord: {school.coordinator?.split(' ')[0] || 'S/C'}</div>
                      </div>
                    </div>
                  ))}
                  {filteredSchools.length === 0 && (
                    <div className="md:col-span-2 py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-slate-300" /></div>
                      <p className="text-slate-500 font-medium">Nenhuma escola encontrada.</p>
                    </div>
                  )}
                </div>
              )}

              {/* --- LIST: CLASSES --- */}
              {activeTab === 'class' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-4 pl-8">Turma / Turno</th>
                          <th className="px-6 py-4">Etapa</th>
                          <th className="px-6 py-4">Escola</th>
                          <th className="px-6 py-4 text-center">Matrículas</th>
                          <th className="px-6 py-4 text-right pr-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredClasses.map(cls => (
                          <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-5 pl-8">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold border border-indigo-100"><span className="text-xs">{cls.year.toString().slice(-2)}</span></div>
                                <div>
                                  <div className="font-bold text-slate-800">{cls.name}</div>
                                  <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5"><Clock size={10} /> {cls.shift}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${cls.stage.includes('Creche') ? 'bg-amber-50 text-amber-600 border-amber-100' : cls.stage.includes('Pré') ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{cls.stage}</span>
                            </td>
                            <td className="px-6 py-5"><div className="text-xs font-medium text-slate-600 truncate max-w-[180px]">{schools.find(s => s.id === cls.schoolId)?.name || 'N/A'}</div></td>
                            <td className="px-6 py-5 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Users size={12} className="text-slate-400" /><span className="text-xs font-bold text-slate-700">{students.filter(s => s.classId === cls.id).length}</span></div>
                            </td>
                            <td className="px-6 py-5 pr-8 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setClassForm(cls); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors"><Pencil size={16} /></button>
                                <button onClick={() => removeClass(cls.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        /* Removed invalid @apply rules */
      `}</style>
    </div >
  );
};
