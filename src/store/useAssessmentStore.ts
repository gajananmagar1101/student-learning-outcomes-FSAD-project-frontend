import { create } from 'zustand/react'
import type { Assessment } from '@/types'
import { assessmentAPI } from '@/lib/services'

interface AssessmentState {
  assessments: Assessment[]
  loading: boolean
  fetchAssessments: () => Promise<void>
  addAssessment: (a: Omit<Assessment, 'id' | '_id'>) => Promise<void>
  updateAssessment: (id: string, data: Partial<Assessment>) => Promise<void>
  deleteAssessment: (id: string) => Promise<void>
}

const normalize = (a: Assessment & { _id?: string }): Assessment => ({
  ...a,
  id: a._id ?? a.id,
})

export const useAssessmentStore = create<AssessmentState>((set) => ({
  assessments: [],
  loading: false,

  fetchAssessments: async () => {
    set({ loading: true })
    try {
      const res = await assessmentAPI.getAll()
      const assessments = (res.data.assessments ?? []).map(normalize)
      console.log('[AssessmentStore] Fetched:', assessments.length)
      set({ assessments, loading: false })
    } catch (err) {
      console.error('[AssessmentStore] Fetch error:', err)
      set({ loading: false })
    }
  },

  addAssessment: async (a) => {
    const res = await assessmentAPI.create(a)
    const assessment = normalize(res.data.assessment)
    set((s) => ({ assessments: [assessment, ...s.assessments] }))
  },

  updateAssessment: async (id, data) => {
    const res = await assessmentAPI.update(id, data)
    const updated = normalize(res.data.assessment)
    set((s) => ({ assessments: s.assessments.map((a) => (a.id === id || a._id === id) ? updated : a) }))
  },

  deleteAssessment: async (id) => {
    await assessmentAPI.delete(id)
    set((s) => ({ assessments: s.assessments.filter((a) => a.id !== id && a._id !== id) }))
  },
}))
