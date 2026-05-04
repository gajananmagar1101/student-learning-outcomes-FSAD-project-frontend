import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, BookOpen, CircleCheckBig } from 'lucide-react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { getEmailValidationMessage, isRealisticEmail } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { btechYearOptions } from '@/lib/btech'
import kluHeaderLogo from '@/assets/klu-header-logo.png'

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'student' | 'faculty'
  grade: string
}

export function Register() {
  const navigate = useNavigate()
  const { register: registerUser, login, loginError, clearError, loading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState<null | 'student' | 'faculty'>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)

  const { register, handleSubmit, getValues, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { role: 'student' },
  })
  const selectedRole = watch('role')
  const nameField = register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })
  const emailField = register('email', {
    required: 'Email is required',
    validate: (value) => isRealisticEmail(value) || getEmailValidationMessage(),
  })
  const passwordField = register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })

  const onSubmit = async (data: FormData) => {
    const ok = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      grade: data.grade,
    })

    if (ok) {
      setCreatedCredentials(data.role === 'student' ? { email: data.email, password: data.password } : null)
      setRegistrationSuccess(data.role)
      setShowPassword(false)
      clearError()
      reset({ name: '', email: '', password: '', confirmPassword: '', role: data.role, grade: '' })
    }
  }

  const handleContinueToLogin = async () => {
    if (registrationSuccess === 'student' && createdCredentials) {
      const loggedIn = await login(createdCredentials.email, createdCredentials.password, 'student')
      if (loggedIn) {
        navigate('/student-dashboard')
      }
      return
    }

    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
        <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        className="w-full max-w-md relative z-10">
        <div className="text-center mb-7">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/75 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <img src={kluHeaderLogo} alt="KL University" className="h-full w-full object-contain" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Create KL U Account</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account now. Email verification is temporarily turned off.</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl p-6">
          {registrationSuccess ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                registrationSuccess === 'faculty' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <CircleCheckBig size={30} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {registrationSuccess === 'faculty' ? 'Request submitted successfully' : 'Account created successfully'}
                </h2>
                <p className="text-sm leading-6 text-gray-600">
                  {registrationSuccess === 'faculty'
                    ? 'Your faculty account request has been submitted for admin approval. You can log in once it is approved.'
                    : 'Your account has been created successfully. You can log in now to continue to the portal.'}
                </p>
              </div>
              <div className="space-y-2">
                <motion.button
                  type="button"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinueToLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-purple-700 disabled:opacity-70"
                >
                  {loading ? (
                    <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg> Signing in...</>
                  ) : registrationSuccess === 'student' ? 'Continue and log in' : 'Go to login'}
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationSuccess(null)
                    setCreatedCredentials(null)
                    clearError()
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  Go back
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex justify-center">
                  <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                    selectedRole === 'faculty'
                      ? 'border border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}>
                    <BookOpen size={15} /> {selectedRole === 'faculty' ? 'KL U Faculty Registration' : 'KL U Learner Registration'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Register As</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                      <input type="radio" value="student" {...register('role')} className="accent-emerald-600" />
                      Learner
                    </label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700">
                      <input type="radio" value="faculty" {...register('role')} className="accent-indigo-600" />
                      Faculty
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      placeholder="Gajanan"
                      {...nameField}
                      onChange={(event) => {
                        nameField.onChange(event)
                        clearError()
                      }}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/85 text-sm text-gray-900 caret-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder-gray-400"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@college.edu"
                      {...emailField}
                      onChange={(event) => {
                        emailField.onChange(event)
                        clearError()
                      }}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/85 text-sm text-gray-900 caret-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder-gray-400"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                {selectedRole === 'student' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
                    <select
                      {...register('grade')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/85 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                    >
                      <option value="">Select B.Tech year</option>
                      {btechYearOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-800">
                    Faculty registration goes directly to admin approval. Once approved, login will work immediately.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      {...passwordField}
                      onChange={(event) => {
                        passwordField.onChange(event)
                        clearError()
                      }}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white/85 text-sm text-gray-900 caret-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder-gray-400"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      {...register('confirmPassword', {
                        required: 'Please confirm password',
                        validate: (v) => v === getValues('password') || 'Passwords do not match',
                      })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/85 text-sm text-gray-900 caret-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder-gray-400"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                </div>

                {loginError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-600">{loginError}</p>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-purple-700 disabled:opacity-70"
                >
                  {loading ? (
                    <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg> Creating account...</>
                  ) : selectedRole === 'faculty' ? 'Submit Faculty Request' : 'Create Account'}
                </motion.button>
              </form>

              <p className="mt-4 text-center text-xs text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Sign in →</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
