export const btechYearOptions = [
  { value: 'FE', label: 'First Year B.Tech' },
  { value: 'SE', label: 'Second Year B.Tech' },
  { value: 'TE', label: 'Third Year B.Tech' },
  { value: 'BE', label: 'Final Year B.Tech' },
]

const legacyYearMap: Record<string, string> = {
  '1': 'FE',
  '2': 'FE',
  '3': 'FE',
  '4': 'SE',
  '5': 'SE',
  '6': 'SE',
  '7': 'TE',
  '8': 'TE',
  '9': 'TE',
  '10': 'BE',
  '11': 'BE',
  '12': 'BE',
}

export const normalizeAcademicYear = (value?: string) => {
  const normalized = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/b\.?tech/g, '')
    .replace(/standard/g, '')
    .replace(/class/g, '')
    .replace(/grade/g, '')
    .replace(/year/g, '')
    .replace(/\s+/g, '')

  if (!normalized) return ''
  if (normalized === 'fe' || normalized === 'first' || normalized === 'firstyear') return 'FE'
  if (normalized === 'se' || normalized === 'second' || normalized === 'secondyear') return 'SE'
  if (normalized === 'te' || normalized === 'third' || normalized === 'thirdyear') return 'TE'
  if (normalized === 'be' || normalized === 'final' || normalized === 'finalyear' || normalized === 'fourth' || normalized === 'fourthyear') return 'BE'
  return legacyYearMap[normalized] ?? normalized.toUpperCase()
}

export const formatAcademicYearLabel = (value?: string) => {
  const normalized = normalizeAcademicYear(value)
  return btechYearOptions.find((option) => option.value === normalized)?.label ?? 'Unassigned'
}

export const academicYearSortValue = (value?: string) => {
  const normalized = normalizeAcademicYear(value)
  return btechYearOptions.findIndex((option) => option.value === normalized)
}
