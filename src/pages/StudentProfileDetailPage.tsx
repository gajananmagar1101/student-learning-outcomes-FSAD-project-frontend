import { ArrowLeft, BookOpen, FileBarChart2, GraduationCap, History } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { GlassCard } from '@/components/ui/GlassCard'
import { useStudentProfileData } from '@/hooks/useStudentProfileData'
import { formatAcademicYearLabel, normalizeAcademicYear } from '@/lib/btech'

const sectionMeta = {
  assignments: {
    title: 'Submitted Assignments',
    icon: FileBarChart2,
    description: 'Submission status, deadlines, and marks for every assignment in the learner cohort.',
  },
  quizzes: {
    title: 'Quiz Attempts',
    icon: BookOpen,
    description: 'All quiz attempts with scores, subject coverage, and letter grades.',
  },
  history: {
    title: 'System Score History',
    icon: History,
    description: 'Chronological list of graded records captured by the performance service.',
  },
} as const

export function StudentProfileDetailPage() {
  const navigate = useNavigate()
  const { studentId = '', section = 'assignments' } = useParams()
  const profile = useStudentProfileData(studentId)

  const meta = sectionMeta[section as keyof typeof sectionMeta]

  const goBack = () => {
    if (profile.returnGrade) {
      navigate(`/students/profile/${studentId}?grade=${normalizeAcademicYear(profile.returnGrade)}`)
      return
    }
    navigate(`/students/profile/${studentId}`)
  }

  const titleSuffix = useMemo(() => {
    if (!profile.student?.name) return 'Learner'
    return profile.student.name
  }, [profile.student?.name])

  if (!meta) {
    navigate(`/students/profile/${studentId}`)
    return null
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={goBack}
              className="mb-2 inline-flex items-center gap-2 text-sm text-light-ink-muted transition-colors hover:text-light-ink-primary dark:text-dark-ink-muted dark:hover:text-dark-ink-primary"
            >
              <ArrowLeft size={14} />
              Back to Learner Profile
            </button>
            <div className="flex items-center gap-2">
              <meta.icon size={18} className="text-indigo-500" />
              <h1 className="text-xl font-semibold text-light-ink-primary dark:text-dark-ink-primary">{meta.title}</h1>
            </div>
            <p className="mt-2 text-sm text-light-ink-muted dark:text-dark-ink-muted">
              {titleSuffix} · {profile.student?.grade ? formatAcademicYearLabel(profile.student.grade) : 'Unassigned'} · {meta.description}
            </p>
          </div>
        </div>
      </GlassCard>

      {section === 'assignments' ? (
        <GlassCard className="p-4 sm:p-5">
          {profile.assignmentRows.length === 0 ? (
            <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">No assignments found for this learner yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-light-border text-left text-xs uppercase tracking-wider text-light-ink-muted dark:border-dark-border dark:text-dark-ink-muted">
                    <th className="px-2 py-2">Assignment</th>
                    <th className="px-2 py-2">Subject</th>
                    <th className="px-2 py-2">Deadline</th>
                    <th className="px-2 py-2">Submitted</th>
                    <th className="px-2 py-2">Marks</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.assignmentRows.map((row) => (
                    <tr key={row.id} className="border-b border-light-border/70 transition-colors hover:bg-indigo-50/50 dark:border-dark-border/70 dark:hover:bg-white/5">
                      <td className="px-2 py-2.5 font-medium text-light-ink-primary dark:text-dark-ink-primary">{row.title}</td>
                      <td className="px-2 py-2.5 text-light-ink-secondary dark:text-dark-ink-secondary">{row.subject}</td>
                      <td className="px-2 py-2.5 text-light-ink-secondary dark:text-dark-ink-secondary">{new Date(row.deadline).toLocaleDateString()}</td>
                      <td className="px-2 py-2.5 text-light-ink-secondary dark:text-dark-ink-secondary">
                        {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : 'Not submitted'}
                      </td>
                      <td className="px-2 py-2.5 text-light-ink-primary dark:text-dark-ink-primary">
                        {row.marks == null ? 'Pending' : `${row.marks}/${row.totalMarks} (${row.percentage}%)`}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            label={row.status}
                            variant={row.status === 'graded' ? 'success' : row.status === 'submitted' ? 'info' : 'warning'}
                          />
                          {row.late ? <Badge label="late" variant="danger" /> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      ) : null}

      {section === 'quizzes' ? (
        <GlassCard className="p-4 sm:p-5">
          {profile.quizRows.length === 0 ? (
            <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">No quiz attempts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-light-border text-left text-xs uppercase tracking-wider text-light-ink-muted dark:border-dark-border dark:text-dark-ink-muted">
                    <th className="px-2 py-2">Quiz</th>
                    <th className="px-2 py-2">Subject</th>
                    <th className="px-2 py-2">Submitted</th>
                    <th className="px-2 py-2">Marks</th>
                    <th className="px-2 py-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.quizRows.map((row) => (
                    <tr key={row.id} className="border-b border-light-border/70 transition-colors hover:bg-indigo-50/50 dark:border-dark-border/70 dark:hover:bg-white/5">
                      <td className="px-2 py-2.5 font-medium text-light-ink-primary dark:text-dark-ink-primary">{row.title}</td>
                      <td className="px-2 py-2.5 text-light-ink-secondary dark:text-dark-ink-secondary">{row.subject}</td>
                      <td className="px-2 py-2.5 text-light-ink-secondary dark:text-dark-ink-secondary">{new Date(row.submittedAt).toLocaleDateString()}</td>
                      <td className="px-2 py-2.5 text-light-ink-primary dark:text-dark-ink-primary">{row.marks}/{row.totalMarks} ({row.percentage}%)</td>
                      <td className="px-2 py-2.5">
                        <Badge
                          label={row.grade}
                          variant={row.percentage >= 85 ? 'success' : row.percentage >= 60 ? 'info' : 'warning'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      ) : null}

      {section === 'history' ? (
        <GlassCard className="p-4 sm:p-5">
          {profile.scoreHistoryRows.length === 0 ? (
            <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">No system score history available yet.</p>
          ) : (
            <div className="space-y-2.5">
              {profile.scoreHistoryRows.map((item) => (
                <div
                  key={item.submissionId}
                  className="rounded-2xl border border-light-border bg-light-card2/70 p-3 dark:border-dark-border dark:bg-dark-card2/80"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-light-ink-primary dark:text-dark-ink-primary">{item.assignmentTitle}</p>
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
      ) : null}

      <GlassCard className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap size={16} className="text-indigo-500" />
          <h2 className="text-base font-semibold text-light-ink-primary dark:text-dark-ink-primary">Subject-wise Grade Snapshot</h2>
        </div>
        {!profile.subjectProgress.length ? (
          <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">No subject-wise grades available yet.</p>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {profile.subjectProgress.map((item) => (
              <div key={item.subject} className="rounded-2xl border border-light-border bg-light-card2/70 p-3 dark:border-dark-border dark:bg-dark-card2/80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-light-ink-primary dark:text-dark-ink-primary">{item.subject}</p>
                    <p className="mt-1 text-xs text-light-ink-muted dark:text-dark-ink-muted">
                      {item.gradedItems} graded item{item.gradedItems === 1 ? '' : 's'} · {item.pendingAssignments} pending assignment{item.pendingAssignments === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge label={item.grade} variant={item.progress >= 85 ? 'success' : item.progress >= 60 ? 'info' : 'warning'} />
                </div>
                <p className="mt-2 text-lg font-semibold text-light-ink-primary dark:text-dark-ink-primary">{item.progress}%</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
