import { useMemo } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookCopy,
  BookOpenCheck,
  CalendarDays,
  ChartColumnBig,
  LayoutDashboard,
  LogOut,
  Moon,
  PencilLine,
  SearchCheck,
  Sun,
  UserCircle2,
  UserCheck,
  UsersRound,
} from 'lucide-react'
import { LayoutGroup, motion } from 'framer-motion'
import klUniversityLogo from '@/assets/kl-university-logo.png'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { NotificationPanel } from './NotificationPanel'
import { SearchBar } from './SearchBar'
import { cn } from '@/lib/utils'
import { getHomeRouteForRole, getRoleLabel, isStaffRole } from '@/lib/roles'

interface NavbarProps { title: string }

type TopLink = { to: string; label: string; icon: typeof LayoutDashboard }

const isLinkActive = (pathname: string, to: string) => {
  if (to === '/dashboard') return pathname === '/dashboard'
  if (to === '/student-dashboard') return pathname === '/student-dashboard'
  if (to === '/quizzes') return pathname === '/quizzes' || pathname.startsWith('/quizzes/')
  if (to === '/subjects') return pathname === '/subjects' || pathname.startsWith('/subjects/')
  if (to === '/students') return pathname === '/students' || pathname.startsWith('/students/')
  if (to === '/student-performance') return pathname === '/student-performance' || pathname.startsWith('/student-performance/')
  return pathname === to
}

