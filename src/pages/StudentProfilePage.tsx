import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, GraduationCap, Mail, Trophy, TrendingUp, Star, FileCheck, ExternalLink, ClipboardList } from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatAcademicYearLabel, normalizeAcademicYear } from '@/lib/btech'
import { useStudentProfileData } from '@/hooks/useStudentProfileData'

export function StudentProfilePage() {
  const navigate = useNavigate()
  const { studentId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const returnGrade = searchParams.get('grade')
  const {
    student,
    studentResolved,
    loadingPerformance,
    performanceError,
    assignmentRows,
    quizRows,
    scoreHistoryRows,
    summary,
    subjectProgress,
    isGradeMatched,
  } = useStudentProfileData(studentId)

  const goBack = () => {
    if (returnGrade) {
      navigate(`/students/class?grade=${normalizeAcademicYear(returnGrade)}`)
      return
    }
    navigate('/students')
  }

  if (!studentId) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-sm text-red-500">Invalid learner id.</p>
      </GlassCard>
    )
  }

  if (!student && studentResolved) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-sm font-medium text-red-500">Learner not found.</p>
        <button type="button" onClick={goBack} className="btn-ghost mt-4">
          Back
        </button>
      </GlassCard>
    )
  }

  if (!student) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">Loading learner profile...</p>
      </GlassCard>
    )
  }

  const detailSections = [
    {
      key: 'assignments',
      title: 'Submitted Assignments',
      icon: ClipboardList,
      countLabel: `${assignmentRows.length} total`,
      helperText: assignmentRows.length === 0
        ? 'Open this section to view all assignment records once submissions arrive.'
        : 'Open to see every assignment with subject, deadline, submission date, marks, and status.',
    },
    {
      key: 'quizzes',
      title: 'Quiz Attempts',
      icon: BookOpen,
      countLabel: `${quizRows.length} attempts`,
      helperText: quizRows.length === 0
        ? 'Open this section to check quiz activity once attempts are submitted.'
        : 'Open to review all quiz attempts with subject, submission time, score, and grade.',
    },
    {
      key: 'history',
      title: 'System Score History',
      icon: FileCheck,
      countLabel: `${scoreHistoryRows.length} entries`,
      helperText: scoreHistoryRows.length === 0
        ? 'Open this section when graded records start appearing in the performance timeline.'
        : 'Open to browse the complete score timeline captured by the performance system.',
    },
  ] as const

  return (
    <div className="relative space-y-5 overflow-hidden">
      <div className="pointer-events-none absolute -left-16 -top-14 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
      <div className="pointer-events-none absolute -right-20 top-24 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/20" />
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={goBack}
              className="mb-3 inline-flex items-center gap-2 text-sm text-light-ink-muted transition-colors hover:text-light-ink-primary dark:text-dark-ink-muted dark:hover:text-dark-ink-primary"
            >
              <ArrowLeft size={14} />
              Back to {returnGrade ? formatAcademicYearLabel(returnGrade) : 'Cohorts'}
            </button>
            <h1 className="text-2xl font-semibold text-light-ink-primary dark:text-dark-ink-primary">Learner Performance Profile</h1>
            <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">
              Complete overview of assignments, quiz attempts, and marks.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-glow">
            {student?.name?.charAt(0).toUpperCase() ?? 'L'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold text-light-ink-primary dark:text-dark-ink-primary">{student?.name ?? 'Loading...'}</p>
            <p className="mt-1 flex items-center gap-1 truncate text-sm text-light-ink-muted dark:text-dark-ink-muted">
              <Mail size={13} />
              {student?.email ?? '...'}
            </p>
            <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-300">
              {student?.grade ? formatAcademicYearLabel(student.grade) : 'Academic year not set'}
              {isGradeMatched ? ' cohort' : ''}
            </p>
          </div>
          <div className="rounded-2xl border border-light-border bg-light-card2/70 px-4 py-3 dark:border-dark-border dark:bg-dark-card2/80">
            <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Joined</p>
            <p className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">
              {student?.createdAt ? new Date(student.createdAt).toLocaleDateString() : '...'}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <motion.div whileHover={{ y: -3 }}>
          <GlassCard className="min-h-[104px] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-medium text-light-ink-muted dark:text-dark-ink-muted">Average Score</p>
              <span className="glass-icon h-7 w-7 shrink-0">
                <TrendingUp size={13} />
              </span>
            </div>
            <p className="mt-4 text-[1.75rem] leading-none font-bold text-indigo-600">{summary.avgPercent}%</p>
          </GlassCard>
        </motion.div>
        <motion.div whileHover={{ y: -3 }}>
          <GlassCard className="min-h-[104px] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-medium text-light-ink-muted dark:text-dark-ink-muted">Best Score</p>
              <span className="glass-icon h-7 w-7 shrink-0">
                <Star size={13} />
              </span>
            </div>
            <p className="mt-4 text-[1.75rem] leading-none font-bold text-emerald-600">{summary.bestPercent}%</p>
          </GlassCard>
        </motion.div>
        <motion.div whileHover={{ y: -3 }}>
          <GlassCard className="min-h-[104px] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-medium text-light-ink-muted dark:text-dark-ink-muted">Total Submissions</p>
              <span className="glass-icon h-7 w-7 shrink-0">
                <FileCheck size={13} />
              </span>
            </div>
            <p className="mt-4 text-[1.75rem] leading-none font-bold text-light-ink-primary dark:text-dark-ink-primary">{summary.totalSubmissions}</p>
          </GlassCard>
        </motion.div>
        <motion.div whileHover={{ y: -3 }}>
          <GlassCard className="min-h-[104px] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-medium text-light-ink-muted dark:text-dark-ink-muted">Pending Submissions</p>
              <span className="glass-icon h-7 w-7 shrink-0">
                <ClipboardList size={13} />
              </span>
            </div>
            <p className="mt-4 text-[1.75rem] leading-none font-bold text-rose-500">{summary.pendingCount}</p>
          </GlassCard>
        </motion.div>
        <motion.div whileHover={{ y: -3 }}>
          <GlassCard className="min-h-[104px] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-medium text-light-ink-muted dark:text-dark-ink-muted">Overall Grade</p>
              <span className="glass-icon h-7 w-7 shrink-0">
                <Trophy size={13} />
              </span>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-[1.75rem] leading-none font-bold text-amber-600">
              {summary.overallGrade}
            </p>
          </GlassCard>
        </motion.div>
      </div>

      {performanceError && (
        <GlassCard className="p-4">
          <p className="text-sm text-red-500">{performanceError}</p>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-light-ink-primary dark:text-dark-ink-primary">Subject-wise Progress</h2>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            Subject-wise grade included
          </span>
        </div>
        {loadingPerformance && subjectProgress.length === 0 ? (
          <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">Loading performance...</p>
        ) : subjectProgress.length === 0 ? (
          <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">No graded records yet.</p>
        ) : (
          <div className="space-y-3">
            {subjectProgress.map((item) => (
              <div key={item.subject} className="rounded-2xl border border-light-border bg-light-card2/60 p-4 dark:border-dark-border dark:bg-dark-card2/70">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">{item.subject}</p>
                    <p className="mt-1 text-xs text-light-ink-muted dark:text-dark-ink-muted">
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

      <div className="space-y-4">
        {detailSections.map((section) => (
          <GlassCard key={section.key} className="p-5">
            <button
              type="button"
              onClick={() => navigate(`/students/profile/${studentId}/${section.key}${returnGrade ? `?grade=${normalizeAcademicYear(returnGrade)}` : ''}`)}
              className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 glass-icon h-9 w-9 shrink-0">
                  <section.icon size={16} />
                </span>
                <div>
                  <span className="inline-flex items-center gap-2 text-lg font-semibold text-light-ink-primary transition-colors hover:text-indigo-600 dark:text-dark-ink-primary dark:hover:text-indigo-300">
                    {section.title}
                    <ExternalLink size={15} />
                  </span>
                  <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">{section.helperText}</p>
                </div>
              </div>
              <span className="rounded-full border border-light-border bg-light-card2/70 px-3 py-1 text-xs font-semibold text-light-ink-muted dark:border-dark-border dark:bg-dark-card2/80 dark:text-dark-ink-muted">
                {section.countLabel}
              </span>
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
