import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  label?: string
  showValue?: boolean
  color?: string
}

export function ProgressBar({ value, label, showValue = true, color = 'bg-indigo-500' }: ProgressBarProps) {
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-1.5 flex justify-between gap-3">
          {label && <span className="text-[13px] text-light-ink-secondary dark:text-dark-ink-secondary">{label}</span>}
          {showValue && <span className="text-[13px] font-semibold text-light-ink-primary dark:text-dark-ink-primary">{value}%</span>}
        </div>
      )}
      <div className="h-2 w-full rounded-full border border-light-border bg-light-base dark:border-dark-border dark:bg-dark-base">
        <div
          className={cn('h-[6px] rounded-full transition-all duration-700 mt-[1px]', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}
