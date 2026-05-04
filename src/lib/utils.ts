import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const RESERVED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'fake.com',
  'invalid.com',
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'yopmail.com',
  'sharklasers.com',
  '10minutemail.com',
])

const PLACEHOLDER_EMAIL_LOCALS = new Set([
  'test',
  'testing',
  'fake',
  'demo',
  'sample',
  'asdf',
  'qwerty',
  'abc',
  'temp',
  'user',
  'username',
  'unknown',
  'none',
  'na',
])

export function isRealisticEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized || normalized.length > 254 || /\s/.test(normalized)) return false

  const parts = normalized.split('@')
  if (parts.length !== 2) return false

  const [localPart, domain] = parts
  if (!localPart || !domain || localPart.length > 64) return false
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return false
  if (!/^[a-z0-9._%+-]+$/i.test(localPart)) return false

  if (domain.length > 253 || !domain.includes('.') || domain.includes('..')) return false
  if (!/^[a-z0-9.-]+$/i.test(domain)) return false

  const labels = domain.split('.')
  if (labels.some((label) => !label || label.startsWith('-') || label.endsWith('-') || label.length > 63)) {
    return false
  }

  const tld = labels[labels.length - 1]
  if (!tld || !/^[a-z]{2,24}$/i.test(tld)) return false
  if (RESERVED_EMAIL_DOMAINS.has(domain)) return false
  if (PLACEHOLDER_EMAIL_LOCALS.has(localPart)) return false

  return true
}

export function getEmailValidationMessage() {
  return 'Enter a valid personal or school email address'
}
