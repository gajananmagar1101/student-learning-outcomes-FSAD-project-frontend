import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { BookPlus, ChevronDown, Layers3, LoaderCircle, Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { subjectAPI, yearAPI } from '@/lib/services'
import { useUIStore } from '@/store/useUIStore'
import type { SubjectOption, YearOption } from '@/types'

interface SubjectFormValues {
  names: string
  yearId: string
}

const parseSubjectNames = (value: string) =>
  [...new Set(
    value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  )]

const yearSortOrder = (code?: string | null) => {
  switch (code?.trim().toUpperCase()) {
    case 'FE':
      return 1
    case 'SE':
      return 2
    case 'TE':
      return 3
    case 'BE':
      return 4
    default:
      return Number.MAX_SAFE_INTEGER
  }
}

export function Subjects() {
  const addToast = useUIStore((state) => state.addToast)
  const [years, setYears] = useState<YearOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectOption | null>(null)
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    defaultValues: {
      names: '',
      yearId: '',
    },
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [yearsRes, subjectsRes] = await Promise.all([
          yearAPI.getAll(),
          subjectAPI.getAll(),
        ])
        const nextYears = [...(yearsRes.data.years ?? [])].sort(
          (left, right) => yearSortOrder(left.code) - yearSortOrder(right.code) || left.name.localeCompare(right.name)
        )
        setYears(nextYears)
        setSubjects(subjectsRes.data.subjects ?? [])
      } catch (error) {
        console.error('[Subjects] Failed to load subject data:', error)
        addToast('Failed to load subject data', 'error')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [addToast])

  const onSubmit = handleSubmit(async (values) => {
    const subjectNames = parseSubjectNames(values.names)
    if (subjectNames.length === 0) {
      addToast('Enter at least one subject name', 'error')
      return
    }

    setSubmitting(true)
    try {
      const results = await Promise.allSettled(
        subjectNames.map((name) => subjectAPI.create({
          name,
          yearId: values.yearId,
        }))
      )

      const createdSubjects = results
        .flatMap((result) => result.status === 'fulfilled' ? [result.value.data.subject as SubjectOption] : [])
      const createdCount = createdSubjects.length

      const failures = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => (
          (result.reason as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Failed to add subject'
        ))

      reset()
      if (createdSubjects.length > 0) {
        setSubjects((current) => [...current, ...createdSubjects])
      }
      if (createdCount > 0) {
        addToast(
          createdCount === 1
            ? 'Subject added successfully'
            : `${createdCount} subjects added successfully`,
          'success'
        )
      }
      if (failures.length > 0) {
        addToast(failures[0], 'error')
      }
    } catch (error) {
      console.error('[Subjects] Failed to create subject:', error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to add subject'
      addToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const subjectsByYear = years.map((year) => ({
    year,
    subjects: subjects
      .filter((subject) => subject.yearId === year.id)
      .sort((left, right) => left.name.localeCompare(right.name)),
  }))

  const sortedYears = [...years].sort(
    (left, right) => yearSortOrder(left.code) - yearSortOrder(right.code) || left.name.localeCompare(right.name)
  )

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return

    setDeletingSubjectId(subjectToDelete.id)
    try {
      await subjectAPI.delete(subjectToDelete.id)
      setSubjects((current) => current.filter((subject) => subject.id !== subjectToDelete.id))
      addToast('Subject removed successfully', 'success')
      setSubjectToDelete(null)
    } catch (error) {
      console.error('[Subjects] Failed to delete subject:', error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to remove subject'
      addToast(message, 'error')
    } finally {
      setDeletingSubjectId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
        <GlassCard className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex rounded-2xl bg-indigo-500/10 p-2 text-indigo-600">
                <BookPlus size={18} />
              </div>
              <h2 className="text-lg font-semibold text-light-ink-primary dark:text-dark-ink-primary">Add Subject</h2>
              <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">
                Select a specific academic year and add all subjects for that year in one step.
              </p>
            </div>
            <Badge variant="info" label={`${years.length} years`} />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">
                Subject Names
              </label>
              <textarea
                {...register('names', { required: 'Enter at least one subject name.' })}
                placeholder={'Operating Systems\nDatabase Management Systems\nSoftware Engineering'}
                rows={5}
                className="form-input resize-none"
              />
              <p className="mt-1 text-xs text-light-ink-muted dark:text-dark-ink-muted">
                Add one subject per line, or separate multiple subjects with commas.
              </p>
              {errors.names && <p className="mt-1 text-xs text-red-400">{errors.names.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-light-ink-muted dark:text-dark-ink-muted">
                Academic Year
              </label>
              <select
                {...register('yearId', { required: 'Academic year is required.' })}
                className="form-input"
                disabled={loading}
              >
                <option value="">{loading ? 'Loading years...' : 'Select year'}</option>
                {sortedYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
              {errors.yearId && <p className="mt-1 text-xs text-red-400">{errors.yearId.message}</p>}
            </div>

            <button type="submit" className="btn-primary justify-center" disabled={submitting || loading}>
              {submitting ? <LoaderCircle size={15} className="animate-spin" /> : <BookPlus size={15} />}
              {submitting ? 'Saving...' : 'Add Subject'}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-light-border px-5 py-4 dark:border-dark-border">
            <div>
              <h2 className="text-lg font-semibold text-light-ink-primary dark:text-dark-ink-primary">Year-wise Subjects</h2>
              <p className="mt-1 text-sm text-light-ink-muted dark:text-dark-ink-muted">
                Expand a year to view the subjects assigned to that cohort.
              </p>
            </div>
            <Badge variant="success" label={`${subjects.length} subjects`} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-light-ink-muted dark:text-dark-ink-muted">
              <LoaderCircle size={16} className="animate-spin" />
              Loading subjects...
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {subjectsByYear.map(({ year, subjects: yearSubjects }) => (
                <details
                  key={year.id}
                  open={yearSubjects.length > 0}
                  className="group overflow-hidden rounded-2xl border border-light-border bg-light-card2/40 dark:border-dark-border dark:bg-dark-card2/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-light-ink-primary dark:text-dark-ink-primary">{year.name}</p>
                      <p className="mt-0.5 text-xs text-light-ink-muted dark:text-dark-ink-muted">
                        {yearSubjects.length} subject{yearSubjects.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <ChevronDown size={16} className="text-light-ink-muted transition-transform group-open:rotate-180 dark:text-dark-ink-muted" />
                  </summary>

                  <div className="border-t border-light-border px-4 py-3 dark:border-dark-border">
                    {yearSubjects.length === 0 ? (
                      <p className="text-sm text-light-ink-muted dark:text-dark-ink-muted">No subjects added for this year yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {yearSubjects.map((subject) => (
                          <div
                            key={subject.id}
                            className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
                          >
                            <Layers3 size={14} />
                            <span>{subject.name}</span>
                            <button
                              type="button"
                              onClick={() => setSubjectToDelete(subject)}
                              className="rounded-full p-1 text-sky-700/70 transition hover:bg-red-500/10 hover:text-red-500 dark:text-sky-200/80"
                              title={`Remove ${subject.name}`}
                              aria-label={`Remove ${subject.name}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <Modal
        open={Boolean(subjectToDelete)}
        onClose={() => deletingSubjectId ? null : setSubjectToDelete(null)}
        title="Remove Subject"
      >
        <div className="space-y-4">
          <p className="text-sm text-light-ink-secondary dark:text-dark-ink-secondary">
            Are you sure you want to remove <span className="font-semibold">{subjectToDelete?.name}</span> from{' '}
            <span className="font-semibold">{years.find((year) => year.id === subjectToDelete?.yearId)?.name ?? 'this year'}</span>?
          </p>
          <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-600">
            This action cannot be undone. This will also remove related assignments, submissions, quizzes, attempts, and assessments linked to this subject.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSubjectToDelete(null)}
              className="btn-ghost"
              disabled={Boolean(deletingSubjectId)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSubject}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={Boolean(deletingSubjectId)}
            >
              {deletingSubjectId ? 'Removing...' : 'Confirm Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
