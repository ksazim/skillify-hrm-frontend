<template>
  <CrudLayout ref="layoutRef" title="Today's Attendance" subtitle="Monitor and manage employee attendance in real-time"
    :breadcrumbs="breadcrumbs" :stats="pageStats" :loading="isLoading" loading-message="Loading attendance records"
    :error="hasError ? errorMessage : ''" error-title="Failed to Load Attendance" :has-data="!!records.length"
    :notification="notification" @retry="loadData">

    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
      </svg>
    </template>

    <!-- ── Filters ── -->
    <template #filters>
      <div class="attendance-filters">
        <div class="filter-row">
          <!-- Company selector -->
          <div class="filter-field">
            <label class="filter-label">Company</label>
            <div class="select-wrapper">
              <select v-model="selectedCompany" class="filter-select" @change="handleCompanyChange">
                <option value="">All Companies</option>
                <option v-for="c in companies" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
              <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>

          <!-- Search -->
          <div class="filter-field filter-field--grow">
            <label class="filter-label">Search Employee</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input v-model="searchQuery" type="text" class="filter-input" placeholder="Search by name or ID…" />
            </div>
          </div>

          <!-- Status filter -->
          <div class="filter-field">
            <label class="filter-label">Status</label>
            <div class="select-wrapper">
              <select v-model="statusFilter" class="filter-select">
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="leave">On Leave</option>
              </select>
              <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>

          <!-- Refresh -->
          <div class="filter-field filter-field--action">
            <label class="filter-label">&nbsp;</label>
            <button class="btn-refresh" @click="loadData" :class="{ spinning: isLoading }">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Today's date header ── -->
    <div class="table__layout">
      <div class="date-header">
        <div class="date-pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
          </svg>
          {{ todayLabel }}
        </div>
        <span class="record-count">{{ filteredRecords.length }} employees</span>
      </div>

      <!-- ── Attendance Table ── -->
      <div class="attendance-table-card">
        <div class="attendance-table-wrapper">
          <table class="attendance-table">
            <thead>
              <tr>
                <th style="width:50px">#</th>
                <th style="width:200px">Employee</th>
                <th style="width:130px">Department</th>
                <th style="width:110px">Check In</th>
                <th style="width:110px">Check Out</th>
                <th style="width:90px">Hours</th>
                <th style="width:100px; text-align:center">Status</th>
                <th style="width:80px; text-align:center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredRecords.length && !isLoading">
                <td colspan="8" class="empty-row">
                  <div class="empty-state">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                    </svg>
                    <p>No attendance records found{{ selectedCompany ? '' : ' — select a company to begin' }}</p>
                  </div>
                </td>
              </tr>
              <tr v-for="(rec, idx) in filteredRecords" :key="rec.employee.id" class="attendance-row"
                :class="{ 'row--editing': editingId === rec.attendance?.id }">
                <td class="cell-num">{{ idx + 1 }}</td>
                <td>
                  <div class="employee-cell">
                    <div class="emp-avatar">{{ initials(rec.employee.user?.name) }}</div>
                    <div class="emp-info">
                      <span class="emp-name">{{ rec.employee.user?.name || '—' }}</span>
                      <span class="emp-id">ID: {{ rec.employee.id }}</span>
                    </div>
                  </div>
                </td>
                <td class="cell-muted">{{ rec.employee.department?.name || '—' }}</td>

                <!-- Check In -->
                <td>
                  <template v-if="editingId === rec.attendance?.id">
                    <input v-model="editForm.check_in" type="time" class="time-input" />
                  </template>
                  <span v-else class="time-value">{{ formatTime(rec.attendance?.check_in) }}</span>
                </td>

                <!-- Check Out -->
                <td>
                  <template v-if="editingId === rec.attendance?.id">
                    <input v-model="editForm.check_out" type="time" class="time-input" />
                  </template>
                  <span v-else class="time-value">{{ formatTime(rec.attendance?.check_out) }}</span>
                </td>

                <!-- Hours -->
                <td>
                  <span class="hours-badge" v-if="rec.attendance">
                    {{ calcHours(rec.attendance.check_in, rec.attendance.check_out) }}
                  </span>
                  <span v-else class="cell-dash">—</span>
                </td>

                <!-- Status -->
                <td style="text-align:center">
                  <template v-if="editingId === rec.attendance?.id">
                    <div class="select-wrapper select-wrapper--sm">
                      <select v-model="editForm.status" class="filter-select filter-select--sm">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="leave">Leave</option>
                        <option value="half_day">Half Day</option>
                      </select>
                      <svg class="select-arrow" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    </div>
                  </template>
                  <span v-else :class="['status-badge', `status-badge--${resolveStatus(rec)}`]">
                    {{ resolveStatus(rec) }}
                  </span>
                </td>

                <!-- Actions -->
                <td style="text-align:center">
                  <div class="action-btns">
                    <template v-if="editingId === rec.attendance?.id">
                      <button class="btn-save" @click="saveEdit(rec)" :disabled="isSaving" title="Save">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </button>
                      <button class="btn-cancel" @click="cancelEdit" title="Cancel">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                        </svg>
                      </button>
                    </template>
                    <template v-else>
                      <button class="btn-edit-row" @click="startEdit(rec)" :disabled="!rec.attendance"
                        :title="!rec.attendance ? 'No attendance record to edit' : 'Edit attendance'">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                        Edit
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </CrudLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import CrudLayout from '../../components/CrudLayout.vue'

