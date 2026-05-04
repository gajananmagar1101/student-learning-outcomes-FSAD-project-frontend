import { create } from 'zustand/react'
import type { Quiz, QuizAttempt, QuizQuestion } from '@/types'
import { quizAPI } from '@/lib/services'

interface CreateQuizInput {
  title: string
  subjectId?: string
  subject: string
  className: string
  description?: string
  deadlineAt?: string
  durationMinutes: number
  status: Quiz['status']
  questions: QuizQuestion[]
}

interface SubmitQuizInput {
  quizId: string
  studentId: string
  studentName: string
  studentEmail: string
  className: string
  answers: number[]
}

interface QuizState {
  quizzes: Quiz[]
  attempts: QuizAttempt[]
  loading: boolean
  fetchQuizzes: () => Promise<void>
  fetchAttempts: () => Promise<void>
  createQuiz: (input: CreateQuizInput) => Promise<Quiz>
  updateQuiz: (id: string, input: CreateQuizInput) => Promise<Quiz>
  deleteQuiz: (id: string) => Promise<void>
  submitQuiz: (input: SubmitQuizInput) => Promise<QuizAttempt>
}

const FALLBACK_STORAGE_KEY = 'quiz-store-fallback'
const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
const ENABLE_LOCAL_FALLBACK = import.meta.env.DEV
const safeText = (value: unknown) => (typeof value === 'string' ? value : '')

const normalizeQuiz = (quiz: Partial<Quiz> & { id: string }): Quiz => ({
  id: quiz.id,
  subjectId: safeText(quiz.subjectId) || undefined,
  title: safeText(quiz.title),
  subject: safeText(quiz.subject),
  className: safeText(quiz.className),
  description: safeText(quiz.description),
  deadlineAt: safeText(quiz.deadlineAt) || undefined,
  durationMinutes: Number.isFinite(quiz.durationMinutes) ? Number(quiz.durationMinutes) : 0,
  status: quiz.status === 'published' || quiz.status === 'closed' ? quiz.status : 'draft',
  questions: Array.isArray(quiz.questions)
    ? quiz.questions.map((question) => ({
      id: safeText(question.id) || createId(),
      prompt: safeText(question.prompt),
      options: Array.isArray(question.options)
        ? question.options.map((option) => safeText(option))
        : ['', '', '', ''],
      correctOption: Number.isFinite(question.correctOption) ? Number(question.correctOption) : 0,
      points: Number.isFinite(question.points) ? Number(question.points) : 1,
    }))
    : [],
  totalPoints: Number.isFinite(quiz.totalPoints)
    ? Number(quiz.totalPoints)
    : (Array.isArray(quiz.questions) ? quiz.questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0) : 0),
  createdAt: safeText(quiz.createdAt) || new Date().toISOString(),
  updatedAt: safeText(quiz.updatedAt) || safeText(quiz.createdAt) || new Date().toISOString(),
})

const normalizeQuizPayload = (input: CreateQuizInput) => ({
  ...input,
  title: input.title.trim(),
  subjectId: input.subjectId?.trim() || undefined,
  subject: input.subject.trim(),
  className: input.className.trim(),
  description: input.description?.trim() ?? '',
  deadlineAt: input.deadlineAt || undefined,
  questions: input.questions.map((question) => ({
    prompt: question.prompt.trim(),
    options: question.options.map((option) => option.trim()),
    correctOption: question.correctOption,
    points: question.points,
  })),
})

const loadFallbackState = (): Pick<QuizState, 'quizzes' | 'attempts'> => {
  if (!ENABLE_LOCAL_FALLBACK) {
    return { quizzes: [], attempts: [] }
  }
  try {
    const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY)
    if (!raw) return { quizzes: [], attempts: [] }
    const parsed = JSON.parse(raw) as { quizzes?: Quiz[]; attempts?: QuizAttempt[] }
    return {
      quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    }
  } catch {
    return { quizzes: [], attempts: [] }
  }
}

const saveFallbackState = (quizzes: Quiz[], attempts: QuizAttempt[]) => {
  if (!ENABLE_LOCAL_FALLBACK) return
  try {
    window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify({ quizzes, attempts }))
  } catch {
    // ignore storage errors
  }
}

