<template>
  <CrudLayout
    ref="layoutRef"
    title="Attendance Records"
    subtitle="Browse and filter complete employee attendance history"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading attendance records"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Records"
    :has-data="!!allRecords.length"
    :notification="notification"
    @retry="applyFilters"
  >

    <!-- ── Icon ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
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
              <svg class="sf-arrow" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </div>
          </div>
          <div class="sf-field">
            <label class="sf-label">Department</label>
            <div class="sf-select-wrap">
              <select v-model="filters.department" class="sf-select">
                <option value="">All Departments</option>
                <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
              </select>
              <svg class="sf-arrow" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </div>
          </div>
        </div>

        <!-- Row 2 -->
        <div class="sf-row">
          <div class="sf-field">
            <label class="sf-label">Employee ID</label>
            <div class="sf-input-wrap">
              <svg class="sf-input-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <input
                v-model="filters.employee_id"
                type="text"
                class="sf-input"
                placeholder="e.g. 42"
                @keydown.enter="applyFilters"
              />
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
              <svg class="sf-arrow" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </div>
          </div>
          <div class="sf-field sf-field--grow">
            <label class="sf-label">Search Name</label>
            <div class="sf-input-wrap">
              <svg class="sf-input-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                v-model="filters.search"
                type="text"
                class="sf-input"
                placeholder="Search by employee name…"
              />
            </div>
          </div>
          <div class="sf-field sf-field--actions">
            <label class="sf-label">&nbsp;</label>
            <div class="sf-btn-group">
              <button class="sf-btn sf-btn--primary" @click="applyFilters" :disabled="isLoading">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                Search
              </button>
              <button class="sf-btn sf-btn--ghost" @click="resetFilters" :disabled="isLoading">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
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
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style="opacity:.18">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
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
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
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
            <svg class="sf-arrow" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
          </div>
        </div>
        <div class="sf-pg-controls">
          <button class="sf-pg-btn" :disabled="meta.current_page <= 1" @click="goPage(1)">«</button>
          <button class="sf-pg-btn" :disabled="meta.current_page <= 1" @click="goPage(meta.current_page - 1)">‹</button>
          <button
            v-for="p in visiblePageNumbers" :key="p"
            class="sf-pg-btn"
            :class="{ 'sf-pg-btn--active': p === meta.current_page, 'sf-pg-btn--ellipsis': p === '…' }"
            :disabled="p === '…'"
            @click="p !== '…' && goPage(p)"
          >{{ p }}</button>
          <button class="sf-pg-btn" :disabled="meta.current_page >= meta.last_page" @click="goPage(meta.current_page + 1)">›</button>
          <button class="sf-pg-btn" :disabled="meta.current_page >= meta.last_page" @click="goPage(meta.last_page)">»</button>
        </div>
        <span class="sf-pg-info">{{ meta.from }}–{{ meta.to }} of {{ meta.total }}</span>
      </div>
    </template>

  </CrudLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CrudLayout from '../../components/CrudLayout.vue'

const baseApi   = process.env.VUE_APP_BASE_API
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
const companies    = ref([])
const departments  = ref([])
const allRecords   = ref([])
const isLoading    = ref(false)
const hasError     = ref(false)
const errorMessage = ref('')
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })
const perPage      = ref(25)

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
    const res  = await fetch(`${baseApi}/system/companies`, { headers: authHeaders() })
    const data = await res.json()
    companies.value = data.companies ?? []
  } catch { notify('warning', 'Could not load company list.') }
}

