import { useEffect, useMemo, useState } from 'react'
import { Award, BarChart2, Download, TrendingUp, Users } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { useStudentStore } from '@/store/useStudentStore'
import { adminAssignmentAPI, submissionAPI } from '@/lib/services'
import type { AdminSubmission } from '@/types'

const gradeColor = ['#10B981', '#4F46E5', '#F59E0B', '#EF4444']

const monthKey = (value: string) => new Date(value).toLocaleString([], { month: 'short', year: '2-digit' })

export function Reports() {
  const { students, fetchStudents } = useStudentStore()
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([])
  const [assignmentCount, setAssignmentCount] = useState(0)

  useEffect(() => {
    fetchStudents()

    const load = async () => {
      try {
        const [submissionsRes, assignmentsRes] = await Promise.all([
          submissionAPI.getAllForAdmin(),
          adminAssignmentAPI.getAll(),
        ])
        setSubmissions(submissionsRes.data.submissions ?? [])
        setAssignmentCount((assignmentsRes.data.assignments ?? []).length)
      } catch (error) {
        console.error('[Reports] Failed to load report data:', error)
      }
    }

    load()
  }, [fetchStudents])

  const gradedSubmissions = useMemo(
    () => submissions.filter((submission) => typeof submission.marks === 'number'),
    [submissions]
  )

  const avgScore = useMemo(() => {
    if (!gradedSubmissions.length) return 0
    const total = gradedSubmissions.reduce(
      (sum, submission) => sum + ((submission.marks ?? 0) / submission.totalMarks) * 100,
      0
    )
    return Math.round(total / gradedSubmissions.length)
  }, [gradedSubmissions])

  const leaderboard = useMemo(() => {
    const byStudent = new Map<string, { name: string; grade: string; total: number; count: number }>()

    gradedSubmissions.forEach((submission) => {
      const current = byStudent.get(submission.studentId) ?? {
        name: submission.studentName,
        grade: '',
        total: 0,
        count: 0,
      }

      const student = students.find((item) => item.id === submission.studentId || item._id === submission.studentId)
      current.grade = student?.grade ?? current.grade
      current.total += ((submission.marks ?? 0) / submission.totalMarks) * 100
      current.count += 1
      byStudent.set(submission.studentId, current)
    })

    return Array.from(byStudent.entries())
      .map(([id, item]) => ({
        id,
        name: item.name,
        grade: item.grade,
        avg: Math.round(item.total / item.count),
      }))
      .sort((left, right) => right.avg - left.avg)
      .slice(0, 5)
  }, [gradedSubmissions, students])

  const trendData = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>()

    gradedSubmissions.forEach((submission) => {
      const key = monthKey(submission.updatedAt)
      const current = grouped.get(key) ?? { total: 0, count: 0 }
      current.total += ((submission.marks ?? 0) / submission.totalMarks) * 100
      current.count += 1
      grouped.set(key, current)
    })

    return Array.from(grouped.entries()).map(([month, item]) => ({
      month,
      score: Math.round(item.total / item.count),
    }))
  }, [gradedSubmissions])

  const gradeDistribution = useMemo(() => {
    const distribution = [
      { name: 'A (90-100)', value: 0 },
      { name: 'B (80-89)', value: 0 },
      { name: 'C (70-79)', value: 0 },
      { name: 'D (<70)', value: 0 },
    ]

    gradedSubmissions.forEach((submission) => {
      const percent = ((submission.marks ?? 0) / submission.totalMarks) * 100
      if (percent >= 90) distribution[0].value += 1
      else if (percent >= 80) distribution[1].value += 1
      else if (percent >= 70) distribution[2].value += 1
      else distribution[3].value += 1
    })

    return distribution
  }, [gradedSubmissions])

  const studentComparisonData = useMemo(() => {
    return leaderboard.map((item) => ({
      name: item.name.split(' ')[0],
      avg: item.avg,
    }))
  }, [leaderboard])

  const subjectAverages = useMemo(() => {
    const bySubject = new Map<string, { total: number; count: number; topScore: number }>()

    gradedSubmissions.forEach((submission) => {
      const percent = ((submission.marks ?? 0) / submission.totalMarks) * 100
      const current = bySubject.get(submission.subject) ?? { total: 0, count: 0, topScore: 0 }
      current.total += percent
      current.count += 1
      current.topScore = Math.max(current.topScore, Math.round(percent))
      bySubject.set(submission.subject, current)
    })

    return Array.from(bySubject.entries()).map(([subject, item]) => ({
      subject,
      classAvg: Math.round(item.total / item.count),
      topScore: item.topScore,
    }))
  }, [gradedSubmissions])

  const radarData = subjectAverages.map((item) => ({
    subject: item.subject.slice(0, 6),
    score: item.classAvg,
  }))

  const summaryStats = [
    { label: 'Cohort Average', value: `${avgScore}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Top Performer', value: leaderboard[0] ? `${leaderboard[0].avg}%` : '0%', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Learners', value: `${students.length}`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Assignments', value: `${assignmentCount}`, icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const exportReport = () => {
    const lines = [
      ['Learner', 'Assignment', 'Subject', 'Marks', 'Total Marks', 'Status', 'Updated At'],
      ...submissions.map((submission) => [
        submission.studentName,
        submission.assignmentTitle,
        submission.subject,
        String(submission.marks ?? ''),
        String(submission.totalMarks),
        submission.status,
        submission.updatedAt,
      ]),
    ]
    const csv = lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Live analytics generated from assignment submissions and published marks.</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Download size={15} /> Export Report
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryStats.map((item) => (
          <GlassCard key={item.label} className="p-3.5">
            <div className={`inline-flex p-2 rounded-xl ${item.bg} mb-2`}>
              <item.icon size={16} className={item.color} />
            </div>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Score Trend</h2>
          {!trendData.length ? (
            <p className="text-sm text-gray-400 text-center py-16">No score trend available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="reportsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#4F46E5" fill="url(#reportsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Grade Distribution</h2>
          {!gradedSubmissions.length ? (
            <p className="text-sm text-gray-400 text-center py-16">No graded submissions available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={gradeDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {gradeDistribution.map((entry, index) => <Cell key={entry.name} fill={gradeColor[index]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Learner Comparison</h2>
          {!studentComparisonData.length ? (
            <p className="text-sm text-gray-400 text-center py-16">No learner comparison available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={studentComparisonData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                  {studentComparisonData.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={gradeColor[index % gradeColor.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Subject Radar</h2>
          {!radarData.length ? (
            <p className="text-sm text-gray-400 text-center py-16">No subject radar available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <Radar dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-4 sm:p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Subject Performance Breakdown</h2>
        {!subjectAverages.length ? (
          <p className="text-sm text-gray-400 text-center py-16">No subject breakdown available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectAverages} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="classAvg" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Cohort Avg" />
              <Bar dataKey="topScore" fill="#10B981" radius={[4, 4, 0, 0]} name="Top Score" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </GlassCard>
    </div>
  )
}
