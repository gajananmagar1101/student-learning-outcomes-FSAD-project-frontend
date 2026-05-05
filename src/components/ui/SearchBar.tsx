import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useStudentStore } from '@/store/useStudentStore'
import { useQuizStore } from '@/store/useQuizStore'
import { normalizeAcademicYear } from '@/lib/btech'
import { facultyRequestAPI, subjectAPI } from '@/lib/services'
import { isStaffRole } from '@/lib/roles'
import type { FacultyMember, SubjectOption } from '@/types'

type SearchResult = {
  label: string
  sub: string
  path: string
  kind: string
}

const includesQuery = (value: string, query: string) => value.toLowerCase().includes(query)

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loadingData, setLoadingData] = useState(false)
  const [faculty, setFaculty] = useState<FacultyMember[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const hasLoadedDataRef = useRef(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { assessments, fetchAssessments } = useAssessmentStore()
  const { adminAssignments, studentAssignments, submissions, fetchAdminAssignments, fetchStudentAssignments, fetchAdminSubmissions } = useAssignmentStore()
  const { students, fetchStudents } = useStudentStore()
  const { quizzes, attempts, fetchQuizzes, fetchAttempts } = useQuizStore()
  const normalizedQuery = query.toLowerCase().trim()
  const assignments = isStaffRole(user?.role) ? adminAssignments : studentAssignments

  const results: SearchResult[] = normalizedQuery.length > 1
    ? [
        ...assessments
          .filter((assessment) =>
            includesQuery(assessment.title, normalizedQuery) ||
            includesQuery(assessment.subject, normalizedQuery)
          )
          .slice(0, 4)
          .map((assessment) => ({
            label: assessment.title,
            sub: `${assessment.subject} · ${assessment.status}`,
            path: '/assessments',
            kind: 'Assessment',
          })),
        ...assignments
          .filter((assignment) =>
            includesQuery(assignment.title, normalizedQuery) ||
            includesQuery(assignment.subject, normalizedQuery) ||
            includesQuery(assignment.className, normalizedQuery) ||
            includesQuery(assignment.description, normalizedQuery)
          )
          .slice(0, 4)
          .map((assignment) => ({
            label: assignment.title,
            sub: `${assignment.subject} · ${assignment.className}`,
            path: '/assessments',
            kind: 'Assignment',
          })),
        ...subjects
          .filter((subject) =>
            includesQuery(subject.name, normalizedQuery) ||
            includesQuery(subject.yearName ?? '', normalizedQuery) ||
            includesQuery(subject.yearCode ?? '', normalizedQuery)
          )
          .slice(0, 4)
          .map((subject) => ({
            label: subject.name,
            sub: subject.yearName ?? subject.yearCode ?? 'Subject',
            path: '/subjects',
            kind: 'Subject',
          })),
        ...students
          .filter((student) =>
            includesQuery(student.name, normalizedQuery) ||
            includesQuery(student.email, normalizedQuery) ||
            includesQuery(student.grade, normalizedQuery)
          )
          .slice(0, 4)
          .map((student) => ({
            label: student.name,
            sub: `${student.email} · ${normalizeAcademicYear(student.grade) || student.grade}`,
            path: student._id
              ? `/students/profile/${student._id}?grade=${encodeURIComponent(normalizeAcademicYear(student.grade) || 'FE')}`
              : `/students/class?grade=${encodeURIComponent(normalizeAcademicYear(student.grade) || 'FE')}`,
            kind: 'Learner',
          })),
        ...faculty
          .filter((member) =>
            includesQuery(member.name, normalizedQuery) ||
            includesQuery(member.email, normalizedQuery)
          )
          .slice(0, 4)
          .map((member) => ({
            label: member.name,
            sub: member.email,
            path: '/faculty',
            kind: 'Faculty',
          })),
        ...quizzes
          .filter((quiz) =>
            includesQuery(quiz.title, normalizedQuery) ||
            includesQuery(quiz.subject, normalizedQuery) ||
            includesQuery(quiz.className, normalizedQuery) ||
            includesQuery(quiz.description, normalizedQuery)
          )
          .slice(0, 4)
          .map((quiz) => ({
            label: quiz.title,
            sub: `${quiz.subject} · ${quiz.status}`,
            path: '/quizzes',
            kind: 'Quiz',
          })),
        ...submissions
          .filter((submission) =>
            includesQuery(submission.assignmentTitle, normalizedQuery) ||
            includesQuery(submission.studentName, normalizedQuery) ||
            includesQuery(submission.studentEmail, normalizedQuery) ||
            includesQuery(submission.subject, normalizedQuery)
          )
          .slice(0, 4)
          .map((submission) => ({
            label: submission.assignmentTitle,
            sub: `${submission.studentName} · ${submission.subject}`,
            path: '/reports',
            kind: 'Submission',
          })),
        ...attempts
          .filter((attempt) =>
            includesQuery(attempt.studentName, normalizedQuery) ||
            includesQuery(attempt.studentEmail, normalizedQuery) ||
            includesQuery(attempt.className, normalizedQuery)
          )
          .slice(0, 4)
          .map((attempt) => ({
            label: attempt.studentName,
            sub: `${attempt.studentEmail} · Quiz attempt`,
            path: '/quizzes',
            kind: 'Attempt',
          })),
      ].slice(0, 16)
    : []

  const go = (path: string) => { navigate(path); setOpen(false); setQuery('') }

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    hasLoadedDataRef.current = false
    setFaculty([])
    setSubjects([])
  }, [user?.role])

  useEffect(() => {
    if (!open || hasLoadedDataRef.current) return

    let active = true

    const loadSearchData = async () => {
      setLoadingData(true)
      try {
        const tasks: Promise<unknown>[] = []

        if (assessments.length === 0) tasks.push(fetchAssessments())
        if (quizzes.length === 0) tasks.push(fetchQuizzes())
        if (attempts.length === 0) tasks.push(fetchAttempts())
        if (isStaffRole(user?.role) && students.length === 0) tasks.push(fetchStudents())
        if (isStaffRole(user?.role) && adminAssignments.length === 0) tasks.push(fetchAdminAssignments())
        if (user?.role === 'student' && studentAssignments.length === 0) tasks.push(fetchStudentAssignments())
        if (user?.role === 'admin' && submissions.length === 0) tasks.push(fetchAdminSubmissions())

        await Promise.allSettled(tasks)

        const [subjectResult, facultyResult] = await Promise.allSettled([
          subjectAPI.getAll(),
          user?.role === 'admin' ? facultyRequestAPI.getFaculty() : Promise.resolve({ data: { faculty: [] } }),
        ])

        if (!active) return

        setSubjects(subjectResult.status === 'fulfilled' ? (subjectResult.value.data.subjects ?? []) : [])
        setFaculty(facultyResult.status === 'fulfilled' ? (facultyResult.value.data.faculty ?? []) : [])
        hasLoadedDataRef.current = true
      } finally {
        if (active) {
          setLoadingData(false)
        }
      }
    }

    void loadSearchData()

    return () => {
      active = false
    }
  }, [
    adminAssignments.length,
    assessments.length,
    attempts.length,
    fetchAdminAssignments,
    fetchAdminSubmissions,
    fetchAssessments,
    fetchAttempts,
    fetchQuizzes,
    fetchStudentAssignments,
    fetchStudents,
    open,
    quizzes.length,
    studentAssignments.length,
    students.length,
    submissions.length,
    user?.role,
  ])

  return (
    <div ref={searchRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="apple-glass inline-flex h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 text-sm font-medium text-light-ink-secondary shadow-sm transition-colors hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15 md:hidden"
        aria-label="Open search"
      >
        <Search size={15} />
        Search
      </button>

      <div className="relative hidden md:block">
        <div className="flex h-[2.125rem] w-48 items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 text-light-ink-secondary shadow-sm transition-all focus-within:w-56 focus-within:border-slate-300 focus-within:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:focus-within:border-indigo-300/40 dark:focus-within:bg-white/15 lg:w-64 lg:focus-within:w-72">
          <Search size={14} className="shrink-0 text-light-ink-muted dark:text-slate-300" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false)
              if (event.key === 'Enter' && results[0]) go(results[0].path)
            }}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-[13px] font-normal outline-none placeholder:text-light-ink-muted dark:text-slate-100 dark:placeholder:text-slate-300"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setOpen(false)
              }}
              className="shrink-0 text-light-ink-muted transition-colors hover:text-light-ink-primary dark:text-slate-300 dark:hover:text-white"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {open && query.trim().length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-2xl border border-light-border bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-dark-border dark:bg-dark-card/95"
            >
              {results.length > 0 && (
                <div className="space-y-1">
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        go(r.path)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                    >
                      <span className="shrink-0 rounded-full bg-indigo-500/12 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">{r.kind}</span>
                      <div>
                        <p className="text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">{r.label}</p>
                        <p className="text-xs text-light-ink-muted dark:text-dark-ink-muted">{r.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.length === 0 && (
                <p className="py-5 text-center text-sm text-light-ink-muted dark:text-dark-ink-muted">No results found</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] overflow-y-auto bg-slate-950/50 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              className="mx-auto flex min-h-[18rem] w-full max-w-md flex-col overflow-hidden rounded-[1.8rem] border border-white/40 bg-white/96 shadow-2xl max-h-[calc(100dvh-env(safe-area-inset-top)-1.5rem)] dark:border-white/10 dark:bg-[#08111f]/96"
            >
              <div className="flex items-center gap-2 border-b border-light-border px-3 py-3 dark:border-dark-border">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-2 dark:border-white/15 dark:bg-white/10">
                  <Search size={16} className="shrink-0 text-light-ink-muted dark:text-slate-300" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setOpen(false)
                      if (event.key === 'Enter' && results[0]) go(results[0].path)
                    }}
                    placeholder="Search assignments, quizzes, learners..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-light-ink-muted dark:text-slate-100 dark:placeholder:text-slate-400"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="shrink-0 text-light-ink-muted dark:text-slate-300"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-2 py-1 text-sm font-medium text-light-ink-secondary dark:text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                {loadingData && query.trim().length <= 1 ? (
                  <p className="px-3 py-6 text-center text-sm text-light-ink-muted dark:text-dark-ink-muted">Preparing search...</p>
                ) : null}

                {query.trim().length > 1 ? (
                  results.length > 0 ? (
                    <div className="space-y-1">
                      {results.map((result, index) => (
                        <button
                          key={`${result.kind}-${result.path}-${index}`}
                          onClick={() => go(result.path)}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                        >
                          <span className="shrink-0 rounded-full bg-indigo-500/12 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">{result.kind}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-light-ink-primary dark:text-dark-ink-primary">{result.label}</p>
                            <p className="truncate text-xs text-light-ink-muted dark:text-dark-ink-muted">{result.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-6 text-center text-sm text-light-ink-muted dark:text-dark-ink-muted">No results found</p>
                  )
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-light-ink-muted dark:text-dark-ink-muted">Type at least 2 letters to search.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
