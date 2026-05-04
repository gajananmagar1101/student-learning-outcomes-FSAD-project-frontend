import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, User, BarChart3, BookOpen, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import kluHeaderLogo from '@/assets/klu-header-logo.png'

const features = [
  { icon: BarChart3, label: 'Placement Analytics' },
  { icon: BookOpen, label: 'Lab & Theory Work' },
  { icon: Users, label: 'B.Tech Cohorts' },
]

export function Login() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#f7f8fb] px-3 py-5 dark:bg-dark-base sm:p-4">
      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-44 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-200/35 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-500/10" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative z-10 grid w-full min-w-0 max-w-5xl gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">

        <section className="min-w-0 text-center lg:text-left">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
            className="mx-auto mb-4 flex aspect-[2.45/1] w-full max-w-[20rem] items-center justify-center overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.10)] dark:border-white/15 dark:bg-white sm:max-w-sm sm:rounded-[2rem] sm:p-5 lg:mx-0">
            <img src={kluHeaderLogo} alt="KL University" className="h-full w-full object-contain" />
          </motion.div>
          <p className="mb-0.5 text-[9px] font-medium uppercase tracking-wide text-indigo-500">Student Learning Portal</p>
          <h1 className="text-lg font-semibold text-light-ink-primary dark:text-dark-ink-primary sm:text-xl">KL University</h1>
          <p className="mx-auto mt-1 max-w-[18rem] text-[11px] leading-5 text-slate-600 dark:text-slate-300 lg:mx-0">
            One place for learning, assessments, and progress.
          </p>
          <div className="mx-auto mt-4 flex max-w-[21rem] flex-wrap items-center justify-center gap-2 lg:mx-0 lg:justify-start">
            {features.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/88 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-xl dark:border-slate-600/70 dark:bg-slate-800/80 dark:text-slate-100 sm:text-xs">
                <Icon size={11} className="text-indigo-500 dark:text-indigo-300" /> {label}
              </span>
            ))}
          </div>
        </section>

        <section className="w-full min-w-0 rounded-3xl border border-white/70 bg-white/76 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/12 dark:bg-white/8 sm:rounded-[2rem] sm:p-6">
          <p className="mb-2 text-center text-base font-medium text-light-ink-primary dark:text-dark-ink-primary">Choose your workspace</p>
          <p className="mb-6 text-center text-sm text-light-ink-muted dark:text-dark-ink-muted">Continue as faculty or learner</p>

          <div className="space-y-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login/admin')}
              className="group flex w-full min-w-0 items-center gap-3 rounded-3xl border border-indigo-200/80 bg-indigo-50/70 p-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/15 sm:gap-4 sm:p-4">
              <div className="shrink-0 rounded-2xl bg-white/80 p-3 shadow-sm transition-colors group-hover:bg-white dark:bg-white/10">
                <ShieldCheck size={20} className="text-indigo-400 sm:size-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">Faculty / Program Admin</p>
                <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Manage cohorts, assignments, and performance insights</p>
              </div>
              <ArrowRight size={17} className="shrink-0 text-indigo-400 transition-transform group-hover:translate-x-0.5" />
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login/student')}
              className="group flex w-full min-w-0 items-center gap-3 rounded-3xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15 sm:gap-4 sm:p-4">
              <div className="shrink-0 rounded-2xl bg-white/80 p-3 shadow-sm transition-colors group-hover:bg-white dark:bg-white/10">
                <User size={20} className="text-emerald-400 sm:size-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">KL University Learner</p>
                <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">Track progress, submissions, and semester performance</p>
              </div>
              <ArrowRight size={17} className="shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          </div>

          <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted text-center mt-5">
            No account?{' '}
            <button onClick={() => navigate('/register')} className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create one →
            </button>
          </p>
        </section>
      </motion.div>
    </div>
  )
}
