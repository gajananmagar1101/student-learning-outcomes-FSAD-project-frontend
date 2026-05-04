import { create } from 'zustand/react'
import type { AdminSubmission, AssignmentItem, AssignmentSubmission, StudentAssignmentItem } from '@/types'
import { adminAssignmentAPI, studentAssignmentAPI, submissionAPI } from '@/lib/services'

type AssignmentPayload = Omit<AssignmentItem, 'id' | '_id' | 'createdAt' | 'publicationStatus'> & {
  status: 'draft' | 'published'
}

interface AssignmentStoreState {
  adminAssignments: AssignmentItem[]
  studentAssignments: StudentAssignmentItem[]
  submissions: AdminSubmission[]
  loading: boolean
  fetchAdminAssignments: () => Promise<void>
  fetchStudentAssignments: () => Promise<void>
  fetchAdminSubmissions: () => Promise<void>
  createAssignment: (data: AssignmentPayload) => Promise<void>
  updateAssignment: (id: string, data: AssignmentPayload) => Promise<void>
  publishAssignment: (id: string) => Promise<void>
  deleteAssignment: (id: string) => Promise<void>
  submitAssignment: (data: { assignmentId: string; content?: string; fileName?: string; fileContent?: string }) => Promise<void>
  updateSubmission: (id: string, data: { assignmentId: string; content?: string; fileName?: string; fileContent?: string }) => Promise<void>
  gradeSubmission: (id: string, marks: number) => Promise<void>
}

const normalizeAssignment = (assignment: AssignmentItem & { _id?: string; id?: string; status?: string }): AssignmentItem => ({
  ...assignment,
  id: assignment._id ?? assignment.id ?? '',
  publicationStatus: assignment.publicationStatus ?? (assignment.status === 'published' ? 'published' : 'draft'),
})

const normalizeSubmission = <T extends { _id?: string; id?: string }>(submission: T): T & { id: string } => ({
  ...submission,
  id: submission._id ?? submission.id ?? '',
})

const normalizeStudentAssignment = (assignment: StudentAssignmentItem & { _id?: string; submission?: AssignmentSubmission | null }) => ({
  ...normalizeAssignment(assignment),
  submission: assignment.submission ? normalizeSubmission(assignment.submission) : null,
})

export const useAssignmentStore = create<AssignmentStoreState>((set, get) => ({
  adminAssignments: [],
  studentAssignments: [],
  submissions: [],
  loading: false,

  fetchAdminAssignments: async () => {
    set({ loading: true })
    try {
      const res = await adminAssignmentAPI.getAll()
      set({
        adminAssignments: (res.data.assignments ?? []).map((assignment: AssignmentItem) => normalizeAssignment(assignment)),
        loading: false,
      })
    } catch (error) {
      console.error('[AssignmentStore] Failed to fetch admin assignments:', error)
      set({ loading: false })
    }
  },

  fetchStudentAssignments: async () => {
    set({ loading: true })
    try {
      const res = await studentAssignmentAPI.getAll()
      set({
        studentAssignments: (res.data.assignments ?? []).map((assignment: StudentAssignmentItem) => normalizeStudentAssignment(assignment)),
        loading: false,
      })
    } catch (error) {
      console.error('[AssignmentStore] Failed to fetch student assignments:', error)
      set({ loading: false })
    }
  },

  fetchAdminSubmissions: async () => {
    try {
      const res = await submissionAPI.getAllForAdmin()
      set({
        submissions: (res.data.submissions ?? []).map((submission: AdminSubmission) => normalizeSubmission(submission)),
      })
    } catch (error) {
      console.error('[AssignmentStore] Failed to fetch admin submissions:', error)
    }
  },

  createAssignment: async (data) => {
    const res = await adminAssignmentAPI.create(data)
    const assignment = normalizeAssignment(res.data.assignment)
    set((state) => ({ adminAssignments: [assignment, ...state.adminAssignments] }))
  },

  updateAssignment: async (id, data) => {
    const res = await adminAssignmentAPI.update(id, data)
    const assignment = normalizeAssignment(res.data.assignment)
    set((state) => ({
      adminAssignments: state.adminAssignments.map((item) => item.id === id ? assignment : item),
    }))
  },

  publishAssignment: async (id) => {
    const res = await adminAssignmentAPI.publish(id)
    const assignment = normalizeAssignment(res.data.assignment)
    set((state) => ({
      adminAssignments: state.adminAssignments.map((item) => item.id === id ? assignment : item),
    }))
  },

  deleteAssignment: async (id) => {
    await adminAssignmentAPI.delete(id)
    set((state) => ({
      adminAssignments: state.adminAssignments.filter((item) => item.id !== id),
      submissions: state.submissions.filter((submission) => submission.assignmentId !== id),
    }))
  },

  submitAssignment: async (data) => {
    await submissionAPI.create(data)
    await get().fetchStudentAssignments()
  },

  updateSubmission: async (id, data) => {
    await submissionAPI.update(id, data)
    await get().fetchStudentAssignments()
  },

  gradeSubmission: async (id, marks) => {
    await submissionAPI.grade(id, { marks })
    await get().fetchAdminSubmissions()
  },
}))
