import { MONTHS, AVATAR_PALETTE } from './constants'

// All logic here is copied verbatim from the original component —
// only the location changed. No formatting/calculation behavior
// has been altered.

export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(Number(val) || 0)

export const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch {
    return iso
  }
}

export const monthName = (num) =>
  MONTHS.find(m => m.value === Number(num))?.label ?? num

export const initials = (name) =>
  (name ?? '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()

export const avatarBg = (name) => {
  if (!name) return AVATAR_PALETTE[0]
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]
}
