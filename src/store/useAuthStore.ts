import { create } from 'zustand/react'
import type { StateCreator } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { Role, User } from '@/types'
import { authAPI } from '@/lib/services'
import { isStaffRole } from '@/lib/roles'

interface AuthState {
  user: User | null
  token: string | null
  loginError: string | null
  loading: boolean
  hydrated: boolean
  pendingVerificationEmail: string | null
  pendingVerificationExpiresAt: number | null
  pendingRegistrationRole: Role | null
  pendingApprovalAfterVerification: boolean
  markHydrated: () => void
  login: (email: string, password: string, expectedRole?: 'student' | 'staff') => Promise<boolean>
  register: (data: { name: string; email: string; password: string; role: string; grade?: string }) => Promise<boolean>
  verifyEmailOtp: (email: string, otp: string) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>
  setUser: (user: User | null) => void
  logout: () => void
  clearError: () => void
}

const normalizeUser = (user: User & { _id?: string; role?: string }): User => ({
  ...user,
  id: user._id ?? user.id,
  role: user.role?.toLowerCase() === 'admin'
    ? 'admin'
    : user.role?.toLowerCase() === 'faculty'
      ? 'faculty'
      : 'student',
  accessBlocked: Boolean(user.accessBlocked),
  accessBlockedUntil: user.accessBlockedUntil ?? null,
  accessBlockReason: user.accessBlockReason ?? null,
})

const authStoreCreator = persist<AuthState>(
    (set) => ({
      user: null,
      token: null,
      loginError: null,
      loading: false,
      hydrated: false,
      pendingVerificationEmail: null,
      pendingVerificationExpiresAt: null,
      pendingRegistrationRole: null,
      pendingApprovalAfterVerification: false,
      markHydrated: () => set({ hydrated: true }),

      login: async (email, password, expectedRole) => {
        set({ loading: true, loginError: null })
        try {
          const res = await authAPI.login({ email, password })
          const { token, user } = res.data
          const normalizedUser = normalizeUser(user)
          if (expectedRole === 'student' && normalizedUser.role !== 'student') {
            set({
              loginError: 'This account is not allowed in the learner portal. Please use the faculty login page.',
              loading: false,
            })
            return false
          }
          if (expectedRole === 'staff' && !isStaffRole(normalizedUser.role)) {
            set({
              loginError: 'This account is not allowed in the faculty portal. Please use the learner login page.',
              loading: false,
            })
            return false
          }
          localStorage.setItem('token', token)
          set({ user: normalizedUser, token, loading: false, loginError: null })
          return true
        } catch (err: unknown) {
          const msg = axios.isAxiosError(err)
            ? err.response?.data?.message ?? (err.request ? 'Cannot reach the server. Make sure the backend deployment is running and reachable.' : err.message)
            : 'Login failed'
          set({ loginError: msg, loading: false })
          return false
        }
      },

      register: async (data) => {
        set({ loading: true, loginError: null })
        try {
          const res = await authAPI.register(data)
          set({
            user: null,
            token: null,
            pendingVerificationEmail: null,
            pendingVerificationExpiresAt: null,
            pendingRegistrationRole: (res.data.role?.toLowerCase() ?? data.role?.toLowerCase()) === 'faculty' ? 'faculty' : 'student',
            pendingApprovalAfterVerification: Boolean(res.data.pendingApproval),
            loading: false,
            loginError: null,
          })
          return true
        } catch (err: unknown) {
          const msg = axios.isAxiosError(err)
            ? err.response?.data?.message ?? (err.request ? 'Cannot reach the server. Make sure the backend deployment is running and reachable.' : err.message)
            : 'Registration failed'
          set({ loginError: msg, loading: false })
          return false
        }
      },

      verifyEmailOtp: async (email, otp) => {
        set({ loading: true, loginError: null })
        try {
          await authAPI.verifyEmail({ email, otp })
          set({ loading: false, loginError: 'Email verification is currently disabled.' })
          return false
        } catch (err: unknown) {
          const msg = axios.isAxiosError(err)
            ? err.response?.data?.message ?? (err.request ? 'Cannot reach the server. Make sure the backend deployment is running and reachable.' : err.message)
            : 'Could not verify OTP'
          set({ loginError: msg, loading: false })
          return false
        }
      },

      resendVerification: async (email) => {
        set({ loading: true, loginError: null })
        try {
          await authAPI.resendVerification({ email })
          set({ loading: false, loginError: 'Email verification is currently disabled.' })
          return false
        } catch (err: unknown) {
          const msg = axios.isAxiosError(err)
            ? err.response?.data?.message ?? (err.request ? 'Cannot reach the server. Make sure the backend deployment is running and reachable.' : err.message)
            : 'Could not resend verification email'
          set({ loginError: msg, loading: false })
          return false
        }
      },

      setUser: (user) => set({ user: user ? normalizeUser(user) : null }),

      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          loginError: null,
          loading: false,
          pendingVerificationEmail: null,
          pendingVerificationExpiresAt: null,
          pendingRegistrationRole: null,
          pendingApprovalAfterVerification: false,
        })
      },

      clearError: () => set({ loginError: null }),
    }),
    {
      name: 'auth-store',
      partialize: ((s: AuthState) => ({
        user: s.user,
        token: s.token,
        pendingVerificationEmail: s.pendingVerificationEmail,
        pendingVerificationExpiresAt: s.pendingVerificationExpiresAt,
        pendingRegistrationRole: s.pendingRegistrationRole,
        pendingApprovalAfterVerification: s.pendingApprovalAfterVerification,
      })) as never,
      onRehydrateStorage: () => (state) => {
        state?.clearError()
        state?.markHydrated()
      },
    }
  ) as unknown as StateCreator<AuthState, [], []>

export const useAuthStore = create<AuthState>()(authStoreCreator)
