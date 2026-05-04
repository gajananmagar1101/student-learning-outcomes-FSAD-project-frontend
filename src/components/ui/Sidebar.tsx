import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Users, BarChart3, User, X, LogOut, BrainCircuit, ChartColumnBig, BookCopy, UserCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import kluHeaderLogo from '@/assets/klu-header-logo.png'
import { getRoleLabel, isStaffRole } from '@/lib/roles'

const adminLinks = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assessments', icon: ClipboardList,   label: 'Assignments' },
  { to: '/quizzes',     icon: BrainCircuit,    label: 'Quizzes' },
  { to: '/subjects',    icon: BookCopy,        label: 'Subjects' },
  { to: '/students',    icon: Users,           label: 'B.Tech Cohorts' },
  { to: '/reports',     icon: BarChart3,       label: 'Reports' },
  { to: '/profile',     icon: User,            label: 'Profile' },
]

const adminOnlyLinks = [
  { to: '/faculty', icon: UserCheck, label: 'Faculty' },
]

const studentLinks = [
  { to: '/student-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assessments',       icon: ClipboardList,   label: 'Assignments' },
  { to: '/quizzes',           icon: BrainCircuit,    label: 'Quizzes' },
  { to: '/student-performance', icon: ChartColumnBig, label: 'Performance' },
  { to: '/profile',           icon: User,            label: 'Profile' },
]

interface SidebarProps { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const links = isStaffRole(user?.role)
    ? [...adminLinks, ...(user?.role === 'admin' ? adminOnlyLinks : [])]
    : studentLinks
  const roleLabel = getRoleLabel(user?.role)

  const handleLogout = () => { logout(); navigate('/login') }

  const content = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-light-border px-4 py-4 dark:border-dark-border">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-white/60 bg-white/75 p-1 shadow-sm">
          <img src={kluHeaderLogo} alt="KL University" className="h-full w-full object-contain" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-light-ink-primary dark:text-dark-ink-primary">KL U</p>
          <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Academic Command Center</p>
        </div>
        <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-light-ink-muted hover:bg-light-hover dark:text-dark-ink-muted dark:hover:bg-dark-hover lg:hidden">
          <X size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="portal-scroll-region slim-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) => cn('nav-link', isActive && 'active')}>
            {({ isActive }) => (
              <>
                <div className={cn('rounded-lg p-1.5 transition-colors',
                  isActive ? 'bg-accent/20' : 'bg-light-card2 dark:bg-dark-card2')}>
                  <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-light-ink-muted dark:text-dark-ink-muted'} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="mt-auto space-y-1 border-t border-light-border bg-light-card px-2.5 py-3 dark:border-dark-border dark:bg-dark-card">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">{user?.name}</p>
            <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">{roleLabel}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-light-ink-muted transition-colors hover:bg-red-500/10 hover:text-red-400 dark:text-dark-ink-muted">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden h-screen w-56 shrink-0 flex-col overflow-hidden border-r border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card lg:flex">
        {content}
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose} className="fixed inset-0 bg-black/60 z-30 lg:hidden" />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-40 h-full w-56 border-r border-light-border bg-light-card shadow-2xl dark:border-dark-border dark:bg-dark-card lg:hidden">
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
