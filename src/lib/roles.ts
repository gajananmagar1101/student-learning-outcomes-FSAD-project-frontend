import type { Role } from '@/types'

export const isStaffRole = (role?: string | null): role is Extract<Role, 'admin' | 'faculty'> =>
  role === 'admin' || role === 'faculty'

export const getHomeRouteForRole = (role?: string | null) =>
  isStaffRole(role) ? '/dashboard' : '/student-dashboard'

export const getRoleLabel = (role?: string | null) => {
  if (role === 'admin') return 'Program Admin'
  if (role === 'faculty') return 'Faculty'
  return 'B.Tech Learner'
}
