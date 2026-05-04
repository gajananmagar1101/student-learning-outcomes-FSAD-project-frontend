import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { cn } from '@/lib/utils'

const config = {
  success: { icon: <CheckCircle2 size={15} className="text-emerald-400" />, border: 'border-l-emerald-500' },
  error:   { icon: <XCircle size={15} className="text-red-400" />,         border: 'border-l-red-500' },
  info:    { icon: <Info size={15} className="text-indigo-400" />,          border: 'border-l-indigo-500' },
}

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }} transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl card border-l-4 min-w-[260px] shadow-2xl',
              config[t.type].border
            )}>
            {config[t.type].icon}
            <p className="flex-1 text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-light-ink-muted transition-colors hover:text-light-ink-primary dark:text-dark-ink-muted dark:hover:text-dark-ink-primary"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
