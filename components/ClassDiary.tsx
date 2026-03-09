import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context';
import { Period, AttendanceRecord, DailyLog, ExperienceLog, DescriptiveReport } from '../types';
import { SKILL_FIELDS } from '../constants';
import { Calendar, CheckCircle, XCircle, Clock, BookOpen, FileText, Save, Users, PenTool, Check, Trash2, Plus, Brain, Heart, Activity, Filter, Download, MessageSquare } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { TEXT_H1, TEXT_BODY, TEXT_SMALL, INPUT_STYLE, LABEL_STYLE, BTN_PRIMARY_STYLE, BTN_SECONDARY_STYLE, GLASS_EFFECT } from '../utils/styles';

export const ClassDiary: React.FC = () => {
  const { classes, students, schools, attendance, dailyLogs, experienceLogs, descriptiveReports, saveAttendance, saveDailyLog, saveExperienceLog, saveDescriptiveReport, showNotification, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'attendance' | 'routine' | 'experience' | 'report'>('attendance');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // FILTER CLASSES BASED ON ROLE
  const availableClasses = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'teacher') {
      // Simple case-insensitive match for the prototype
      return classes.filter(c =>
        c.teacher.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(c.teacher.toLowerCase())
      );
    }
    return classes;
  }, [classes, currentUser]);

  const currentClass = classes.find(c => c.id === selectedClassId);

  // Memoize classStudents to prevent useEffect from re-running on every render (which resets attendance state)
  const classStudents = useMemo(() =>
    students.filter(s => s.classId === selectedClassId),
    [students, selectedClassId]);

  // --- ATTENDANCE STATE ---
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: 'P' | 'F' | 'J' }>({});

  // --- ROUTINE STATE (Individual) ---
  const [routineText, setRoutineText] = useState('');
  const [pedagogicalText, setPedagogicalText] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // --- EXPERIENCE LOG STATE ---
  const [expFieldId, setExpFieldId] = useState('');
  const [expSkillCode, setExpSkillCode] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expMethodology, setExpMethodology] = useState('');
  const [expMaterials, setExpMaterials] = useState('');
  const [expObservations, setExpObservations] = useState('');
  const [expPhotos, setExpPhotos] = useState<string[]>([]);

  // --- REPORT STATE (New Structure) ---
  const [reportTab, setReportTab] = useState<'cognitive' | 'socioemotional' | 'motor' | 'language'>('cognitive');
  const [reportForm, setReportForm] = useState<DescriptiveReport>({
    studentId: '',
    period: 1,
    status: 'Rascunho',
    cognitive: '',
    socioemotional: '',
    motor: '',
    language: '',
    strengths: '',
    areasToDevelop: '',
    recommendations: '',
    generalSynthesis: ''
  });

  // Initial Data Loaders
  useEffect(() => {
    if (activeTab === 'attendance' && selectedClassId && selectedDate) {
      const currentRecords = attendance.filter(r => r.classId === selectedClassId && r.date === selectedDate);
      const newState: { [key: string]: 'P' | 'F' | 'J' } = {};
      classStudents.forEach(s => {
        const record = currentRecords.find(r => r.studentId === s.id);
        newState[s.id] = record?.status || 'P'; // Default Present
      });
      setAttendanceState(newState);
    }
  }, [activeTab, selectedClassId, selectedDate, attendance, classStudents]);

  useEffect(() => {
    // Load individual routine if student selected
    if (activeTab === 'routine' && selectedClassId && selectedDate) {
      if (selectedStudentId) {
        const log = dailyLogs.find(l => l.studentId === selectedStudentId && l.date === selectedDate);
        if (log) {
          setRoutineText(log.routine);
          setPedagogicalText(log.pedagogicalRecord);
          setSelectedFields(log.skillFieldIds);
        } else {
          setRoutineText('');
          setPedagogicalText('');
          setSelectedFields([]);
        }
      } else {
        // Clear if no student selected
        setRoutineText('');
        setPedagogicalText('');
        setSelectedFields([]);
      }
    }
  }, [activeTab, selectedClassId, selectedDate, dailyLogs, selectedStudentId]);

  useEffect(() => {
    // Load Experience Log
    if (activeTab === 'experience' && selectedClassId && selectedDate) {
      const log = experienceLogs.find(l => l.classId === selectedClassId && l.date === selectedDate);
      if (log) {
        setExpFieldId(log.fieldId);
        setExpSkillCode(log.skillCode);
        setExpDescription(log.description);
        setExpMethodology(log.methodology);
        setExpMaterials(log.materials);
        setExpObservations(log.observations);
        setExpPhotos(log.photos || []);
      } else {
        setExpFieldId('');
        setExpSkillCode('');
        setExpDescription('');
        setExpMethodology('');
        setExpMaterials('');
        setExpObservations('');
        setExpPhotos([]);
      }
    }
  }, [activeTab, selectedClassId, selectedDate, experienceLogs]);

  useEffect(() => {
    if (activeTab === 'report' && selectedStudentId && selectedPeriod) {
      const report = descriptiveReports.find(r => r.studentId === selectedStudentId && r.period === selectedPeriod);
      if (report) {
        setReportForm(report);
      } else {
        // Reset form
        setReportForm({
          studentId: selectedStudentId,
          period: selectedPeriod,
          status: 'Rascunho',
          cognitive: '',
          socioemotional: '',
          motor: '',
          language: '',
          strengths: '',
          areasToDevelop: '',
          recommendations: '',
          generalSynthesis: ''
        });
      }
    }
  }, [selectedStudentId, selectedPeriod, descriptiveReports, activeTab]);


  // --- HANDLERS ---

  const handleAttendanceChange = (studentId: string, status: 'P' | 'F' | 'J') => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    if (!selectedClassId) {
      showNotification('Selecione uma turma para salvar a frequência.', 'error');
      return;
    }
    const records: Partial<AttendanceRecord>[] = Object.entries(attendanceState).map(([studentId, status]) => ({
      date: selectedDate,
      classId: selectedClassId,
      studentId,
      status: status as 'P' | 'F' | 'J'
    }));
    saveAttendance(records);
    // Notification is handled in context or here
  };

  const handleSaveRoutine = () => {
    if (!selectedClassId || !selectedStudentId) {
      showNotification('Selecione um estudante para salvar o diário.', 'error');
      return;
    }
    const log: Partial<DailyLog> = {
      date: selectedDate,
      classId: selectedClassId,
      studentId: selectedStudentId,
      routine: routineText,
      pedagogicalRecord: pedagogicalText,
      skillFieldIds: selectedFields
    };
    saveDailyLog(log);
    // Notification is handled in context
  };

  const handleSaveExperienceLog = () => {
    if (!selectedClassId) {
      showNotification('Selecione uma turma.', 'error');
      return;
    }
    if (!expFieldId || !expDescription) {
      showNotification('Preencha os campos obrigatórios (Campo de Experiência e Descrição).', 'error');
      return;
    }

    const log: Partial<ExperienceLog> = {
      date: selectedDate,
      classId: selectedClassId,
      fieldId: expFieldId,
      skillCode: expSkillCode,
      description: expDescription,
      methodology: expMethodology,
      materials: expMaterials,
      observations: expObservations,
      photos: expPhotos
    };

    saveExperienceLog(log);
    showNotification('Registro de Campos de Experiência salvo com sucesso!', 'success');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Convert to Base64 for local storage simplicity
      const reader = new FileReader();
      reader.onloadend = () => {
        setExpPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setExpPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveReport = (statusOverride?: 'Rascunho' | 'Finalizado') => {
    if (!selectedStudentId) {
      showNotification("Selecione um aluno.", 'error');
      return;
    }

    const finalStatus = statusOverride || reportForm.status;

    // Update the local form state visually if we forced a status
    if (statusOverride) {
      setReportForm(prev => ({ ...prev, status: statusOverride }));
    }

    saveDescriptiveReport({
      ...reportForm,
      status: finalStatus,
      studentId: selectedStudentId,
      period: selectedPeriod
    });

    const message = statusOverride === 'Rascunho'
      ? 'Rascunho salvo com sucesso!'
      : 'Parecer descritivo salvo com sucesso!';

    showNotification(message, 'success');
  };

  const handleDownloadPDF = () => {
    if (!selectedStudentId || !selectedClassId) {
      showNotification("Selecione um aluno e uma turma.", 'error');
      return;
    }

    const student = classStudents.find(s => s.id === selectedStudentId);
    const school = schools.find(s => s.id === currentClass?.schoolId);

    const doc = new jsPDF();

    // Configurações de layout
    const leftMargin = 20;
    const rightMargin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - leftMargin - rightMargin;
    let yPos = 20;

    // --- CABEÇALHO ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(school?.name.toUpperCase() || "ESCOLA", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    doc.setFontSize(12);
    doc.text("PARECER DESCRITIVO INDIVIDUAL", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    // --- DADOS DO ALUNO ---
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`ALUNO(A):`, leftMargin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(student?.name.toUpperCase() || "", leftMargin + 25, yPos);
    yPos += 6;

    doc.setFont("helvetica", "bold");
    doc.text(`TURMA:`, leftMargin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(currentClass?.name || "", leftMargin + 25, yPos);

    doc.setFont("helvetica", "bold");
    doc.text(`PERÍODO:`, pageWidth - rightMargin - 40, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${selectedPeriod}º BIMESTRE`, pageWidth - rightMargin - 18, yPos);
    yPos += 8;

    doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
    yPos += 10;

    // --- FUNÇÃO AUXILIAR PARA SEÇÕES ---
    const addSection = (title: string, content: string) => {
      if (!content || content.trim() === "") return;

      // Verifica se cabe na página (título + pelo menos 2 linhas)
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setFillColor(245, 247, 250); // Cinza muito claro
      doc.rect(leftMargin, yPos - 4, contentWidth, 7, 'F');
      doc.text(title, leftMargin + 2, yPos + 1);
      yPos += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const splitText = doc.splitTextToSize(content, contentWidth);
      const textHeight = splitText.length * 5;

      // Se o texto for muito grande para o resto da página
      if (yPos + textHeight > 280) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(splitText, leftMargin, yPos);
      yPos += textHeight + 6;
    };

    // --- CONTEÚDO ---
    addSection("DESENVOLVIMENTO COGNITIVO", reportForm.cognitive);
    addSection("DESENVOLVIMENTO SOCIOEMOCIONAL", reportForm.socioemotional);
    addSection("DESENVOLVIMENTO MOTOR", reportForm.motor);
    addSection("LINGUAGEM E COMUNICAÇÃO", reportForm.language);

    addSection("PONTOS FORTES", reportForm.strengths);
    addSection("ÁREAS A DESENVOLVER", reportForm.areasToDevelop);
    addSection("RECOMENDAÇÕES PARA A FAMÍLIA", reportForm.recommendations);

    // Parecer Geral sempre por último e com destaque
    if (reportForm.generalSynthesis) {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      addSection("PARECER GERAL", reportForm.generalSynthesis);
    }

    // --- ASSINATURAS ---
    if (yPos > 250) {
      doc.addPage();
      yPos = 40;
    } else {
      yPos = Math.max(yPos + 20, 260); // Joga pro final da página se possível
    }

    const sigY = yPos;
    doc.setDrawColor(0);
    doc.line(leftMargin + 10, sigY, leftMargin + 70, sigY);
    doc.line(pageWidth - rightMargin - 70, sigY, pageWidth - rightMargin - 10, sigY);

    doc.setFontSize(9);
    doc.text("Professor(a)", leftMargin + 40, sigY + 5, { align: "center" });
    doc.text("Coordenação Pedagógica", pageWidth - rightMargin - 40, sigY + 5, { align: "center" });

    // Salvar
    doc.save(`Parecer_${student?.name}_${selectedPeriod}Bim.pdf`);
    showNotification('PDF gerado com sucesso!', 'success');
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    );
  };

  const getPlaceholder = () => {
    switch (reportTab) {
      case 'cognitive': return 'Descreva o desenvolvimento cognitivo: raciocínio, curiosidade, resolução de problemas...';
      case 'socioemotional': return 'Descreva o desenvolvimento socioemocional: interações, sentimentos, regras...';
      case 'motor': return 'Descreva o desenvolvimento motor: coordenação, equilíbrio, movimento...';
      case 'language': return 'Descreva o desenvolvimento da linguagem: oralidade, vocabulário, narrativa, comunicação...';
      default: return '';
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/50 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
            <BookOpen size={12} /> Gestão Pedagógica
          </div>
          <h1 className={`${TEXT_H1} text-3xl md:text-4xl`}>
            Diário de <span className="text-amber-600">Classe Digital</span>
          </h1>
          <p className={`${TEXT_BODY} text-lg max-w-2xl mt-2`}>
            Gerencie frequência, rotina e pareceres descritivos.
          </p>
        </div>

        {/* Class Selection - Always Visible */}
        <div className={`${GLASS_EFFECT} p-4 rounded-2xl border border-white/40 shadow-xl shadow-slate-200/50 min-w-[300px]`}>
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
            <Users className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 w-4 h-4 mt-3" />
          </div>
        </div>
      </div>

      {selectedClassId && (
        <>
          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2 custom-scrollbar">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300
                ${activeTab === 'attendance'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                  : 'bg-white text-slate-500 hover:bg-amber-50 hover:text-amber-600 border border-slate-100'
                }`}
            >
              <CheckCircle className="w-4 h-4" /> Frequência
            </button>
            <button
              onClick={() => setActiveTab('routine')}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300
                ${activeTab === 'routine'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-100'
                }`}
            >
              <Clock className="w-4 h-4" /> Rotina
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300
                ${activeTab === 'experience'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-200'
                  : 'bg-white text-slate-500 hover:bg-purple-50 hover:text-purple-600 border border-slate-100'
                }`}
            >
              <PenTool className="w-4 h-4" /> Experiência
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300
                ${activeTab === 'report'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100'
                }`}
            >
              <FileText className="w-4 h-4" /> Parecer
            </button>
          </div>

          {/* TAB: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className={`${GLASS_EFFECT} rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2`}>
              <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  <Calendar className="text-amber-500 ml-2" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="border-none focus:ring-0 text-slate-700 font-bold bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="w-4 h-4" /> Total: <span className="font-bold text-slate-800">{classStudents.length} Alunos</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4 md:p-6 border-b border-slate-100">Estudante</th>
                      <th className="p-4 md:p-6 border-b border-slate-100 text-center w-24">Presente</th>
                      <th className="p-4 md:p-6 border-b border-slate-100 text-center w-24">Falta</th>
                      <th className="p-4 md:p-6 border-b border-slate-100 text-center w-24">Atestado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {classStudents.map(student => (
                      <tr key={student.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="p-4 md:p-6">
                          <span className="font-bold text-slate-700">{student.name}</span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleAttendanceChange(student.id, 'P')}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${attendanceState[student.id] === 'P' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110' : 'bg-slate-100 text-slate-300 hover:bg-emerald-100 hover:text-emerald-400'}`}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleAttendanceChange(student.id, 'F')}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${attendanceState[student.id] === 'F' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110' : 'bg-slate-100 text-slate-300 hover:bg-rose-100 hover:text-rose-400'}`}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleAttendanceChange(student.id, 'J')}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${attendanceState[student.id] === 'J' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 scale-110' : 'bg-slate-100 text-slate-300 hover:bg-amber-100 hover:text-amber-400'}`}
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {classStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-400">Nenhum estudante matriculado nesta turma.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleSaveAttendance} className={`${BTN_PRIMARY_STYLE} flex items-center gap-2`}>
                  <Save className="w-4 h-4" /> Salvar Frequência
                </button>
              </div>
            </div>
          )}

          {/* TAB: ROUTINE (INDIVIDUAL) */}
          {activeTab === 'routine' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className={`${GLASS_EFFECT} p-6 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50`}>
                  <label className={LABEL_STYLE}>Data do Registro</label>
                  <div className="relative group mb-4">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className={`${INPUT_STYLE} pl-10`}
                    />
                  </div>

                  <label className={LABEL_STYLE}>Selecione o Estudante</label>
                  <div className="bg-white/50 rounded-2xl border border-slate-100 overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
                    {classStudents.map(student => {
                      const hasLog = dailyLogs.some(l => l.studentId === student.id && l.date === selectedDate);
                      return (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`w-full text-left p-3 border-b border-slate-50 flex items-center justify-between hover:bg-blue-50 transition-colors ${selectedStudentId === student.id ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-slate-600'}`}
                        >
                          <span className="text-sm font-bold truncate mr-2">{student.name}</span>
                          {hasLog && <Check className={`w-4 h-4 ${selectedStudentId === student.id ? 'text-blue-200' : 'text-emerald-500'}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                {selectedStudentId ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg"><Users className="w-6 h-6" /></div>
                        <div>
                          <div className="font-bold text-lg">{classStudents.find(s => s.id === selectedStudentId)?.name}</div>
                          <div className="text-blue-100 text-xs font-medium">Registro Diário Individual</div>
                        </div>
                      </div>
                      <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{new Date(selectedDate).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className={`${GLASS_EFFECT} p-6 rounded-3xl border border-white/40 shadow-sm`}>
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Clock size={16} /></div> Rotina Diária
                          </h3>
                          <textarea
                            className={`${INPUT_STYLE} h-40 resize-none`}
                            placeholder="Ex: Aceitou bem a alimentação; Dormiu 1h..."
                            value={routineText}
                            onChange={e => setRoutineText(e.target.value)}
                          />
                        </div>
                        <div className={`${GLASS_EFFECT} p-6 rounded-3xl border border-white/40 shadow-sm`}>
                          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><PenTool size={16} /></div> Registro Pedagógico
                          </h3>
                          <textarea
                            className={`${INPUT_STYLE} h-40 resize-none`}
                            placeholder="Descreva a interação da criança com as atividades..."
                            value={pedagogicalText}
                            onChange={e => setPedagogicalText(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={`${GLASS_EFFECT} p-6 rounded-3xl border border-white/40 shadow-sm h-fit`}>
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-lg text-green-600"><BookOpen size={16} /></div> Campos de Experiência
                        </h3>
                        <div className="space-y-3">
                          {SKILL_FIELDS.map(field => (
                            <div
                              key={field.id}
                              onClick={() => toggleField(field.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selectedFields.includes(field.id) ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                            >
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${selectedFields.includes(field.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-slate-50'}`}
                              >
                                {selectedFields.includes(field.id) && <CheckCircle className="w-4 h-4" />}
                              </div>
                              <div>
                                <span className="font-black text-[10px] px-1.5 py-0.5 rounded text-white mr-2 uppercase tracking-wider" style={{ backgroundColor: field.color }}>{field.id}</span>
                                <span className="text-sm text-slate-700 font-bold">{field.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={handleSaveRoutine} className={`${BTN_PRIMARY_STYLE} w-full mt-8`}>
                          <Save className="w-4 h-4" /> Salvar Diário
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 border-4 border-dashed border-slate-200/60 rounded-3xl bg-slate-50/50">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-medium">Selecione um estudante ao lado.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: EXPERIENCE LOG */}
          {activeTab === 'experience' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <div className={`${GLASS_EFFECT} p-8 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50 relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className={LABEL_STYLE}>Campo de Experiência *</label>
                      <select className={INPUT_STYLE} value={expFieldId} onChange={e => setExpFieldId(e.target.value)}>
                        <option value="">Selecione o campo</option>
                        {SKILL_FIELDS.map(f => <option key={f.id} value={f.id}>{f.id} - {f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_STYLE}>Código BNCC</label>
                      <input className={INPUT_STYLE} placeholder="Ex: EI03EO01" value={expSkillCode} onChange={e => setExpSkillCode(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className={LABEL_STYLE}>Descrição da Atividade *</label>
                      <textarea className={`${INPUT_STYLE} h-32 resize-none`} placeholder="Descreva a atividade realizada..." value={expDescription} onChange={e => setExpDescription(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={LABEL_STYLE}>Metodologia</label>
                        <textarea className={`${INPUT_STYLE} h-32 resize-none`} placeholder="Estratégias utilizadas..." value={expMethodology} onChange={e => setExpMethodology(e.target.value)} />
                      </div>
                      <div>
                        <label className={LABEL_STYLE}>Materiais</label>
                        <textarea className={`${INPUT_STYLE} h-32 resize-none`} placeholder="Materiais utilizados..." value={expMaterials} onChange={e => setExpMaterials(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_STYLE}>Observações</label>
                      <textarea className={`${INPUT_STYLE} h-24 resize-none`} placeholder="Observações adicionais..." value={expObservations} onChange={e => setExpObservations(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className={`${GLASS_EFFECT} p-6 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50`}>
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-pink-100 rounded-lg text-pink-500"><Activity size={18} /></div> Portfólio Visual
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {expPhotos.map((photo, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={photo} alt={`Portfólio ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => handleRemovePhoto(index)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-pink-500 hover:text-pink-500 transition-colors cursor-pointer bg-slate-50/50 hover:bg-pink-50/50">
                      <Plus className="w-8 h-8 mb-2" />
                      <span className="text-xs font-bold uppercase">Adicionar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <button onClick={handleSaveExperienceLog} className={`${BTN_PRIMARY_STYLE} w-full`}>
                    <Save className="w-4 h-4" /> Salvar Experiência
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl text-sm">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Filter size={14} /> Dica Pedagógica</h4>
                  <p>Documente o processo de aprendizagem focando nas interações e descobertas das crianças. As fotos enriquecem o portfólio e validam as observações.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DESCRIPTIVE REPORTS */}
          {activeTab === 'report' && (
            <div className={`${GLASS_EFFECT} rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 space-y-8`}>

              {/* ROW 1: SELECTORS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-4">
                  <label className={LABEL_STYLE}>Aluno *</label>
                  <select
                    className={`${INPUT_STYLE} bg-white`}
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {classStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className={LABEL_STYLE}>Período</label>
                  <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/60">
                    {[1, 2, 3, 4].map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPeriod(p as Period)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedPeriod === p
                          ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                          : 'text-slate-400 hover:text-indigo-500'
                          }`}
                      >
                        {p}º Bim
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className={LABEL_STYLE}>Status</label>
                  <div className="flex gap-2">
                    <button
                      disabled={!selectedStudentId}
                      onClick={() => setReportForm({ ...reportForm, status: 'Rascunho' })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${reportForm.status === 'Rascunho'
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        } ${!selectedStudentId && 'opacity-50 cursor-not-allowed'}`}
                    >
                      Rascunho
                    </button>
                    <button
                      disabled={!selectedStudentId}
                      onClick={() => setReportForm({ ...reportForm, status: 'Finalizado' })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${reportForm.status === 'Finalizado'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'
                        } ${!selectedStudentId && 'opacity-50 cursor-not-allowed'}`}
                    >
                      Finalizado
                    </button>
                  </div>
                </div>
              </div>

              {selectedStudentId ? (
                <>
                  {/* ROW 2: TABS */}
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                    <button
                      onClick={() => setReportTab('cognitive')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${reportTab === 'cognitive' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Brain size={18} /> Cognitivo
                    </button>
                    <button
                      onClick={() => setReportTab('socioemotional')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${reportTab === 'socioemotional' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Heart size={18} /> Socioemocional
                    </button>
                    <button
                      onClick={() => setReportTab('motor')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${reportTab === 'motor' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Activity size={18} /> Motor
                    </button>
                    <button
                      onClick={() => setReportTab('language')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${reportTab === 'language' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                      <MessageSquare size={18} /> Linguagem
                    </button>
                  </div>

                  {/* ROW 3: DOMAIN TEXTAREA */}
                  <div>
                    <textarea
                      className={`${INPUT_STYLE} h-40 resize-none w-full text-base leading-relaxed bg-white`}
                      placeholder={`Descreva o desenvolvimento ${reportTab === 'language' ? 'da linguagem' : reportTab}...`}
                      value={reportForm[reportTab as keyof DescriptiveReport] as string}
                      onChange={e => setReportForm({ ...reportForm, [reportTab]: e.target.value })}
                    />
                  </div>

                  {/* ROW 4: STRENGTHS & AREAS TO DEVELOP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`${LABEL_STYLE} mb-2 block`}>Pontos Fortes</label>
                      <textarea
                        className={`${INPUT_STYLE} h-32 resize-none bg-white`}
                        placeholder="Ex: Comunicação e interação..."
                        value={reportForm.strengths}
                        onChange={e => setReportForm({ ...reportForm, strengths: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={`${LABEL_STYLE} mb-2 block`}>Áreas a Desenvolver</label>
                      <textarea
                        className={`${INPUT_STYLE} h-32 resize-none bg-white`}
                        placeholder="Ex: Foco em atividades prolongadas..."
                        value={reportForm.areasToDevelop}
                        onChange={e => setReportForm({ ...reportForm, areasToDevelop: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* ROW 5: FAMILY RECOMMENDATIONS */}
                  <div>
                    <label className={`${LABEL_STYLE} mb-2 block`}>Recomendações para a Família</label>
                    <textarea
                      className={`${INPUT_STYLE} h-24 resize-none bg-white`}
                      placeholder="Ex: Estimular leitura em casa..."
                      value={reportForm.recommendations}
                      onChange={e => setReportForm({ ...reportForm, recommendations: e.target.value })}
                    />
                  </div>

                  {/* ROW 6: GENERAL OPINION */}
                  <div>
                    <label className={`${LABEL_STYLE} mb-2 block`}>Parecer Geral</label>
                    <textarea
                      className={`${INPUT_STYLE} h-24 resize-none bg-white`}
                      placeholder="Síntese final do desenvolvimento..."
                      value={reportForm.generalSynthesis}
                      onChange={e => setReportForm({ ...reportForm, generalSynthesis: e.target.value })}
                    />
                  </div>

                  {/* ROW 7: FOOTER ACTIONS */}
                  <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setReportForm({ ...reportForm, studentId: activeTab === 'report' ? '' : reportForm.studentId })} // Reset or Cancel action
                      className={`${BTN_SECONDARY_STYLE} px-6`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDownloadPDF()}
                      className={`${BTN_SECONDARY_STYLE} px-6 flex items-center gap-2`}
                    >
                      <Download size={18} /> Baixar PDF
                    </button>
                    <button
                      onClick={() => handleSaveReport('Rascunho')}
                      className={`${BTN_SECONDARY_STYLE} px-6 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200`}
                    >
                      <FileText size={18} className="inline mr-2" /> Salvar Rascunho
                    </button>
                    <button
                      onClick={() => handleSaveReport('Finalizado')}
                      className={`${BTN_PRIMARY_STYLE} px-8 bg-purple-600 hover:bg-purple-700 border-purple-600 flex items-center gap-2`}
                    >
                      <Save size={18} /> Criar
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-medium text-lg">Selecione um aluno acima para iniciar o parecer.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
