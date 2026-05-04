import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { getHomeRouteForRole, isStaffRole } from '@/lib/roles'

const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout').then((module) => ({ default: module.DashboardLayout })))
const Login = lazy(() => import('@/pages/Login').then((module) => ({ default: module.Login })))
const AdminLogin = lazy(() => import('@/pages/AdminLogin').then((module) => ({ default: module.AdminLogin })))
const StudentLogin = lazy(() => import('@/pages/StudentLogin').then((module) => ({ default: module.StudentLogin })))
const Register = lazy(() => import('@/pages/Register').then((module) => ({ default: module.Register })))
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail').then((module) => ({ default: module.VerifyEmail })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const Assessments = lazy(() => import('@/pages/Assessments').then((module) => ({ default: module.Assessments })))
const Students = lazy(() => import('@/pages/Students').then((module) => ({ default: module.Students })))
const Reports = lazy(() => import('@/pages/Reports').then((module) => ({ default: module.Reports })))
const Subjects = lazy(() => import('@/pages/Subjects').then((module) => ({ default: module.Subjects })))
const Profile = lazy(() => import('@/pages/Profile').then((module) => ({ default: module.Profile })))
const StudentDashboard = lazy(() => import('@/pages/StudentDashboard').then((module) => ({ default: module.StudentDashboard })))
const StudentPerformancePage = lazy(() => import('@/pages/StudentPerformancePage').then((module) => ({ default: module.StudentPerformancePage })))
const StudentPerformanceHistoryPage = lazy(() => import('@/pages/StudentPerformanceHistoryPage').then((module) => ({ default: module.StudentPerformanceHistoryPage })))
const StudentPlannerPage = lazy(() => import('@/pages/StudentPlannerPage').then((module) => ({ default: module.StudentPlannerPage })))
const SubjectAssignmentsPage = lazy(() => import('@/pages/SubjectAssignmentsPage').then((module) => ({ default: module.SubjectAssignmentsPage })))
const ClassStudentsPage = lazy(() => import('@/pages/ClassStudentsPage').then((module) => ({ default: module.ClassStudentsPage })))
const Quizzes = lazy(() => import('@/pages/Quizzes').then((module) => ({ default: module.Quizzes })))
const StudentProfilePage = lazy(() => import('@/pages/StudentProfilePage').then((module) => ({ default: module.StudentProfilePage })))
const StudentProfileDetailPage = lazy(() => import('@/pages/StudentProfileDetailPage').then((module) => ({ default: module.StudentProfileDetailPage })))
const FacultyRequests = lazy(() => import('@/pages/FacultyRequests').then((module) => ({ default: module.FacultyRequests })))
const BlockedAccountPage = lazy(() => import('@/pages/BlockedAccountPage').then((module) => ({ default: module.BlockedAccountPage })))

function AppShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-bg px-4 dark:bg-dark-bg">
      <div className="rounded-2xl border border-light-border bg-white/80 px-5 py-3 text-sm text-light-ink-muted shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-ink-muted">
        Loading...
      </div>
    </div>
  )
}

function ProtectedRoute({ children, staffOnly = false, adminOnly = false }: { children: React.ReactNode; staffOnly?: boolean; adminOnly?: boolean }) {
  const { user, hydrated } = useAuthStore()
  const location = useLocation()
  if (!hydrated) return <AppShellFallback />
  if (!user) return <Navigate to="/login" replace />
  if (user.accessBlocked && location.pathname !== '/account-blocked') {
    return <Navigate to="/account-blocked" replace />
  }
  if (staffOnly && !isStaffRole(user.role)) return <Navigate to="/student-dashboard" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to={isStaffRole(user.role) ? '/dashboard' : '/student-dashboard'} replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuthStore()
  if (!hydrated) return <AppShellFallback />
  if (user) return <Navigate to={getHomeRouteForRole(user.role)} replace />
  return <>{children}</>
}

const SCROLL_STORAGE_KEY = 'app-scroll-positions'

function ScrollRestorationManager() {
  const location = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto'
      }
    }
  }, [])

  useEffect(() => {
    const routeKey = `${location.pathname}${location.search}`

    const loadPositions = () => {
      try {
        const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY)
        return raw ? JSON.parse(raw) as Record<string, number> : {}
      } catch {
        return {}
      }
    }

    const savePosition = () => {
      try {
        const positions = loadPositions()
        positions[routeKey] = window.scrollY
        window.sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions))
      } catch {
        // ignore storage failures
      }
    }

    const restorePosition = () => {
      const positions = loadPositions()
      const target = positions[routeKey]
      if (typeof target === 'number') {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: target, left: 0, behavior: 'auto' })
        })
        return
      }
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      })
    }

    restorePosition()

    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        savePosition()
        ticking = false
      })
    }

    const handleBeforeUnload = () => {
      savePosition()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      savePosition()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [location.pathname, location.search])

  return null
}

export default function App() {
  const { user, hydrated, markHydrated } = useAuthStore()
  const darkMode = useUIStore((state) => state.darkMode)
  const fetchNotifications = useUIStore((state) => state.fetchNotifications)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    if (!hydrated) {
      markHydrated()
      const timeoutId = window.setTimeout(() => {
        markHydrated()
      }, 150)
      return () => window.clearTimeout(timeoutId)
    }
    return undefined
  }, [hydrated, markHydrated])

  useEffect(() => {
    if (user && !user.accessBlocked) {
      void fetchNotifications()
    }
  }, [fetchNotifications, user])

  return (
    <BrowserRouter>
      <ScrollRestorationManager />
      <Suspense fallback={<AppShellFallback />}>
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/login/admin" element={<GuestRoute><AdminLogin /></GuestRoute>} />
          <Route path="/login/student" element={<GuestRoute><StudentLogin /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/verify-email" element={<GuestRoute><VerifyEmail /></GuestRoute>} />
          <Route path="/account-blocked" element={<ProtectedRoute><BlockedAccountPage /></ProtectedRoute>} />

          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<ProtectedRoute staffOnly><Dashboard /></ProtectedRoute>} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quizzes/create" element={<Quizzes />} />
            <Route path="/quizzes/subject" element={<ProtectedRoute staffOnly><Quizzes /></ProtectedRoute>} />
            <Route path="/quizzes/library/subject" element={<Quizzes />} />
            <Route path="/quizzes/attempt/:quizId" element={<Quizzes />} />
            <Route path="/assessments/subject" element={<ProtectedRoute staffOnly><SubjectAssignmentsPage /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute staffOnly><Students /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute staffOnly><Subjects /></ProtectedRoute>} />
            <Route path="/students/class" element={<ProtectedRoute staffOnly><ClassStudentsPage /></ProtectedRoute>} />
            <Route path="/students/profile/:studentId" element={<ProtectedRoute staffOnly><StudentProfilePage /></ProtectedRoute>} />
            <Route path="/students/profile/:studentId/:section" element={<ProtectedRoute staffOnly><StudentProfileDetailPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute staffOnly><Reports /></ProtectedRoute>} />
            <Route path="/faculty" element={<ProtectedRoute adminOnly><FacultyRequests /></ProtectedRoute>} />
            <Route path="/faculty-requests" element={<Navigate to="/faculty" replace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/student-performance" element={<StudentPerformancePage />} />
            <Route path="/student-performance/:section" element={<StudentPerformanceHistoryPage />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student-planner" element={<StudentPlannerPage />} />
          </Route>

          <Route path="*" element={<Navigate to={user ? getHomeRouteForRole(user.role) : '/login'} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
