import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({ children, className, hover = false, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      whileHover={hover ? { y: -2, scale: 1.003, boxShadow: '0 16px 36px rgba(79,70,229,0.18)' } : undefined}
      onClick={onClick}
      className={cn('card', className)}
    >
      {children}
    </motion.div>
  )
}
