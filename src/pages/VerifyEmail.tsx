import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import kluHeaderLogo from '@/assets/klu-header-logo.png'

export function VerifyEmail() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-7 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/75 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            <img src={kluHeaderLogo} alt="KL University" className="h-full w-full object-contain" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Email Verification Paused</h1>
          <p className="mt-1 text-sm text-gray-500">Student and faculty email verification is temporarily disabled.</p>
        </div>

        <div className="rounded-2xl border border-white/30 bg-white/60 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              New registrations now work without OTP. If you just registered, go back to login and continue from there.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/login"
              className="block w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-purple-700"
            >
              Go to Login
            </Link>
            <Link
              to="/register"
              className="w-full rounded-xl border border-gray-200 bg-white/85 px-4 py-2.5 text-center text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-700"
            >
              Back to Register
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