const baseApi = process.env.VUE_APP_BASE_API
const layoutRef = ref(null)

// ── State ────────────────────────────────────────────────────────────────────
const companies = ref([])
const selectedCompany = ref('')
const records = ref([])
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const statusFilter = ref('')
const editingId = ref(null)
const editForm = ref({})
const isSaving = ref(false)
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: "Today's Attendance" },
]

// ── Today label ───────────────────────────────────────────────────────────────
const todayLabel = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
})

// ── Status resolver ───────────────────────────────────────────────────────────
// The API returns `is_present` / `is_late` flags rather than a `status` string,
// so we derive the display status from whichever field is available.
const resolveStatus = (rec) => {
  if (!rec.attendance) return 'absent'
  // If the backend ever starts returning a status string, prefer it
  if (rec.attendance.status) return rec.attendance.status
  if (rec.attendance.is_late === 1) return 'late'
  if (rec.attendance.is_present === 1) return 'present'
  return 'absent'
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const pageStats = computed(() => {
  const total = records.value.length
  const present = records.value.filter(r => resolveStatus(r) === 'present').length
  const absent = records.value.filter(r => resolveStatus(r) === 'absent').length
  const late = records.value.filter(r => resolveStatus(r) === 'late').length
  return [
    { label: 'Total', value: total },
    { label: 'Present', value: present },
    { label: 'Absent', value: absent },
    { label: 'Late', value: late },
  ]
})

// ── Filtered records ──────────────────────────────────────────────────────────
const filteredRecords = computed(() => {
  return records.value.filter(rec => {
    const name = rec.employee.user?.name?.toLowerCase() || ''
    const id = String(rec.employee.id)
    const matchSearch = !searchQuery.value ||
      name.includes(searchQuery.value.toLowerCase()) ||
      id.includes(searchQuery.value)
    const recStatus = resolveStatus(rec)
    const matchStatus = !statusFilter.value || recStatus === statusFilter.value
    return matchSearch && matchStatus
  })
})

// ── Notify helper ─────────────────────────────────────────────────────────────
const notify = (type, message, { title = '', autoClose = 3000 } = {}) => {
  if (layoutRef.value?.showBanner) {
    layoutRef.value.showBanner(type, message, { title, autoClose })
    return
  }
  notification.value = { show: false, type, title, message, autoClose }
  setTimeout(() => {
    notification.value = { show: true, type, title, message, autoClose }
  }, 0)
}

// ── Auth headers ─────────────────────────────────────────────────────────────
const authHeaders = (extra = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

// ── API ───────────────────────────────────────────────────────────────────────
const loadCompanies = async () => {
  try {
    const res = await fetch(`${baseApi}/system/companies`, { headers: authHeaders() })
    const data = await res.json()
    companies.value = data.companies ?? []
  } catch {
    notify('warning', 'Could not load company list.')
  }
}

const loadData = async () => {
  if (!selectedCompany.value) {
    records.value = []
    return
  }
  isLoading.value = true
  hasError.value = false
  try {
    const params = new URLSearchParams({ company_id: selectedCompany.value })
    const res = await fetch(`${baseApi}/attendance/admin/today-employees?${params}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    records.value = Array.isArray(data) ? data : []
  } catch (e) {
    hasError.value = true
    errorMessage.value = e.message || 'Failed to load attendance.'
    notify('error', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const handleCompanyChange = () => {
  editingId.value = null
  loadData()
}

// ── Edit handlers ─────────────────────────────────────────────────────────────
const startEdit = (rec) => {
  if (!rec.attendance) return
  editingId.value = rec.attendance.id
  editForm.value = {
    check_in: rec.attendance.check_in ? rec.attendance.check_in.slice(0, 5) : '',
    check_out: rec.attendance.check_out ? rec.attendance.check_out.slice(0, 5) : '',
    status: resolveStatus(rec),
  }
}

const cancelEdit = () => {
  editingId.value = null
  editForm.value = {}
}

const saveEdit = async (rec) => {
  if (!rec.attendance?.id) return
  isSaving.value = true
  try {
    const res = await fetch(`${baseApi}/attendance/admin/update`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: rec.attendance.id, ...editForm.value }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `HTTP ${res.status}`)
    }
    // Patch local data so we don't re-fetch the whole list
    rec.attendance.check_in = editForm.value.check_in
    rec.attendance.check_out = editForm.value.check_out
    // Store the status so resolveStatus picks it up on next render
    rec.attendance.status = editForm.value.status
    editingId.value = null
    notify('success', `Attendance updated for ${rec.employee.user?.name || 'employee'}.`, { autoClose: 3000 })
  } catch (e) {
    notify('error', e.message || 'Failed to update attendance.')
  } finally {
    isSaving.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (t) => {
  if (!t) return '—'
  try {
    const [h, m] = t.split(':')
    const date = new Date()
    date.setHours(+h, +m)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return t }
}

const calcHours = (cin, cout) => {
  if (!cin || !cout) return '—'
  try {
    const [h1, m1] = cin.split(':').map(Number)
    const [h2, m2] = cout.split(':').map(Number)
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (diff <= 0) return '—'
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return `${h}h ${m.toString().padStart(2, '0')}m`
  } catch { return '—' }
}

const initials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

onMounted(() => { loadCompanies() })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:where(.attendance-filters, .date-header, .attendance-table-card, .attendance-table-wrapper, .attendance-table) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.attendance-filters,
.attendance-filters *,
.attendance-filters *::before,
.attendance-filters *::after {
  box-sizing: border-box;
}

/* ── Filters ── */
.attendance-filters {
  padding: 18px 20px;
  background: #FFFFFF;
  border: 1px solid #E4E7EC;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  margin-bottom: 4px;
  width: 100%;
  max-width: 100%;
}

.filter-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 170px;
  min-width: 150px;
  max-width: 260px;
}

.filter-field--grow {
  flex: 2 1 220px;
  max-width: none;
}

.filter-field--action {
  min-width: unset;
  max-width: none;
  flex: 0 0 auto;
  margin-left: auto;
}

.filter-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #667085;
}

.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.filter-select {
  appearance: none;
  width: 100%;
  height: 38px;
  padding: 0 32px 0 12px;
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

.filter-select:hover {
  border-color: #98A2B3;
}

.filter-select:focus {
  border-color: #4338CA;
  box-shadow: 0 0 0 3px rgba(21, 94, 99, 0.12);
}

.filter-select option {
  color: #101828;
}

.select-wrapper--sm {
  display: flex;
}

.filter-select--sm {
  height: 32px;
  font-size: 12.5px;
  padding: 0 26px 0 10px;
  border-radius: 6px;
}

.select-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #98A2B3;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #98A2B3;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 34px;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  border-radius: 8px;
  color: #101828;
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}

.filter-input::placeholder {
  color: #98A2B3;
}

.filter-input:hover {
  border-color: #98A2B3;
}

.filter-input:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(21, 94, 99, 0.12);
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 18px;
  background: #4F46E5;
  border: 1px solid #4F46E5;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: .01em;
  cursor: pointer;
  transition: background .15s, box-shadow .15s;
}

.btn-refresh:hover {
  background: #4F46E5;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
}

.btn-refresh:active {
  background: #4F46E5;
}

.btn-refresh.spinning svg {
  animation: spin .7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Date header ── */
.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 2px 12px;
}

.date-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  background: rgba(21, 94, 99, 0.08);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .01em;
  color: #4F46E5;
}

.record-count {
  font-size: 13px;
  font-weight: 500;
  color: #667085;
}

.table__layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* width: 100%; */
  /* border: 5px solid red; */
  /* debug */
  padding: 16px 32px;
  background: #FFFFFF;

}

/* ── Table card ── */
.attendance-table-card {
  background: #FFFFFF;
  border: 1px solid #E4E7EC;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  overflow: hidden;
}

.attendance-table-wrapper {
  overflow-x: auto;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.attendance-table thead th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #667085;
  border-bottom: 1px solid #E4E7EC;
  white-space: nowrap;
  background: #F9FAFB;
  text-align: left;
}

.attendance-table tbody td {
  padding: 13px 16px;
  font-size: 13.5px;
  color: #344054;
  border-bottom: 1px solid #F0F2F5;
  vertical-align: middle;
}

.attendance-table tbody tr:last-child td {
  border-bottom: none;
}

.attendance-row {
  transition: background .12s;
}

.attendance-row:hover td {
  background: #F9FAFB;
}

.row--editing td {
  background: #F0F9F8 !important;
}

.cell-num {
  color: #98A2B3;
  font-size: 12.5px;
  font-weight: 500;
}

.cell-muted {
  color: #667085;
  font-size: 13px;
}

.cell-dash {
  color: #D0D5DD;
}

/* ── Employee cell ── */
.employee-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}

.emp-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(21, 94, 99, 0.1);
  border: 1px solid rgba(21, 94, 99, 0.18);
  color: #4F46E5;
  font-size: 11.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.emp-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.emp-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #101828;
}

.emp-id {
  font-size: 11px;
  color: #98A2B3;
  letter-spacing: .02em;
}

/* ── Time value ── */
.time-value {
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
  color: #344054;
}

/* ── Time input ── */
.time-input {
  width: 92px;
  height: 32px;
  padding: 0 8px;
  background: #FFFFFF;
  border: 1px solid #4F46E5;
  border-radius: 6px;
  color: #101828;
  font-size: 13px;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  outline: none;
}

.time-input:focus {
  box-shadow: 0 0 0 3px rgba(21, 94, 99, 0.12);
}

/* ── Hours badge ── */
.hours-badge {
  display: inline-block;
  font-size: 12.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: #475467;
}

/* ── Status badges ── */
.status-badge {
  display: inline-block;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11px;
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

/* ── Action buttons ── */
.action-btns {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.btn-edit-row {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 13px;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  border-radius: 6px;
  color: #344054;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}

.btn-edit-row:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #98A2B3;
}

.btn-edit-row:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-save,
.btn-cancel {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid;
  cursor: pointer;
  transition: background .15s;
}

.btn-save {
  background: #ECFDF3;
  border-color: #ABEFC6;
  color: #067647;
}

.btn-save:hover {
  background: #D1FADF;
}

.btn-save:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.btn-cancel {
  background: #FEF3F2;
  border-color: #FECDCA;
  color: #B42318;
}

.btn-cancel:hover {
  background: #FEE4E2;
}

/* ── Empty state ── */
.empty-row td {
  padding: 56px 16px !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #98A2B3;
}

.empty-state p {
  font-size: 13.5px;
  margin: 0;
  color: #667085;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-field,
  .filter-field--grow,
  .filter-field--action {
    flex: none;
    min-width: 0;
    max-width: none;
    width: 100%;
    margin-left: 0;
  }

  .btn-refresh {
    width: 100%;
    justify-content: center;
  }

  .date-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .attendance-filters {
    padding: 14px;
    border-radius: 10px;
  }

  .filter-row {
    gap: 12px;
  }
}
</style>