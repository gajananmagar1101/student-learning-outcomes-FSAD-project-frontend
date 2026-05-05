import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { studentAPI } from '@/lib/services'
import { formatAcademicYearLabel, normalizeAcademicYear } from '@/lib/btech'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useQuizStore } from '@/store/useQuizStore'
import { useStudentStore } from '@/store/useStudentStore'
import type { AdminSubmission, AssignmentSubmissionStatus, QuizAttempt, StudentPerformance } from '@/types'

export interface StudentAssignmentRow {
  id: string
  assignmentId: string
  title: string
  subject: string
  deadline: string
  totalMarks: number
  submittedAt: string | null
  gradedAt: string | null
  marks: number | null
  percentage: number | null
  status: AssignmentSubmissionStatus
  late: boolean
  pendingSubmission: boolean
}

export interface StudentQuizRow {
  id: string
  quizId: string
  title: string
  subject: string
  submittedAt: string
  totalMarks: number
  marks: number
  percentage: number
  grade: string
}

export interface SubjectProgressRow {
  subject: string
  progress: number
  grade: string
  gradedItems: number
  pendingAssignments: number
}

export const getLetterGrade = (percent: number) => {
  if (percent >= 90) return 'A'
  if (percent >= 80) return 'B'
  if (percent >= 70) return 'C'
  if (percent >= 60) return 'D'
  return 'F'
}

const buildSubmittedAssignmentRow = (submission: AdminSubmission): StudentAssignmentRow => {
  const totalMarks = submission.totalMarks || 100
  const marks = submission.marks ?? null
  const percentage = marks == null ? null : Math.round((marks / totalMarks) * 100)
  return {
    id: submission.id,
    assignmentId: submission.assignmentId,
    title: submission.assignmentTitle,
    subject: submission.subject,
    deadline: submission.deadline,
    submittedAt: submission.submittedAt,
    gradedAt: submission.updatedAt,
    totalMarks,
    marks,
    percentage,
    status: submission.status,
    late: submission.late,
    pendingSubmission: false,
  }
}

