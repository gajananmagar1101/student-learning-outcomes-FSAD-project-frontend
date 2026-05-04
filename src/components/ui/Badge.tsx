import { cn } from '@/lib/utils'

interface BadgeProps {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'info'
}

const variants = {
  success: 'border border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  warning: 'border border-amber-500/30 bg-amber-500/12 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  danger:  'border border-red-500/30 bg-red-500/12 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  info:    'border border-indigo-500/30 bg-indigo-500/12 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
}

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize leading-5', variants[variant])}>
      {label}
    </span>
  )
}
