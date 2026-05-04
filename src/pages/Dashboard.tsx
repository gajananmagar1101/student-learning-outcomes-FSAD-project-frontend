import { useEffect, useMemo, useState } from 'react'
import { Activity, BookOpen, BrainCircuit, CheckCircle, TrendingUp, Trophy, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useStudentStore } from '@/store/useStudentStore'
import { useQuizStore } from '@/store/useQuizStore'
import { scoreAPI } from '@/lib/services'
import { formatAcademicYearLabel } from '@/lib/btech'
import type { StudentScore } from '@/types'

interface Analytics {
  totalStudents: number
  totalAssessments: number
  avgScore: number
  subjectAverages: { subject: string; classAvg: number; topScore: number }[]
  leaderboard: { id: string; name: string; grade: string; avg: number }[]
}

const formatMonth = (value: string) =>
  new Date(value).toLocaleString([], { month: 'short', year: '2-digit' })

export function Dashboard() {
  const { assessments, fetchAssessments } = useAssessmentStore()
  const { submissions, fetchAdminSubmissions, fetchAdminAssignments, adminAssignments } = useAssignmentStore()
  const { students, fetchStudents } = useStudentStore()
  const { quizzes, attempts } = useQuizStore()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [scores, setScores] = useState<StudentScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
    fetchAssessments()
    fetchAdminAssignments()
    fetchAdminSubmissions()
    const load = async () => {
      try {
        const [analyticsRes, scoresRes] = await Promise.all([
          scoreAPI.getAnalytics(),
          scoreAPI.getAll(),
        ])
        setAnalytics(analyticsRes.data.analytics)
        setScores(scoresRes.data.scores ?? [])
      } catch (error) {
        console.error('[Dashboard] Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fetchAdminAssignments, fetchAdminSubmissions, fetchAssessments, fetchStudents])

  const gradedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.marks != null),
    [submissions]
  )

  const assignmentAnalytics = useMemo(() => {
    if (!gradedSubmissions.length) {
      return {
        avgScore: 0,
        subjectAverages: [] as { subject: string; classAvg: number; topScore: number }[],
        leaderboard: [] as { id: string; name: string; grade: string; avg: number }[],
      }
    }

    const subjectMap = new Map<string, { total: number; count: number; top: number }>()
    const studentMap = new Map<string, { name: string; grade: string; total: number; count: number }>()

    gradedSubmissions.forEach((submission) => {
      const percentage = Math.round(((submission.marks ?? 0) / (submission.totalMarks || 100)) * 100)

      const subjectCurrent = subjectMap.get(submission.subject) ?? { total: 0, count: 0, top: 0 }
      subjectCurrent.total += percentage
      subjectCurrent.count += 1
      subjectCurrent.top = Math.max(subjectCurrent.top, percentage)
      subjectMap.set(submission.subject, subjectCurrent)

      const studentRecord = students.find((student) => student._id === submission.studentId || student.id === submission.studentId)
      const studentCurrent = studentMap.get(submission.studentId) ?? {
        name: submission.studentName,
        grade: studentRecord?.grade ?? '',
        total: 0,
        count: 0,
      }
      studentCurrent.total += percentage
      studentCurrent.count += 1
      studentMap.set(submission.studentId, studentCurrent)
    })

    return {
      avgScore: Math.round(
        gradedSubmissions.reduce((sum, submission) => sum + Math.round(((submission.marks ?? 0) / (submission.totalMarks || 100)) * 100), 0)
        / gradedSubmissions.length
      ),
      subjectAverages: Array.from(subjectMap.entries()).map(([subject, value]) => ({
        subject,
        classAvg: Math.round(value.total / value.count),
        topScore: value.top,
      })),
      leaderboard: Array.from(studentMap.entries())
        .map(([id, value]) => ({
          id,
          name: value.name,
          grade: value.grade,
          avg: Math.round(value.total / value.count),
        }))
        .sort((left, right) => right.avg - left.avg)
        .slice(0, 5),
    }
  }, [gradedSubmissions, students])

  const displayAnalytics = gradedSubmissions.length
    ? {
        totalStudents: students.length,
        totalAssessments: adminAssignments.length || assessments.length,
        avgScore: assignmentAnalytics.avgScore,
        subjectAverages: assignmentAnalytics.subjectAverages,
        leaderboard: assignmentAnalytics.leaderboard,
      }
    : analytics

  const trendData = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>()
    if (gradedSubmissions.length) {
      gradedSubmissions.forEach((submission) => {
        const key = formatMonth(submission.updatedAt)
        const current = grouped.get(key) ?? { total: 0, count: 0 }
        current.total += ((submission.marks ?? 0) / (submission.totalMarks || 100)) * 100
        current.count += 1
        grouped.set(key, current)
      })
    } else {
      scores.forEach((score) => {
        const key = formatMonth(score.submittedAt)
        const current = grouped.get(key) ?? { total: 0, count: 0 }
        current.total += (score.score / (score.assessment?.maxScore ?? 100)) * 100
        current.count += 1
        grouped.set(key, current)
      })
    }
    return Array.from(grouped.entries()).map(([month, stats]) => ({
      month,
      score: Math.round(stats.total / stats.count),
      average: displayAnalytics?.avgScore ?? Math.round(stats.total / stats.count),
    }))
  }, [displayAnalytics?.avgScore, gradedSubmissions, scores])

  const recentActivity = useMemo(() => {
    if (gradedSubmissions.length) {
      return gradedSubmissions
        .slice()
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
        .slice(0, 5)
    }
    return scores.slice(0, 5)
  }, [gradedSubmissions, scores])

  const completionRate = (adminAssignments.length || assessments.length)
    ? Math.round((gradedSubmissions.length / (adminAssignments.length || assessments.length)) * 100)
    : 0

  const storedAssignmentsCount = adminAssignments.length || assessments.length

  const recentQuizAttempts = attempts.slice(0, 5)

  const quizOverview = useMemo(() => ({
    total: quizzes.length,
    published: quizzes.filter((quiz) => quiz.status === 'published').length,
    attempts: attempts.length,
    average: attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + ((attempt.score / attempt.totalPoints) * 100), 0) / attempts.length)
      : 0,
  }), [attempts, quizzes])

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Learners" value={displayAnalytics?.totalStudents ?? students.length} change="registered learners" positive icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-500/20" />
        <StatCard title="Average Score" value={loading ? '...' : `${displayAnalytics?.avgScore ?? 0}%`} change="based on graded work" positive icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-500/20" />
        <StatCard title="Completion Rate" value={`${completionRate}%`} change="completed assessments" positive icon={CheckCircle} iconColor="text-amber-600" iconBg="bg-amber-500/20" />
        <StatCard title="Assignments" value={storedAssignmentsCount} change="currently stored" positive icon={BookOpen} iconColor="text-purple-600" iconBg="bg-purple-500/20" />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <GlassCard className="p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Score Trend</h2>
          {trendData.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No graded scores available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="dashboardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="score" stroke="#4F46E5" fill="url(#dashboardGrad)" name="Monthly Average" />
                <Area type="monotone" dataKey="average" stroke="#10B981" fill="none" name="Cohort Average" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Subject Comparison</h2>
          {!displayAnalytics?.subjectAverages?.length ? (
            <p className="py-12 text-center text-sm text-gray-400">No subject analytics available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={displayAnalytics.subjectAverages} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="classAvg" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Cohort Avg" />
                <Bar dataKey="topScore" fill="#10B981" radius={[4, 4, 0, 0]} name="Top Score" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <GlassCard className="flex min-h-0 flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15"><Trophy size={16} className="text-amber-500" /></div>
            <h2 className="text-sm font-semibold text-gray-900">Leaderboard</h2>
          </div>
          {!displayAnalytics?.leaderboard?.length ? (
            <p className="py-12 text-center text-sm text-gray-400">Leaderboard appears after learners receive scores.</p>
          ) : (
            <div className="slim-scrollbar max-h-[18rem] space-y-2 overflow-y-auto pr-1">
              {displayAnalytics.leaderboard.map((student, index) => (
                <div key={student.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/40">
                  <span className="text-sm font-bold text-gray-500 w-6">{index + 1}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-500">{formatAcademicYearLabel(student.grade)}</p>
                  </div>
                  <p className="text-sm font-semibold text-indigo-600">{student.avg}%</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="flex min-h-0 flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/15"><Activity size={16} className="text-indigo-500" /></div>
            <h2 className="text-sm font-semibold text-gray-900">Recent Grading Activity</h2>
          </div>
          {!recentActivity.length ? (
            <p className="py-12 text-center text-sm text-gray-400">No recent score activity yet.</p>
          ) : (
            <div className="slim-scrollbar max-h-[18rem] space-y-2 overflow-y-auto pr-1">
              {recentActivity.map((score) => {
                const isSubmission = 'assignmentTitle' in score
                const percent = isSubmission
                  ? Math.round(((score.marks ?? 0) / (score.totalMarks || 100)) * 100)
                  : Math.round((score.score / (score.assessment?.maxScore ?? 100)) * 100)
                return (
                  <div key={isSubmission ? score.id : (score._id ?? `${score.studentId}-${score.assessmentId}-${score.submittedAt}`)} className="rounded-xl p-2.5 transition-colors hover:bg-white/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{isSubmission ? score.assignmentTitle : (score.assessment?.title ?? 'Assessment')}</p>
                        <p className="text-xs text-gray-500">
                          {isSubmission ? score.subject : (score.assessment?.subject ?? 'Subject')} · {new Date(isSubmission ? score.updatedAt : score.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge label={`${percent}%`} variant={percent >= 70 ? 'success' : 'warning'} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <GlassCard className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-fuchsia-500/15"><BrainCircuit size={16} className="text-fuchsia-500" /></div>
            <h2 className="text-sm font-semibold text-gray-900">Quiz Overview</h2>
          </div>
          {!quizOverview.total ? (
            <p className="py-12 text-center text-sm text-gray-400">Create quizzes to track objective-test performance here.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Total Quizzes', value: quizOverview.total },
                { label: 'Published', value: quizOverview.published },
                { label: 'Attempts', value: quizOverview.attempts },
                { label: 'Avg Score', value: `${quizOverview.average}%` },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/40 p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="flex min-h-0 flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/15"><Activity size={16} className="text-sky-500" /></div>
            <h2 className="text-sm font-semibold text-gray-900">Recent Quiz Attempts</h2>
          </div>
          {!recentQuizAttempts.length ? (
            <p className="py-12 text-center text-sm text-gray-400">Learner quiz attempts will appear here after submissions.</p>
          ) : (
            <div className="slim-scrollbar max-h-[18rem] space-y-2 overflow-y-auto pr-1">
              {recentQuizAttempts.map((attempt) => {
                const percent = Math.round((attempt.score / attempt.totalPoints) * 100)
                const quiz = quizzes.find((item) => item.id === attempt.quizId)
                return (
                  <div key={attempt.id} className="rounded-xl p-2.5 transition-colors hover:bg-white/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{quiz?.title ?? 'Quiz'}</p>
                        <p className="text-xs text-gray-500">
                          {attempt.studentName} · {formatAcademicYearLabel(attempt.className)} · {new Date(attempt.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge label={`${percent}%`} variant={percent >= 70 ? 'success' : 'warning'} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