const initialFallbackState = typeof window !== 'undefined'
  ? loadFallbackState()
  : { quizzes: [], attempts: [] }

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: initialFallbackState.quizzes,
  attempts: initialFallbackState.attempts,
  loading: false,

  fetchQuizzes: async () => {
    set({ loading: true })
    try {
      const res = await quizAPI.getAll()
      const quizzes = Array.isArray(res.data.quizzes)
        ? res.data.quizzes
          .filter((quiz: Partial<Quiz> & { id?: string }) => Boolean(quiz?.id))
          .map((quiz: Partial<Quiz> & { id: string }) => normalizeQuiz(quiz))
        : []
      set((state) => {
        saveFallbackState(quizzes, state.attempts)
        return { quizzes }
      })
    } catch {
      if (!ENABLE_LOCAL_FALLBACK) throw new Error('Failed to load quizzes from server')
      // keep fallback/local quizzes in development
    } finally {
      set({ loading: false })
    }
  },

  fetchAttempts: async () => {
    set({ loading: true })
    try {
      const res = await quizAPI.getAttempts()
      const attempts = res.data.attempts ?? []
      set((state) => {
        saveFallbackState(state.quizzes, attempts)
        return { attempts }
      })
    } catch {
      if (!ENABLE_LOCAL_FALLBACK) throw new Error('Failed to load quiz attempts from server')
      // keep fallback/local attempts in development
    } finally {
      set({ loading: false })
    }
  },

  createQuiz: async (input) => {
    try {
      const res = await quizAPI.create(normalizeQuizPayload(input))
      const quiz = res.data.quiz as Quiz
      set((state) => {
        const quizzes = [quiz, ...state.quizzes]
        saveFallbackState(quizzes, state.attempts)
        return { quizzes }
      })
      return quiz
    } catch {
      if (!ENABLE_LOCAL_FALLBACK) throw new Error('Failed to create quiz')
      const now = new Date().toISOString()
      const quiz: Quiz = {
        id: createId(),
        ...normalizeQuizPayload(input),
        questions: input.questions,
        totalPoints: input.questions.reduce((sum, question) => sum + question.points, 0),
        createdAt: now,
        updatedAt: now,
      }
      set((state) => {
        const quizzes = [quiz, ...state.quizzes]
        saveFallbackState(quizzes, state.attempts)
        return { quizzes }
      })
      return quiz
    }
  },

  updateQuiz: async (id, input) => {
    try {
      const res = await quizAPI.update(id, normalizeQuizPayload(input))
      const quiz = res.data.quiz as Quiz
      set((state) => {
        const quizzes = state.quizzes.map((item) => (item.id === id ? quiz : item))
        saveFallbackState(quizzes, state.attempts)
        return { quizzes }
      })
      return quiz
    } catch {
      if (!ENABLE_LOCAL_FALLBACK) throw new Error('Failed to update quiz')
      const existing = get().quizzes.find((item) => item.id === id)
      const quiz: Quiz = {
        id,
        ...normalizeQuizPayload(input),
        questions: input.questions,
        totalPoints: input.questions.reduce((sum, question) => sum + question.points, 0),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set((state) => {
        const quizzes = state.quizzes.map((item) => (item.id === id ? quiz : item))
        saveFallbackState(quizzes, state.attempts)
        return { quizzes }
      })
      return quiz
    }
  },

  deleteQuiz: async (id) => {
    try {
      await quizAPI.delete(id)
    } catch {
      if (!ENABLE_LOCAL_FALLBACK) throw new Error('Failed to delete quiz')
      // fallback delete locally
    }
    set((state) => {
      const quizzes = state.quizzes.filter((quiz) => quiz.id !== id)
      const attempts = state.attempts.filter((attempt) => attempt.quizId !== id)
      saveFallbackState(quizzes, attempts)
      return { quizzes, attempts }
    })
  },

  submitQuiz: async (input) => {
    try {
      const res = await quizAPI.submitAttempt(input.quizId, { answers: input.answers })
      const attempt = res.data.attempt as QuizAttempt
      set((state) => {
        const attempts = [
          attempt,
          ...state.attempts.filter((item) => !(item.quizId === input.quizId && item.studentId === input.studentId)),
        ]
        saveFallbackState(state.quizzes, attempts)
        return { attempts }
      })

      if (!get().quizzes.find((quiz) => quiz.id === input.quizId)) {
        await get().fetchQuizzes()
      }

      return attempt
    } catch {
      if (!ENABLE_LOCAL_FALLBACK) throw new Error('Failed to submit quiz')
      const quiz = get().quizzes.find((item) => item.id === input.quizId)
      if (!quiz) {
        throw new Error('Quiz not found')
      }
      const score = quiz.questions.reduce((sum, question, index) => (
        input.answers[index] === question.correctOption ? sum + question.points : sum
      ), 0)
      const attempt: QuizAttempt = {
        id: createId(),
        ...input,
        score,
        totalPoints: quiz.totalPoints,
        submittedAt: new Date().toISOString(),
      }
      set((state) => {
        const attempts = [
          attempt,
          ...state.attempts.filter((item) => !(item.quizId === input.quizId && item.studentId === input.studentId)),
        ]
        saveFallbackState(state.quizzes, attempts)
        return { attempts }
      })
      return attempt
    }
  },
}))
