import { useMemo } from 'react'
import { CalendarDays, Clock3, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/useAuthStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useQuizStore } from '@/store/useQuizStore'
import { normalizeAcademicYear } from '@/lib/btech'

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export function StudentPlannerPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const studentAssignments = useAssignmentStore((state) => state.studentAssignments)
  const quizzes = useQuizStore((state) => state.quizzes)
  const attempts = useQuizStore((state) => state.attempts)

  const cohort = normalizeAcademicYear(user?.grade)
  const userId = user?._id ?? user?.id
  const now = Date.now()

  const pendingAssignments = useMemo(
    () => studentAssignments.filter((assignment) => assignment.status !== 'graded'),
    [studentAssignments]
  )

  const availableQuizzes = useMemo(
    () => quizzes.filter((quiz) => (
      quiz.status === 'published'
      && normalizeAcademicYear(quiz.className) === cohort
      && (!quiz.deadlineAt || new Date(quiz.deadlineAt).getTime() >= now)
    )),
    [cohort, now, quizzes]
  )

  const attemptedQuizIds = useMemo(
    () => new Set(attempts.filter((attempt) => attempt.studentId === userId).map((attempt) => attempt.quizId)),
    [attempts, userId]
  )

  const plannerItems = useMemo(() => {
    const assignmentItems = pendingAssignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      subtitle: `${assignment.subject} · ${assignment.totalMarks} marks`,
      dueAt: assignment.deadline,
      type: 'Assignment' as const,
      actionLabel: assignment.submission ? 'Update Submission' : 'Submit Work',
      onOpen: () => navigate('/assessments'),
      status: assignment.submission ? 'submitted' : 'pending',
    }))

    const quizItems = availableQuizzes
      .filter((quiz) => !attemptedQuizIds.has(quiz.id))
      .map((quiz) => ({
        id: `quiz-${quiz.id}`,
        title: quiz.title,
        subtitle: `${quiz.subject} · ${quiz.questions.length} questions`,
        dueAt: quiz.deadlineAt ?? new Date(now + (1000 * 60 * 60 * 24 * 30)).toISOString(),
        type: 'Quiz' as const,
        actionLabel: 'Open Quiz',
        onOpen: () => navigate('/quizzes'),
        status: 'open',
      }))

    return [...assignmentItems, ...quizItems]
      .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
      .slice(0, 8)
  }, [attemptedQuizIds, availableQuizzes, navigate, now, pendingAssignments])

  const nextDeadline = plannerItems[0]
  const completedQuizCount = attempts.filter((attempt) => attempt.studentId === userId).length

  const quickTips = [
    pendingAssignments.length
      ? `You have ${pendingAssignments.length} assignment${pendingAssignments.length === 1 ? '' : 's'} waiting for review or submission.`
      : 'Your assignment queue is clear right now.',
    availableQuizzes.length
      ? `${availableQuizzes.length} quiz${availableQuizzes.length === 1 ? '' : 'zes'} are available for your cohort.`
      : 'No new quizzes are open for your cohort at the moment.',
    nextDeadline
      ? `Next priority: ${nextDeadline.title} by ${formatDateTime(nextDeadline.dueAt)}.`
      : 'No immediate deadlines are scheduled yet.',
  ]

  return (
    <div className="space-y-6">
      <GlassCard className="border-sky-200/40 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-emerald-500/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
              <CalendarDays size={14} /> Weekly Planner
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-light-ink-primary dark:text-dark-ink-primary">Stay ahead of deadlines</h1>
            <p className="mt-1 max-w-2xl text-sm text-light-ink-muted dark:text-dark-ink-muted">
              Track pending assignments, open quizzes, and the next best action for your semester flow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="rounded-xl border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200"
          >
            Open Progress
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">Pending Assignments</p>
          <p className="mt-3 text-3xl font-bold text-indigo-600">{pendingAssignments.length}</p>
          <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">Draft, submitted, or awaiting grade</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">Open Quizzes</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600">{availableQuizzes.length}</p>
          <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">Available for your current B.Tech year</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">Completed Quizzes</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">{completedQuizCount}</p>
          <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">Attempts already submitted</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-light-ink-primary dark:text-dark-ink-primary">Action Queue</h2>
            <button
              type="button"
              onClick={() => navigate('/assessments')}
              className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-300"
            >
              View all work
            </button>
          </div>
          {!plannerItems.length ? (
            <p className="py-12 text-center text-sm text-light-ink-muted dark:text-dark-ink-muted">No pending tasks right now.</p>
          ) : (
            <div className="space-y-3">
              {plannerItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-light-border bg-white/50 p-4 dark:border-dark-border dark:bg-dark-card2/70 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">{item.title}</p>
                      <Badge label={item.type} variant={item.type === 'Quiz' ? 'info' : 'warning'} />
                    </div>
                    <p className="mt-1 text-xs text-light-ink-muted dark:text-dark-ink-muted">{item.subtitle}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-light-ink-muted dark:text-dark-ink-muted">
                      <Clock3 size={12} /> Due {formatDateTime(item.dueAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={item.onOpen}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-light-ink-primary dark:text-dark-ink-primary">
            <Sparkles size={16} className="text-amber-500" /> Focus Notes
          </h2>
          <div className="mt-4 space-y-3">
            {quickTips.map((tip) => (
              <div key={tip} className="rounded-2xl border border-light-border bg-white/55 p-4 text-sm text-light-ink-secondary dark:border-dark-border dark:bg-dark-card2/70 dark:text-dark-ink-secondary">
                {tip}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-indigo-200/70 bg-white/80 p-4 shadow-sm dark:border-indigo-400/25 dark:bg-slate-900/85">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Next Best Move</p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {nextDeadline ? `${nextDeadline.title} is the closest deadline in your queue.` : 'You are caught up. Use this time to review past quiz attempts.'}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
