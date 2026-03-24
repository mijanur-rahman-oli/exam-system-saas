// src/types/index.ts
export type UserRole = 'admin' | 'question_setter' | 'teacher' | 'student';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  grade?: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: number;
  name: string;
  description?: string | null;
  createdAt: Date;
}

export interface Chapter {
  id: number;
  subjectId: number;
  name: string;
  description?: string | null;
  subject?: Subject;
}

export interface Subconcept {
  id: number;
  chapterId: number;
  name: string;
  description?: string | null;
  chapter?: Chapter;
}

export interface Question {
  id: number;
  subjectId: number;
  chapterId?: number | null;
  subconceptId?: number | null;
  question: string;
  optionA: string;
  optionB: string;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer: string;
  explanation?: string | null;
  marks: number;
  difficulty: Difficulty;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  chapter?: Chapter;
  subconcept?: Subconcept;
}

export interface Exam {
  id: number;
  examName: string;
  description?: string | null;
  subjectId: number;
  gradeLevel?: string | null;
  duration: number;
  totalMarks?: number | null;
  passingMarks?: number | null;
  scheduleTime?: Date | null;
  isActive: boolean;
  retakeAllowed: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  questions?: ExamQuestion[];
}

export interface ExamQuestion {
  id: number;
  examId: number;
  questionId: number;
  marks: number;
  question?: Question;
}

export interface ExamAttempt {
  id: number;
  examId: number;
  studentId: number;
  score?: number | null;
  startedAt: Date;
  submittedAt?: Date | null;
  isCompleted: boolean;
  exam?: Exam;
  results?: ExamResult[];
}

export interface ExamResult {
  id: number;
  examAttemptId: number;
  questionId: number;
  selectedAnswer?: string | null;
  isCorrect: boolean;
  marksObtained?: number | null;
  question?: Question;
}

// Form Types
export interface LoginFormData {
  username: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
  grade?: string;
  fullName?: string;
  subject?: string;
}

export interface QuestionFormData {
  subjectId: number;
  chapterId?: number;
  subconceptId?: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  explanation?: string;
  marks: number;
  difficulty: Difficulty;
}

export interface ExamFormData {
  examName: string;
  description?: string;
  subjectId: number;
  gradeLevel?: string;
  duration: number;
  passingMarks?: number;
  scheduleTime?: Date;
  isActive: boolean;
  retakeAllowed: boolean;
  questions: { questionId: number; marks: number }[];
}