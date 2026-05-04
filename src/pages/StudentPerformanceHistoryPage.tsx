import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, ClipboardList } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuizStore } from '@/store/useQuizStore'

const sectionMeta = {
  assignments: {
    title: 'Assignment History',
    icon: ClipboardList,
    description: 'Every graded assignment with subject, marks, percentage, and graded time.',
  },
  quizzes: {
    title: 'Quiz History',
    icon: BookOpen,
    description: 'Every graded quiz attempt with subject, score, percentage, and submitted time.',
  },
} as const

export function StudentPerformanceHistoryPage() {
  const navigate = useNavigate()
  const { section = 'assignments' } = useParams()
  const { user } = useAuthStore()
  const { studentAssignments, fetchStudentAssignments } = useAssignmentStore()
  const { quizzes, attempts, fetchQuizzes, fetchAttempts } = useQuizStore()

  useEffect(() => {
    if (user?.role !== 'student') return
    void fetchStudentAssignments()
    void fetchQuizzes()
    void fetchAttempts()
  }, [fetchAttempts, fetchQuizzes, fetchStudentAssignments, user?.role])

  const meta = sectionMeta[section as keyof typeof sectionMeta]
  const studentId = user?._id ?? user?.id

  const assignmentHistory = useMemo(
    () =>
      studentAssignments
        .filter((assignment) => assignment.submission?.marks != null)
        .map((assignment) => {
          const marks = assignment.submission?.marks ?? 0
          const totalMarks = assignment.totalMarks || 100
          const percentage = Math.round((marks / totalMarks) * 100)
          return {
            id: `assignment-${assignment.submission?.id ?? assignment.id}`,
            title: assignment.title,
            subject: assignment.subject,
            marks,
            totalMarks,
            percentage,
            gradedAt: assignment.submission?.updatedAt ?? assignment.deadline,
          }
        })
        .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()),
    [studentAssignments]
  )

  const quizHistory = useMemo(
    () =>
      attempts
        .filter((attempt) => studentId && attempt.studentId === studentId)
        .map((attempt) => {
          const quiz = quizzes.find((item) => item.id === attempt.quizId)
          const totalMarks = attempt.totalPoints || 1
          const percentage = Math.round((attempt.score / totalMarks) * 100)
          return {
            id: `quiz-${attempt.id}`,
            title: quiz?.title ?? 'Quiz Attempt',
            subject: quiz?.subject ?? 'Quiz',
            marks: attempt.score,
            totalMarks,
            percentage,
            gradedAt: attempt.submittedAt,
          }
        })
        .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()),
    [attempts, quizzes, studentId]
  )

  if (!meta) {
    navigate('/student-performance')
    return null
  }

  const rows = section === 'assignments' ? assignmentHistory : quizHistory

  return (
    <div className="max-w-4xl space-y-5">
      <GlassCard className="p-5">
        <button
          type="button"
          onClick={() => navigate('/student-performance')}
          className="mb-3 inline-flex items-center gap-2 text-sm text-light-ink-muted transition-colors hover:text-light-ink-primary dark:text-dark-ink-muted dark:hover:text-dark-ink-primary"
        >
          <ArrowLeft size={14} />
          Back to My Performance
        </button>
        <div className="flex items-center gap-2">
          <meta.icon size={18} className="text-indigo-500" />
          <h1 className="text-2xl font-semibold text-light-ink-primary dark:text-dark-ink-primary">{meta.title}</h1>
        </div>
        <p className="mt-2 text-sm text-light-ink-muted dark:text-dark-ink-muted">{meta.description}</p>
      </GlassCard>

      <GlassCard className="p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">No {section === 'assignments' ? 'assignment' : 'quiz'} history yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-light-border bg-light-card2/70 p-4 dark:border-dark-border dark:bg-dark-card2/80"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-light-ink-primary dark:text-dark-ink-primary">{item.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-light-ink-muted dark:text-dark-ink-muted">
                      <span>{item.subject}</span>
                      <span>{new Date(item.gradedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-indigo-600">{item.marks}/{item.totalMarks}</span>
                    <Badge
                      label={`${item.percentage}%`}
                      variant={item.percentage >= 85 ? 'success' : item.percentage >= 60 ? 'info' : 'warning'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
