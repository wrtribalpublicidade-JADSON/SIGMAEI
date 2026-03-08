import React, { useState, useMemo } from 'react';
import { useApp } from '../context';
import { SKILL_FIELDS, getBnccGroup } from '../constants';
import { Period, SkillLevel } from '../types';
import { ChevronDown, Save, User, Search, Filter } from 'lucide-react';
import { TEXT_H1, TEXT_BODY, TEXT_SMALL, CARD_STYLE, INPUT_STYLE, LABEL_STYLE, BTN_PRIMARY_STYLE, BTN_SECONDARY_STYLE, GLASS_EFFECT } from '../utils/styles';

export const Assessment: React.FC = () => {
  const { classes, students, assessments, updateAssessment, currentUser } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(1);
  const [searchTerm, setSearchTerm] = useState('');

  // FILTER CLASSES BASED ON ROLE
  const availableClasses = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'teacher') {
      const userName = (currentUser.name || '').toLowerCase();
      return classes.filter(c =>
        (c.teacher || '').toLowerCase().includes(userName) ||
        userName.includes((c.teacher || '').toLowerCase())
      );
    }
    return classes;
  }, [classes, currentUser]);

  const filteredStudents = useMemo(() => {
    const classSt = students.filter(s => s.classId === selectedClassId);
    if (!searchTerm) return classSt;
    return classSt.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, selectedClassId, searchTerm]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Helper to calculate age
  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    return `${years} anos e ${months} meses`;
  };

  const handleLevelChange = (skillCode: string, level: SkillLevel) => {
    if (selectedStudentId) {
      updateAssessment(selectedStudentId, selectedPeriod, skillCode, level);
    }
  };

  // Filter skills based on class stage
  const bnccGroup = selectedClass ? getBnccGroup(selectedClass.stage) : 'EI02';

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/50 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-2 border border-cyan-200">
            <Filter size={12} /> Avaliação Contínua
          </div>
          <h1 className={`${TEXT_H1} text-3xl md:text-4xl`}>
            Lançamento de <span className="text-cyan-600">Habilidades</span>
          </h1>
          <p className={`${TEXT_BODY} text-lg max-w-2xl mt-2`}>
            Registre o desenvolvimento das crianças com base nos objetivos da BNCC.
          </p>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p as Period)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedPeriod === p ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-500 hover:text-cyan-600 hover:bg-cyan-50'}`}
            >
              {p}º Bim
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Selection */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`${GLASS_EFFECT} p-6 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50`}>
            <label className={LABEL_STYLE}>Selecione a Turma</label>
            <div className="relative">
              <select
                className={`${INPUT_STYLE} appearance-none bg-white/80`}
                value={selectedClassId}
                onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}
              >
                <option value="">Selecione...</option>
                {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 w-4 h-4 mt-3" />
            </div>
          </div>

          {selectedClassId && (
            <div className={`${GLASS_EFFECT} rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col max-h-[calc(100vh-300px)]`}>
              <div className="p-4 border-b border-slate-100 bg-cyan-50/30 backdrop-blur-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    placeholder="Buscar aluno..."
                    className="w-full bg-white pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 border border-transparent
                        ${selectedStudentId === student.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-200'
                        : 'hover:bg-slate-50 text-slate-600 hover:border-slate-100'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-colors
                        ${selectedStudentId === student.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {(student.name || 'A').charAt(0)}
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${selectedStudentId === student.id ? 'text-white' : 'text-slate-800'}`}>{student.name || 'Aluno'}</div>
                      <div className={`text-[10px] font-medium ${selectedStudentId === student.id ? 'text-cyan-100' : 'text-slate-400'}`}>{calculateAge(student.birthDate)}</div>
                    </div>
                  </button>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-sm">Nenhum aluno encontrado.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main: Skill Grid */}
        <div className="lg:col-span-9">
          {selectedStudent ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

              {/* Student Header Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/50">
                      <span className="text-2xl font-bold text-white font-display">{(selectedStudent.name || 'A').charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-display">{selectedStudent.name}</h2>
                      <div className="flex items-center gap-3 mt-1 text-slate-300 text-sm">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-white">{selectedClass?.name}</span>
                        <span>•</span>
                        <span>{selectedClass?.stage} - {bnccGroup}</span>
                        <span>•</span>
                        <span>{calculateAge(selectedStudent.birthDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="text-xs font-bold uppercase text-cyan-400 tracking-wider mb-1">Período Ativo</div>
                    <div className="text-3xl font-bold font-display">{selectedPeriod}º Bimestre</div>
                  </div>
                </div>
              </div>

              {SKILL_FIELDS.map(field => {
                // Filter skills for the current class stage
                const stageSkills = field.skills.filter(s => s.code.startsWith(bnccGroup));

                if (stageSkills.length === 0) return null;

                return (
                  <div key={field.id} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                    <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: field.color }} />
                        <h3 className="font-bold text-lg text-slate-800">{field.name}</h3>
                      </div>
                      <span className="text-[10px] font-black tracking-widest px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-400 shadow-sm">{field.id}</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {stageSkills.map(skill => {
                        const currentVal = assessments[selectedStudent.id]?.[selectedPeriod]?.[skill.code];
                        return (
                          <div key={skill.code} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/80 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{skill.code}</span>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{skill.description}</p>
                            </div>

                            <div className="flex gap-2 shrink-0 bg-slate-50 p-2 rounded-xl self-start md:self-auto border border-slate-100">
                              {(['D', 'ED', 'AD'] as SkillLevel[]).map(level => (
                                <button
                                  key={level}
                                  onClick={() => handleLevelChange(skill.code, level)}
                                  className={`
                                    w-10 h-10 rounded-lg text-xs font-bold border transition-all duration-200 flex items-center justify-center transform active:scale-95
                                    ${currentVal === level
                                      ? level === 'D' ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110'
                                        : level === 'ED' ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-200 scale-110'
                                          : 'bg-rose-500 border-rose-600 text-white shadow-lg shadow-rose-200 scale-110'
                                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50'
                                    }
                                  `}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-center pt-8 pb-8 opacity-50">
                <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                  <Save className="w-4 h-4 animate-bounce" /> Alterações salvas automaticamente
                </div>
              </div>

            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 border-4 border-dashed border-slate-200/60 rounded-3xl bg-slate-50/50 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <User className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Nenhum aluno selecionado</h3>
              <p className="text-slate-500 max-w-md text-center">Selecione um estudante na lista lateral para iniciar ou continuar o processo de avaliação.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
