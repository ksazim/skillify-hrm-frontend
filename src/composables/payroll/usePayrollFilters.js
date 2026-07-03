import { ref, computed } from 'vue'
import { monthName } from '@/utils/formatters'

/**
 * usePayrollFilters
 * ──────────────────
 * All search / filter / pagination / grouping logic, unchanged
 * in behavior from the original component. Takes a reactive
 * `payrolls` ref (or computed) as input and exposes the derived
 * state a list view needs.
 */
export function usePayrollFilters(payrolls) {
  const searchQuery   = ref('')
  const statusFilter  = ref('all')
  const selectedMonth = ref('')
  const selectedYear  = ref('')
  const currentPage   = ref(1)
  const perPage       = 15

  const resetPage = () => { currentPage.value = 1 }

  /* ── Aggregate stats ──────────────────────────────────── */
  const totalGross = computed(() =>
    payrolls.value.reduce((s, p) => s + (Number(p.gross_salary) || 0), 0)
  )
  const totalNet = computed(() =>
    payrolls.value.reduce((s, p) => s + (Number(p.net_salary) || 0), 0)
  )
  const draftCount = computed(() =>
    payrolls.value.filter(p => p.status === 'draft').length
  )

  /* ── Status filter tabs ───────────────────────────────── */
  const statusFilters = computed(() => [
    { value: 'all',   label: 'All',   count: payrolls.value.length },
    { value: 'draft', label: 'Draft', count: payrolls.value.filter(p => p.status === 'draft').length },
    { value: 'paid',  label: 'Paid',  count: payrolls.value.filter(p => p.status === 'paid').length }
  ])

  /* ── Filtered & paginated list ────────────────────────── */
  const filteredPayrolls = computed(() => {
    let list = payrolls.value

    if (statusFilter.value !== 'all')
      list = list.filter(p => p.status === statusFilter.value)

    if (selectedMonth.value)
      list = list.filter(p => p.month === Number(selectedMonth.value))

    if (selectedYear.value)
      list = list.filter(p => p.year === Number(selectedYear.value))

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(p =>
        (p.employee?.user?.name ?? '').toLowerCase().includes(q) ||
        String(p.employee_id).includes(q)
      )
    }

    return list
  })

  const paginatedPayrolls = computed(() => {
    const start = (currentPage.value - 1) * perPage
    return filteredPayrolls.value.slice(start, start + perPage)
  })

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredPayrolls.value.length / perPage))
  )

  /* ── History grouped by period ────────────────────────── */
  const historyRows = computed(() => {
    const map = {}
    payrolls.value.forEach(p => {
      const key = `${monthName(p.month)} ${p.year}`
      if (!map[key]) map[key] = { period: key, count: 0, gross: 0, net: 0 }
      map[key].count++
      map[key].gross += Number(p.gross_salary) || 0
      map[key].net   += Number(p.net_salary)   || 0
    })
    return Object.values(map).reverse()
  })

  return {
    searchQuery,
    statusFilter,
    selectedMonth,
    selectedYear,
    currentPage,
    resetPage,
    totalGross,
    totalNet,
    draftCount,
    statusFilters,
    filteredPayrolls,
    paginatedPayrolls,
    totalPages,
    historyRows
  }
}