export function useStudentProfileData(studentId: string) {
  const [searchParams] = useSearchParams()
  const returnGrade = searchParams.get('grade')

  const { students, fetchStudents } = useStudentStore()
  const {
    adminAssignments,
    submissions,
    fetchAdminAssignments,
    fetchAdminSubmissions,
  } = useAssignmentStore()
  const { quizzes, attempts, fetchQuizzes, fetchAttempts } = useQuizStore()

  const [performance, setPerformance] = useState<StudentPerformance | null>(null)
  const [loadingPerformance, setLoadingPerformance] = useState(true)
  const [performanceError, setPerformanceError] = useState<string | null>(null)

  useEffect(() => {
    if (students.length === 0) {
      void fetchStudents()
    }
  }, [fetchStudents, students.length])

  useEffect(() => {
    void fetchAdminAssignments()
    void fetchAdminSubmissions()
    void fetchQuizzes()
    void fetchAttempts()
  }, [fetchAdminAssignments, fetchAdminSubmissions, fetchAttempts, fetchQuizzes])

  useEffect(() => {
    if (!studentId) return

    let cancelled = false
    const loadPerformance = async () => {
      setLoadingPerformance(true)
      setPerformanceError(null)
      try {
        const res = await studentAPI.getPerformance(studentId)
        if (!cancelled) {
          setPerformance(res.data.performance ?? null)
        }
      } catch (error) {
        const status = (error as { response?: { status?: number; data?: { message?: string } } })?.response?.status
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        if (!cancelled) {
          setPerformance(null)
          if (status && status !== 404) {
            setPerformanceError(message ?? 'Failed to fetch learner performance')
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingPerformance(false)
        }
      }
    }

    void loadPerformance()
    return () => {
      cancelled = true
    }
  }, [studentId])

  const student = useMemo(
    () => students.find((item) => (item._id ?? item.id) === studentId) ?? null,
    [studentId, students]
  )

  const normalizedStudentGrade = normalizeAcademicYear(student?.grade)

  const studentSubmissions = useMemo(
    () => submissions.filter((submission) => submission.studentId === studentId),
    [studentId, submissions]
  )

  const submittedAssignmentRows = useMemo(
    () => studentSubmissions.map(buildSubmittedAssignmentRow),
    [studentSubmissions]
  )

  const pendingAssignmentRows = useMemo(() => {
    if (!normalizedStudentGrade) return []

    const submittedAssignmentIds = new Set(studentSubmissions.map((submission) => submission.assignmentId))
    return adminAssignments
      .filter((assignment) => normalizeAcademicYear(assignment.className) === normalizedStudentGrade)
      .filter((assignment) => !submittedAssignmentIds.has(assignment.id))
      .map((assignment) => ({
        id: `pending-${assignment.id}`,
        assignmentId: assignment.id,
        title: assignment.title,
        subject: assignment.subject,
        deadline: assignment.deadline,
        totalMarks: assignment.totalMarks || 100,
        submittedAt: null,
        gradedAt: null,
        marks: null,
        percentage: null,
        status: 'pending' as const,
        late: false,
        pendingSubmission: true,
      }))
      .sort((left, right) => new Date(left.deadline).getTime() - new Date(right.deadline).getTime())
  }, [adminAssignments, normalizedStudentGrade, studentSubmissions])

  const assignmentRows = useMemo(
    () => [...submittedAssignmentRows, ...pendingAssignmentRows],
    [pendingAssignmentRows, submittedAssignmentRows]
  )

  const quizRows = useMemo(
    () =>
      attempts
        .filter((attempt: QuizAttempt) => attempt.studentId === studentId)
        .map((attempt) => {
          const quiz = quizzes.find((item) => item.id === attempt.quizId)
          const totalMarks = attempt.totalPoints || 1
          const percentage = Math.round((attempt.score / totalMarks) * 100)
          return {
            id: attempt.id,
            quizId: attempt.quizId,
            title: quiz?.title ?? 'Quiz Attempt',
            subject: quiz?.subject ?? 'Quiz',
            submittedAt: attempt.submittedAt,
            totalMarks,
            marks: attempt.score,
            percentage,
            grade: getLetterGrade(percentage),
          }
        }),
    [attempts, quizzes, studentId]
  )

  const overduePendingAssignmentRows = useMemo(
    () => pendingAssignmentRows.filter((row) => new Date(row.deadline).getTime() <= Date.now()),
    [pendingAssignmentRows]
  )

  const missedQuizRows = useMemo(() => {
    if (!normalizedStudentGrade) return []

    const attemptedQuizIds = new Set(quizRows.map((row) => row.quizId))
    return quizzes
      .filter((quiz) => normalizeAcademicYear(quiz.className) === normalizedStudentGrade)
      .filter((quiz) => Boolean(quiz.deadlineAt) && new Date(quiz.deadlineAt as string).getTime() <= Date.now())
      .filter((quiz) => !attemptedQuizIds.has(quiz.id))
      .map((quiz) => ({
        id: `missed-${quiz.id}`,
        quizId: quiz.id,
        title: quiz.title,
        subject: quiz.subject,
        submittedAt: quiz.deadlineAt ?? new Date().toISOString(),
        totalMarks: quiz.totalPoints || 1,
        marks: 0,
        percentage: 0,
        grade: 'F',
      }))
  }, [normalizedStudentGrade, quizRows, quizzes])

  const overallRows = useMemo(
    () => [
      ...submittedAssignmentRows
        .filter((row) => row.percentage != null)
        .map((row) => ({ subject: row.subject, percentage: row.percentage as number })),
      ...quizRows.map((row) => ({ subject: row.subject, percentage: row.percentage })),
      ...overduePendingAssignmentRows.map((row) => ({ subject: row.subject, percentage: 0 })),
      ...missedQuizRows.map((row) => ({ subject: row.subject, percentage: 0 })),
    ],
    [missedQuizRows, overduePendingAssignmentRows, quizRows, submittedAssignmentRows]
  )

  const summary = useMemo(() => {
    const gradedCount = overallRows.length
    const totalAssignments = assignmentRows.length
    const totalSubmissions = submittedAssignmentRows.length + quizRows.length
    const pendingCount = pendingAssignmentRows.length

    if (gradedCount === 0) {
      return {
        avgPercent: 0,
        bestPercent: 0,
        totalAssignments,
        totalSubmissions,
        pendingCount,
        overallGrade: 'N/A',
      }
    }

    const percentages = overallRows.map((row) => row.percentage)
    const avgPercent = Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
    const bestPercent = Math.max(...percentages)
    return {
      avgPercent,
      bestPercent,
      totalAssignments,
      totalSubmissions,
      pendingCount,
      overallGrade: getLetterGrade(avgPercent),
    }
  }, [assignmentRows.length, overallRows, pendingAssignmentRows.length, quizRows.length, submittedAssignmentRows.length])

  const subjectProgress = useMemo(() => {
    const bySubject = new Map<string, { total: number; count: number; pendingAssignments: number }>()

    overallRows.forEach((row) => {
      const prev = bySubject.get(row.subject) ?? { total: 0, count: 0, pendingAssignments: 0 }
      bySubject.set(row.subject, {
        total: prev.total + row.percentage,
        count: prev.count + 1,
        pendingAssignments: prev.pendingAssignments,
      })
    })

    pendingAssignmentRows.forEach((row) => {
      const prev = bySubject.get(row.subject) ?? { total: 0, count: 0, pendingAssignments: 0 }
      bySubject.set(row.subject, {
        total: prev.total,
        count: prev.count,
        pendingAssignments: prev.pendingAssignments + 1,
      })
    })

    return Array.from(bySubject.entries())
      .map(([subject, stats]) => {
        const progress = stats.count > 0 ? Math.round(stats.total / stats.count) : 0
        return {
          subject,
          progress,
          grade: stats.count > 0 ? getLetterGrade(progress) : 'N/A',
          gradedItems: stats.count,
          pendingAssignments: stats.pendingAssignments,
        }
      })
      .sort((left, right) => right.progress - left.progress || left.subject.localeCompare(right.subject))
  }, [overallRows, pendingAssignmentRows])

  const scoreHistoryRows = useMemo(() => {
    const performanceRows = performance?.scoreHistory ?? []
    return [...performanceRows].sort((left, right) => new Date(right.gradedAt).getTime() - new Date(left.gradedAt).getTime())
  }, [performance?.scoreHistory])

  const isGradeMatched = returnGrade && student?.grade
    ? normalizeAcademicYear(student.grade) === normalizeAcademicYear(returnGrade)
    : false

  return {
    returnGrade,
    student,
    studentResolved: students.length > 0,
    performance,
    loadingPerformance,
    performanceError,
    submittedAssignmentRows,
    pendingAssignmentRows,
    assignmentRows,
    quizRows,
    scoreHistoryRows,
    summary,
    subjectProgress,
    isGradeMatched,
    cohortLabel: student?.grade ? formatAcademicYearLabel(student.grade) : 'Academic year not set',
  }
}
