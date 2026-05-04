import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Mail, BookOpen, TrendingUp, Award, RefreshCw, Trash2, UserX } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { useStudentStore } from '@/store/useStudentStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useQuizStore } from '@/store/useQuizStore'
import { useUIStore } from '@/store/useUIStore'
import { studentAPI, scoreAPI } from '@/lib/services'
import { btechYearOptions, formatAcademicYearLabel, normalizeAcademicYear } from '@/lib/btech'
import type { DBStudent, StudentPerformance, StudentScore, Assessment } from '@/types'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const cohortOptions = btechYearOptions.map((option) => option.value)

interface ScoreWithAssessment extends StudentScore {
  assessment: Assessment
}

const getLetterGrade = (percent: number) => {
  if (percent >= 90) return 'A'
  if (percent >= 80) return 'B'
  if (percent >= 70) return 'C'
  if (percent >= 60) return 'D'
  return 'F'
}

export function StudentDrawer({ student, onClose }: { student: DBStudent; onClose: () => void }) {
  const {
    submissions,
    fetchAdminSubmissions,
  } = useAssignmentStore()
  const addToast = useUIStore((state) => state.addToast)
  const { quizzes, attempts, fetchQuizzes, fetchAttempts } = useQuizStore()
  const [scores, setScores] = useState<ScoreWithAssessment[]>([])
  const [performance, setPerformance] = useState<StudentPerformance | null>(null)
  const [loadingScores, setLoadingScores] = useState(true)

  const loadScores = useCallback(async () => {
    let performanceLoaded = false

    try {
      const performanceRes = await studentAPI.getPerformance(student._id)
      setPerformance(performanceRes.data.performance ?? null)
      performanceLoaded = true
    } catch (performanceErr) {
      const status = (performanceErr as { response?: { status?: number } })?.response?.status
      setPerformance(null)
      if (status && status !== 404) {
        console.error('[StudentDrawer] Failed to fetch performance:', performanceErr)
      }
    }

    try {
      const scoresRes = await scoreAPI.getStudentScores(student._id)
      const nextScores = scoresRes.data.scores ?? []
      setScores(nextScores)
      return nextScores as ScoreWithAssessment[]
    } catch (scoreErr) {
      setScores([])
      console.error('[StudentDrawer] Failed to fetch scores:', scoreErr)
      if (!performanceLoaded) {
        addToast('Failed to fetch learner grades', 'error')
      }
      return []
    } finally {
      setLoadingScores(false)
    }
  }, [addToast, student._id])

  useEffect(() => {
    setLoadingScores(true)
    loadScores()
  }, [loadScores])

  useEffect(() => {
    fetchAdminSubmissions()
  }, [fetchAdminSubmissions])

  useEffect(() => {
    fetchQuizzes()
    fetchAttempts()
  }, [fetchAttempts, fetchQuizzes])

  const studentSubmissions = submissions.filter((submission) => submission.studentId === student._id)
  const gradedStudentSubmissions = studentSubmissions.filter((submission) => submission.marks != null)
  const studentQuizAttempts = attempts.filter((attempt) => {
    const sid = student._id ?? student.id
    return attempt.studentId === sid
  })

  const avg = scores.length
    ? Math.round(scores.reduce((a, s) => {
        const max = s.assessment?.maxScore ?? 100
        return a + (s.score / max) * 100
      }, 0) / scores.length)
    : 0

  const best = scores.length
    ? Math.round(Math.max(...scores.map((s) => (s.score / (s.assessment?.maxScore ?? 100)) * 100)))
    : 0

  const submissionHistory = gradedStudentSubmissions.map((submission) => ({
    submissionId: `assignment-${submission.id}`,
    assignmentTitle: submission.assignmentTitle,
    subject: submission.subject,
    marks: submission.marks ?? 0,
    totalMarks: submission.totalMarks,
    percentage: Math.round(((submission.marks ?? 0) / (submission.totalMarks || 100)) * 100),
    gradedAt: submission.updatedAt,
  }))

  const quizHistory = studentQuizAttempts.map((attempt) => {
    const quiz = quizzes.find((item) => item.id === attempt.quizId)
    const totalMarks = attempt.totalPoints || 1
    return {
      submissionId: `quiz-${attempt.id}`,
      assignmentTitle: quiz?.title ? `[Quiz] ${quiz.title}` : '[Quiz] Quiz Attempt',
      subject: quiz?.subject ?? 'Quiz',
      marks: attempt.score,
      totalMarks,
      percentage: Math.round((attempt.score / totalMarks) * 100),
      gradedAt: attempt.submittedAt,
    }
  })

  const basePerformanceHistory = submissionHistory.length ? submissionHistory : (performance?.scoreHistory ?? [])
  const performanceHistory = [...basePerformanceHistory, ...quizHistory]
    .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())
  const hasPerformanceHistory = performanceHistory.length > 0

  const avgPercentage = hasPerformanceHistory
    ? Math.round(performanceHistory.reduce((sum, item) => sum + item.percentage, 0) / performanceHistory.length)
    : Math.round(performance?.avgPercentage ?? avg)
  const bestPercentage = hasPerformanceHistory
    ? Math.max(...performanceHistory.map((item) => item.percentage))
    : Math.round(performance?.bestPercentage ?? best)
  const totalSubmissions = hasPerformanceHistory
    ? performanceHistory.length
    : performance?.totalSubmissions ?? scores.length

  // Build subject breakdown from assignment grades when available.
  const subjectMap: Record<string, { total: number; count: number }> = {}
  if (hasPerformanceHistory) {
    performanceHistory.forEach((item) => {
      const sub = item.subject ?? 'Unknown'
      if (!subjectMap[sub]) subjectMap[sub] = { total: 0, count: 0 }
      subjectMap[sub].total += item.percentage
      subjectMap[sub].count += 1
    })
  } else {
    scores.forEach((s) => {
      const sub = s.assessment?.subject ?? 'Unknown'
      if (!subjectMap[sub]) subjectMap[sub] = { total: 0, count: 0 }
      subjectMap[sub].total += (s.score / (s.assessment?.maxScore ?? 100)) * 100
      subjectMap[sub].count += 1
    })
  }
  const subjects = Object.entries(subjectMap).map(([subject, d]) => ({
    subject,
    progress: Math.round(d.total / d.count),
  }))
  const radarData = subjects.map((s) => ({ subject: s.subject.slice(0, 4), score: s.progress }))

  const handleDeleteScore = async (scoreId: string) => {
    if (!confirm('Delete this learner grade?')) return
    try {
      await scoreAPI.delete(scoreId)
      await loadScores()
      addToast('Grade deleted successfully', 'info')
    } catch (err) {
      console.error('[StudentDrawer] Failed to delete score:', err)
      addToast('Failed to delete learner grade', 'error')
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="portal-scroll-region slim-scrollbar fixed right-0 top-0 h-full w-full max-w-sm bg-white/90 backdrop-blur-xl border-l border-white/20 shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Learner Profile</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{student.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={11} /> {student.email}</p>
              <p className="text-xs text-indigo-600 font-medium mt-1">
                {student.grade ? formatAcademicYearLabel(student.grade) : 'Academic year not set'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Avg Score', value: loadingScores ? '...' : `${avgPercentage}%`, icon: TrendingUp, color: 'text-indigo-600' },
              { label: 'Submissions', value: loadingScores ? '...' : totalSubmissions, icon: BookOpen, color: 'text-emerald-600' },
              { label: 'Best Score', value: loadingScores ? '...' : `${bestPercentage}%`, icon: Award, color: 'text-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl bg-white/60 border border-gray-100 text-center">
                <stat.icon size={14} className={`${stat.color} mx-auto mb-1`} />
                <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Joined */}
          <div className="p-3 rounded-xl bg-white/40 border border-gray-100">
            <p className="text-xs text-gray-500">Joined</p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(student.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Radar */}
          {radarData.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/50 border border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-2">Skill Radar</p>
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject progress */}
          {subjects.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Subject Progress</p>
              <div className="slim-scrollbar max-h-[18rem] space-y-3 overflow-y-auto pr-1">
              {subjects.map((sub) => (
                <ProgressBar key={sub.subject} label={sub.subject} value={sub.progress}
                  color={sub.progress >= 85 ? 'bg-emerald-500' : sub.progress >= 70 ? 'bg-indigo-500' : 'bg-amber-500'} />
              ))}
              </div>
            </div>
          )}

          {/* Score history */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Score History</p>
            {loadingScores ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : hasPerformanceHistory ? (
              <div className="slim-scrollbar max-h-[20rem] space-y-2 overflow-y-auto pr-1">
                {performanceHistory.map((item) => (
                  <div key={item.submissionId} className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 border border-gray-100">
                    <div>
                      <p className="text-xs font-medium text-gray-800">{item.assignmentTitle}</p>
                      <p className="text-xs text-gray-400">{item.subject} · {new Date(item.gradedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-indigo-600">{item.marks}/{item.totalMarks}</span>
                      <Badge label={`${item.percentage}%`} variant={item.percentage >= 85 ? 'success' : item.percentage >= 60 ? 'info' : 'warning'} />
                      <Badge label={getLetterGrade(item.percentage)} variant={item.percentage >= 85 ? 'success' : item.percentage >= 60 ? 'info' : 'warning'} />
                    </div>
                  </div>
                ))}
              </div>
            ) : scores.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No scores yet</p>
              </div>
            ) : (
              <div className="slim-scrollbar max-h-[20rem] space-y-2 overflow-y-auto pr-1">
                {scores.map((sc) => {
                  const pct = Math.round((sc.score / (sc.assessment?.maxScore ?? 100)) * 100)
                  return (
                    <div key={sc._id ?? sc.assessmentId} className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 border border-gray-100">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{sc.assessment?.title ?? 'Assessment'}</p>
                        <p className="text-xs text-gray-400">{sc.assessment?.subject} · {new Date(sc.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">{sc.score}/{sc.assessment?.maxScore ?? 100}</span>
                        <Badge label={`${pct}%`} variant={pct >= 85 ? 'success' : pct >= 60 ? 'info' : 'warning'} />
                        <Badge label={getLetterGrade(pct)} variant={pct >= 85 ? 'success' : pct >= 60 ? 'info' : 'warning'} />
                        {sc._id && (
                          <button
                            onClick={() => handleDeleteScore(sc._id!)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                            title="Delete grade"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

export function Students() {
  const { students, loading, error, fetchStudents } = useStudentStore()
  const navigate = useNavigate()

  // ✅ FIX: Fetch real students from API on mount
  useEffect(() => {
    console.log('[Students] Fetching students from API...')
    fetchStudents()
  }, [fetchStudents])

  const classSummaries = useMemo(
    () =>
      cohortOptions.map((grade) => ({
        grade,
        label: formatAcademicYearLabel(grade),
        students: students
          .filter((student) => normalizeAcademicYear(student.grade) === grade)
          .sort((left, right) => left.name.localeCompare(right.name)),
      })),
    [students]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <GlassCard className="p-8 text-center">
        <UserX size={32} className="mx-auto text-red-400 mb-3" />
        <p className="text-sm font-medium text-red-600 mb-1">Failed to load learners</p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
        <button onClick={fetchStudents}
          className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-xl hover:bg-indigo-600 transition-colors">
          Retry
        </button>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{students.length} learners</p>
          <button onClick={fetchStudents}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white/60 text-sm text-gray-600 hover:bg-white/80 transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Empty state */}
      {students.length === 0 && (
        <GlassCard className="p-12 text-center">
          <UserX size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-600">No learners registered yet</p>
          <p className="text-xs text-gray-400 mt-1">B.Tech learners will appear here once they sign up</p>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {classSummaries.map((group) => (
          <button
            key={group.grade}
            type="button"
            onClick={() => navigate(`/students/class?grade=${group.grade}`)}
            className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 px-4 py-4 text-left transition-all hover:border-indigo-200 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">{formatAcademicYearLabel(group.grade)}</p>
            <p className="mt-3 text-4xl font-bold text-gray-900">{group.students.length}</p>
            <p className="mt-2 text-sm text-gray-500">{group.students.length === 1 ? 'learner' : 'learners'}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