const fetchRecords = async (page = 1) => {
  isLoading.value = true
  hasError.value  = false
  try {
    const params = new URLSearchParams({ page, per_page: perPage.value })
    if (filters.value.employee_id) params.set('employee_id', filters.value.employee_id)
    if (filters.value.from)        params.set('from',        filters.value.from)
    if (filters.value.to)          params.set('to',          filters.value.to)
    if (filters.value.status)      params.set('status',      filters.value.status)
    if (filters.value.company_id)  params.set('company_id',  filters.value.company_id)
    if (filters.value.department)  params.set('department',  filters.value.department)

    const res  = await fetch(`${baseApi}/attendance/admin/summaries?${params}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    allRecords.value = data.data ?? (Array.isArray(data) ? data : [])
    meta.value = {
      current_page: data.current_page ?? 1,
      last_page:    data.last_page    ?? 1,
      total:        data.total        ?? allRecords.value.length,
      per_page:     data.per_page     ?? perPage.value,
      from:         data.from         ?? 1,
      to:           data.to           ?? allRecords.value.length,
    }

    // Derive department list from loaded records for the dropdown
    const depts = [...new Set(allRecords.value.map(r => r.employee?.department).filter(Boolean))].sort()
    if (depts.length) departments.value = depts

  } catch (e) {
    hasError.value     = true
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
    to:   today.toISOString().slice(0, 10),
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
    { label: 'Total',   value: meta.value.total || d.length },
    { label: 'Present', value: d.filter(r => r.status === 'present').length },
    { label: 'Absent',  value: d.filter(r => !r.status || r.status === 'absent').length },
    { label: 'Late',    value: d.filter(r => r.status === 'late').length },
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
  const cur   = meta.value.current_page
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
    const dt        = new Date(d + 'T00:00:00')
    const todayStr  = new Date().toISOString().slice(0, 10)
    const yestStr   = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const label     = dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (d === todayStr) return `Today — ${label}`
    if (d === yestStr)  return `Yesterday — ${label}`
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
  filters.value.to   = today.toISOString().slice(0, 10)
  filters.value.from = prior.toISOString().slice(0, 10)
  loadCompanies()
  fetchRecords(1)
})
</script>

<style scoped>
/* ─── Filter panel ──────────────────────────────────────────────────────────── */
.sf-filters { display: flex; flex-direction: column; gap: 10px; }
.sf-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
.sf-field { display: flex; flex-direction: column; gap: 5px; min-width: 140px; }
.sf-field--grow    { flex: 1 1 180px; }
.sf-field--actions { min-width: unset; }

.sf-label {
  font-size: 10.5px; font-weight: 600;
  letter-spacing: .09em; text-transform: uppercase;
  color: rgba(240, 234, 224, 0.40);
}

.sf-input-wrap { position: relative; display: flex; align-items: center; }
.sf-input-icon { position: absolute; left: 10px; color: rgba(201, 169, 110, 0.38); pointer-events: none; }

.sf-input {
  width: 100%; height: 34px; padding: 0 10px 0 30px;
  background: #111008; border: 1px solid rgba(201, 169, 110, 0.20);
  color: rgba(240, 234, 224, 0.85); font-size: 13px;
  outline: none; transition: border-color .18s; color-scheme: dark;
}
.sf-input--date  { padding-left: 10px; min-width: 130px; }
.sf-input:focus  { border-color: rgba(201, 169, 110, 0.52); }
.sf-input::placeholder { color: rgba(240, 234, 224, 0.22); }

.sf-select-wrap     { position: relative; display: inline-flex; align-items: center; width: 100%; }
.sf-select-wrap--sm { width: auto; }

.sf-select {
  appearance: none; width: 100%; height: 34px; padding: 0 28px 0 10px;
  background: #111008; border: 1px solid rgba(201, 169, 110, 0.20);
  color: rgba(240, 234, 224, 0.85); font-size: 13px;
  cursor: pointer; outline: none; transition: border-color .18s; color-scheme: dark;
}
.sf-select:focus  { border-color: rgba(201, 169, 110, 0.52); }
.sf-select--sm    { height: 30px; font-size: 12px; width: auto; min-width: 60px; }
.sf-select option         { background: #111008; color: rgba(240, 234, 224, 0.85); }
.sf-select option:checked { background: #1e1a0d; }

.sf-arrow { position: absolute; right: 8px; pointer-events: none; color: rgba(201, 169, 110, 0.45); }

.sf-btn-group { display: flex; gap: 6px; }
.sf-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px; font-size: 12.5px; font-weight: 500;
  letter-spacing: .04em; cursor: pointer;
  transition: background .15s, border-color .15s; white-space: nowrap;
}
.sf-btn:disabled { opacity: .45; cursor: not-allowed; }
.sf-btn--primary {
  background: rgba(201, 169, 110, 0.12);
  border: 1px solid rgba(201, 169, 110, 0.38); color: #C9A96E;
}
.sf-btn--primary:not(:disabled):hover { background: rgba(201, 169, 110, 0.20); border-color: rgba(201, 169, 110, 0.6); }
.sf-btn--ghost { background: transparent; border: 1px solid rgba(240, 234, 224, 0.12); color: rgba(240, 234, 224, 0.45); }
.sf-btn--ghost:not(:disabled):hover  { background: rgba(240, 234, 224, 0.05); color: rgba(240, 234, 224, 0.7); }

/* ─── Chips ─────────────────────────────────────────────────────────────────── */
.chip-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 10px 0 4px; }
.chip-label { font-size: 11px; letter-spacing: .07em; text-transform: uppercase; color: rgba(240, 234, 224, 0.28); margin-right: 2px; }
.chip {
  display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
  background: rgba(201, 169, 110, 0.08); border: 1px solid rgba(201, 169, 110, 0.22);
  color: #D4B87A; font-size: 11.5px;
}
.chip-remove { background: none; border: none; color: inherit; cursor: pointer; padding: 0; line-height: 1; font-size: 14px; opacity: .55; }
.chip-remove:hover { opacity: 1; }

/* ─── Result meta ───────────────────────────────────────────────────────────── */
.result-meta { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 6px; }
.result-count { font-size: 12px; font-weight: 500; letter-spacing: .05em; color: rgba(201, 169, 110, 0.65); text-transform: uppercase; }
.result-pages { font-size: 11.5px; color: rgba(240, 234, 224, 0.30); }

/* ─── Table ─────────────────────────────────────────────────────────────────── */
.summary-table-wrapper { overflow-x: auto; }
.summary-table { width: 100%; border-collapse: collapse; table-layout: auto; }

.summary-table thead th {
  padding: 9px 14px; font-size: 11px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase;
  color: rgba(201, 169, 110, 0.65);
  border-bottom: 1px solid rgba(201, 169, 110, 0.14);
  background: rgba(201, 169, 110, 0.03); white-space: nowrap;
}
.summary-table tbody td {
  padding: 10px 14px; font-size: 13px;
  color: rgba(240, 234, 224, 0.78);
  border-bottom: 1px solid rgba(201, 169, 110, 0.06);
  vertical-align: middle;
}

/* ─── Date group row ────────────────────────────────────────────────────────── */
.date-group-row td {
  padding: 7px 14px !important;
  background: rgba(201, 169, 110, 0.055) !important;
  border-top: 1px solid rgba(201, 169, 110, 0.16) !important;
  border-bottom: 1px solid rgba(201, 169, 110, 0.08) !important;
}
.date-group-label {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700;
  letter-spacing: .10em; text-transform: uppercase; color: #C9A96E;
}
.date-group-count { font-weight: 400; font-size: 10.5px; color: rgba(201, 169, 110, 0.42); margin-left: 4px; }

.summary-row:hover td { background: rgba(201, 169, 110, 0.025); }

/* ─── Cells ─────────────────────────────────────────────────────────────────── */
.cell-dim   { color: rgba(240, 234, 224, 0.28); font-size: 12px; }
.cell-id    { color: rgba(240, 234, 224, 0.40); font-size: 12px; text-align: center; }
.cell-muted { color: rgba(240, 234, 224, 0.42); font-size: 12.5px; }
.date-value  { font-size: 12px; font-weight: 500; color: rgba(240, 234, 224, 0.50); font-variant-numeric: tabular-nums; }
.time-value  { font-size: 13px; font-variant-numeric: tabular-nums; color: rgba(240, 234, 224, 0.72); }
.hours-value { font-size: 12.5px; font-variant-numeric: tabular-nums; color: rgba(240, 234, 224, 0.55); }
.ot-value    { font-size: 12px; color: #C9A96E; font-variant-numeric: tabular-nums; }

.emp-cell   { display: flex; align-items: center; gap: 9px; }
.emp-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(201, 169, 110, 0.10); border: 1px solid rgba(201, 169, 110, 0.22);
  color: #C9A96E; font-size: 10.5px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.emp-info { display: flex; flex-direction: column; gap: 1px; }
.emp-name { font-size: 13px; font-weight: 500; color: rgba(240, 234, 224, 0.88); }

/* ─── Status badges ─────────────────────────────────────────────────────────── */
.status-badge { display: inline-block; padding: 3px 9px; font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; white-space: nowrap; }
.status-badge--present  { background: rgba(74,222,128,.09);  border: 1px solid rgba(74,222,128,.24);  color: #4ADE80; }
.status-badge--absent   { background: rgba(248,113,113,.09); border: 1px solid rgba(248,113,113,.24); color: #F87171; }
.status-badge--late     { background: rgba(251,191,36,.09);  border: 1px solid rgba(251,191,36,.24);  color: #FBBF24; }
.status-badge--leave    { background: rgba(147,197,253,.09); border: 1px solid rgba(147,197,253,.24); color: #93C5FD; }
.status-badge--half_day { background: rgba(196,181,253,.09); border: 1px solid rgba(196,181,253,.24); color: #C4B5FD; }

/* ─── Empty ─────────────────────────────────────────────────────────────────── */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 16px; color: rgba(240, 234, 224, 0.28); }
.empty-state p { font-size: 13px; margin: 0; }

/* ─── Pagination ────────────────────────────────────────────────────────────── */
.sf-pagination { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 12px 0 4px; }
.sf-page-size  { display: flex; align-items: center; gap: 8px; }
.sf-pg-label   { font-size: 11.5px; color: rgba(240, 234, 224, 0.35); white-space: nowrap; }
.sf-pg-controls { display: flex; gap: 3px; flex-wrap: wrap; }

.sf-pg-btn {
  min-width: 30px; height: 30px; padding: 0 6px; background: transparent;
  border: 1px solid rgba(201, 169, 110, 0.15); color: rgba(240, 234, 224, 0.50);
  font-size: 12.5px; cursor: pointer; transition: background .15s, border-color .15s, color .15s;
  display: inline-flex; align-items: center; justify-content: center;
}
.sf-pg-btn:not(:disabled):hover { background: rgba(201, 169, 110, 0.09); border-color: rgba(201, 169, 110, 0.35); color: #C9A96E; }
.sf-pg-btn--active   { background: rgba(201, 169, 110, 0.14) !important; border-color: rgba(201, 169, 110, 0.45) !important; color: #C9A96E !important; font-weight: 600; }
.sf-pg-btn--ellipsis { cursor: default; border-color: transparent; }
.sf-pg-btn:disabled  { opacity: .3; cursor: not-allowed; }
.sf-pg-info { font-size: 11.5px; color: rgba(240, 234, 224, 0.30); margin-left: auto; white-space: nowrap; }
</style>