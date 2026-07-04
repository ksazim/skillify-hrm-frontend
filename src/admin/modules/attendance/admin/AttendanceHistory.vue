<template>
  <CrudLayout ref="layoutRef" title="Attendance Records"
    subtitle="Browse and filter complete employee attendance history" :breadcrumbs="breadcrumbs" :stats="pageStats"
    :loading="isLoading" loading-message="Loading attendance records" :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Records" :has-data="!!allRecords.length" :notification="notification"
    @retry="applyFilters">

    <!-- ── Icon ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    </template>

    <!-- ── Filters ── -->
    <template #filters>
      <div class="sf-filters">

        <!-- Row 1 -->
        <div class="sf-row">
          <div class="sf-field">
            <label class="sf-label">From</label>
            <input v-model="filters.from" type="date" class="sf-input sf-input--date" />
          </div>
          <div class="sf-field">
            <label class="sf-label">To</label>
            <input v-model="filters.to" type="date" class="sf-input sf-input--date" />
          </div>
          <div class="sf-field">
            <label class="sf-label">Company</label>
            <div class="sf-select-wrap">
              <select v-model="filters.company_id" class="sf-select" @change="onCompanyChange">
                <option value="">All Companies</option>
                <option v-for="c in companies" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
              <svg class="sf-arrow" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>
          <div class="sf-field">
            <label class="sf-label">Department</label>
            <div class="sf-select-wrap">
              <select v-model="filters.department" class="sf-select">
                <option value="">All Departments</option>
                <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
              </select>
              <svg class="sf-arrow" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Row 2 -->
        <div class="sf-row">
          <div class="sf-field">
            <label class="sf-label">Employee ID</label>
            <div class="sf-input-wrap">
              <svg class="sf-input-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <input v-model="filters.employee_id" type="text" class="sf-input" placeholder="e.g. 42"
                @keydown.enter="applyFilters" />
            </div>
          </div>
          <div class="sf-field">
            <label class="sf-label">Status</label>
            <div class="sf-select-wrap">
              <select v-model="filters.status" class="sf-select">
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="leave">On Leave</option>
                <option value="half_day">Half Day</option>
              </select>
              <svg class="sf-arrow" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>
          <div class="sf-field sf-field--grow">
            <label class="sf-label">Search Name</label>
            <div class="sf-input-wrap">
              <svg class="sf-input-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input v-model="filters.search" type="text" class="sf-input" placeholder="Search by employee name…" />
            </div>
          </div>
          <div class="sf-field sf-field--actions">
            <label class="sf-label">&nbsp;</label>
            <div class="sf-btn-group">
              <button class="sf-btn sf-btn--primary" @click="applyFilters" :disabled="isLoading">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                Search
              </button>
              <button class="sf-btn sf-btn--ghost" @click="resetFilters" :disabled="isLoading">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- ── Active chips ── -->
    <div v-if="activeChips.length" class="chip-row">
      <span class="chip-label">Filters:</span>
      <span v-for="chip in activeChips" :key="chip.key" class="chip">
        {{ chip.label }}
        <button class="chip-remove" @click="removeChip(chip.key)">×</button>
      </span>
    </div>

    <!-- ── Result meta ── -->
    <div class="result-meta">
      <span class="result-count">{{ meta.total ? meta.total + ' records' : visibleRecords.length + ' records' }}</span>
      <span v-if="meta.last_page > 1" class="result-pages">Page {{ meta.current_page }} / {{ meta.last_page }}</span>
    </div>

    <!-- ── Table ── -->
    <div class="summary-table-card">
      <div class="summary-table-wrapper">
        <table class="summary-table">
          <thead>
            <tr>
              <th style="width:46px">#</th>
              <th style="width:100px">Date</th>
              <th style="width:50px; text-align:center">EID</th>
              <th style="width:190px">Employee</th>
              <th style="width:130px">Department</th>
              <th style="width:105px">Check In</th>
              <th style="width:105px">Check Out</th>
              <th style="width:78px">Hours</th>
              <th style="width:100px; text-align:center">Status</th>
              <th style="width:80px">OT</th>
            </tr>
          </thead>
          <tbody>

            <tr v-if="!visibleRecords.length && !isLoading">
              <td colspan="10">
                <div class="empty-state">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                  <p>No records found. Try adjusting your filters.</p>
                </div>
              </td>
            </tr>

            <template v-for="(group, date) in groupedByDate" :key="date">
              <tr class="date-group-row">
                <td colspan="10">
                  <div class="date-group-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                    </svg>
                    {{ formatDateHeading(date) }}
                    <span class="date-group-count">{{ group.length }} employees</span>
                  </div>
                </td>
              </tr>
              <tr v-for="(rec, idx) in group" :key="rec.id" class="summary-row">
                <td class="cell-dim">{{ idx + 1 }}</td>
                <td><span class="date-value">{{ formatDateShort(rec.date) }}</span></td>
                <td class="cell-id">{{ rec.employee_id }}</td>
                <td>
                  <div class="emp-cell">
                    <div class="emp-avatar">{{ initials(rec.employee?.user?.name) }}</div>
                    <div class="emp-info">
                      <span class="emp-name">{{ rec.employee?.user?.name || '—' }}</span>
                    </div>
                  </div>
                </td>
                <td class="cell-muted">{{ rec.employee?.department || '—' }}</td>
                <td><span class="time-value">{{ formatTime(rec.check_in) }}</span></td>
                <td><span class="time-value">{{ formatTime(rec.check_out) }}</span></td>
                <td><span class="hours-value">{{ calcHours(rec.check_in, rec.check_out) }}</span></td>
                <td style="text-align:center">
                  <span :class="['status-badge', `status-badge--${rec.status || 'absent'}`]">
                    {{ rec.status || 'absent' }}
                  </span>
                </td>
                <td>
                  <span v-if="rec.overtime_minutes" class="ot-value">{{ fmtMinutes(rec.overtime_minutes) }}</span>
                  <span v-else class="cell-dim">—</span>
                </td>
              </tr>
            </template>

          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Pagination ── -->
    <template #pagination>
      <div class="sf-pagination">
        <div class="sf-page-size">
          <span class="sf-pg-label">Rows per page</span>
          <div class="sf-select-wrap sf-select-wrap--sm">
            <select v-model="perPage" class="sf-select sf-select--sm" @change="applyFilters">
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <svg class="sf-arrow" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
        <div class="sf-pg-controls">
          <button class="sf-pg-btn" :disabled="meta.current_page <= 1" @click="goPage(1)">«</button>
          <button class="sf-pg-btn" :disabled="meta.current_page <= 1" @click="goPage(meta.current_page - 1)">‹</button>
          <button v-for="p in visiblePageNumbers" :key="p" class="sf-pg-btn"
            :class="{ 'sf-pg-btn--active': p === meta.current_page, 'sf-pg-btn--ellipsis': p === '…' }"
            :disabled="p === '…'" @click="p !== '…' && goPage(p)">{{ p }}</button>
          <button class="sf-pg-btn" :disabled="meta.current_page >= meta.last_page"
            @click="goPage(meta.current_page + 1)">›</button>
          <button class="sf-pg-btn" :disabled="meta.current_page >= meta.last_page"
            @click="goPage(meta.last_page)">»</button>
        </div>
        <span class="sf-pg-info">{{ meta.from }}–{{ meta.to }} of {{ meta.total }}</span>
      </div>
    </template>

  </CrudLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import CrudLayout from '../../components/CrudLayout.vue'

