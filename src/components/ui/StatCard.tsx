import type { LucideIcon } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: React.ReactNode
  change?: string
  positive?: boolean
  icon: LucideIcon
  iconColor: string
  iconBg: string
}

export function StatCard({ title, value, change, positive, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <GlassCard hover className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">{title}</p>
          <p className="mt-1 text-[1.7rem] font-bold leading-none text-light-ink-primary dark:text-dark-ink-primary">{value}</p>
          {change && (
            <p className={cn('mt-1.5 flex items-center gap-1 text-[11px] font-medium', positive ? 'text-emerald-400' : 'text-red-400')}>
              {positive ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-2', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
    </GlassCard>
  )
}
