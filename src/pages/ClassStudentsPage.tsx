import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Ban, Clock3, RefreshCw, ShieldAlert, Trash2, Unlock, UserX } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Modal } from '@/components/ui/Modal'
import { useStudentStore } from '@/store/useStudentStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { studentAPI } from '@/lib/services'
import { formatAcademicYearLabel, normalizeAcademicYear } from '@/lib/btech'
import type { DBStudent } from '@/types'

const avatarColors = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
]

const toLocalDateTimeValue = (isoText?: string | null) => {
  if (!isoText) return ''

  const date = new Date(isoText)
  if (Number.isNaN(date.getTime())) return ''

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

export function ClassStudentsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const grade = searchParams.get('grade') ?? 'FE'
  const user = useAuthStore((state) => state.user)
  const { students, loading, error, fetchStudents, removeStudent, updateStudent } = useStudentStore()
  const addToast = useUIStore((state) => state.addToast)
  const [search, setSearch] = useState('')
  const [studentToDelete, setStudentToDelete] = useState<DBStudent | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [blockUntilByStudent, setBlockUntilByStudent] = useState<Record<string, string>>({})
  const [blockReasonByStudent, setBlockReasonByStudent] = useState<Record<string, string>>({})
  const canManageStudentAccess = user?.role === 'admin'

  useEffect(() => {
    if (students.length === 0) {
      fetchStudents()
    }
  }, [fetchStudents, students.length])

  useEffect(() => {
    setBlockUntilByStudent((current) => {
      const next = { ...current }
      students.forEach((student) => {
        const studentId = student._id ?? student.id
        if (next[studentId] == null) {
          next[studentId] = toLocalDateTimeValue(student.accessBlockedUntil)
        }
      })
      return next
    })

    setBlockReasonByStudent((current) => {
      const next = { ...current }
      students.forEach((student) => {
        const studentId = student._id ?? student.id
        if (next[studentId] == null) {
          next[studentId] = student.accessBlockReason ?? ''
        }
      })
      return next
    })
  }, [students])

  const filtered = useMemo(
    () =>
      students
        .filter((student) => normalizeAcademicYear(student.grade) === grade)
        .filter((student) => {
          const query = search.toLowerCase().trim()
          if (!query) return true
          return student.name.toLowerCase().includes(query) || student.email.toLowerCase().includes(query)
        })
        .sort((left, right) => left.name.localeCompare(right.name)),
    [grade, search, students]
  )

  const openDeleteConfirmation = (student: DBStudent, e: React.MouseEvent) => {
    e.stopPropagation()
    setStudentToDelete(student)
  }

  const handleDelete = async () => {
    if (!studentToDelete) return

    const studentId = studentToDelete._id ?? studentToDelete.id
    try {
      await studentAPI.delete(studentId)
      removeStudent(studentId)
      addToast('Learner deleted successfully', 'info')
      setStudentToDelete(null)
    } catch {
      addToast('Failed to delete learner', 'error')
    }
  }

  const handleAccessUpdate = async (student: DBStudent, mode: 'block' | 'restore') => {
    const studentId = student._id ?? student.id
    setProcessingId(studentId)

    try {
      if (mode === 'restore') {
        const response = await studentAPI.updateAccess(studentId, { blockedUntil: null, reason: '' })
        const updatedStudent = response.data.student as DBStudent
        updateStudent(updatedStudent)
        setBlockUntilByStudent((current) => ({ ...current, [studentId]: '' }))
        setBlockReasonByStudent((current) => ({ ...current, [studentId]: '' }))
        addToast('Learner access restored', 'success')
        return
      }

      const blockUntilValue = blockUntilByStudent[studentId]
      if (!blockUntilValue) {
        addToast('Select block-until date and time', 'error')
        return
      }

      const blockUntilIso = new Date(blockUntilValue).toISOString()
      const response = await studentAPI.updateAccess(studentId, {
        blockedUntil: blockUntilIso,
        reason: blockReasonByStudent[studentId]?.trim() || undefined,
      })
      const updatedStudent = response.data.student as DBStudent
      updateStudent(updatedStudent)
      setBlockUntilByStudent((current) => ({ ...current, [studentId]: toLocalDateTimeValue(updatedStudent.accessBlockedUntil) }))
      setBlockReasonByStudent((current) => ({ ...current, [studentId]: updatedStudent.accessBlockReason ?? '' }))
      addToast('Learner access blocked', 'info')
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      addToast(message ?? 'Failed to update learner access', 'error')
    } finally {
      setProcessingId(null)
    }
  }

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
        <button onClick={fetchStudents} className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-xl hover:bg-indigo-600 transition-colors">
          Retry
        </button>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-5">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="mb-3 inline-flex items-center gap-2 text-sm text-light-ink-muted transition-colors hover:text-light-ink-primary dark:text-dark-ink-muted dark:hover:text-dark-ink-primary"
            >
              <ArrowLeft size={14} />
              Back to Cohorts
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">{formatAcademicYearLabel(grade)}</h1>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? 'learner' : 'learners'} in this cohort</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search learners..."
              className="form-input w-56"
            />
            <button onClick={fetchStudents} className="btn-ghost">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-gray-600">No learners found in {formatAcademicYearLabel(grade)}</p>
          <p className="mt-1 text-xs text-gray-400">Learners from this cohort will appear here.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((student, studentIndex) => {
            const colorIndex = studentIndex % avatarColors.length
            return (
              <motion.div key={student._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: studentIndex * 0.04 }}>
                <GlassCard
                  hover
                  className="p-5 cursor-pointer"
                  onClick={() => navigate(`/students/profile/${student._id}?grade=${grade}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[colorIndex]} flex items-center justify-center text-white font-semibold text-sm shadow-sm shrink-0`}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{student.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          student.accessBlocked ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {student.accessBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{student.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {formatAcademicYearLabel(grade)}
                        </span>
                        <span className="text-xs text-gray-400">Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                      </div>
                      {student.accessBlocked && student.accessBlockedUntil ? (
                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600">
                          <Clock3 size={12} />
                          Blocked until {new Date(student.accessBlockedUntil).toLocaleString()}
                        </p>
                      ) : (
                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <ShieldAlert size={12} />
                          Learner can access the portal right now.
                        </p>
                      )}
                      {student.accessBlocked && student.accessBlockReason ? (
                        <p className="mt-1 text-xs text-gray-500">Reason: {student.accessBlockReason}</p>
                      ) : null}
                    </div>
                  </div>
                  {canManageStudentAccess ? (
                    <div className="mt-4 space-y-3 rounded-2xl border border-gray-100 bg-white/70 p-3" onClick={(event) => event.stopPropagation()}>
                      <div className="grid gap-2 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Block Until</span>
                          <input
                            type="datetime-local"
                            value={blockUntilByStudent[student._id] ?? ''}
                            onChange={(event) => {
                              const nextValue = event.target.value
                              setBlockUntilByStudent((current) => ({ ...current, [student._id]: nextValue }))
                            }}
                            className="form-input w-full"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Reason</span>
                          <input
                            type="text"
                            value={blockReasonByStudent[student._id] ?? ''}
                            onChange={(event) => {
                              const nextValue = event.target.value
                              setBlockReasonByStudent((current) => ({ ...current, [student._id]: nextValue }))
                            }}
                            placeholder="Optional reason"
                            className="form-input w-full"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={processingId === student._id}
                          onClick={() => void handleAccessUpdate(student, 'block')}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          <Ban size={13} />
                          Block account
                        </button>
                        <button
                          type="button"
                          disabled={processingId === student._id || !student.accessBlocked}
                          onClick={() => void handleAccessUpdate(student, 'restore')}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                        >
                          <Unlock size={13} />
                          Restore access
                        </button>
                        <button
                          type="button"
                          onClick={(event) => openDeleteConfirmation(student, event)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                          Delete account
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <p className="text-xs text-indigo-500 mt-3 font-medium">Click card to view scores & details →</p>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal
        open={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        title="Delete Learner Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-light-ink-secondary dark:text-dark-ink-secondary">
            Are you sure you want to delete {studentToDelete?.name}'s account? Their grades and related data may also be removed.
          </p>
          <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-600">
            This action cannot be undone.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setStudentToDelete(null)} className="btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
            >
              Delete Learner
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