export function Navbar({ title }: NavbarProps) {
  const { user, logout } = useAuthStore()
  const darkMode = useUIStore((state) => state.darkMode)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)
  const navigate = useNavigate()
  const location = useLocation()
  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U'
  const roleLabel = getRoleLabel(user?.role)

  const topLinks = useMemo<TopLink[]>(() => {
    if (isStaffRole(user?.role)) {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/assessments', label: 'Assignments', icon: BookOpenCheck },
        { to: '/quizzes', label: 'Quizzes', icon: SearchCheck },
        { to: '/subjects', label: 'Subjects', icon: BookCopy },
        { to: '/students', label: 'B.Tech Cohorts', icon: UsersRound },
        ...(user?.role === 'admin' ? [{ to: '/faculty', label: 'Faculty', icon: UserCheck }] : []),
        { to: '/reports', label: 'Reports', icon: BarChart3 },
      ]
    }

    return [
      { to: '/student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/assessments', label: 'Assignments', icon: BookOpenCheck },
      { to: '/quizzes', label: 'Quizzes', icon: SearchCheck },
      { to: '/student-planner', label: 'Planner', icon: CalendarDays },
    ]
  }, [user?.role])

  const menuItems = useMemo(() => {
    if (isStaffRole(user?.role)) {
      return [
        { to: '/profile', icon: UserCircle2, label: 'My Profile' },
        { to: '/profile?mode=edit', icon: PencilLine, label: 'Edit Profile' },
        { to: '/dashboard', icon: LayoutDashboard, label: 'Go to Dashboard' },
        ...(user?.role === 'admin' ? [{ to: '/faculty', icon: UserCheck, label: 'Faculty' }] : []),
      ]
    }

    return [
      { to: '/student-performance', icon: ChartColumnBig, label: 'My Performance' },
      { to: '/profile', icon: UserCircle2, label: 'My Profile' },
      { to: '/profile?mode=edit', icon: PencilLine, label: 'Edit Profile' },
      { to: '/student-dashboard', icon: LayoutDashboard, label: 'Go to Dashboard' },
    ]
  }, [user?.role])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="top-navbar sticky top-0 z-20 border-b border-white/45 bg-white/75 shadow-[0_4px_12px_rgba(15,23,42,0.055)] backdrop-blur-xl dark:border-white/10 dark:bg-[#071225]/95 dark:shadow-[0_4px_12px_rgba(0,0,0,0.13)]">
      <div className="top-navbar-inner flex flex-wrap items-center gap-2.5 px-3 py-2.5 lg:flex-nowrap lg:px-5">
        <div className="profile-menu order-2 ml-auto lg:order-last lg:ml-0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="profile-pill apple-glass flex shrink-0 items-center gap-2 rounded-full border border-indigo-300/70 bg-gradient-to-r from-white/85 to-indigo-50/80 px-2.5 py-1.5 text-left transition-colors hover:from-white hover:to-indigo-100 dark:border-indigo-500/40 dark:from-slate-900/90 dark:to-indigo-950/80 dark:hover:to-indigo-900/80"
              aria-label="Open profile menu"
            >
              <div className="glass-icon h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white shadow-glow-sm">
                {initial}
              </div>
              <span className="hidden max-w-36 truncate text-[13px] font-semibold text-light-ink-primary dark:text-dark-ink-primary md:block">{user?.name}</span>
            </motion.button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={10}
              className="z-50 w-64 overflow-hidden rounded-2xl border border-light-border bg-light-card p-2 shadow-2xl dark:border-dark-border dark:bg-dark-card"
            >
              <div className="mb-1 rounded-xl border border-light-border bg-light-card2/70 p-2.5 dark:border-dark-border dark:bg-dark-card2/80">
                <p className="truncate text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">{user?.name}</p>
                <p className="truncate text-xs text-light-ink-muted dark:text-dark-ink-muted">{user?.email}</p>
                <span className="mt-2 inline-block rounded-full bg-indigo-500/12 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {roleLabel}
                </span>
              </div>

              <div className="space-y-1">
                {menuItems.map(({ to, icon: Icon, label }) => (
                  <DropdownMenu.Item
                    key={to}
                    onSelect={() => navigate(to)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm outline-none transition-colors',
                      isLinkActive(location.pathname, to.split('?')[0])
                        ? 'bg-indigo-500/12 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                        : 'text-light-ink-secondary hover:bg-light-hover dark:text-dark-ink-secondary dark:hover:bg-dark-hover'
                    )}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </DropdownMenu.Item>
                ))}
              </div>

              <DropdownMenu.Separator className="my-2 h-px bg-light-border dark:bg-dark-border" />

              <button
                onClick={handleLogout}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut size={16} />
                  Logout
                </span>
              </button>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        </div>

        <button
          onClick={() => navigate(getHomeRouteForRole(user?.role))}
          className="brand-pill apple-glass flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 transition-colors hover:bg-white/80 dark:border-white/15 dark:bg-slate-900/85 dark:text-white dark:hover:bg-slate-800/90"
          title={title}
        >
          <span className="glass-icon h-7 w-7 overflow-hidden rounded-full p-0.5">
            <img
              src={klUniversityLogo}
              alt="KL University"
              className="h-full w-full rounded-full object-contain"
            />
          </span>
          <span className="hidden text-[13px] font-bold text-light-ink-primary dark:text-dark-ink-primary sm:block">KL University</span>
        </button>

        <nav className="mobile-nav-row hide-scrollbar order-4 -mx-1 w-[calc(100%+0.5rem)] min-w-0 overflow-x-auto lg:order-none lg:mx-0 lg:w-auto lg:flex-1">
          <LayoutGroup id="top-navigation">
          <div className="nav-switch apple-glass flex w-max items-center gap-1 rounded-full border border-white/60 bg-white/60 p-0.5 backdrop-blur-2xl dark:border-white/20 dark:bg-slate-900/80">
            {topLinks.map((link) => {
              const Icon = link.icon
              const active = isLinkActive(location.pathname, link.to)
              return (
              <NavLink
                key={link.to}
                to={link.to}
                className={cn(
                  'nav-switch-link relative isolate inline-flex items-center gap-2 overflow-hidden rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-200',
                  active
                    ? 'is-active text-indigo-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="nav-active-pill absolute inset-0 -z-10 rounded-full bg-indigo-50/95 ring-1 ring-indigo-500/55 dark:bg-indigo-500/45 dark:ring-indigo-300/35"
                    transition={{ type: 'spring', stiffness: 460, damping: 38, mass: 0.8 }}
                  />
                )}
                <span className={cn('nav-icon-bubble', active && 'is-active')}>
                  <Icon size={14} className={cn('shrink-0 transition-colors duration-200', active && 'text-indigo-500 dark:text-indigo-100')} />
                </span>
                <span className="relative">{link.label}</span>
              </NavLink>
              )
            })}
          </div>
          </LayoutGroup>
        </nav>

        <div className="navbar-actions order-1 ml-auto flex shrink-0 items-center gap-1.5 lg:order-none lg:ml-0">
          <SearchBar />
          <button
            onClick={toggleDarkMode}
            title="Toggle theme"
            className="theme-pill apple-glass rounded-full p-1.5 text-light-ink-secondary transition-colors hover:bg-white/80 hover:text-light-ink-primary dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800/90 dark:hover:text-white"
          >
            {darkMode
              ? <Sun size={16} className="text-amber-400" />
              : <Moon size={16} className="text-light-ink-secondary dark:text-dark-ink-secondary" />}
          </button>
          <NotificationPanel />
        </div>
      </div>
    </header>
  )
}
