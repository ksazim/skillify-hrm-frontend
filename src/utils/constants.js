// ─────────────────────────────────────────────────────────
// Static, reusable lookup data for the Payroll module.
// Pulling these out of the component means every file that
// needs "months" or "years" imports one source of truth
// instead of re-declaring the array.
// ─────────────────────────────────────────────────────────

export const MONTHS = [
  { value: 1,  label: 'January'   }, { value: 2,  label: 'February'  },
  { value: 3,  label: 'March'     }, { value: 4,  label: 'April'     },
  { value: 5,  label: 'May'       }, { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      }, { value: 8,  label: 'August'    },
  { value: 9,  label: 'September' }, { value: 10, label: 'October'   },
  { value: 11, label: 'November'  }, { value: 12, label: 'December'  }
]

const now = new Date()
export const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)
export const CURRENT_MONTH = now.getMonth() + 1
export const CURRENT_YEAR  = now.getFullYear()

// Light-theme-friendly avatar colors — saturated enough to
// keep white initials readable, but not neon.
export const AVATAR_PALETTE = [
  '#6366F1', '#059669', '#2563EB', '#7C3AED',
  '#DB2777', '#0891B2', '#D97706', '#DC2626'
]

// Roles allowed to run payroll / mark paid / delete records.
export const ADMIN_ROLES = ['admin', 'hr', 'super administrator', 'super_admin']