const baseApi = process.env.VUE_APP_BASE_API
const layoutRef = ref(null)

// ── Auth ──────────────────────────────────────────────────────────────────────
const authHeaders = (extra = {}) => {
  const token = localStorage.getItem('token')
    || localStorage.getItem('token')
    || localStorage.getItem('token')
    || sessionStorage.getItem('token') || ''
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

// ── State ─────────────────────────────────────────────────────────────────────
const companies = ref([])
const departments = ref([])
const allRecords = ref([])
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })
const perPage = ref(25)

const meta = ref({ current_page: 1, last_page: 1, total: 0, per_page: 25, from: 0, to: 0 })

const filters = ref({
  from: '', to: '', employee_id: '',
  status: '', company_id: '', department: '', search: '',
})

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Attendance Records' },
]

// ── Notify ────────────────────────────────────────────────────────────────────
const notify = (type, message, opts = {}) => {
  const { title = '', autoClose = 3000 } = opts
  if (layoutRef.value?.showBanner) {
    layoutRef.value.showBanner(type, message, { title, autoClose }); return
  }
  notification.value = { show: false, type, title, message, autoClose }
  setTimeout(() => { notification.value = { show: true, type, title, message, autoClose } }, 0)
}

// ── API ───────────────────────────────────────────────────────────────────────
const loadCompanies = async () => {
  try {
    const res = await fetch(`${baseApi}/system/companies`, { headers: authHeaders() })
    const data = await res.json()
    companies.value = data.companies ?? []
  } catch { notify('warning', 'Could not load company list.') }
}

