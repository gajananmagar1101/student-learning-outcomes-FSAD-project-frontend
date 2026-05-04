import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/useUIStore'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

const typeIcon = (type: Notification['type']) => {
  if (type === 'success') return <CheckCircle2 size={13} className="text-emerald-400" />
  if (type === 'warning') return <AlertTriangle size={13} className="text-amber-400" />
  return <Info size={13} className="text-indigo-400" />
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const notifications = useUIStore((state) => state.notifications)
  const notificationsLoading = useUIStore((state) => state.notificationsLoading)
  const fetchNotifications = useUIStore((state) => state.fetchNotifications)
  const markAllRead = useUIStore((state) => state.markAllRead)
  const markRead = useUIStore((state) => state.markRead)
  const deleteNotification = useUIStore((state) => state.deleteNotification)
  const unread = notifications.filter((n) => !n.read).length
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (!open) return
    void fetchNotifications()
  }, [fetchNotifications, open])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-1.5 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover">
        <Bell size={16} className="text-light-ink-secondary dark:text-dark-ink-secondary" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="fixed left-3 right-3 top-16 z-[140] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.32)] dark:border-slate-700 dark:bg-slate-950 sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-72">
            <div className="max-h-[min(72vh,32rem)] overflow-hidden bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3 border-b border-light-border bg-white px-4 py-3 dark:border-dark-border dark:bg-slate-950">
              <p className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[calc(min(72vh,32rem)-3rem)] overflow-y-auto bg-white dark:bg-slate-950">
              {!notificationsLoading && notifications.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">No notifications yet</p>
                  <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted mt-1">
                    Your updates will appear here for this account.
                  </p>
                </div>
              )}
              {notificationsLoading && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">Loading notifications...</p>
                </div>
              )}
              {notifications.map((n) => (
                <div key={n.id}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-light-border bg-white px-4 py-3 text-left transition-colors last:border-0 hover:bg-light-hover dark:border-dark-border dark:bg-slate-950 dark:hover:bg-dark-hover',
                    !n.read && 'bg-indigo-50 dark:bg-indigo-950/35'
                  )}>
                  <button
                    onClick={() => markRead(n.id)}
                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-light-card2 dark:bg-dark-card2">{typeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm text-light-ink-primary dark:text-dark-ink-primary', !n.read && 'font-semibold')}>{n.title}</p>
                      <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted mt-0.5 truncate">{n.message}</p>
                      <p className="text-xs text-light-ink-muted/60 dark:text-dark-ink-muted/60 mt-1">{n.time}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                  </button>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="p-1 rounded-md text-light-ink-muted dark:text-dark-ink-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
