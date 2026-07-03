import { ref, computed } from 'vue'
import { ADMIN_ROLES } from '@/utils/constants'

/**
 * usePayrollApi
 * ──────────────
 * Encapsulates every network call the Payroll module makes.
 * Nothing about the endpoints, methods, payloads, or response
 * parsing has changed from the original component — this is a
 * straight extraction so the UI components don't need to know
 * about `fetch`, auth headers, or the `/payroll` prefix at all.
 */
export function usePayrollApi() {
  const apiBase = process.env.VUE_APP_BASE_API

  const authHeader = () => {
    const t = localStorage.getItem('token')
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  /**
   * All payroll routes share the /payroll prefix.
   * path examples:
   *   ''                 → GET  /payroll          (index)
   *   '/generate'        → POST /payroll/generate
   *   '/123'             → GET  /payroll/123      (show)
   *   '/123/mark-paid'   → POST /payroll/123/mark-paid
   *   '/123'             → DELETE /payroll/123
   */
  const apiFetch = async (path, options = {}) => {
    const res = await fetch(`${apiBase}/payroll${path}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers ?? {}) }
    })
    const json = await res.json()
    if (!res.ok) throw json
    return json
  }

  /* ── Current user / admin check ─────────────────────── */
  const currentUser = ref(null)

  const isAdmin = computed(() => {
    const roles = currentUser.value?.roles ?? []
    return roles
      .map(r => (typeof r === 'object' ? r?.name ?? '' : r).toLowerCase())
      .some(r => ADMIN_ROLES.includes(r))
  })

  const loadCurrentUser = async () => {
    try {
      const res  = await fetch(`${apiBase}/user`, { headers: authHeader() })
      const data = await res.json()
      currentUser.value = data.user ?? data
    } catch { /* ignore */ }
  }

  /* ── Companies ───────────────────────────────────────── */
  const companies        = ref([])
  const companiesLoading = ref(false)

  const loadCompanies = async () => {
    companiesLoading.value = true
    try {
      const res  = await fetch(`${apiBase}/system/companies`, { headers: authHeader() })
      const data = await res.json()
      // Response shape: { companies: [{ value, label }] }
      companies.value = data.companies ?? []
    } catch { /* ignore — list stays empty */ }
    finally { companiesLoading.value = false }
  }

  /* ── Payrolls ────────────────────────────────────────── */
  const fetchPayrolls = async () => {
    // GET /payroll
    const data = await apiFetch('')
    return data.data?.data ?? data.data ?? []
  }

  const fetchPayrollDetail = async (id) => {
    // GET /payroll/{id}
    const data = await apiFetch(`/${id}`)
    return data.data
  }

  const generatePayroll = async (payload) => {
    // POST /payroll/generate
    return apiFetch('/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
  }

  const markPayrollPaid = async (id) => {
    // POST /payroll/{id}/mark-paid
    return apiFetch(`/${id}/mark-paid`, { method: 'POST' })
  }

  const deletePayrollRecord = async (id) => {
    // DELETE /payroll/{id}
    return apiFetch(`/${id}`, { method: 'DELETE' })
  }

  return {
    currentUser,
    isAdmin,
    loadCurrentUser,
    companies,
    companiesLoading,
    loadCompanies,
    fetchPayrolls,
    fetchPayrollDetail,
    generatePayroll,
    markPayrollPaid,
    deletePayrollRecord
  }
}
