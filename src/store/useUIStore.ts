import { create } from 'zustand/react'
import type { StateCreator } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import type { Notification, Toast } from '@/types'
import { notificationAPI } from '@/lib/services'

interface UIState {
  darkMode: boolean
  notifications: Notification[]
  notificationsLoading: boolean
  toggleDarkMode: () => void
  fetchNotifications: () => Promise<void>
  markAllRead: () => Promise<void>
  markRead: (id: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  toasts: Toast[]
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: string) => void
}

const formatNotificationTime = (createdAt?: string) => {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const normalizeNotification = (raw: unknown): Notification | null => {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const id = String(item.id ?? item._id ?? '')
  if (!id) return null
  return {
    id,
    title: String(item.title ?? 'Notification'),
    message: String(item.message ?? ''),
    type: item.type === 'success' || item.type === 'warning' ? item.type : 'info',
    read: Boolean(item.read),
    time: formatNotificationTime(typeof item.createdAt === 'string' ? item.createdAt : undefined),
  }
}

const uiStoreCreator = persist<UIState>(
    (set, get) => ({
      darkMode: false,
      notifications: [],
      notificationsLoading: false,

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      fetchNotifications: async () => {
        set({ notificationsLoading: true })
        try {
          const response = await notificationAPI.getAll()
          const notifications = Array.isArray(response.data?.notifications)
            ? response.data.notifications
                .map(normalizeNotification)
                .filter((item: Notification | null): item is Notification => item !== null)
            : []
          set({ notifications })
        } catch {
          set({ notifications: [] })
        } finally {
          set({ notificationsLoading: false })
        }
      },

      markAllRead: async () => {
        const previousNotifications = get().notifications
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
        }))
        try {
          await notificationAPI.markAllRead()
        } catch {
          set({ notifications: previousNotifications })
        }
      },

      markRead: async (id) => {
        const previousNotifications = get().notifications
        set((state) => ({
          notifications: state.notifications.map((notification) => (
            notification.id === id ? { ...notification, read: true } : notification
          )),
        }))
        try {
          await notificationAPI.markRead(id)
        } catch {
          set({ notifications: previousNotifications })
        }
      },

      deleteNotification: async (id) => {
        const previousNotifications = get().notifications
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }))
        try {
          await notificationAPI.delete(id)
        } catch {
          set({ notifications: previousNotifications })
        }
      },

      toasts: [],
      addToast: (message, type) => {
        const id = `t${Date.now()}`
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          const { removeToast } = get()
          removeToast(id)
        }, 3500)
      },
      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
    }),
    {
      name: 'ui-store',
      partialize: ((state: UIState) => ({ darkMode: state.darkMode })) as never,
    }
  ) as unknown as StateCreator<UIState, [], []>

export const useUIStore = create<UIState>()(uiStoreCreator)
