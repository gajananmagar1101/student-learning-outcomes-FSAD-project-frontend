import { ShieldAlert, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

export function BlockedAccountPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const blockedUntilText = user?.accessBlockedUntil
    ? new Date(user.accessBlockedUntil).toLocaleString()
    : null
  const roleLabel = user?.role === 'student' ? 'Learner' : user?.role === 'faculty' ? 'Faculty' : 'User'

  return (
    <div className="flex min-h-screen items-center justify-center bg-light-base px-4 py-8 dark:bg-dark-base">
      <div className="w-full max-w-xl rounded-[2rem] border border-red-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-red-500/20 dark:bg-dark-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
          <ShieldAlert size={28} />
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">Access Paused</p>
          <h1 className="mt-2 text-2xl font-bold text-light-ink-primary dark:text-dark-ink-primary">
            Your account has been temporarily blocked by the admin
          </h1>
          <p className="mt-3 text-sm leading-6 text-light-ink-muted dark:text-dark-ink-muted">
            You have signed in successfully, but all portal features will stay unavailable until your access is restored.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-light-border bg-light-card px-4 py-4 text-sm dark:border-dark-border dark:bg-dark-card2/70">
          <p className="font-semibold text-light-ink-primary dark:text-dark-ink-primary">
            {roleLabel}: {user?.name ?? 'Blocked account'}
          </p>
          <p className="mt-2 text-light-ink-secondary dark:text-dark-ink-secondary">
            Email: {user?.email ?? '-'}
          </p>
          <p className="mt-2 text-light-ink-secondary dark:text-dark-ink-secondary">
            Block until: {blockedUntilText ?? 'Admin update pending'}
          </p>
          {user?.accessBlockReason ? (
            <p className="mt-2 text-light-ink-secondary dark:text-dark-ink-secondary">
              Reason: {user.accessBlockReason}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
