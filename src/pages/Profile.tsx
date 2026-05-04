import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { studentAPI } from '@/lib/services'
import { formatAcademicYearLabel } from '@/lib/btech'
import { getRoleLabel, isStaffRole } from '@/lib/roles'
import { Mail, Shield, User, Edit2, Check, Moon, Sun, Bell, X, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'

export function Profile() {
  const { user, setUser } = useAuthStore()
  const darkMode = useUIStore((state) => state.darkMode)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.name ?? '')
  const [className, setClassName] = useState(user?.grade ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const addToast = useUIStore((state) => state.addToast)

  useEffect(() => {
    setDisplayName(user?.name ?? '')
    setClassName(user?.grade ?? '')
  }, [user?.email, user?.grade, user?.name])

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode !== 'edit' || !user) return

    setEditing(true)
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('mode')
      return next
    }, { replace: true })
  }, [searchParams, setSearchParams, user])

  const handleSave = async () => {
    if (!user) return

    setSavingProfile(true)
    try {
      const res = await studentAPI.updateMe({
        name: displayName.trim(),
        email: user.email,
        grade: user.role === 'student' ? className.trim() : undefined,
      })
      setUser(res.data.user)
      setEditing(false)
      addToast('Profile updated successfully', 'success')
    } catch (error) {
      console.error('[Profile] Failed to update profile:', error)
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? (error.request ? 'Cannot reach backend. Restart the active backend and try again.' : error.message)
        : 'Failed to update profile'
      addToast(message, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setDisplayName(user?.name ?? '')
    setClassName(user?.grade ?? '')
    setEditing(false)
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Profile Header */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-500/30 shrink-0"
          >
            {user?.name.charAt(0)}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-light-ink-primary dark:text-dark-ink-primary">{displayName}</h2>
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg p-1.5 text-light-ink-muted transition-colors hover:bg-indigo-500/10 hover:text-indigo-600 dark:text-dark-ink-muted dark:hover:text-indigo-300"
              >
                <Edit2 size={15} />
              </button>
            </div>
            <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">{user?.email}</p>
            <span className="mt-2 inline-block rounded-full bg-indigo-500/12 px-3 py-1 text-xs font-semibold capitalize text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {isStaffRole(user?.role) ? `👨‍🏫 ${getRoleLabel(user?.role)}` : '🎓 B.Tech Learner'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Info Fields */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">Account Information</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Edit2 size={13} /> Edit Info
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-light-card2 px-3 py-1.5 text-xs font-semibold text-light-ink-secondary transition-colors hover:bg-light-hover dark:bg-dark-card2 dark:text-dark-ink-secondary dark:hover:bg-dark-hover"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={savingProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-60"
              >
                <Check size={13} /> {savingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-light-card2/60 p-3 transition-colors hover:bg-light-hover dark:bg-dark-card2/70 dark:hover:bg-dark-hover">
            <div className="glass-icon bg-indigo-500/10">
              <User size={16} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Full Name</p>
              {editing ? (
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-indigo-200 bg-white/85 px-3 py-2 text-sm font-medium text-light-ink-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-dark-border dark:bg-dark-base dark:text-dark-ink-primary"
                />
              ) : (
                <p className="text-sm font-medium capitalize text-light-ink-primary dark:text-dark-ink-primary">{displayName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-light-card2/60 p-3 transition-colors hover:bg-light-hover dark:bg-dark-card2/70 dark:hover:bg-dark-hover">
            <div className="glass-icon bg-indigo-500/10">
              <Mail size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Email Address</p>
              <p className="text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">{user?.email}</p>
            </div>
          </div>

          {user?.role === 'student' && (
            <div className="flex items-center gap-3 rounded-xl bg-light-card2/60 p-3 transition-colors hover:bg-light-hover dark:bg-dark-card2/70 dark:hover:bg-dark-hover">
              <div className="glass-icon bg-indigo-500/10">
                <GraduationCap size={16} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Academic Year</p>
                {editing ? (
                  <input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-indigo-200 bg-white/85 px-3 py-2 text-sm font-medium text-light-ink-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-dark-border dark:bg-dark-base dark:text-dark-ink-primary"
                    placeholder="Enter B.Tech year"
                  />
                ) : (
                  <p className="text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">{user?.grade ? formatAcademicYearLabel(user.grade) : 'Academic year not set'}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-light-card2/60 p-3 transition-colors hover:bg-light-hover dark:bg-dark-card2/70 dark:hover:bg-dark-hover">
            <div className="glass-icon bg-indigo-500/10">
              <Shield size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Role</p>
              <p className="text-sm font-medium capitalize text-light-ink-primary dark:text-dark-ink-primary">
                {isStaffRole(user?.role) ? getRoleLabel(user?.role) : 'B.Tech Learner'}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Preferences */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-light-card2/60 p-3 dark:bg-dark-card2/70">
            <div className="flex items-center gap-3">
              <div className="glass-icon bg-light-card dark:bg-dark-card2">
                {darkMode ? <Moon size={16} className="text-indigo-600" /> : <Sun size={16} className="text-amber-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">Dark Mode</p>
                <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Toggle dark theme</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-light-card2/60 p-3 dark:bg-dark-card2/70">
            <div className="flex items-center gap-3">
              <div className="glass-icon bg-indigo-500/10">
                <Bell size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">Notifications</p>
                <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Assessment reminders & updates</p>
              </div>
            </div>
            <button className="relative w-11 h-6 rounded-full bg-indigo-500">
              <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow translate-x-5" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
