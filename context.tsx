import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { School, ClassRoom, Student, AssessmentData, Period, SkillLevel, AttendanceRecord, DailyLog, DescriptiveReport, ExperienceLog, Notification, NotificationType, UserSession, UserRole, SystemUser } from './types';
import { SKILL_FIELDS, getBnccGroup } from './constants';
import { supabase } from './services/supabase';

interface AppContextType {
  schools: School[];
  classes: ClassRoom[];
  students: Student[];
  assessments: AssessmentData;
  attendance: AttendanceRecord[];
  dailyLogs: DailyLog[];
  experienceLogs: ExperienceLog[];
  descriptiveReports: DescriptiveReport[];
  systemUsers: SystemUser[];
  notifications: Notification[];
  currentUser: UserSession | null;
  authLoading: boolean;
  addSchool: (school: School) => void;
  removeSchool: (id: string) => void;
  updateSchool: (school: School) => void;

  addClass: (cls: ClassRoom) => void;
  addClasses: (classes: ClassRoom[]) => void;
  removeClass: (id: string) => void;
  updateClass: (cls: ClassRoom) => void;

  addStudent: (student: Student) => void;
  addStudents: (students: Student[]) => void;
  removeStudent: (id: string) => void;
  updateStudent: (student: Student) => void;

