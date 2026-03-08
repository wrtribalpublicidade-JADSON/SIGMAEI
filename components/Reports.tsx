import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context';
import { SKILL_FIELDS, LEVEL_COLORS, getBnccGroup } from '../constants';
import { Period } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BookOpen, AlertCircle, TrendingUp, Calendar, Filter, Download, User, FileText, FileSpreadsheet, Image as ImageIcon, Loader2, BarChart3, Brain, Heart, Activity, Star, Target, MessageCircle, MessageSquare, Search, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { TEXT_H1, TEXT_BODY, TEXT_SMALL, CARD_STYLE, INPUT_STYLE, LABEL_STYLE, BTN_PRIMARY_STYLE, BTN_SECONDARY_STYLE, GLASS_EFFECT } from '../utils/styles';

export const Reports: React.FC = () => {
    const { schools, classes, students, assessments, descriptiveReports } = useApp();
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedPeriod, setSelectedPeriod] = useState<Period>(1);
    const [viewMode, setViewMode] = useState<'single' | 'evolution' | 'student'>('single');
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // State to track selected skill filter per field in Evolution mode
    const [evolutionFilters, setEvolutionFilters] = useState<{ [key: string]: string }>({});

    const selectedClass = classes.find(c => c.id === selectedClassId);
    const classStudents = students.filter(s => s.classId === selectedClassId);
    const school = schools.find(s => s.id === selectedClass?.schoolId);
    const selectedStudent = students.find(s => s.id === selectedStudentId);

    // Helper to identify BNCC Group (Age Range)
    const bnccGroup = selectedClass ? getBnccGroup(selectedClass.stage) : 'EI02';

    // Helper to calculate age
    const calculateAge = (dob: string) => {
        if (!dob) return '';
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

    // Stats Calculation for Single Period View
    const calculateFieldStats = (fieldId: string) => {
        const field = SKILL_FIELDS.find(f => f.id === fieldId);
        if (!field) return [];
        const relevantSkills = field.skills.filter(s => s.code.startsWith(bnccGroup));

        return relevantSkills.map(skill => {
            let d = 0, ed = 0, ad = 0;
            let count = 0;
            classStudents.forEach(st => {
                const val = assessments[st.id]?.[selectedPeriod]?.[skill.code];
                if (val === 'D') d++;
                else if (val === 'ED') ed++;
                else if (val === 'AD') ad++;
                if (val) count++;
            });
            const base = classStudents.length || 1;
            return {
                name: skill.code,
                D: parseFloat(((d / base) * 100).toFixed(1)),
                ED: parseFloat(((ed / base) * 100).toFixed(1)),
                AD: parseFloat(((ad / base) * 100).toFixed(1)),
                fullDescription: skill.description
            };
        });
    };

    // Stats Calculation for Evolution View (Aggregated Field or Specific Skill)
    const calculateEvolutionStats = (fieldId: string, skillCodeFilter?: string) => {
        const field = SKILL_FIELDS.find(f => f.id === fieldId);
        if (!field) return [];
        const periods: Period[] = [1, 2, 3, 4];
        let relevantSkills = field.skills.filter(s => s.code.startsWith(bnccGroup));

        // Filter by specific skill if selected and not 'all'
        if (skillCodeFilter && skillCodeFilter !== 'all') {
            relevantSkills = relevantSkills.filter(s => s.code === skillCodeFilter);
        }

        return periods.map(period => {
            let d = 0, ed = 0, ad = 0, total = 0;
            classStudents.forEach(student => {
                relevantSkills.forEach(skill => {
                    const val = assessments[student.id]?.[period]?.[skill.code];
                    if (val === 'D') d++;
                    else if (val === 'ED') ed++;
                    else if (val === 'AD') ad++;
                    if (val) total++;
                });
            });
            const base = total || 1;
            return {
                name: `${period}º Bim`,
                D: total ? parseFloat(((d / base) * 100).toFixed(1)) : 0,
                ED: total ? parseFloat(((ed / base) * 100).toFixed(1)) : 0,
                AD: total ? parseFloat(((ad / base) * 100).toFixed(1)) : 0,
                totalCount: total
            };
        });
    };

    // --- ADMIN INSIGHTS CALCULATION ---
    const getAdminInsights = () => {
        if (!selectedClass) return [];

        return SKILL_FIELDS.map(field => {
            const relevantSkills = field.skills.filter(s => s.code.startsWith(bnccGroup));
            let maxAD = -1;
            let worstSkill = null;

            relevantSkills.forEach(skill => {
                let d = 0, ed = 0, ad = 0, total = 0;
                classStudents.forEach(st => {
                    const val = assessments[st.id]?.[selectedPeriod]?.[skill.code];
                    if (val === 'D') d++;
                    else if (val === 'ED') ed++;
                    else if (val === 'AD') ad++;
                    if (val) total++;
                });

                if (total > 0) {
                    const adPercent = (ad / total) * 100;
                    if (adPercent > maxAD) {
                        maxAD = adPercent;
                        worstSkill = { ...skill, adPercent };
                    }
                }
            });

            if (worstSkill && maxAD > 0) {
                return {
                    field: field.id,
                    fieldName: field.name,
                    fieldColor: field.color,
                    skillCode: worstSkill.code,
                    skillDescription: worstSkill.description,
                    adPercent: maxAD.toFixed(1)
                };
            }
            return null;
        }).filter(Boolean);
    };

    const downloadChart = async (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${filename}.png`;
            link.click();
        } catch (err) {
            console.error("Erro ao baixar gráfico:", err);
        }
    };

    // --- EXPORT FUNCTIONALITY ---
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const ws_data: any[] = [];

        // Headers
        ws_data.push(["DASHBOARD PEDAGÓGICO - RELATÓRIO GERAL"]);
        ws_data.push([`ESCOLA: ${school?.name || ''}`]);
        ws_data.push([`TURMA: ${selectedClass?.name || ''}`]);
        ws_data.push([`DATA: ${new Date().toLocaleDateString()}`]);
        ws_data.push([]); // Spacer

        // Content based on view
        if (viewMode === 'single') {
            ws_data.push([`PERÍODO: ${selectedPeriod}º BIMESTRE`]);
            // Add logic later... simple placeholder
            ws_data.push(["Dados exportados simplificados."]);
        }

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, "Relatório");
        XLSX.writeFile(wb, `Relatorio_${selectedClass?.name}_${new Date().getFullYear()}.xlsx`);
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Relatorio_Grafico_${selectedClass?.name}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };


    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-200">
                        <BarChart3 size={12} /> Inteligência de Dados
                    </div>
                    <h1 className={`${TEXT_H1} text-3xl md:text-4xl`}>
                        Painel de <span className="text-indigo-600">Resultados</span>
                    </h1>
                    <p className={`${TEXT_BODY} text-lg max-w-2xl mt-2`}>
                        Visualize os indicadores de aprendizagem e tome decisões baseadas em dados.
                    </p>
                </div>

                <div className={`${GLASS_EFFECT} p-4 rounded-2xl border border-white/40 shadow-xl shadow-slate-200/50 min-w-[300px]`}>
                    <label className={LABEL_STYLE}>Selecione a Turma</label>
                    <div className="relative">
                        <select
                            className={`${INPUT_STYLE} appearance-none bg-white/80`}
                            value={selectedClassId}
                            onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}
                        >
                            <option value="">Selecione...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Filter className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 w-4 h-4 mt-3" />
                    </div>
                </div>
            </div>

            {selectedClassId ? (
                <>
                    {/* VIEW MODE TABS */}
                    <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
                        <button
                            onClick={() => setViewMode('single')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <TrendingUp size={16} /> Visão por Bimestre
                        </button>
                        <button
                            onClick={() => setViewMode('evolution')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'evolution' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <BarChart3 size={16} /> Evolução Anual
                        </button>
                        <button
                            onClick={() => setViewMode('student')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <User size={16} /> Boletim
                        </button>
                    </div>

                    {/* REPORT CONTENT AREA */}
                    <div ref={reportRef} className="space-y-8">

                        {/* --- VIEW: SINGLE PERIOD ANALYSIS --- */}
                        {viewMode === 'single' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Filtrar Bimestre:</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setSelectedPeriod(p as Period)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${selectedPeriod === p ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    {p}º
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* --- PAINEL ADMINISTRATIVO --- */}
                                <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 mb-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <AlertCircle className="text-amber-400 w-6 h-6" />
                                        <h2 className="text-xl font-bold text-white">Painel Administrativo - Pontos de Atenção ({selectedPeriod}º Bim)</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {getAdminInsights().map((insight: any, idx: number) => (
                                            <div key={idx} className="bg-slate-800/50 rounded-xl p-5 border-l-4 relative overflow-hidden group hover:bg-slate-800 transition-colors" style={{ borderLeftColor: insight?.fieldColor }}>
                                                {/* Background Glow */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none" />

                                                <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80" style={{ color: insight?.fieldColor }}>{insight?.fieldName}</p>
                                                <h3 className="text-lg font-bold text-white mb-1">{insight?.skillCode}</h3>
                                                <p className="text-xs text-slate-400 mb-4 line-clamp-2 h-8">{insight?.skillDescription}</p>

                                                <div className="flex items-center justify-between">
                                                    <div className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                                                        {insight?.adPercent}% A Desenvolver
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Maior índice do campo</span>
                                                </div>
                                            </div>
                                        ))}
                                        {getAdminInsights().length === 0 && (
                                            <div className="col-span-full py-8 text-center text-slate-500 italic">
                                                Nenhum ponto de atenção crítico identificado neste bimestre. Parabéns!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    {SKILL_FIELDS.map(field => {
                                        const data = calculateFieldStats(field.id);
                                        if (data.length === 0) return null;
                                        const chartId = `chart-${field.id}`;

                                        return (
                                            <div id={chartId} key={field.id} className={`${GLASS_EFFECT} rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50 p-6 md:p-8 flex flex-col h-[500px] relative group`}>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: field.color }}>
                                                            {field.id}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-700 text-lg leading-none">{field.name}</h3>
                                                            <p className="text-xs text-slate-400 font-medium mt-1">Análise de Habilidades</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => downloadChart(chartId, `Grafico_${field.id}_${selectedPeriod}Bim`)}
                                                        className="p-2 bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Baixar Gráfico PNG"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                </div>

                                                <div className="flex-1 w-full min-h-0">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                                            <XAxis type="number" hide />
                                                            <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                                            <Tooltip
                                                                cursor={{ fill: '#f1f5f9' }}
                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                            />
                                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                            <Bar dataKey="D" name="Desenv." stackId="a" fill={LEVEL_COLORS.D} radius={[0, 4, 4, 0]} barSize={20} />
                                                            <Bar dataKey="ED" name="Em Desenv." stackId="a" fill={LEVEL_COLORS.ED} barSize={20} />
                                                            <Bar dataKey="AD" name="A Desenv." stackId="a" fill={LEVEL_COLORS.AD} radius={[4, 0, 0, 4]} barSize={20} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* --- VIEW: EVOLUTION --- */}
                        {/* --- VIEW: EVOLUTION --- */}
                        {viewMode === 'evolution' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                                {SKILL_FIELDS.map(field => {
                                    const filterValue = evolutionFilters[field.id] || 'all';
                                    const data = calculateEvolutionStats(field.id, filterValue);
                                    if (data.length === 0 && filterValue === 'all') return null;

                                    const chartId = `evolution-chart-${field.id}`;
                                    const relevantSkills = field.skills.filter(s => s.code.startsWith(bnccGroup));

                                    return (
                                        <div id={chartId} key={field.id} className={`${GLASS_EFFECT} rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50 p-6 md:p-8 flex flex-col h-[500px] relative group`}>
                                            <div className="flex flex-col gap-4 mb-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: field.color }}>
                                                            <TrendingUp size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-700 text-lg">{field.name}</h3>
                                                            <p className="text-xs text-slate-400 font-medium">Evolução por Bimestre</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* CONTROLS: FILTER & DOWNLOAD */}
                                                <div className="flex items-center gap-2 justify-end" data-html2canvas-ignore>
                                                    <div className="relative flex-1 max-w-sm">
                                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                                                        <select
                                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-2 pl-8 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium shadow-sm truncate"
                                                            value={filterValue}
                                                            onChange={(e) => setEvolutionFilters(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                        >
                                                            <option value="all">Todas as Habilidades (Média)</option>
                                                            {relevantSkills.map(skill => (
                                                                <option key={skill.code} value={skill.code}>
                                                                    {skill.code} - {skill.description.substring(0, 40)}...
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <button
                                                        onClick={() => downloadChart(chartId, `Evolucao_${field.id}_${selectedClass?.name}`)}
                                                        className="p-2 bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                                                        title="Baixar Gráfico PNG"
                                                    >
                                                        <ImageIcon size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex-1 w-full min-h-0 bg-white/50 rounded-2xl p-4 border border-slate-100">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                                        <Tooltip
                                                            cursor={{ fill: '#f1f5f9' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                        />
                                                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                                        <Bar dataKey="D" name="Desenv." stackId="a" fill={LEVEL_COLORS.D} radius={[0, 0, 4, 4]} barSize={40} />
                                                        <Bar dataKey="ED" name="Em Desenv." stackId="a" fill={LEVEL_COLORS.ED} barSize={40} />
                                                        <Bar dataKey="AD" name="A Desenv." stackId="a" fill={LEVEL_COLORS.AD} radius={[4, 4, 0, 0]} barSize={40} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* --- VIEW: BOLETIM (STUDENT REPORT CARD) --- */}
                        {viewMode === 'student' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 print:space-y-0">
                                <div className={`${GLASS_EFFECT} p-6 rounded-3xl border border-white/40 shadow-sm max-w-sm print:hidden no-print`}>
                                    <label className={LABEL_STYLE}>Selecione o Estudante</label>
                                    <div className="relative">
                                        <select
                                            className={INPUT_STYLE}
                                            value={selectedStudentId}
                                            onChange={e => setSelectedStudentId(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {classStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <Search className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 w-4 h-4 mt-3" />
                                    </div>
                                    <button
                                        onClick={() => window.print()}
                                        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} /> Imprimir / Salvar PDF
                                    </button>
                                </div>

                                {selectedStudent && (
                                    <div id="printable-report" className="bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
                                        {/* Report Header */}
                                        <div className="bg-slate-50 border-b border-slate-200 p-8 print:p-0 print:mb-4">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-800 uppercase print:text-xl">{school?.name}</h2>
                                                    <p className="text-sm text-slate-500 font-medium">RELATÓRIO DE DESENVOLVIMENTO INDIVIDUAL</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-700">TURMA: {selectedClass?.name}</p>
                                                    <p className="text-sm text-slate-500">ANO LETIVO: {new Date().getFullYear()}</p>
                                                </div>
                                            </div>
                                            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">ALUNO(A)</span>
                                                    <span className="text-xl font-bold text-slate-800">{selectedStudent.name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">DATA DE NASCIMENTO</span>
                                                    <span className="text-base font-medium text-slate-700">{new Date(selectedStudent.birthDate).toLocaleDateString()} ({calculateAge(selectedStudent.birthDate)})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SKILLS TABLE */}
                                        <div className="p-8 print:p-4 space-y-8">
                                            {SKILL_FIELDS.map(field => {
                                                const relevantSkills = field.skills.filter(s => s.code.startsWith(bnccGroup));
                                                if (relevantSkills.length === 0) return null;

                                                return (
                                                    <div key={field.id} className="border border-slate-200 rounded-xl overflow-hidden break-inside-avoid">
                                                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                                                            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: field.color }} />
                                                            <h3 className="font-bold text-sm text-slate-700 uppercase">{field.id} - {field.name}</h3>
                                                        </div>
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 w-16">Cód</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">Habilidade</th>
                                                                    {[1, 2, 3, 4].map(b => (
                                                                        <th key={b} className="px-2 py-2 text-center text-xs font-bold text-slate-500 w-12">{b}º Bim</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {relevantSkills.map(skill => (
                                                                    <tr key={skill.code} className="hover:bg-slate-50/50">
                                                                        <td className="px-4 py-3 text-xs font-medium text-slate-500">{skill.code}</td>
                                                                        <td className="px-4 py-3 text-slate-700">{skill.description}</td>
                                                                        {[1, 2, 3, 4].map(b => {
                                                                            const val = assessments[selectedStudent.id]?.[b as Period]?.[skill.code];
                                                                            let bg = '';
                                                                            let text = '';
                                                                            if (val === 'D') { bg = 'bg-emerald-100'; text = 'text-emerald-700'; }
                                                                            else if (val === 'ED') { bg = 'bg-amber-100'; text = 'text-amber-700'; }
                                                                            else if (val === 'AD') { bg = 'bg-rose-100'; text = 'text-rose-700'; }

                                                                            return (
                                                                                <td key={b} className={`px-2 py-3 text-center text-xs font-bold ${bg} ${text}`}>
                                                                                    {val || '-'}
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* DESCRIPTIVE REPORTS */}
                                        <div className="p-8 print:p-4 bg-slate-50 border-t border-slate-200">
                                            <h3 className="text-center font-bold text-lg text-slate-800 mb-6 uppercase">Parecer Descritivo Final</h3>

                                            <div className="space-y-6">
                                                {(() => {
                                                    const bim = 4;
                                                    const report = descriptiveReports.find(r => r.studentId === selectedStudent.id && r.period === bim);

                                                    return (
                                                        <div className="bg-white border border-slate-200 rounded-xl p-6 print:border-slate-300 break-inside-avoid">
                                                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                                                <h4 className="font-bold text-slate-800">{bim}º Bimestre</h4>
                                                                {report?.status === 'Finalizado' && (
                                                                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200">Finalizado</span>
                                                                )}
                                                            </div>

                                                            {report ? (
                                                                <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                                                                    {report.generalSynthesis && (
                                                                        <div>
                                                                            <span className="font-bold block text-slate-900 mb-1">Parecer Geral:</span>
                                                                            {report.generalSynthesis}
                                                                        </div>
                                                                    )}

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {report.cognitive && (
                                                                            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                                                                <div className="flex items-center gap-2 mb-1 text-indigo-700 font-bold text-xs uppercase">
                                                                                    <Brain size={12} /> Cognitivo
                                                                                </div>
                                                                                {report.cognitive}
                                                                            </div>
                                                                        )}
                                                                        {report.language && (
                                                                            <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                                                                                <div className="flex items-center gap-2 mb-1 text-purple-700 font-bold text-xs uppercase">
                                                                                    <MessageSquare size={12} /> Linguagem
                                                                                </div>
                                                                                {report.language}
                                                                            </div>
                                                                        )}
                                                                        {report.socioemotional && (
                                                                            <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                                                                                <div className="flex items-center gap-2 mb-1 text-rose-700 font-bold text-xs uppercase">
                                                                                    <Heart size={12} /> Socioemocional
                                                                                </div>
                                                                                {report.socioemotional}
                                                                            </div>
                                                                        )}
                                                                        {report.motor && (
                                                                            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                                                                                <div className="flex items-center gap-2 mb-1 text-amber-700 font-bold text-xs uppercase">
                                                                                    <Activity size={12} /> Motor
                                                                                </div>
                                                                                {report.motor}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                                        {report.strengths && (
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-1 text-amber-600 font-bold text-xs uppercase">
                                                                                    <Star size={12} /> Pontos Fortes
                                                                                </div>
                                                                                {report.strengths}
                                                                            </div>
                                                                        )}
                                                                        {report.areasToDevelop && (
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-1 text-rose-600 font-bold text-xs uppercase">
                                                                                    <Target size={12} /> Áreas a Desenvolver
                                                                                </div>
                                                                                {report.areasToDevelop}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {report.recommendations && (
                                                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                                                            <div className="flex items-center gap-2 mb-1 text-blue-600 font-bold text-xs uppercase">
                                                                                <MessageCircle size={12} /> Recomendações
                                                                            </div>
                                                                            <span className="italic text-slate-600">{report.recommendations}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-slate-400 italic text-center py-4">Parecer não registrado para este período.</p>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* SIGNATURES */}
                                            <div className="mt-16 mb-8 flex flex-col md:flex-row justify-between gap-12 px-8 break-inside-avoid">
                                                <div className="flex-1 border-t border-slate-800 pt-2 text-center">
                                                    <p className="font-bold text-sm text-slate-800">Professor(a)</p>
                                                </div>
                                                <div className="flex-1 border-t border-slate-800 pt-2 text-center">
                                                    <p className="font-bold text-sm text-slate-800">Coordenação Pedagógica</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* GLOBAL ACTIONS */}
                    <div className="fixed bottom-8 right-8 flex gap-4 z-50">
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:bg-emerald-700 hover:scale-105 transition-all"
                        >
                            <FileSpreadsheet className="w-5 h-5" /> Exportar Planilha
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isGeneratingPDF}
                            className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:bg-slate-900 hover:scale-105 transition-all disabled:opacity-70"
                        >
                            {isGeneratingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                            Gerar Relatório PDF
                        </button>
                    </div>
                </>
            ) : (
                <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400 border-4 border-dashed border-slate-200/60 rounded-3xl bg-slate-50/50">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                        <BarChart3 className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Painel de Resultados</h3>
                    <p className="text-slate-500 max-w-md text-center">Selecione uma turma acima para visualizar os indicadores e relatórios.</p>
                </div>
            )}
        </div>
    );
};
