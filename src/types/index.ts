export type Role = 'admin' | 'faculty' | 'student'

export interface User {
  _id?: string
  id: string
  name: string
  email: string
  role: Role
  isEmailVerified?: boolean
  grade?: string
  avatar?: string
  accessBlocked?: boolean
  accessBlockedUntil?: string | null
  accessBlockReason?: string | null
}

export interface Assessment {
  _id?: string
  id: string
  title: string
  subject: string
  date: string
  maxScore: number
  status: 'upcoming' | 'completed' | 'grading'
}

export type AssignmentSubmissionStatus = 'pending' | 'submitted' | 'graded'
export type AssignmentStatus = 'draft' | 'published'

export interface AssignmentSubmission {
  _id?: string
  id: string
  content?: string | null
  fileName?: string | null
  fileContent?: string | null
  marks?: number | null
  status: Exclude<AssignmentSubmissionStatus, 'pending'>
  submittedAt: string
  updatedAt: string
}

export interface AssignmentItem {
  _id?: string
  id: string
  subjectId?: string
  title: string
  subject: string
  className: string
  description: string
  totalMarks: number
  deadline: string
  publicationStatus: AssignmentStatus
  questionFileName?: string | null
  questionFileContent?: string | null
  createdAt?: string
}

export interface StudentAssignmentItem extends AssignmentItem {
  submissionClosed: boolean
  canSubmit: boolean
  canEdit: boolean
  status: AssignmentSubmissionStatus
  submission?: AssignmentSubmission | null
}

export interface AdminSubmission {
  _id?: string
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  assignmentId: string
  assignmentTitle: string
  subject: string
  totalMarks: number
  deadline: string
  content?: string | null
  fileName?: string | null
  fileContent?: string | null
  marks?: number | null
  status: Exclude<AssignmentSubmissionStatus, 'pending'>
  submittedAt: string
  updatedAt: string
  late: boolean
}

export interface StudentScore {
  _id?: string
  studentId?: string
  assessmentId?: string
  assessment?: Assessment
  score: number
  feedback?: string
  submittedAt: string
}

export interface StudentPerformance {
  avgScore: number
  avgPercentage: number
  bestScore: number
  bestPercentage: number
  overallGrade: string
  progressPercent: number
  totalSubmissions: number
  scoreHistory: {
    submissionId: string
    assignmentId: string
    assignmentTitle: string
    subject: string
    marks: number
    totalMarks: number
    percentage: number
    gradedAt: string
  }[]
}

export interface SubjectProgress {
  subject: string
  progress: number
  score: number
}

// DB student — scores come from separate API call
export interface DBStudent {
  _id: string
  id?: string
  name: string
  email: string
  grade: string
  role: string
  createdAt: string
  accessBlocked: boolean
  accessBlockedUntil: string | null
  accessBlockReason: string | null
}

// Full student with scores (used in drawer)
export interface Student {
  _id?: string
  id: string
  name: string
  email: string
  grade: string
  scores: StudentScore[]
  subjects: SubjectProgress[]
}

export interface ChartDataPoint {
  month: string
  score: number
  average: number
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correctOption: number
  points: number
}

export interface AiGeneratedQuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: string
}

export interface AiQuizStatus {
  enabled: boolean
  configured: boolean
  available: boolean
  maxQuestionCount: number
  message: string
}

export type QuizStatus = 'draft' | 'published' | 'closed'

export interface Quiz {
  id: string
  subjectId?: string
  title: string
  subject: string
  className: string
  description: string
  deadlineAt?: string
  durationMinutes: number
  status: QuizStatus
  questions: QuizQuestion[]
  totalPoints: number
  createdAt: string
  updatedAt: string
}

export interface QuizAttempt {
  id: string
  quizId: string
  studentId: string
  studentName: string
  studentEmail: string
  className: string
  answers: number[]
  score: number
  totalPoints: number
  submittedAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning'
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export interface SubjectOption {
  id: string
  name: string
  yearId: string
  yearCode?: string | null
  yearName?: string | null
}

export interface YearOption {
  id: string
  code: string
  name: string
}

export interface FacultyRegistrationRequest {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  approvalStatus: string | null
  requestedAt: string | null
  updatedAt: string | null
}

export interface FacultyMember {
  _id?: string
  id: string
  name: string
  email: string
  role: string
  createdAt: string | null
  accessBlocked: boolean
  accessBlockedUntil: string | null
  accessBlockReason: string | null
}