const fetchRecords = async (page = 1) => {
  isLoading.value = true
  hasError.value = false
  try {
    const params = new URLSearchParams({ page, per_page: perPage.value })
    if (filters.value.employee_id) params.set('employee_id', filters.value.employee_id)
    if (filters.value.from) params.set('from', filters.value.from)
    if (filters.value.to) params.set('to', filters.value.to)
    if (filters.value.status) params.set('status', filters.value.status)
    if (filters.value.company_id) params.set('company_id', filters.value.company_id)
    if (filters.value.department) params.set('department', filters.value.department)

    const res = await fetch(`${baseApi}/attendance/admin/summaries?${params}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    allRecords.value = data.data ?? (Array.isArray(data) ? data : [])
    meta.value = {
      current_page: data.current_page ?? 1,
      last_page: data.last_page ?? 1,
      total: data.total ?? allRecords.value.length,
      per_page: data.per_page ?? perPage.value,
      from: data.from ?? 1,
      to: data.to ?? allRecords.value.length,
    }

    // Derive department list from loaded records for the dropdown
    const depts = [...new Set(allRecords.value.map(r => r.employee?.department).filter(Boolean))].sort()
    if (depts.length) departments.value = depts

  } catch (e) {
    hasError.value = true
    errorMessage.value = e.message || 'Failed to load records.'
    notify('error', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const applyFilters = () => fetchRecords(1)

const resetFilters = () => {
  const today = new Date()
  const prior = new Date(); prior.setDate(prior.getDate() - 30)
  filters.value = {
    from: prior.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
    employee_id: '', status: '', company_id: '', department: '', search: '',
  }
  fetchRecords(1)
}

const onCompanyChange = () => {
  filters.value.department = ''
  fetchRecords(1)
}

const goPage = (p) => {
  if (p < 1 || p > meta.value.last_page) return
  fetchRecords(p)
}

// ── Client-side name search (only filter not handled server-side) ─────────────
const visibleRecords = computed(() => {
  if (!filters.value.search) return allRecords.value
  const q = filters.value.search.toLowerCase()
  return allRecords.value.filter(r => (r.employee?.user?.name || '').toLowerCase().includes(q))
})

// ── Group records by date descending (server already ordered by date desc) ────
const groupedByDate = computed(() => {
  const groups = {}
  for (const rec of visibleRecords.value) {
    const d = rec.date?.slice(0, 10) ?? 'Unknown'
    if (!groups[d]) groups[d] = []
    groups[d].push(rec)
  }
  return groups
})

// ── Stats ─────────────────────────────────────────────────────────────────────
const pageStats = computed(() => {
  const d = allRecords.value
  return [
    { label: 'Total', value: meta.value.total || d.length },
    { label: 'Present', value: d.filter(r => r.status === 'present').length },
    { label: 'Absent', value: d.filter(r => !r.status || r.status === 'absent').length },
    { label: 'Late', value: d.filter(r => r.status === 'late').length },
  ]
})

// ── Active chips ──────────────────────────────────────────────────────────────
const activeChips = computed(() => {
  const chips = []
  if (filters.value.from || filters.value.to)
    chips.push({ key: 'dates', label: `${filters.value.from || '…'} → ${filters.value.to || '…'}` })
  if (filters.value.employee_id)
    chips.push({ key: 'employee_id', label: `ID: ${filters.value.employee_id}` })
  if (filters.value.status)
    chips.push({ key: 'status', label: filters.value.status })
  if (filters.value.company_id) {
    const c = companies.value.find(x => String(x.value) === String(filters.value.company_id))
    chips.push({ key: 'company_id', label: c?.label ?? `Company ${filters.value.company_id}` })
  }
  if (filters.value.department)
    chips.push({ key: 'department', label: filters.value.department })
  if (filters.value.search)
    chips.push({ key: 'search', label: `"${filters.value.search}"` })
  return chips
})

const removeChip = (key) => {
  if (key === 'dates') { filters.value.from = ''; filters.value.to = '' }
  else filters.value[key] = ''
  if (key !== 'search') fetchRecords(1)
}

// ── Page number buttons ───────────────────────────────────────────────────────
const visiblePageNumbers = computed(() => {
  const total = meta.value.last_page
  const cur = meta.value.current_page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, cur, cur - 1, cur + 1].filter(p => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  const result = []; let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) result.push('…')
    result.push(p); prev = p
  }
  return result
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDateHeading = (d) => {
  if (!d || d === 'Unknown') return 'Unknown Date'
  try {
    const dt = new Date(d + 'T00:00:00')
    const todayStr = new Date().toISOString().slice(0, 10)
    const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const label = dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (d === todayStr) return `Today — ${label}`
    if (d === yestStr) return `Yesterday — ${label}`
    return label
  } catch { return d }
}

const formatDateShort = (d) => {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }
  catch { return d }
}

const formatTime = (t) => {
  if (!t) return '—'
  try {
    const [h, m] = t.split(':')
    const dt = new Date(); dt.setHours(+h, +m)
    return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return t }
}

const calcHours = (cin, cout) => {
  if (!cin || !cout) return '—'
  try {
    const [h1, m1] = cin.split(':').map(Number)
    const [h2, m2] = cout.split(':').map(Number)
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (diff <= 0) return '—'
    return `${Math.floor(diff / 60)}h ${String(diff % 60).padStart(2, '0')}m`
  } catch { return '—' }
}

const fmtMinutes = (mins) => {
  if (!mins) return '—'
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
}

const initials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  const today = new Date()
  const prior = new Date(); prior.setDate(prior.getDate() - 30)
  filters.value.to = today.toISOString().slice(0, 10)
  filters.value.from = prior.toISOString().slice(0, 10)
  loadCompanies()
  fetchRecords(1)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:where(.sf-filters, .chip-row, .result-meta, .summary-table-card, .summary-table-wrapper, .summary-table, .sf-pagination) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.sf-filters,
.sf-filters *,
.sf-filters *::before,
.sf-filters *::after {
  box-sizing: border-box;
}

/* ─── Filter panel ──────────────────────────────────────────────────────────── */
.sf-filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  background: #FFFFFF;
  border: 1px solid #E4E7EC;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  width: 100%;
  max-width: 100%;
}

.sf-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.sf-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 180px;
  min-width: 160px;
  max-width: 260px;
}

.sf-field--grow {
  flex: 2 1 240px;
  max-width: none;
}

.sf-field--actions {
  flex: 0 0 auto;
  min-width: unset;
  max-width: none;
  margin-left: auto;
}

.sf-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #667085;
}

.sf-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.sf-input-icon {
  position: absolute;
  left: 11px;
  color: #98A2B3;
  pointer-events: none;
}

.sf-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 32px;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  border-radius: 8px;
  color: #101828;
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}

.sf-input--date {
  padding-left: 12px;
  min-width: 140px;
}

.sf-input:hover {
  border-color: #98A2B3;
}

.sf-input:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(21, 94, 99, 0.12);
}

.sf-input::placeholder {
  color: #98A2B3;
}

.sf-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.sf-select-wrap--sm {
  width: auto;
}

.sf-select {
  appearance: none;
  width: 100%;
  height: 38px;
  padding: 0 30px 0 12px;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  border-radius: 8px;
  color: #101828;
  font-size: 13.5px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}

.sf-select:hover {
  border-color: #98A2B3;
}

.sf-select:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(21, 94, 99, 0.12);
}

.sf-select--sm {
  height: 32px;
  font-size: 12.5px;
  width: auto;
  min-width: 64px;
  padding: 0 26px 0 10px;
  border-radius: 6px;
}

.sf-select option {
  color: #101828;
}

.sf-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #98A2B3;
}

.sf-btn-group {
  display: flex;
  gap: 8px;
}

.sf-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: .01em;
  cursor: pointer;
  border-radius: 8px;
  transition: background .15s, border-color .15s;
  white-space: nowrap;
}

.sf-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.sf-btn--primary {
  background: #4F46E5;
  border: 1px solid #4F46E5;
  color: #FFFFFF;
}

.sf-btn--primary:not(:disabled):hover {
  background: #4338CA;
}

.sf-btn--ghost {
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  color: #344054;
}

.sf-btn--ghost:not(:disabled):hover {
  background: #F9FAFB;
  border-color: #98A2B3;
}

/* ─── Chips ─────────────────────────────────────────────────────────────────── */
.chip-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 14px 2px 4px;
}

.chip-label {
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #98A2B3;
  margin-right: 2px;
  font-weight: 600;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  background: rgba(21, 94, 99, 0.07);
  border: 1px solid rgba(21, 94, 99, 0.22);
  border-radius: 999px;
  color: #4F46E5;
  font-size: 12px;
  font-weight: 500;
}

.chip-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  font-size: 15px;
  opacity: .6;
}

.chip-remove:hover {
  opacity: 1;
}

/* ─── Result meta ───────────────────────────────────────────────────────────── */
.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 2px 10px;
}

.result-count {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .02em;
  color: #344054;
}

.result-pages {
  font-size: 12px;
  color: #98A2B3;
}

/* ─── Table card ────────────────────────────────────────────────────────────── */
.summary-table-card {
  background: #FFFFFF;
  border: 1px solid #E4E7EC;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  overflow: hidden;
}

.summary-table-wrapper {
  overflow-x: auto;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.summary-table thead th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #667085;
  border-bottom: 1px solid #E4E7EC;
  background: #F9FAFB;
  white-space: nowrap;
  text-align: left;
}

.summary-table tbody td {
  padding: 12px 16px;
  font-size: 13.5px;
  color: #344054;
  border-bottom: 1px solid #F0F2F5;
  vertical-align: middle;
}

.summary-table tbody tr:last-child td {
  border-bottom: none;
}

/* ─── Date group row ────────────────────────────────────────────────────────── */
.date-group-row td {
  padding: 9px 16px !important;
  background: #F0F9F8 !important;
  border-top: 1px solid #E4E7EC !important;
  border-bottom: 1px solid #E4E7EC !important;
}

.date-group-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #4F46E5;
}

.date-group-count {
  font-weight: 500;
  font-size: 11px;
  color: #667085;
  margin-left: 4px;
  text-transform: none;
  letter-spacing: 0;
}

.summary-row {
  transition: background .12s;
}

.summary-row:hover td {
  background: #F9FAFB;
}

/* ─── Cells ─────────────────────────────────────────────────────────────────── */
.cell-dim {
  color: #98A2B3;
  font-size: 12.5px;
}

.cell-id {
  color: #667085;
  font-size: 12.5px;
  text-align: center;
  font-weight: 500;
}

.cell-muted {
  color: #667085;
  font-size: 13px;
}

.date-value {
  font-size: 12.5px;
  font-weight: 600;
  color: #475467;
  font-variant-numeric: tabular-nums;
}

.time-value {
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
  color: #344054;
}

.hours-value {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #475467;
  font-weight: 500;
}

.ot-value {
  font-size: 12.5px;
  color: #4F46E5;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.emp-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.emp-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(21, 94, 99, 0.1);
  border: 1px solid rgba(21, 94, 99, 0.18);
  color: #4F46E5;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.emp-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.emp-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #101828;
}

/* ─── Status badges ─────────────────────────────────────────────────────────── */
.status-badge {
  display: inline-block;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-badge--present {
  background: #ECFDF3;
  border: 1px solid #ABEFC6;
  color: #067647;
}

.status-badge--absent {
  background: #FEF3F2;
  border: 1px solid #FECDCA;
  color: #B42318;
}

.status-badge--late {
  background: #FFFAEB;
  border: 1px solid #FEDF89;
  color: #B54708;
}

.status-badge--leave {
  background: #EFF8FF;
  border: 1px solid #B2DDFF;
  color: #175CD3;
}

.status-badge--half_day {
  background: #F4F3FF;
  border: 1px solid #D9D6FE;
  color: #5925DC;
}

/* ─── Empty ─────────────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 16px;
  color: #98A2B3;
}

.empty-state p {
  font-size: 13.5px;
  margin: 0;
  color: #667085;
}

/* ─── Pagination ────────────────────────────────────────────────────────────── */
.sf-pagination {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding: 16px 2px 4px;
}

.sf-page-size {
  display: flex;
  align-items: center;
  gap: 9px;
}

.sf-pg-label {
  font-size: 12.5px;
  color: #667085;
  white-space: nowrap;
  font-weight: 500;
}

.sf-pg-controls {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.sf-pg-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 7px;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  color: #475467;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sf-pg-btn:not(:disabled):hover {
  background: #F9FAFB;
  border-color: #98A2B3;
  color: #4F46E5;
}

.sf-pg-btn--active {
  background: #4F46E5 !important;
  border-color: #4F46E5 !important;
  color: #FFFFFF !important;
  font-weight: 600;
}

.sf-pg-btn--ellipsis {
  cursor: default;
  border-color: transparent;
  background: transparent;
}

.sf-pg-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.sf-pg-info {
  font-size: 12.5px;
  color: #667085;
  margin-left: auto;
  white-space: nowrap;
}

/* ─── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .sf-row {
    flex-direction: column;
    align-items: stretch;
  }

  .sf-field,
  .sf-field--grow,
  .sf-field--actions {
    flex: none;
    min-width: 0;
    max-width: none;
    width: 100%;
    margin-left: 0;
  }

  .sf-btn-group {
    width: 100%;
  }

  .sf-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .sf-pagination {
    justify-content: center;
  }

  .sf-pg-info {
    margin-left: 0;
    width: 100%;
    text-align: center;
    order: -1;
  }
}

@media (max-width: 480px) {

  .attendance-filters,
  .sf-filters {
    padding: 14px;
    border-radius: 10px;
  }

  .sf-row {
    gap: 12px;
  }

  .sf-input--date {
    min-width: 0;
  }

  .sf-btn-group {
    flex-direction: column;
    gap: 8px;
  }

  .sf-btn {
    width: 100%;
  }

  .chip-row {
    padding: 12px 0 4px;
  }

  .result-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>