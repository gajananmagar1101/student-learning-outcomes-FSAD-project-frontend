import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { GlassCard } from '@/components/ui/GlassCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuizStore } from '@/store/useQuizStore'
import { studentAPI } from '@/lib/services'
import type { StudentPerformance } from '@/types'
import { BookOpen, ClipboardList, FileCheck, GraduationCap, Star, TrendingUp, Trophy, ExternalLink } from 'lucide-react'

export function StudentPerformancePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { studentAssignments, fetchStudentAssignments } = useAssignmentStore()
  const { quizzes, attempts, fetchQuizzes, fetchAttempts } = useQuizStore()
  const [performance, setPerformance] = useState<StudentPerformance | null>(null)

  useEffect(() => {
    const studentId = user?._id ?? user?.id
    if (user?.role !== 'student' || !studentId) return

    let cancelled = false
    const loadPerformance = async () => {
      try {
        const res = await studentAPI.getPerformance(studentId)
        if (!cancelled) {
          setPerformance(res.data.performance ?? null)
        }
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (!cancelled) {
          setPerformance(null)
          if (status && status !== 404) {
            console.error('[StudentPerformancePage] Failed to load performance:', error)
          }
        }
      }
    }

    void loadPerformance()
    return () => {
      cancelled = true
    }
  }, [user?._id, user?.id, user?.role])

  useEffect(() => {
    if (user?.role !== 'student') return
    void fetchStudentAssignments()
    void fetchQuizzes()
    void fetchAttempts()
  }, [fetchAttempts, fetchQuizzes, fetchStudentAssignments, user?.role])

  const studentId = user?._id ?? user?.id

  const gradedAssignments = useMemo(
    () =>
      studentAssignments
        .filter((assignment) => assignment.submission?.marks != null)
        .map((assignment) => {
          const marks = assignment.submission?.marks ?? 0
          const totalMarks = assignment.totalMarks || 100
          return {
            submissionId: `assignment-${assignment.submission?.id ?? assignment.id}`,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            subject: assignment.subject,
            marks,
            totalMarks,
            percentage: Math.round((marks / totalMarks) * 100),
            gradedAt: assignment.submission?.updatedAt ?? assignment.deadline,
          }
        }),
    [studentAssignments]
  )

  const gradedQuizAttempts = useMemo(
    () =>
      attempts
        .filter((attempt) => studentId && attempt.studentId === studentId)
        .map((attempt) => {
          const quiz = quizzes.find((item) => item.id === attempt.quizId)
          const totalMarks = attempt.totalPoints || 1
          return {
            submissionId: `quiz-${attempt.id}`,
            assignmentId: attempt.quizId,
            assignmentTitle: quiz?.title ? `[Quiz] ${quiz.title}` : '[Quiz] Quiz Attempt',
            subject: quiz?.subject ?? 'Quiz',
            marks: attempt.score,
            totalMarks,
            percentage: Math.round((attempt.score / totalMarks) * 100),
            gradedAt: attempt.submittedAt,
          }
        }),
    [attempts, quizzes, studentId]
  )

  const allGradedItems = useMemo(
    () => [...gradedAssignments, ...gradedQuizAttempts].sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()),
    [gradedAssignments, gradedQuizAttempts]
  )

  const gradedPercentages = allGradedItems.map((item) => item.percentage)
  const avgPercentage = gradedPercentages.length
    ? Math.round(gradedPercentages.reduce((sum, value) => sum + value, 0) / gradedPercentages.length)
    : 0
  const bestPercentage = gradedPercentages.length ? Math.max(...gradedPercentages) : 0
  const pendingAssignments = studentAssignments.filter((assignment) => assignment.status === 'pending').length

  const subjectProgress = useMemo(() => {
    const bySubject = new Map<string, { total: number; count: number; pendingAssignments: number }>()

    gradedAssignments.forEach((item) => {
      const prev = bySubject.get(item.subject) ?? { total: 0, count: 0, pendingAssignments: 0 }
      bySubject.set(item.subject, {
        total: prev.total + item.percentage,
        count: prev.count + 1,
        pendingAssignments: prev.pendingAssignments,
      })
    })

    gradedQuizAttempts.forEach((item) => {
      const prev = bySubject.get(item.subject) ?? { total: 0, count: 0, pendingAssignments: 0 }
      bySubject.set(item.subject, {
        total: prev.total + item.percentage,
        count: prev.count + 1,
        pendingAssignments: prev.pendingAssignments,
      })
    })

    studentAssignments
      .filter((assignment) => assignment.status === 'pending')
      .forEach((assignment) => {
        const prev = bySubject.get(assignment.subject) ?? { total: 0, count: 0, pendingAssignments: 0 }
        bySubject.set(assignment.subject, {
          total: prev.total,
          count: prev.count,
          pendingAssignments: prev.pendingAssignments + 1,
        })
      })

    return Array.from(bySubject.entries())
      .map(([subject, stats]) => {
        const progress = stats.count > 0 ? Math.round(stats.total / stats.count) : 0
        const grade = progress >= 90 ? 'A' : progress >= 80 ? 'B' : progress >= 70 ? 'C' : progress >= 60 ? 'D' : stats.count > 0 ? 'F' : 'N/A'
        return {
          subject,
          progress,
          grade,
          gradedItems: stats.count,
          pendingAssignments: stats.pendingAssignments,
        }
      })
      .sort((left, right) => right.progress - left.progress || left.subject.localeCompare(right.subject))
  }, [gradedAssignments, gradedQuizAttempts, studentAssignments])

  const displayPerformance = performance ?? {
    avgScore: 0,
    avgPercentage,
    bestScore: 0,
    bestPercentage,
    overallGrade: avgPercentage >= 90 ? 'A' : avgPercentage >= 80 ? 'B' : avgPercentage >= 70 ? 'C' : avgPercentage >= 60 ? 'D' : allGradedItems.length ? 'F' : 'N/A',
    progressPercent: avgPercentage,
    totalSubmissions: allGradedItems.length,
    scoreHistory: allGradedItems,
  }

  const historySections = [
    {
      key: 'assignments',
      title: 'Assignment History',
      icon: ClipboardList,
      countLabel: `${gradedAssignments.length} entries`,
      helperText: gradedAssignments.length === 0
        ? 'Open this section to view assignment history once graded submissions are available.'
        : 'Open to see every graded assignment with subject, marks, percentage, and graded time.',
    },
    {
      key: 'quizzes',
      title: 'Quiz History',
      icon: BookOpen,
      countLabel: `${gradedQuizAttempts.length} entries`,
      helperText: gradedQuizAttempts.length === 0
        ? 'Open this section to view quiz history once submitted attempts are available.'
        : 'Open to review every quiz attempt with subject, score, percentage, and submission time.',
    },
  ] as const

  return (
    <div className="max-w-4xl space-y-3.5">
      <GlassCard className="p-4">
        <h1 className="text-xl font-semibold text-light-ink-primary dark:text-dark-ink-primary">My Performance</h1>
        <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">
          Subject-wise grades, submission stats, and complete score history in one place.
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Average Score', value: `${avgPercentage}%`, color: 'text-indigo-600', icon: TrendingUp },
          { label: 'Best Score', value: `${bestPercentage}%`, color: 'text-emerald-600', icon: Star },
          { label: 'Total Submissions', value: `${allGradedItems.length}`, color: 'text-light-ink-primary dark:text-dark-ink-primary', icon: FileCheck },
          { label: 'Pending Submissions', value: `${pendingAssignments}`, color: 'text-rose-500', icon: ClipboardList },
          { label: 'Overall Grade', value: displayPerformance.overallGrade, color: 'text-amber-600', icon: Trophy },
        ].map((stat) => (
          <GlassCard key={stat.label} className="min-h-[92px] p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium text-light-ink-muted dark:text-dark-ink-muted">{stat.label}</p>
              <span className="glass-icon h-6 w-6 shrink-0">
                <stat.icon size={13} />
              </span>
            </div>
            <p className={`mt-3 text-[1.45rem] leading-none font-bold ${stat.color}`}>{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">Performance Progress</h2>
            <p className="mt-1 text-xs text-light-ink-muted dark:text-dark-ink-muted">Updates automatically when admin posts grades.</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-indigo-600">{displayPerformance.overallGrade}</p>
            <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Overall Grade</p>
          </div>
        </div>
        <ProgressBar
          label="Overall Progress"
          value={displayPerformance.progressPercent ?? 0}
          color={(displayPerformance.progressPercent ?? 0) >= 85 ? 'bg-emerald-500' : (displayPerformance.progressPercent ?? 0) >= 70 ? 'bg-indigo-500' : 'bg-amber-500'}
        />
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-light-card2/70 p-2.5 dark:bg-dark-card2/80">
            <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Average Percentage</p>
            <p className="mt-1 text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">{displayPerformance.avgPercentage ?? 0}%</p>
          </div>
          <div className="rounded-xl bg-light-card2/70 p-2.5 dark:bg-dark-card2/80">
            <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Best Percentage</p>
            <p className="mt-1 text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">{displayPerformance.bestPercentage ?? 0}%</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-light-ink-primary dark:text-dark-ink-primary">Subject-wise Progress</h2>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            Subject-wise grade included
          </span>
        </div>
        {subjectProgress.length === 0 ? (
          <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">No graded records yet.</p>
        ) : (
          <div className="slim-scrollbar max-h-[18rem] space-y-2 overflow-y-auto pr-1">
            {subjectProgress.map((item) => (
              <div key={item.subject} className="rounded-[1.45rem] border border-light-border bg-light-card2/55 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-dark-border dark:bg-dark-card2/70">
                <div className="mb-1.5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">{item.subject}</p>
                    <p className="mt-0.5 text-[11px] text-light-ink-muted dark:text-dark-ink-muted">
                      {item.gradedItems} graded item{item.gradedItems === 1 ? '' : 's'} · {item.pendingAssignments} pending assignment{item.pendingAssignments === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge
                    label={item.grade}
                    variant={item.progress >= 85 ? 'success' : item.progress >= 60 ? 'info' : 'warning'}
                  />
                </div>
                <ProgressBar
                  label="Current score"
                  value={item.progress}
                  color={item.progress >= 85 ? 'bg-emerald-500' : item.progress >= 70 ? 'bg-indigo-500' : 'bg-amber-500'}
                />
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">System Score History</h2>
        <div className="space-y-3">
          {historySections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => navigate(`/student-performance/${section.key}`)}
              className="w-full rounded-2xl border border-light-border bg-light-card2/60 p-3 text-left transition-colors hover:bg-light-hover dark:border-dark-border dark:bg-dark-card2/70 dark:hover:bg-dark-hover"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <span className="glass-icon mt-0.5 h-8 w-8 shrink-0">
                    <section.icon size={16} />
                  </span>
                  <div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">
                      {section.title}
                      <ExternalLink size={14} />
                    </span>
                    <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">{section.helperText}</p>
                  </div>
                </div>
                <span className="rounded-full border border-light-border bg-light-card/80 px-3 py-1 text-xs font-semibold text-light-ink-muted dark:border-dark-border dark:bg-dark-card dark:text-dark-ink-muted">
                  {section.countLabel}
                </span>
              </div>
            </button>
          ))}

          {!displayPerformance.scoreHistory?.length ? (
            <p className="pt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">No graded assignment or quiz history yet.</p>
          ) : null}
        </div>
      </GlassCard>
    </div>
  )
}
