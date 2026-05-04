import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <AnimatePresence>
          {open && (
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
              >
                <div className="card my-auto w-full max-w-md overflow-hidden p-6 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <Dialog.Title className="text-base font-semibold text-light-ink-primary dark:text-dark-ink-primary">{title}</Dialog.Title>
                    <button onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors text-light-ink-muted dark:text-dark-ink-muted hover:text-light-ink-primary dark:hover:text-dark-ink-primary">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain pr-1">
                    {children}
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
