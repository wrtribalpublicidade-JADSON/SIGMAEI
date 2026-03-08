
export type Period = 1 | 2 | 3 | 4;
export type SkillLevel = 'D' | 'ED' | 'AD' | null;

// --- USER & AUTH TYPES ---
export type UserRole = 'admin' | 'manager' | 'coordinator' | 'teacher';

export interface UserSession {
  name: string;
  role: UserRole;
  schoolId?: string; // Optional: link user to specific school
}

// Represents a registered user in the database
export interface SystemUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  director: string;
  coordinator: string;
  contact: string;
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  stage: string; // e.g., 'Creche II'
  name: string; // e.g., 'Creche II D'
  shift: 'Matutino' | 'Vespertino' | 'Integral';
  teacher: string;
  year: number;
  // New fields added based on request
  code?: string;
  hours?: string;
  serviceType?: string; // Tipo de Atendimento
  modality?: string; // Modalidade
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  birthDate: string;
  listNumber: number;
  cpf?: string; // Added for CPF validation
}

// Assessment structure: { [studentId]: { [period]: { [skillCode]: level } } }
export interface AssessmentData {
  [studentId: string]: {
    [period in Period]?: {
      [skillCode: string]: SkillLevel;
    };
  };
}

export interface Skill {
  code: string;
  description: string;
}

export interface SkillField {
  id: string; // EO, CG, TS, EF, ET
  name: string;
  skills: Skill[];
  color: string;
}

// --- NEW TYPES FOR CLASS DIARY ---

export interface AttendanceRecord {
  id: string; // Composite: date_studentId
  date: string; // YYYY-MM-DD
  studentId: string;
  classId: string;
  status: 'P' | 'F' | 'J'; // Presente, Falta, Justificada
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  studentId: string; // NEW: Individualized log
  routine: string; // Texto livre sobre alimentação, sono, higiene
  pedagogicalRecord: string; // Registro pedagógico
  skillFieldIds: string[]; // IDs dos campos BNCC trabalhados (e.g., ['EO', 'CG'])
}

// NEW: Campos de Experiência Log (Activity Register)
export interface ExperienceLog {
  id: string; // Composite: date_classId
  date: string;
  classId: string;
  fieldId: string; // Campo de Experiência
  skillCode: string; // Objetivo de Aprendizagem
  description: string; // Descrição da Atividade
  methodology: string; // Metodologia
  materials: string; // Materiais
  observations: string; // Observações
  photos?: string[]; // Fotos do Portfólio
}

export interface DescriptiveReport {
  id?: string;
  studentId: string;
  period: Period;
  status: 'Rascunho' | 'Finalizado';

  // Specific Areas
  cognitive: string;
  socioemotional: string;
  motor: string;
  language: string; // Added field

  // General Fields
  strengths: string; // Pontos Fortes
  areasToDevelop: string; // Áreas a Desenvolver
  recommendations: string; // Recomendações para a Família
  generalSynthesis: string; // Parecer Geral
}

// --- NOTIFICATION TYPES ---
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

export interface AppState {
  schools: School[];
  classes: ClassRoom[];
  students: Student[];
  assessments: AssessmentData;
  attendance: AttendanceRecord[];
  dailyLogs: DailyLog[];
  experienceLogs: ExperienceLog[]; // Added
  descriptiveReports: DescriptiveReport[];
  systemUsers: SystemUser[]; // Added
}
