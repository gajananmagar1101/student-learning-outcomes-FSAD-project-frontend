import { useEffect, useState } from 'react'
import { Ban, CheckCircle2, Clock3, ShieldAlert, Trash2, Unlock, UserCheck } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Modal } from '@/components/ui/Modal'
import { facultyRequestAPI } from '@/lib/services'
import type { FacultyMember, FacultyRegistrationRequest } from '@/types'

const toLocalDateTimeValue = (isoText?: string | null) => {
  if (!isoText) return ''

  const date = new Date(isoText)
  if (Number.isNaN(date.getTime())) return ''

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

export function FacultyRequests() {
  const [requests, setRequests] = useState<FacultyRegistrationRequest[]>([])
  const [faculty, setFaculty] = useState<FacultyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [blockUntilByFaculty, setBlockUntilByFaculty] = useState<Record<string, string>>({})
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({})
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyMember | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const requestsRes = await facultyRequestAPI.getAll()
      const facultyList: FacultyMember[] = requestsRes.data.faculty ?? []
      setRequests(requestsRes.data.requests ?? [])
      setFaculty(facultyList)
      setBlockUntilByFaculty((current) => {
        const next = { ...current }
        facultyList.forEach((member) => {
          if (next[member.id] == null) {
            next[member.id] = toLocalDateTimeValue(member.accessBlockedUntil)
          }
        })
        return next
      })
      setBlockReasons((current) => {
        const next = { ...current }
        facultyList.forEach((member) => {
          if (next[member.id] == null) {
            next[member.id] = member.accessBlockReason ?? ''
          }
        })
        return next
      })
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to load faculty access controls.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId)
    setError(null)
    try {
      if (action === 'approve') {
        await facultyRequestAPI.approve(requestId)
        await loadData()
      } else {
        await facultyRequestAPI.reject(requestId)
        setRequests((current) => current.filter((request) => request.id !== requestId))
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? `Could not ${action} the request.`
      setError(message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleAccessUpdate = async (member: FacultyMember, mode: 'block' | 'restore') => {
    setProcessingId(member.id)
    setError(null)
    try {
      if (mode === 'block') {
        const blockUntilValue = blockUntilByFaculty[member.id]
        if (!blockUntilValue) {
          setError('Select block-until date and time.')
          return
        }
      }

      const response = await facultyRequestAPI.updateAccess(member.id, {
        blockedUntil: mode === 'restore' ? null : new Date(blockUntilByFaculty[member.id]).toISOString(),
        reason: mode === 'restore' ? undefined : blockReasons[member.id]?.trim() || undefined,
      })

      const updatedMember = response.data.faculty as FacultyMember
      setFaculty((current) => current.map((item) => (item.id === member.id ? updatedMember : item)))
      setBlockUntilByFaculty((current) => ({ ...current, [member.id]: toLocalDateTimeValue(updatedMember.accessBlockedUntil) }))
      setBlockReasons((current) => ({ ...current, [member.id]: updatedMember.accessBlockReason ?? '' }))
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Could not update faculty access.'
      setError(message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteFaculty = async () => {
    if (!facultyToDelete) return

    setProcessingId(facultyToDelete.id)
    setError(null)
    try {
      await facultyRequestAPI.delete(facultyToDelete.id)
      setFaculty((current) => current.filter((item) => item.id !== facultyToDelete.id))
      setFacultyToDelete(null)
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Could not delete faculty account.'
      setError(message)
    } finally {
      setProcessingId(null)
    }
  }

  const blockedFacultyCount = faculty.filter((member) => member.accessBlocked).length

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/15 p-2.5"><UserCheck size={18} className="text-indigo-500" /></div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">Pending Requests</p>
              <p className="mt-1 text-2xl font-bold text-light-ink-primary dark:text-dark-ink-primary">{requests.length}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2.5"><CheckCircle2 size={18} className="text-emerald-500" /></div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">Approved Faculty</p>
              <p className="mt-1 text-2xl font-bold text-light-ink-primary dark:text-dark-ink-primary">{faculty.length}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/15 p-2.5"><Clock3 size={18} className="text-amber-500" /></div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">Blocked Now</p>
              <p className="mt-1 text-2xl font-bold text-light-ink-primary dark:text-dark-ink-primary">{blockedFacultyCount}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <GlassCard className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">Faculty Management</h2>
          <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">View all approved faculty accounts here, and manage pending requests below.</p>
        </div>

        {!loading && faculty.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
            Total visible faculty accounts: <span className="font-semibold">{faculty.length}</span>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">Pending Faculty Requests</h2>
          <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">Verified faculty registrations wait here until admin approval.</p>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-light-ink-muted dark:text-dark-ink-muted">Loading faculty requests...</p>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-light-border px-4 py-12 text-center dark:border-dark-border">
            <ShieldAlert className="mx-auto mb-3 text-light-ink-muted dark:text-dark-ink-muted" size={22} />
            <p className="text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">No pending faculty requests.</p>
            <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">New verified faculty registrations will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-light-border bg-white/70 p-4 dark:border-dark-border dark:bg-dark-card2/60">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-light-ink-primary dark:text-dark-ink-primary">{request.name}</h3>
                      <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                        Faculty
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">{request.email}</p>
                    <p className="mt-2 text-xs text-light-ink-muted dark:text-dark-ink-muted">
                      Requested {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'recently'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={processingId === request.id}
                      onClick={() => void handleRequestAction(request.id, 'approve')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={processingId === request.id}
                      onClick={() => void handleRequestAction(request.id, 'reject')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      <Ban size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">All Faculty Accounts</h2>
          <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">Review approved faculty accounts and manage temporary block or restore actions here.</p>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-light-ink-muted dark:text-dark-ink-muted">Loading faculty list...</p>
        ) : faculty.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-light-border px-4 py-12 text-center dark:border-dark-border">
            <UserCheck className="mx-auto mb-3 text-light-ink-muted dark:text-dark-ink-muted" size={22} />
            <p className="text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">No approved faculty yet.</p>
            <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">Approve a faculty request to manage access here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faculty.map((member) => (
              <div key={member.id} className="rounded-2xl border border-light-border bg-white/70 p-4 dark:border-dark-border dark:bg-dark-card2/60">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-light-ink-primary dark:text-dark-ink-primary">{member.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        member.accessBlocked
                          ? 'bg-red-500/10 text-red-600 dark:text-red-300'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                      }`}
                      >
                        {member.accessBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">{member.email}</p>
                    <p className="mt-2 text-xs text-light-ink-muted dark:text-dark-ink-muted">
                      Joined {member.createdAt ? new Date(member.createdAt).toLocaleString() : 'recently'}
                    </p>
                    {member.accessBlocked && member.accessBlockedUntil ? (
                      <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">
                        Access blocked until {new Date(member.accessBlockedUntil).toLocaleString()}
                        {member.accessBlockReason ? ` • ${member.accessBlockReason}` : ''}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                        Faculty can access the portal right now.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:w-[620px]">
                    <input
                      type="datetime-local"
                      value={blockUntilByFaculty[member.id] ?? ''}
                      onChange={(event) => {
                        const nextValue = event.target.value
                        setBlockUntilByFaculty((current) => ({ ...current, [member.id]: nextValue }))
                      }}
                      className="rounded-xl border border-light-border bg-white px-3 py-2.5 text-sm text-light-ink-primary outline-none transition focus:border-indigo-400 dark:border-dark-border dark:bg-dark-card2/70 dark:text-dark-ink-primary"
                    />

                    <input
                      type="text"
                      value={blockReasons[member.id] ?? ''}
                      onChange={(event) => {
                        const nextValue = event.target.value
                        setBlockReasons((current) => ({ ...current, [member.id]: nextValue }))
                      }}
                      placeholder="Optional reason for block"
                      className="rounded-xl border border-light-border bg-white px-3 py-2.5 text-sm text-light-ink-primary outline-none transition focus:border-indigo-400 dark:border-dark-border dark:bg-dark-card2/70 dark:text-dark-ink-primary"
                    />

                    <button
                      type="button"
                      disabled={processingId === member.id}
                      onClick={() => void handleAccessUpdate(member, 'block')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      <Ban size={16} />
                      Block account
                    </button>

                    <button
                      type="button"
                      disabled={processingId === member.id || !member.accessBlocked}
                      onClick={() => void handleAccessUpdate(member, 'restore')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                    >
                      <Unlock size={16} />
                      Restore access
                    </button>

                    <button
                      type="button"
                      disabled={processingId === member.id}
                      onClick={() => setFacultyToDelete(member)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 sm:col-span-2"
                    >
                      <Trash2 size={16} />
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal
        open={Boolean(facultyToDelete)}
        onClose={() => setFacultyToDelete(null)}
        title="Delete Faculty Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-light-ink-secondary dark:text-dark-ink-secondary">
            Are you sure you want to delete {facultyToDelete?.name}'s account?
          </p>
          <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-600">
            This action cannot be undone.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFacultyToDelete(null)} className="btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteFaculty()}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
            >
              Delete account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
