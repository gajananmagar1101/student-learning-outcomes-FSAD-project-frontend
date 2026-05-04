import { create } from 'zustand/react'
import type { DBStudent } from '@/types'
import { studentAPI } from '@/lib/services'

interface StudentState {
  students: DBStudent[]
  loading: boolean
  error: string | null
  fetchStudents: () => Promise<void>
  removeStudent: (id: string) => void
  updateStudent: (student: DBStudent) => void
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  loading: false,
  error: null,

  fetchStudents: async () => {
    set({ loading: true, error: null })
    try {
      const res = await studentAPI.getAll()
      console.log('[StudentStore] Fetched students:', res.data.students?.length)
      // Normalize _id → id
      const students: DBStudent[] = (res.data.students ?? []).map((s: DBStudent) => ({
        ...s,
        id: s._id,
      }))
      set({ students, loading: false })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to fetch students'
      console.error('[StudentStore] Error:', msg)
      set({ error: msg, loading: false })
    }
  },

  removeStudent: (id) =>
    set((s) => ({ students: s.students.filter((st) => st._id !== id && st.id !== id) })),

  updateStudent: (student) =>
    set((state) => ({
      students: state.students.map((item) => {
        const itemId = item._id ?? item.id
        const nextId = student._id ?? student.id
        return itemId === nextId
          ? {
              ...item,
              ...student,
              id: nextId,
            }
          : item
      }),
    })),
}))