  updateAssessment: (studentId: string, period: Period, skillCode: string, level: SkillLevel) => void;
  saveAttendance: (records: AttendanceRecord[]) => void;
  saveDailyLog: (log: DailyLog) => void;
  saveExperienceLog: (log: ExperienceLog) => void;
  saveDescriptiveReport: (report: DescriptiveReport) => void;
  addSystemUser: (user: SystemUser) => void;
  updateSystemUser: (user: SystemUser) => void;
  removeSystemUser: (id: string) => void;
  showNotification: (message: string, type: NotificationType) => void;
  login: (name: string, role: UserRole) => void;
  logout: () => void;
  seedDemoData: () => void;
  isDemoMode: boolean;
  activateDemoMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Use global variable to prevent double fetches in dev strict mode across remounts
let globalFetchLock = false;

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<AssessmentData>(() => JSON.parse(localStorage.getItem('edu_assessments') || '{}'));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => JSON.parse(localStorage.getItem('edu_attendance') || '[]'));
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => JSON.parse(localStorage.getItem('edu_dailylogs') || '[]'));
  const [experienceLogs, setExperienceLogs] = useState<ExperienceLog[]>(() => JSON.parse(localStorage.getItem('edu_experiencelogs') || '[]'));
  const [descriptiveReports, setDescriptiveReports] = useState<DescriptiveReport[]>(() => JSON.parse(localStorage.getItem('edu_reports') || '[]'));
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('edu_systemusers');
    return saved ? JSON.parse(saved) : [{ id: 'admin-001', name: 'Administrador Principal', role: 'admin', createdAt: new Date().toISOString() }];
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Ref to track currentUser inside the auth listener (avoids closure trap)
  const currentUserRef = useRef<UserSession | null>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Failsafe timeout to prevent infinite loading screen
  useEffect(() => {
    let timeoutId: number;
    if (authLoading) {
      timeoutId = window.setTimeout(() => {
        console.warn('Auth loading timeout reached. Forcing unlock.');
        setAuthLoading(false);
      }, 12000); // 12 seconds failsafe⚖️
    }
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [authLoading]);

  // useEffects for purely local data (assessments, attendance, etc. for now)
  useEffect(() => { localStorage.setItem('edu_assessments', JSON.stringify(assessments)); }, [assessments]);
  useEffect(() => { localStorage.setItem('edu_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('edu_dailylogs', JSON.stringify(dailyLogs)); }, [dailyLogs]);
  useEffect(() => { localStorage.setItem('edu_experiencelogs', JSON.stringify(experienceLogs)); }, [experienceLogs]);
  useEffect(() => { localStorage.setItem('edu_reports', JSON.stringify(descriptiveReports)); }, [descriptiveReports]);
  useEffect(() => { localStorage.setItem('edu_systemusers', JSON.stringify(systemUsers)); }, [systemUsers]);

  // Supabase Auth Integration
  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    console.log(`[Auth] fetchUserProfile called for ${userId} (attempt ${retryCount + 1})`);
    if (!supabase) return null;
    try {
      const fetchPromise = supabase.from('profiles').select('*').eq('id', userId).single();

      // Force a 30 second timeout in case the network/db request hangs
      const timeoutPromise = new Promise<{ data: any, error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Profile fetch timeout') }), 30000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('[Auth] fetchUserProfile completed. Data:', data ? 'Yes' : 'No', 'Error:', error?.message);

      if (error) {
        console.warn(`[Auth] Profile not found for ${userId} (Attempt ${retryCount + 1}):`, error.message);

        // If not found, retry up to 3 times (latency for triggers)
        if (retryCount < 3) {
          console.log(`[Auth] Retrying profile fetch in 1.5s...`);
          await new Promise(r => setTimeout(r, 1500));
          return fetchUserProfile(userId, retryCount + 1);
        }
        return null;
      }
      return data;
    } catch (err) {
      console.error('[Auth] Catch error fetching profile:', err);
      return null;
    }
  };

  const fetchInitialData = async () => {
    if (globalFetchLock || isDemoMode) {
      if (globalFetchLock) console.log('[Data] Fetch already in progress, skipping...');
      if (isDemoMode) console.log('[Data] Demo mode active, skipping Supabase fetch.');
      return;
    }
    globalFetchLock = true;

    // Safety timeout in case fetch hangs indefinitely
    const lockTimeout = setTimeout(() => {
      globalFetchLock = false;
      console.warn('[Data] globalFetchLock cleared via timeout safety measure.');
    }, 15000);

    try {
      console.log('[Data] Fetching initial data from Supabase in parallel...');

      // Desestruturando as promessas individualmente dentro do Promise.all para que, caso o Supabase-js
      // retorne erro em um, as outras ainda sejam processadas e mapeadas.
      const [
        schoolsRes,
        classesRes,
        studentsRes,
        attendanceRes,
        routineRes,
        experienceRes,
        reportRes,
        assessmentRes
      ] = await Promise.all([
        supabase.from('escolas').select('*'),
        supabase.from('turmas').select('*'),
        supabase.from('alunos').select('*'),
        supabase.from('frequencia').select('*'),
        supabase.from('registro_rotina').select('*'),
        supabase.from('registro_experiencia').select('*'),
        supabase.from('parecer_descritivo').select('*'),
        supabase.from('avaliacoes_infantil').select('*')
      ]);

      if (schoolsRes.error) console.error('[Data] Error fetching Escolas:', schoolsRes.error);
      if (schoolsRes.data) setSchools(schoolsRes.data);

      if (classesRes.error) console.error('[Data] Error fetching Turmas:', classesRes.error);
      if (classesRes.data) setClasses(classesRes.data.map((c: any) => ({ ...c, schoolId: c.school_id, serviceType: c.service_type })));

      if (studentsRes.error) console.error('[Data] Error fetching Alunos:', studentsRes.error);
      if (studentsRes.data) setStudents(studentsRes.data.map((s: any) => ({ ...s, classId: s.class_id, birthDate: s.birth_date, listNumber: s.list_number })));

      if (attendanceRes.error) console.error('[Data] Error fetching Frequencia:', attendanceRes.error);
      if (attendanceRes.data) setAttendance(attendanceRes.data.map((a: any) => ({ ...a, studentId: a.student_id, classId: a.class_id })));

      if (routineRes.error) console.error('[Data] Error fetching Rotina:', routineRes.error);
      if (routineRes.data) setDailyLogs(routineRes.data.map((r: any) => ({
        ...r,
        classId: r.class_id,
        studentId: r.student_id,
        pedagogicalRecord: r.pedagogical_record,
        skillFieldIds: r.skill_field_ids || [] // Ensure array
      })));

      if (experienceRes.error) console.error('[Data] Error fetching Experiencia:', experienceRes.error);
      if (experienceRes.data) setExperienceLogs(experienceRes.data.map((e: any) => ({ ...e, classId: e.class_id, fieldId: e.field_id, skillCode: e.skill_code })));

      if (reportRes.error) console.error('[Data] Error fetching Pareceres:', reportRes.error);
      if (reportRes.data) setDescriptiveReports(reportRes.data.map((rep: any) => ({
        ...rep,
        studentId: rep.student_id,
        areasToDevelop: rep.areas_to_develop || '',
        generalSynthesis: rep.general_synthesis || ''
      })));

      // Parse assessments mapping
      if (assessmentRes.error) console.error('[Data] Error fetching Avaliacoes Infantil:', assessmentRes.error);
      if (assessmentRes.data) {
        const _mappedAssessments: AssessmentData = {};
        assessmentRes.data.forEach((row: any) => {
          const { student_id, period, skill_code, level } = row;
          if (!_mappedAssessments[student_id]) _mappedAssessments[student_id] = {};
          if (!_mappedAssessments[student_id][period as Period]) _mappedAssessments[student_id][period as Period] = {};
          _mappedAssessments[student_id][period as Period][skill_code] = level as SkillLevel;
        });
        setAssessments(_mappedAssessments);
      }

      console.log('[Data] Initial data fetch complete.');
    } catch (error) {
      console.error('[Data] Fatal error in fetchInitialData network call:', error);
    } finally {
      clearTimeout(lockTimeout);
      globalFetchLock = false;
    }
  };

  useEffect(() => {
    if (!supabase) {
      console.error('[Supabase] Client is null. Check environment variables.');
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    // Listen for auth changes (Login / Logout / Session Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Auth state changed: ${event}`, session?.user?.id);

      if (session?.user) {
        // Optimization: only show loading if we don't have a user yet or it's a new sign-in
        const hasValidUser = currentUserRef.current && currentUserRef.current.name !== 'Usuário';
        const isCriticalEvent = event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && !hasValidUser);

        if (mounted && isCriticalEvent) {
          setAuthLoading(true);
        }

        const profile = await fetchUserProfile(session.user.id);

        if (mounted) {
          const email = session.user.email || '';
          const metaRole = session.user.user_metadata?.role as any;

          if (profile) {
            setCurrentUser({
              name: profile.name || email || 'Usuário',
              role: profile.role || metaRole || 'teacher'
            });
          } else {
            // Fallback for missing profile: force admin for the main user, otherwise teacher
            const userRole = (email === 'jadsoncsilv@gmail.com') ? 'admin' : (metaRole || 'teacher');
            setCurrentUser({
              name: email || 'Usuário',
              role: userRole
            });
          }
        }

        try {
          if (mounted) await fetchInitialData();
        } catch (err) {
          console.error('[Auth] Error fetching data during session change:', err);
        } finally {
          if (mounted) setAuthLoading(false);
        }
      } else {
        // No session (Logged out)
        if (mounted) {
          setCurrentUser(null);
          setAuthLoading(false);
          setIsDemoMode(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const addSchool = async (school: School) => {
    const tempId = school.id || Date.now().toString();
    const newSchool = { ...school, id: tempId };

    // 1. Optimistic Update
    setSchools(prev => [...prev, newSchool]);

    if (isDemoMode) {
      showNotification("Escola salva localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('escolas').insert([{
        id: tempId,
        name: school.name,
        code: school.code,
        address: school.address,
        director: school.director,
        coordinator: school.coordinator,
        contact: school.contact
      }]).select().single();

      if (error) throw error;

      // Update with real data from DB if necessary (e.g., if IDs are generated by DB)
      if (data) {
        setSchools(prev => prev.map(s => s.id === tempId ? data as unknown as School : s));
      }
    } catch (err) {
      console.error("Error adding school:", err);
      // Rollback
      setSchools(prev => prev.filter(s => s.id !== tempId));
      showNotification("Erro ao salvar escola no banco de dados.", "error");
    }
  };

  const removeSchool = async (id: string) => {
    const schoolToRemove = schools.find(s => s.id === id);
    if (!schoolToRemove) return;

    // 1. Optimistic Update
    setSchools(prev => prev.filter(s => s.id !== id));

    if (isDemoMode) {
      showNotification("Escola removida localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { error } = await supabase.from('escolas').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Error removing school:", err);
      // Rollback
      setSchools(prev => [...prev, schoolToRemove]);
      showNotification("Erro ao excluir escola do banco de dados.", "error");
    }
  };

  const updateSchool = async (updatedSchool: School) => {
    const originalSchool = schools.find(s => s.id === updatedSchool.id);
    if (!originalSchool) return;

    // 1. Optimistic Update
    setSchools(prev => prev.map(s => s.id === updatedSchool.id ? updatedSchool : s));

    if (isDemoMode) {
      showNotification("Escola atualizada localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('escolas').update({
        name: updatedSchool.name,
        code: updatedSchool.code,
        address: updatedSchool.address,
        director: updatedSchool.director,
        coordinator: updatedSchool.coordinator,
        contact: updatedSchool.contact
      }).eq('id', updatedSchool.id).select().single();

      if (error) throw error;
      if (data) {
        setSchools(prev => prev.map(s => s.id === updatedSchool.id ? data as unknown as School : s));
      }
    } catch (err) {
      console.error("Error updating school:", err);
      // Rollback
      setSchools(prev => prev.map(s => s.id === updatedSchool.id ? originalSchool : s));
      showNotification("Erro ao atualizar escola.", "error");
    }
  };

  const addClass = async (cls: ClassRoom) => {
    const tempId = cls.id || Date.now().toString();
    const newClass = { ...cls, id: tempId };

    // 1. Optimistic Update
    setClasses(prev => [...prev, newClass]);

    if (isDemoMode) {
      showNotification("Turma salva localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('turmas').insert([{
        id: tempId,
        school_id: cls.schoolId,
        stage: cls.stage,
        name: cls.name,
        shift: cls.shift,
        teacher: cls.teacher,
        year: cls.year,
        code: cls.code,
        hours: cls.hours,
        service_type: cls.serviceType,
        modality: cls.modality
      }]).select().single();

      if (error) throw error;
      if (data) {
        setClasses(prev => prev.map(c => c.id === tempId ? { ...data, schoolId: data.school_id, serviceType: data.service_type } as unknown as ClassRoom : c));
      }
    } catch (err) {
      console.error("Error adding class:", err);
      // Rollback
      setClasses(prev => prev.filter(c => c.id !== tempId));
      showNotification("Erro ao salvar turma.", "error");
    }
  };

  const addClasses = async (newClasses: ClassRoom[]) => {
    const tempClasses = newClasses.map(c => ({ ...c, id: c.id || Date.now().toString() + Math.random() }));

    // 1. Optimistic Update
    setClasses(prev => [...prev, ...tempClasses]);

    if (isDemoMode) {
      showNotification("Turmas salvas localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('turmas').insert(tempClasses.map(cls => ({
        id: cls.id,
        school_id: cls.schoolId,
        stage: cls.stage,
        name: cls.name,
        shift: cls.shift,
        teacher: cls.teacher,
        year: cls.year,
        code: cls.code,
        hours: cls.hours,
        service_type: cls.serviceType,
        modality: cls.modality
      }))).select();

      if (error) throw error;
      if (data) {
        const mapped = data.map((d: any) => ({ ...d, schoolId: d.school_id, serviceType: d.service_type })) as ClassRoom[];
        // Replace temp items with real ones
        const tempIds = tempClasses.map(tc => tc.id);
        setClasses(prev => [...prev.filter(c => !tempIds.includes(c.id)), ...mapped]);
      }
    } catch (err) {
      console.error("Error adding classes:", err);
      // Rollback
      const tempIds = tempClasses.map(tc => tc.id);
      setClasses(prev => prev.filter(c => !tempIds.includes(c.id)));
      showNotification("Erro ao salvar turmas em lote.", "error");
    }
  };

  const removeClass = async (id: string) => {
    const classToRemove = classes.find(c => c.id === id);
    if (!classToRemove) return;

    // 1. Optimistic Update
    setClasses(prev => prev.filter(c => c.id !== id));

    if (isDemoMode) {
      showNotification("Turma removida localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { error } = await supabase.from('turmas').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Error removing class:", err);
      // Rollback
      setClasses(prev => [...prev, classToRemove]);
      showNotification("Erro ao excluir turma do banco de dados.", "error");
    }
  };

  const updateClass = async (updatedClass: ClassRoom) => {
    const originalClass = classes.find(c => c.id === updatedClass.id);
    if (!originalClass) return;

    // 1. Optimistic Update
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));

    if (isDemoMode) {
      showNotification("Turma atualizada localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('turmas').update({
        school_id: updatedClass.schoolId,
        stage: updatedClass.stage,
        name: updatedClass.name,
        shift: updatedClass.shift,
        teacher: updatedClass.teacher,
        year: updatedClass.year,
        code: updatedClass.code,
        hours: updatedClass.hours,
        service_type: updatedClass.serviceType,
        modality: updatedClass.modality
      }).eq('id', updatedClass.id).select().single();

      if (error) throw error;
      if (data) {
        setClasses(prev => prev.map(c => c.id === updatedClass.id ? { ...data, schoolId: data.school_id, serviceType: data.service_type } as unknown as ClassRoom : c));
      }
    } catch (err) {
      console.error("Error updating class:", err);
      // Rollback
      setClasses(prev => prev.map(c => c.id === updatedClass.id ? originalClass : c));
      showNotification("Erro ao atualizar turma no banco de dados.", "error");
    }
  };

  const addStudent = async (student: Student) => {
    const tempId = student.id || Date.now().toString();
    const newStudent = { ...student, id: tempId };

    // 1. Optimistic Update
    setStudents(prev => [...prev, newStudent]);

    if (isDemoMode) {
      showNotification("Aluno salvo localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('alunos').insert([{
        id: tempId,
        class_id: student.classId,
        name: student.name,
        birth_date: student.birthDate,
        list_number: student.listNumber,
        cpf: student.cpf
      }]).select().single();

      if (error) throw error;
      if (data) {
        setStudents(prev => prev.map(s => s.id === tempId ? { ...data, classId: data.class_id, birthDate: data.birth_date, listNumber: data.list_number } as unknown as Student : s));
      }
    } catch (err) {
      console.error("Error adding student:", err);
      // Rollback
      setStudents(prev => prev.filter(s => s.id !== tempId));
      showNotification("Erro ao salvar aluno no banco de dados.", "error");
    }
  };

  const addStudents = async (newStudents: Student[]) => {
    const tempStudents = newStudents.map(s => ({ ...s, id: s.id || Date.now().toString() + Math.random() }));

    // 1. Optimistic Update
    setStudents(prev => [...prev, ...tempStudents]);

    if (isDemoMode) {
      showNotification("Alunos salvos localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('alunos').insert(tempStudents.map(student => ({
        id: student.id,
        class_id: student.classId,
        name: student.name,
        birth_date: student.birthDate,
        list_number: student.listNumber,
        cpf: student.cpf
      }))).select();

      if (error) throw error;
      if (data) {
        const mapped = data.map((d: any) => ({ ...d, classId: d.class_id, birthDate: d.birth_date, listNumber: d.list_number })) as unknown as Student[];
        // Replace temp items with real ones
        const tempIds = tempStudents.map(ts => ts.id);
        setStudents(prev => [...prev.filter(s => !tempIds.includes(s.id)), ...mapped]);
      }
    } catch (err) {
      console.error("Error adding students in bulk:", err);
      // Rollback
      const tempIds = tempStudents.map(ts => ts.id);
      setStudents(prev => prev.filter(s => !tempIds.includes(s.id)));
      showNotification("Erro ao salvar alunos em lote.", "error");
    }
  };

  const removeStudent = async (id: string) => {
    const studentToRemove = students.find(s => s.id === id);
    if (!studentToRemove) return;

    // 1. Optimistic Update
    setStudents(prev => prev.filter(s => s.id !== id));

    if (isDemoMode) {
      showNotification("Aluno removido localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { error } = await supabase.from('alunos').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Error removing student:", err);
      // Rollback
      setStudents(prev => [...prev, studentToRemove]);
      showNotification("Erro ao excluir aluno do banco de dados.", "error");
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    const originalStudent = students.find(s => s.id === updatedStudent.id);
    if (!originalStudent) return;

    // 1. Optimistic Update
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));

    if (isDemoMode) {
      showNotification("Aluno atualizado localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('alunos').update({
        class_id: updatedStudent.classId,
        name: updatedStudent.name,
        birth_date: updatedStudent.birthDate,
        list_number: updatedStudent.listNumber,
        cpf: updatedStudent.cpf
      }).eq('id', updatedStudent.id).select().single();

      if (error) throw error;
      if (data) {
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? { ...data, classId: data.class_id, birthDate: data.birth_date, listNumber: data.list_number } as unknown as Student : s));
      }
    } catch (err) {
      console.error("Error updating student:", err);
      // Rollback
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? originalStudent : s));
      showNotification("Erro ao atualizar aluno no banco de dados.", "error");
    }
  };

  const updateAssessment = async (studentId: string, period: Period, skillCode: string, level: SkillLevel) => {
    // 1. Optimistic Update Local
    setAssessments(prev => {
      const studentData = prev[studentId] || {};
      const periodData = studentData[period] || {};
      return { ...prev, [studentId]: { ...studentData, [period]: { ...periodData, [skillCode]: level } } };
    });

    if (isDemoMode) {
      showNotification("Avaliação salva localmente (Modo Demo).", "info");
      return;
    }

    // 2. Persist in BD
    try {
      const { error } = await supabase.from('avaliacoes_infantil').upsert({
        student_id: studentId,
        period: period,
        skill_code: skillCode,
        level: level
      }, { onConflict: 'student_id, period, skill_code' });

      if (error) throw error;
    } catch (err) {
      console.error("Error saving assessment:", err);
      showNotification("Erro ao salvar avaliação infantil no banco de dados.", "error");
    }
  };

  const saveAttendance = async (records: AttendanceRecord[]) => {
    const originalAttendance = [...attendance];

    // 1. Optimistic Update
    setAttendance(prev => {
      const filtered = prev.filter(r => !records.some(nr => nr.id === r.id));
      return [...filtered, ...records];
    });

    if (isDemoMode) {
      showNotification("Frequência salva localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('frequencia').upsert(records.map(r => ({
        id: r.id,
        date: r.date,
        student_id: r.studentId,
        class_id: r.classId,
        status: r.status
      }))).select();

      if (error) throw error;

      if (data) {
        const mappedData = data.map((a: any) => ({
          ...a,
          studentId: a.student_id,
          classId: a.class_id
        })) as unknown as AttendanceRecord[];

        setAttendance(prev => {
          const filtered = prev.filter(r => !mappedData.some(nr => nr.id === r.id));
          return [...filtered, ...mappedData];
        });
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      // Rollback
      setAttendance(originalAttendance);
      showNotification("Erro ao salvar frequência no banco de dados.", "error");
    }
  };

  const saveDailyLog = async (log: DailyLog) => {
    const originalLogs = [...dailyLogs];

    // 1. Optimistic Update
    setDailyLogs(prev => [...prev.filter(l => l.id !== log.id), log]);

    if (isDemoMode) {
      showNotification("Rotina salva localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('registro_rotina').upsert({
        id: log.id,
        date: log.date,
        class_id: log.classId,
        student_id: log.studentId,
        routine: log.routine,
        pedagogical_record: log.pedagogicalRecord,
        skill_field_ids: log.skillFieldIds
      }).select().single();

      if (error) throw error;

      if (data) {
        const mappedData = {
          ...data,
          classId: data.class_id,
          studentId: data.student_id,
          pedagogicalRecord: data.pedagogical_record,
          skillFieldIds: data.skill_field_ids
        } as unknown as DailyLog;

        setDailyLogs(prev => [...prev.filter(l => l.id !== mappedData.id), mappedData]);
      }
    } catch (err) {
      console.error("Error saving daily log:", err);
      // Rollback
      setDailyLogs(originalLogs);
      showNotification("Erro ao salvar registro de rotina.", "error");
    }
  };

  const saveExperienceLog = async (log: ExperienceLog) => {
    const originalExperienceLogs = [...experienceLogs];

    // 1. Optimistic Update
    setExperienceLogs(prev => [...prev.filter(l => l.id !== log.id), log]);

    if (isDemoMode) {
      showNotification("Experiência salva localmente (Modo Demo).", "info");
      return;
    }

    try {
      const { data, error } = await supabase.from('registro_experiencia').upsert({
        id: log.id,
        date: log.date,
        class_id: log.classId,
        field_id: log.fieldId,
        skill_code: log.skillCode,
        description: log.description,
        methodology: log.methodology,
        materials: log.materials,
        observations: log.observations,
        photos: log.photos || []
      }).select().single();

      if (error) throw error;

      if (data) {
        const mappedData = {
          ...data,
          classId: data.class_id,
          fieldId: data.field_id,
          skillCode: data.skill_code
        } as unknown as ExperienceLog;

        setExperienceLogs(prev => [...prev.filter(l => l.id !== mappedData.id), mappedData]);
      }
    } catch (err) {
      console.error("Error saving experience log:", err);
      // Rollback
      setExperienceLogs(originalExperienceLogs);
      showNotification("Erro ao salvar registro de experiência.", "error");
    }
  };

  const saveDescriptiveReport = async (report: DescriptiveReport) => {
    const originalReports = [...descriptiveReports];

    // 1. Optimistic Update
    setDescriptiveReports(prev => {
      const filtered = prev.filter(r => !(r.studentId === report.studentId && r.period === report.period));
      return [...filtered, { ...report, id: report.id || Date.now().toString() }];
    });

    if (isDemoMode) {
      showNotification("Parecer salvo localmente (Modo Demo).", "info");
      return;
    }

    try {
      const payload: any = {
        student_id: report.studentId,
        period: report.period,
        status: report.status,
        cognitive: report.cognitive,
        socioemotional: report.socioemotional,
        motor: report.motor,
        language: report.language,
        strengths: report.strengths,
        areas_to_develop: report.areasToDevelop,
        recommendations: report.recommendations,
        general_synthesis: report.generalSynthesis
      };

      if (report.id) {
        payload.id = report.id;
      }

      const { data, error } = await supabase.from('parecer_descritivo').upsert(payload, { onConflict: 'student_id, period' }).select().single();

      if (error) throw error;

      if (data) {
        const mappedData = {
          ...data,
          studentId: data.student_id,
          areasToDevelop: data.areas_to_develop,
          generalSynthesis: data.general_synthesis
        } as unknown as DescriptiveReport;

        setDescriptiveReports(prev => {
          const filtered = prev.filter(r => !(r.studentId === mappedData.studentId && r.period === mappedData.period));
          return [...filtered, mappedData];
        });
      }
    } catch (err) {
      console.error("Error saving descriptive report:", err);
      // Rollback
      setDescriptiveReports(originalReports);
      showNotification("Erro ao salvar parecer descritivo.", "error");
    }
  };
  const addSystemUser = (user: SystemUser) => setSystemUsers(prev => [...prev, user]);
  const updateSystemUser = (user: SystemUser) => setSystemUsers(prev => prev.map(u => u.id === user.id ? user : u));
  const removeSystemUser = (id: string) => setSystemUsers(prev => prev.filter(u => u.id !== id));

  const showNotification = (message: string, type: NotificationType) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const login = (name: string, role: UserRole) => {
    // Note: The actual login UI will call supabase.auth.signInWithPassword directly.
    // This is kept for compatibility with the mock data/demo mode if needed temporarily,
    // although it shouldn't be used in production flow.
    setCurrentUser({ name, role });
    showNotification(`Bem-vindo, ${name}!`, 'success');
  };

  const logout = async () => {
    try {
      if (!isDemoMode) {
        // Run signOut but timeout if Supabase hangs internally
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Signout timeout')), 3000));
        await Promise.race([signOutPromise, timeoutPromise]);
      }
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      setIsDemoMode(false);
      setCurrentUser(null);
      // Force UI reset to login
      window.location.assign('/');
    }
  };

  const activateDemoMode = () => {
    setIsDemoMode(true);
    setCurrentUser({ name: 'Visitante (Demo)', role: 'admin' });
    seedDemoData();
    setAuthLoading(false);
    showNotification('Modo demonstração ativado. Alterações não serão salvas no banco de dados.', 'info');
  };

  const seedDemoData = () => {
    // 1. Schools (Increased variety)
    const demoSchools: School[] = [
      { id: 'sc-01', name: 'Escola Municipal Estrela do Amanhã', code: '23456789', address: 'Av. das Flores, 100', director: 'Ana Silva', coordinator: 'Beto Rocha', contact: '(11) 98765-4321' },
      { id: 'sc-02', name: 'CEI Pequenos Gênios', code: '12345678', address: 'Rua do Sol, 45', director: 'Carla Dias', coordinator: 'Daniela Lima', contact: '(11) 91234-5678' },
      { id: 'sc-03', name: 'Creche Municipal Vida e Cor', code: '87654321', address: 'Praça da Paz, s/n', director: 'Marcos Paulo', coordinator: 'Helena Santos', contact: '(11) 99988-7766' },
      { id: 'sc-04', name: 'E.M. Jardim da Infância', code: '11223344', address: 'Travessa da Lua, 12', director: 'Sônia Maria', coordinator: 'Roberto Carlos', contact: '(11) 98877-6655' },
      { id: 'sc-05', name: 'Centro Educacional Arco-Íris', code: '55667788', address: 'Rua das Cores, 88', director: 'Fátima Bezerra', coordinator: 'Jorge Aragão', contact: '(11) 97766-5544' }
    ];

    // 2. Classes (More volume, varied stages)
    const demoClasses: ClassRoom[] = [];
    const stages = ['Berçário', 'Creche I', 'Creche II', 'Pré I', 'Pré II'];
    const shifts: ('Matutino' | 'Vespertino' | 'Integral')[] = ['Matutino', 'Vespertino', 'Integral'];

    demoSchools.forEach((school, sIdx) => {
      stages.forEach((stage, stIdx) => {
        // Create 1-2 classes per stage per school
        const classCount = Math.random() > 0.5 ? 2 : 1;
        for (let i = 0; i < classCount; i++) {
          const letter = String.fromCharCode(65 + i);
          demoClasses.push({
            id: `cl-${school.id}-${stage.replace(' ', '')}-${letter}`,
            schoolId: school.id,
            name: `${stage} ${letter}`,
            stage: stage,
            shift: shifts[Math.floor(Math.random() * shifts.length)],
            teacher: `Prof. ${['Márcia', 'Ricardo', 'Juliana', 'Sandra', 'Paulo', 'Eliana'][Math.floor(Math.random() * 6)]}`,
            year: 2024
          });
        }
      });
    });

    // 3. Students (approx 20 per class, total ~600)
    const demoStudents: Student[] = [];
    const firstNames = ['Lucas', 'Mariana', 'Enzo', 'Valentina', 'Gabriel', 'Isabella', 'Mateus', 'Sophia', 'Heitor', 'Alice', 'Theo', 'Julia', 'Bernardo', 'Manuela', 'Arthur', 'Heloísa', 'Pedro', 'Beatriz', 'Noah', 'Laura', 'Samuel', 'Isadora', 'Miguel', 'Lorena'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Lopes', 'Mendes', 'Barros', 'Nunes'];

    demoClasses.forEach((cls) => {
      const baseYear = cls.stage.includes('Pré') ? 2019 : cls.stage.includes('Berçário') ? 2023 : 2021;
      const studentCount = 15 + Math.floor(Math.random() * 10); // 15-25 students
      for (let i = 1; i <= studentCount; i++) {
        const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
        demoStudents.push({
          id: `st-${cls.id}-${i}`,
          classId: cls.id,
          name: `${fname} ${lname}`,
          birthDate: `${baseYear + Math.floor(Math.random() * 2)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          listNumber: i
        });
      }
    });

    // 4. Assessments (Strategic and Pattern-based for analysis)
    const demoAssessments: AssessmentData = {};
    const periods: Period[] = [1, 2, 3, 4]; // Simulating data up to Q4

    demoStudents.forEach(student => {
      demoAssessments[student.id] = {};
      const cls = demoClasses.find(c => c.id === student.classId)!;
      const group = getBnccGroup(cls.stage);

      periods.forEach(p => {
        // "Operational Gap Pattern": Q1 is messy, Q2 improves, Q3 shows specialized bottlenecks
        demoAssessments[student.id]![p] = {};
        SKILL_FIELDS.forEach(field => {
          field.skills.filter(s => s.code.startsWith(group)).forEach(skill => {
            let level: SkillLevel = 'D';
            const rand = Math.random();

            // Artificial Pattern: School SC-03 has a bottleneck in "Corpo e Gestos" (CG)
            if (student.id.includes('sc-03') && field.id === 'CG') {
              level = rand < 0.5 ? 'AD' : rand < 0.8 ? 'ED' : 'D';
            }
            // Artificial Pattern: "O Eu, o Outro..." (EO) is lower for all babies in Q1
            else if (group === 'EI01' && field.id === 'EO' && p === 1) {
              level = rand < 0.6 ? 'AD' : 'ED';
            }
            // General Evolution
            else {
              if (p === 1) level = rand < 0.3 ? 'AD' : rand < 0.7 ? 'ED' : 'D';
              else if (p === 2) level = rand < 0.15 ? 'AD' : rand < 0.4 ? 'ED' : 'D';
              else level = rand < 0.05 ? 'AD' : rand < 0.2 ? 'ED' : 'D';
            }

            // Inconsistency: 10% of data is missing to simulate real operation
            if (Math.random() > 0.1) {
              demoAssessments[student.id]![p]![skill.code] = level;
            }
          });
        });
      });
    });

    // 5. Descriptive Reports (Sample for some students)
    const demoReports: DescriptiveReport[] = [];
    demoStudents.slice(0, 100).forEach(st => {
      demoReports.push({
        studentId: st.id,
        period: 1,
        status: 'Finalizado',
        cognitive: 'Apresenta curiosidade e participa das atividades propostas.',
        socioemotional: 'Interage bem com os colegas, demonstrando empatia.',
        motor: 'Desenvolve coordenação motora fina através de colagens.',
        language: 'Expressa-se verbalmente com clareza.',
        strengths: 'Comunicação e interação.',
        areasToDevelop: 'Foco em atividades prolongadas.',
        recommendations: 'Estimular leitura em casa.',
        generalSynthesis: 'Desenvolvimento dentro do esperado para a idade.'
      });

      // Add 4th Bimester Report
      demoReports.push({
        studentId: st.id,
        period: 4,
        status: 'Finalizado',
        cognitive: 'Demonstra grande evolução no raciocínio lógico e resolução de problemas simples.',
        socioemotional: 'Participa ativamente das atividades em grupo, respeitando as regras de convivência.',
        motor: 'Coordenação motora ampla e fina bem desenvolvidas para a faixa etária.',
        language: 'Ampliou significativamente o vocabulário e estrutura frases complexas.',
        strengths: 'Liderança e criatividade.',
        areasToDevelop: 'Gerenciamento do tempo em atividades livres.',
        recommendations: 'Continuar estimulando a autonomia nas rotinas diárias.',
        generalSynthesis: 'O aluno apresentou excelente progresso ao longo do ano letivo, atingindo os objetivos propostos.'
      });
    });

    // 6. Attendance (Last 30 days)
    const demoAttendance: AttendanceRecord[] = [];
    const today = new Date();
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      demoClasses.slice(0, 10).forEach(cls => { // Sample attendance for first 10 classes
        const clsStudents = demoStudents.filter(s => s.classId === cls.id);
        clsStudents.forEach(st => {
          const rand = Math.random();
          const status = rand < 0.85 ? 'P' : rand < 0.95 ? 'F' : 'J';
          demoAttendance.push({
            id: `${dateStr}_${st.id}`,
            date: dateStr,
            classId: cls.id,
            studentId: st.id,
            status: status as any
          });
        });
      });
    }

    // Apply demo data
    setSchools(demoSchools);
    setClasses(demoClasses);
    setStudents(demoStudents);
    setAssessments(demoAssessments);
    setDescriptiveReports(demoReports);
    setAttendance(demoAttendance);

    showNotification(`Sucesso: ${demoSchools.length} escolas, ${demoClasses.length} turmas e ${demoStudents.length} alunos gerados.`, 'success');
  };

  const value = {
    schools, classes, students, assessments, attendance, dailyLogs, experienceLogs, descriptiveReports, systemUsers, notifications, currentUser, authLoading,
    addSchool, removeSchool, updateSchool, addClass, addClasses, removeClass, updateClass, addStudent, addStudents, removeStudent, updateStudent,
    updateAssessment, saveAttendance, saveDailyLog, saveExperienceLog, saveDescriptiveReport,
    addSystemUser,
    updateSystemUser,
    removeSystemUser,
    showNotification,
    login,
    logout,
    seedDemoData,
    isDemoMode,
    activateDemoMode
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
