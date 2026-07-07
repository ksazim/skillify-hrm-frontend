<template>
  <div class="attendance-page">

    <!-- ░░ AMBIENT BACKGROUND ░░ -->
    <div class="ambient-layer" aria-hidden="true">
      <div class="ambient-orb orb-1"></div>
      <div class="ambient-orb orb-2"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- ══════════════════════════════════════════
         PAGE HEADER
    ══════════════════════════════════════════ -->
    <header class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <h1 class="page-title">Attendance</h1>
          <p class="page-subtitle">{{ todayFormatted }}</p>
        </div>
      </div>
      <div class="live-clock">
        <span class="clock-time">{{ liveTime }}</span>
        <span class="clock-label">Local Time</span>
      </div>
    </header>

    <!-- ══════════════════════════════════════════
         MAIN CLOCK CARD
    ══════════════════════════════════════════ -->
    <section class="clock-section">
      <div class="clock-card" :class="clockCardClass">

        <!-- Status Ring -->
        <div class="status-ring-wrap">
          <svg class="status-ring" viewBox="0 0 120 120">
            <circle class="ring-track" cx="60" cy="60" r="52" />
            <circle class="ring-progress" cx="60" cy="60" r="52" :stroke-dasharray="`${ringProgress} 999`"
              :stroke="ringColor" />
          </svg>
          <div class="ring-inner">
            <div class="ring-status-dot" :class="{ 'dot-pulse': isClockedIn }"></div>
            <span class="ring-elapsed">{{ elapsedDisplay }}</span>
            <span class="ring-elapsed-label">{{ elapsedLabel }}</span>
          </div>
        </div>

        <!-- Status Info -->
        <div class="clock-info">
          <div class="clock-status-badge" :class="statusBadgeClass">
            <span class="badge-dot"></span>
            {{ statusLabel }}
          </div>

          <div class="clock-times">
            <div class="time-block" v-if="firstCheckIn">
              <span class="time-block-label">First Check-In</span>
              <span class="time-block-value">{{ formatTime(firstCheckIn.check_time) }}</span>
            </div>
            <div class="time-block-divider" v-if="firstCheckIn && lastCheckOut"></div>
            <div class="time-block" v-if="lastCheckOut">
              <span class="time-block-label">Last Check-Out</span>
              <span class="time-block-value">{{ formatTime(lastCheckOut.check_time) }}</span>
            </div>
            <div class="time-block" v-if="!firstCheckIn && !lastCheckOut">
              <span class="time-block-label">Today</span>
              <span class="time-block-value no-record">No records yet</span>
            </div>
          </div>

          <!-- Location + Device info strip -->
          <div class="meta-strip">
            <div class="meta-chip"
              :class="locationStatus === 'granted' ? 'chip-ok' : locationStatus === 'denied' ? 'chip-err' : 'chip-idle'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{{ locationLabel }}</span>
            </div>
            <div class="meta-chip chip-device">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span>{{ deviceName }}</span>
            </div>
          </div>

          <!-- Action Button -->
          <button class="clock-btn" :class="clockBtnClass" :disabled="clockLoading" @click="openReasonModal">
            <span v-if="clockLoading" class="btn-spinner"></span>
            <svg v-else-if="isClockedIn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{{ clockBtnLabel }}</span>
          </button>

          <p v-if="actionMessage" class="action-message" :class="actionMessageClass">
            {{ actionMessage }}
          </p>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         TODAY STATS STRIP
    ══════════════════════════════════════════ -->
    <section class="stats-strip">
      <div class="stat-tile">
        <div class="stat-tile-icon icon-checkins">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
        <div class="stat-tile-body">
          <span class="stat-tile-value">{{ todayCheckInCount }}</span>
          <span class="stat-tile-label">Check-Ins Today</span>
        </div>
      </div>

      <div class="stat-tile-divider"></div>

      <div class="stat-tile">
        <div class="stat-tile-icon icon-checkouts">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <div class="stat-tile-body">
          <span class="stat-tile-value">{{ todayCheckOutCount }}</span>
          <span class="stat-tile-label">Check-Outs Today</span>
        </div>
      </div>

      <div class="stat-tile-divider"></div>

      <div class="stat-tile">
        <div class="stat-tile-icon icon-status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="stat-tile-body">
          <span class="stat-tile-value">{{ firstCheckInTime }}</span>
          <span class="stat-tile-label">First Check-In</span>
        </div>
      </div>

      <div class="stat-tile-divider"></div>

      <div class="stat-tile">
        <div class="stat-tile-icon icon-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div class="stat-tile-body">
          <span class="stat-tile-value">{{ todayLocation }}</span>
          <span class="stat-tile-label">Location</span>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         TODAY ACTIVITY SUMMARY BAR
    ══════════════════════════════════════════ -->
    <div class="today-summary-bar" v-if="todayLogs.length > 0">
      <span class="tsb-label">Today's activity —</span>
      <div class="tsb-chips">
        <span v-for="log in [...todayLogs].reverse()" :key="log.id" class="tsb-chip"
          :class="log.type === 'check_in' ? 'tsb-in' : 'tsb-out'"
          :title="log.type === 'check_in' ? 'Check In' : 'Check Out'">
          <svg v-if="log.type === 'check_in'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {{ formatTime(log.check_time) }}
        </span>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         ATTENDANCE LOGS
    ══════════════════════════════════════════ -->
    <section class="logs-section">
      <div class="logs-header">
        <div class="logs-header-left">
          <h2 class="logs-title">Attendance Log</h2>
          <span class="logs-count" v-if="pagination.total > 0">{{ pagination.total }} entries</span>
        </div>
        <button class="btn-refresh" @click="loadLogs()" :disabled="logsLoading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            :class="{ 'spinning': logsLoading }">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="logsLoading && !logs.length" class="logs-skeleton">
        <div class="skeleton-row" v-for="i in 6" :key="i">
          <div class="sk sk-icon"></div>
          <div class="sk-block">
            <div class="sk sk-type"></div>
            <div class="sk sk-meta"></div>
            <div class="sk sk-reason"></div>
          </div>
          <div class="sk sk-time-r"></div>
        </div>
      </div>

      <!-- Logs timeline -->
      <div v-else-if="logs.length" class="logs-timeline">
        <div v-for="log in logs" :key="log.id" class="log-entry"
          :class="log.type === 'check_in' ? 'entry-in' : 'entry-out'">
          <div class="log-icon-wrap">
            <svg v-if="log.type === 'check_in'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>

          <div class="log-body">
            <div class="log-main">
              <span class="log-type">{{ log.type === 'check_in' ? 'Clocked In' : 'Clocked Out' }}</span>
              <span class="log-badge log-source-badge">{{ log.source || 'web' }}</span>
              <span v-if="log.employee_location" class="log-badge log-city-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {{ log.employee_location }}
              </span>
            </div>
            <div class="log-meta">
              <span class="log-date">{{ formatLogDate(log.check_time) }}</span>
              <span class="log-sep">·</span>
              <span class="log-time-inline">{{ formatTime(log.check_time) }}</span>
            </div>
            <!-- Reason display -->
            <div v-if="log.reason" class="log-reason">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span>{{ log.reason }}</span>
            </div>
          </div>

          <div class="log-time-right">
            <span class="ltr-time">{{ formatTime(log.check_time) }}</span>
            <span class="ltr-type" :class="log.type === 'check_in' ? 'ltr-in' : 'ltr-out'">
              {{ log.type === 'check_in' ? 'IN' : 'OUT' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="logs-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p>No attendance logs yet</p>
        <span>Clock in to start tracking your attendance</span>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.total_pages > 1">
        <button class="page-btn" :disabled="pagination.current_page <= 1"
          @click="changePage(pagination.current_page - 1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class="page-info">Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span>
        <button class="page-btn" :disabled="pagination.current_page >= pagination.total_pages"
          @click="changePage(pagination.current_page + 1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         REASON MODAL
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="reasonModal.show" class="modal-backdrop" @click.self="closeReasonModal">
          <div class="modal-panel" :class="isClockedIn ? 'modal-out' : 'modal-in'">

            <!-- Modal header -->
            <div class="modal-header">
              <div class="modal-header-icon" :class="isClockedIn ? 'mhi-out' : 'mhi-in'">
                <svg v-if="isClockedIn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 class="modal-title">{{ isClockedIn ? 'Clock Out' : 'Clock In' }}</h3>
                <p class="modal-subtitle">{{ liveTime }} · {{ todayFormatted }}</p>
              </div>
              <button class="modal-close" @click="closeReasonModal" :disabled="clockLoading">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Divider -->
            <div class="modal-divider"></div>

            <!-- Reason field -->
            <div class="modal-body">
              <label class="reason-label">
                <span class="reason-label-text">Reason</span>
                <span class="reason-required">Required</span>
              </label>

              <!-- Quick presets -->
              <div class="reason-presets">
                <button v-for="preset in (isClockedIn ? clockInPresets : clockOutPresets)" :key="preset"
                  class="preset-chip" :class="{ 'preset-active': reasonModal.reason === preset }"
                  @click="selectPreset(preset)" type="button">
                  {{ preset }}
                </button>
              </div>

              <div class="reason-input-wrap"
                :class="{ 'input-error': reasonModal.touched && !reasonModal.reason.trim(), 'input-focus': reasonModal.focused }">
                <svg class="reason-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <textarea v-model="reasonModal.reason" class="reason-textarea"
                  :placeholder="isClockedIn ? 'e.g. End of shift, leaving for lunch, appointment…' : 'e.g. Starting regular shift, returning from break…'"
                  rows="3" maxlength="300" @focus="reasonModal.focused = true; reasonModal.touched = true"
                  @blur="reasonModal.focused = false" ref="reasonTextarea"></textarea>
              </div>

              <div class="reason-footer-row">
                <p v-if="reasonModal.touched && !reasonModal.reason.trim()" class="reason-error-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Please provide a reason before proceeding.
                </p>
                <span v-else class="reason-hint">This will be recorded in the attendance log.</span>
                <span class="reason-char-count" :class="{ 'count-warn': reasonModal.reason.length > 260 }">
                  {{ reasonModal.reason.length }}/300
                </span>
              </div>
            </div>

            <!-- Modal footer actions -->
            <div class="modal-footer">
              <button class="modal-btn-cancel" @click="closeReasonModal" :disabled="clockLoading">
                Cancel
              </button>
              <button class="modal-btn-confirm" :class="isClockedIn ? 'confirm-out' : 'confirm-in'"
                :disabled="clockLoading || !reasonModal.reason.trim()" @click="handleClockAction">
                <span v-if="clockLoading" class="btn-spinner"></span>
                <svg v-else-if="isClockedIn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ clockLoading ? 'Processing…' : (isClockedIn ? 'Confirm Clock Out' : 'Confirm Clock In') }}
              </button>
            </div>

          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <transition name="toast">
        <div v-if="toast.show" class="toast-notif" :class="`toast-${toast.type}`">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ toast.message }}
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

// ── API ───────────────────────────────────────────────────────────────────────
const apiBase = process.env.VUE_APP_BASE_API || '/api'
const api = axios.create({ baseURL: apiBase })
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── Device name ───────────────────────────────────────────────────────────────
const getDeviceName = () => {
  const ua = navigator.userAgent
  let os = 'Unknown'
  if (/Windows NT 11/.test(ua)) os = 'Windows 11'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'
  else if (/Linux/.test(ua)) os = 'Linux'
  let browser = 'Browser'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua)) browser = 'Safari'
  return `${browser} / ${os}`
}

// ── Geolocation ───────────────────────────────────────────────────────────────
const resolveLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.address || {}
          const city = addr.city || addr.town || addr.village || addr.county || addr.state || 'Unknown'
          resolve({ city, latitude: coords.latitude, longitude: coords.longitude })
        } catch {
          resolve({ city: null, latitude: coords.latitude, longitude: coords.longitude })
        }
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000 }
    )
  })

// ── Preset reasons ────────────────────────────────────────────────────────────
const clockInPresets = ['Starting regular shift', 'Returning from break', 'Returning from lunch', 'Remote work start']
const clockOutPresets = ['End of shift', 'Lunch break', 'Short break', 'Appointment', 'End of day']

// ── State ─────────────────────────────────────────────────────────────────────
const logs = ref([])
const pagination = ref({ current_page: 1, total_pages: 1, total: 0, per_page: 10 })
const clockLoading = ref(false)
const logsLoading = ref(false)
const actionMessage = ref('')
const actionMsgType = ref('success')
const liveTime = ref('')
const elapsedSecs = ref(0)
const toast = ref({ show: false, type: 'success', message: '' })
const locationCity = ref(null)
const locationCoords = ref(null)
const locationStatus = ref('pending')
const deviceName = ref(getDeviceName())
const reasonTextarea = ref(null)

// Reason modal state
const reasonModal = ref({
  show: false,
  reason: '',
  touched: false,
  focused: false,
})

let clockInterval = null
let elapsedInterval = null

// ── Date helpers ──────────────────────────────────────────────────────────────
const dateOf = (dt) => {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('en-CA') // "YYYY-MM-DD" in local timezone
}
const todayStr = computed(() => new Date().toLocaleDateString('en-CA'))

// ── Derived state ─────────────────────────────────────────────────────────────
const todayLogs = computed(() =>
  logs.value.filter(l => dateOf(l.check_time) === todayStr.value)
)
const firstCheckIn = computed(() => {
  const ins = todayLogs.value.filter(l => l.type === 'check_in')
  return ins.length ? ins.reduce((a, b) => a.check_time < b.check_time ? a : b) : null
})
const lastCheckOut = computed(() => {
  const outs = todayLogs.value.filter(l => l.type === 'check_out')
  return outs.length ? outs.reduce((a, b) => a.check_time > b.check_time ? a : b) : null
})
const latestTodayLog = computed(() => {
  if (!todayLogs.value.length) return null
  return todayLogs.value.reduce((a, b) => a.check_time > b.check_time ? a : b)
})
const isClockedIn = computed(() =>
  latestTodayLog.value?.type === 'check_in'
)

// ── UI computed ───────────────────────────────────────────────────────────────
const statusLabel = computed(() => {
  if (!latestTodayLog.value) return 'Not Clocked In'
  return isClockedIn.value ? 'Clocked In' : 'Clocked Out'
})
const statusBadgeClass = computed(() =>
  isClockedIn.value ? 'badge-in' : 'badge-out'
)
const clockCardClass = computed(() => isClockedIn.value ? 'card-in' : 'card-idle')
const clockBtnClass = computed(() => isClockedIn.value ? 'btn-out' : 'btn-in')
const clockBtnLabel = computed(() => {
  if (clockLoading.value) return 'Processing…'
  return isClockedIn.value ? 'Clock Out' : 'Clock In'
})
const actionMessageClass = computed(() =>
  actionMsgType.value === 'error' ? 'msg-error' : 'msg-success'
)
const todayFormatted = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
)
const locationLabel = computed(() => {
  if (locationStatus.value === 'pending') return 'Locating…'
  if (locationStatus.value === 'denied') return 'Location denied'
  return locationCity.value || 'Location obtained'
})
const ringProgress = computed(() => {
  const pct = Math.min(elapsedSecs.value / (9 * 3600), 1)
  return (2 * Math.PI * 52 * pct).toFixed(1)
})
const ringColor = computed(() => isClockedIn.value ? '#155E63' : 'rgba(21,94,99,0.18)')
const elapsedDisplay = computed(() => {
  if (elapsedSecs.value === 0) return '—'
  const h = Math.floor(elapsedSecs.value / 3600)
  const m = Math.floor((elapsedSecs.value % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
})
const elapsedLabel = computed(() => {
  if (elapsedSecs.value === 0) return 'Not started'
  return isClockedIn.value ? 'Elapsed' : 'Last session'
})
const todayCheckInCount = computed(() => String(todayLogs.value.filter(l => l.type === 'check_in').length || 0))
const todayCheckOutCount = computed(() => String(todayLogs.value.filter(l => l.type === 'check_out').length || 0))
const firstCheckInTime = computed(() => firstCheckIn.value ? formatTime(firstCheckIn.value.check_time) : '—')
const todayLocation = computed(() => {
  const loc = todayLogs.value.find(l => l.employee_location)?.employee_location
  return loc || locationCity.value || '—'
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (dt) => {
  if (!dt) return '—'
  try {
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch { return dt }
}
const formatLogDate = (dt) => {
  if (!dt) return '—'
  try {
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return dt }
}
const showToast = (type, message) => {
  toast.value = { show: true, type, message }
  setTimeout(() => { toast.value.show = false }, 3500)
}
const startLiveClock = () => {
  const tick = () => {
    liveTime.value = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    })
  }
  tick()
  clockInterval = setInterval(tick, 1000)
}
const updateElapsed = () => {
  if (!firstCheckIn.value) { elapsedSecs.value = 0; return }
  const start = new Date(firstCheckIn.value.check_time).getTime()
  const end = isClockedIn.value
    ? Date.now()
    : (lastCheckOut.value ? new Date(lastCheckOut.value.check_time).getTime() : Date.now())
  elapsedSecs.value = Math.max(0, Math.floor((end - start) / 1000))
}

// ── Modal controls ────────────────────────────────────────────────────────────
const openReasonModal = async () => {
  if (clockLoading.value) return
  reasonModal.value = { show: true, reason: '', touched: false, focused: false }
  await nextTick()
  reasonTextarea.value?.focus()
}
const closeReasonModal = () => {
  if (clockLoading.value) return
  reasonModal.value.show = false
}
const selectPreset = (preset) => {
  reasonModal.value.reason = preset
  reasonModal.value.touched = true
}

// ── Parse Laravel paginator ───────────────────────────────────────────────────
const parsePaginatedResponse = (data) => {
  const items = data.data ?? data.list ?? []
  pagination.value = {
    current_page: data.current_page ?? 1,
    total_pages: data.last_page ?? 1,
    total: data.total ?? items.length,
    per_page: data.per_page ?? 10,
  }
  return items
}

// ── API calls ─────────────────────────────────────────────────────────────────
const loadLogs = async (page = pagination.value.current_page) => {
  logsLoading.value = true
  try {
    const { data } = await api.get('/attendance/employee/logs', { params: { page } })
    logs.value = parsePaginatedResponse(data)
    updateElapsed()
  } catch {
    showToast('error', 'Failed to load attendance logs.')
  } finally {
    logsLoading.value = false
  }
}
const changePage = (page) => {
  if (page < 1 || page > pagination.value.total_pages) return
  pagination.value.current_page = page
  loadLogs(page)
}
const buildClockPayload = () => {
  const payload = {
    source: 'web',
    device: deviceName.value,
    reason: reasonModal.value.reason.trim(),
  }
  if (locationCity.value) payload.employee_location = locationCity.value
  if (locationCoords.value) {
    payload.latitude = locationCoords.value.latitude
    payload.longitude = locationCoords.value.longitude
  }
  return payload
}

const handleClockAction = async () => {
  // Validate reason
  reasonModal.value.touched = true
  if (!reasonModal.value.reason.trim()) return
  if (clockLoading.value) return

  clockLoading.value = true
  actionMessage.value = ''

  // Refresh location
  const loc = await resolveLocation()
  if (loc) {
    locationCity.value = loc.city
    locationCoords.value = { latitude: loc.latitude, longitude: loc.longitude }
    locationStatus.value = 'granted'
  } else {
    locationStatus.value = 'denied'
  }

  try {
    const payload = buildClockPayload()
    if (isClockedIn.value) {
      await api.post('/attendance/employee/clock-out', payload)
      showToast('success', 'Clocked out successfully. See you tomorrow!')
      actionMessage.value = 'Clock-out recorded.'
    } else {
      await api.post('/attendance/employee/clock-in', payload)
      showToast('success', 'Clocked in successfully. Have a productive day!')
      actionMessage.value = 'Clock-in recorded.'
    }
    actionMsgType.value = 'success'
    reasonModal.value.show = false
    await loadLogs(1)
  } catch (err) {
    const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
    actionMessage.value = msg
    actionMsgType.value = 'error'
    showToast('error', msg)
  } finally {
    clockLoading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  startLiveClock()
  resolveLocation().then(loc => {
    locationCity.value = loc?.city ?? null
    locationCoords.value = loc ? { latitude: loc.latitude, longitude: loc.longitude } : null
    locationStatus.value = loc ? 'granted' : 'denied'
  })
  await loadLogs(1)
  elapsedInterval = setInterval(updateElapsed, 10_000)
})
onBeforeUnmount(() => {
  clearInterval(clockInterval)
  clearInterval(elapsedInterval)
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   DESIGN TOKENS — light enterprise theme
══════════════════════════════════════════════════ */
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --gold: #155E63;
  --gold-dim: rgba(21, 94, 99, 0.08);
  --gold-mid: rgba(21, 94, 99, 0.35);
  --gold-hover: rgba(21, 94, 99, 0.14);
  --cream: #101828;
  --cream-2: #667085;
  --cream-3: #98A2B3;
  --cream-ghost: rgba(16, 24, 40, 0.04);
  --green: #067647;
  --green-dim: #ECFDF3;
  --green-border: #ABEFC6;
  --red: #B42318;
  --red-dim: #FEF3F2;
  --red-border: #FECDCA;
  --blue: #175CD3;
  --blue-dim: #EFF8FF;
  --blue-border: #B2DDFF;
  --card-bg: #FFFFFF;
  --border: #E4E7EC;
  --border-faint: #F0F2F5;
  --font-serif: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'DM Mono', monospace;
}

/* ══════════════════════════════════════════════════
   PAGE BASE
══════════════════════════════════════════════════ */
.attendance-page {
  min-height: 100vh;
  padding: 32px;
  background: #FFFFFF;
  color: var(--cream);
  font-family: var(--font-body);
  box-sizing: border-box;
  position: relative;
  overflow-x: hidden;
}

.attendance-page,
.attendance-page *,
.attendance-page *::before,
.attendance-page *::after {
  box-sizing: border-box;
}

.ambient-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: .06;
}

.orb-1 {
  width: 540px;
  height: 540px;
  background: radial-gradient(circle, #155E63 0%, transparent 70%);
  top: -220px;
  right: -160px;
  animation: orbDrift 18s ease-in-out infinite alternate;
}

.orb-2 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, #12B76A 0%, transparent 70%);
  bottom: -190px;
  left: -130px;
  animation: orbDrift 22s ease-in-out infinite alternate-reverse;
}

@keyframes orbDrift {
  from {
    transform: translate(0, 0) scale(1);
  }

  to {
    transform: translate(40px, 30px) scale(1.1);
  }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(16, 24, 40, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 24, 40, 0.025) 1px, transparent 1px);
  background-size: 48px 48px;
}

.page-header,
.clock-section,
.stats-strip,
.today-summary-bar,
.logs-section {
  position: relative;
  z-index: 1;
}

/* ══════════════════════════════════════════════════
   PAGE HEADER
══════════════════════════════════════════════════ */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--gold-dim);
  border: 1px solid var(--gold-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
}

.header-icon svg {
  width: 22px;
  height: 22px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-serif);
  color: var(--cream);
  letter-spacing: -.01em;
}

.page-subtitle {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--cream-2);
  letter-spacing: .01em;
}

.live-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.clock-time {
  font-family: var(--font-mono);
  font-size: 22px;
  color: var(--gold);
  letter-spacing: .02em;
  line-height: 1;
  font-weight: 500;
}

.clock-label {
  margin-top: 4px;
  font-size: 10px;
  color: var(--cream-3);
  text-transform: uppercase;
  letter-spacing: .09em;
}

/* ══════════════════════════════════════════════════
   CLOCK CARD
══════════════════════════════════════════════════ */
.clock-section {
  margin-bottom: 24px;
}

.clock-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  padding: 36px 40px;
  display: flex;
  align-items: center;
  gap: 48px;
  flex-wrap: wrap;
  position: relative;
  overflow: hidden;
  transition: border-color .3s;
}

.clock-card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity .4s;
}

.card-idle {
  border-color: var(--border);
}

.card-in {
  border-color: rgba(21, 94, 99, 0.35);
}

.card-in::before {
  background: linear-gradient(135deg, rgba(21, 94, 99, 0.05) 0%, transparent 55%);
  opacity: 1;
}

.status-ring-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.status-ring {
  width: 120px;
  height: 120px;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: #EEF1F4;
  stroke-width: 6;
}

.ring-progress {
  fill: none;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dasharray .8s ease, stroke .4s;
}

.ring-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.ring-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cream-3);
  margin-bottom: 4px;
  transition: background .3s;
}

.card-in .ring-status-dot {
  background: var(--gold);
}

.dot-pulse {
  animation: dotPulse 2s ease-in-out infinite;
}

@keyframes dotPulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(21, 94, 99, 0.4);
  }

  50% {
    box-shadow: 0 0 0 7px rgba(21, 94, 99, 0);
  }
}

.ring-elapsed {
  font-family: var(--font-mono);
  font-size: 19px;
  font-weight: 500;
  color: var(--cream);
  line-height: 1;
}

.ring-elapsed-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .09em;
  color: var(--cream-3);
}

.clock-info {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.clock-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  border: 1px solid;
  border-radius: 999px;
  width: fit-content;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-out {
  color: var(--cream-2);
  border-color: #D0D5DD;
  background: #F9FAFB;
}

.badge-out .badge-dot {
  background: var(--cream-2);
}

.badge-in {
  color: var(--gold);
  border-color: var(--gold-mid);
  background: var(--gold-dim);
}

.badge-in .badge-dot {
  background: var(--gold);
  animation: dotPulse 2s ease-in-out infinite;
}

.clock-times {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.time-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.time-block-label {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--cream-3);
}

.time-block-value {
  font-family: var(--font-mono);
  font-size: 17px;
  color: var(--cream);
  font-weight: 500;
}

.no-record {
  font-size: 14px;
  color: var(--cream-3);
  font-family: var(--font-body);
  font-weight: 400;
}

.time-block-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
  flex-shrink: 0;
}

.meta-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
}

.meta-chip svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.chip-ok {
  color: var(--green);
  border-color: var(--green-border);
  background: var(--green-dim);
}

.chip-err {
  color: var(--red);
  border-color: var(--red-border);
  background: var(--red-dim);
}

.chip-idle {
  color: var(--cream-2);
  border-color: #D0D5DD;
  background: #F9FAFB;
}

.chip-device {
  color: var(--blue);
  border-color: var(--blue-border);
  background: var(--blue-dim);
}

.clock-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 30px;
  border: 1px solid;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  transition: all .2s;
  width: fit-content;
}

.clock-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-in {
  background: #4338CA;
  border-color: #4338CA;
  color: #FFFFFF;
}

.btn-in:hover:not(:disabled) {
  background: #4338CA;
  border-color: #4338CA;
  box-shadow: 0 4px 12px rgba(67, 56, 202, 0.20);
}

.btn-out {
  background: var(--red-dim);
  border-color: var(--red-border);
  color: var(--red);
}

.btn-out:hover:not(:disabled) {
  background: #FEE4E2;
  border-color: var(--red);
}

.clock-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #FFFFFF;
  animation: spin .7s linear infinite;
}

.btn-out .btn-spinner {
  border: 2px solid rgba(180, 35, 24, 0.25);
  border-top-color: var(--red);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.action-message {
  margin: 0;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: .01em;
}

.msg-success {
  color: var(--green);
}

.msg-error {
  color: var(--red);
}

/* ══════════════════════════════════════════════════
   STATS STRIP
══════════════════════════════════════════════════ */
.stats-strip {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  margin-bottom: 20px;
  overflow: hidden;
}

.stat-tile {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  min-width: 140px;
}

.stat-tile-divider {
  width: 1px;
  background: var(--border);
  align-self: stretch;
  flex-shrink: 0;
}

.stat-tile-icon {
  width: 40px;
  height: 40px;
  border: 1px solid;
  border-radius: 9px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-tile-icon svg {
  width: 18px;
  height: 18px;
}

.icon-checkins {
  border-color: var(--gold-mid);
  color: var(--gold);
  background: var(--gold-dim);
}

.icon-checkouts {
  border-color: var(--blue-border);
  color: var(--blue);
  background: var(--blue-dim);
}

.icon-status {
  border-color: var(--green-border);
  color: var(--green);
  background: var(--green-dim);
}

.icon-location {
  border-color: #D0D5DD;
  color: var(--cream-2);
  background: #F9FAFB;
}

.stat-tile-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-tile-value {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 500;
  color: var(--cream);
  line-height: 1;
}

.stat-tile-label {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--cream-3);
}

/* ══════════════════════════════════════════════════
   TODAY ACTIVITY BAR
══════════════════════════════════════════════════ */
.today-summary-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 14px 20px;
  margin-bottom: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  border-left: 3px solid var(--gold);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}

.tsb-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--cream-3);
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 600;
}

.tsb-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tsb-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border: 1px solid;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}

.tsb-chip svg {
  width: 9px;
  height: 9px;
  flex-shrink: 0;
}

.tsb-in {
  color: var(--gold);
  border-color: var(--gold-mid);
  background: var(--gold-dim);
}

.tsb-out {
  color: var(--blue);
  border-color: var(--blue-border);
  background: var(--blue-dim);
}

/* ══════════════════════════════════════════════════
   LOGS SECTION
══════════════════════════════════════════════════ */
.logs-section {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  padding: 28px;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.logs-header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.logs-title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--cream);
  letter-spacing: -.01em;
}

.logs-count {
  font-size: 12px;
  color: var(--cream-3);
  letter-spacing: .02em;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  background: #FFFFFF;
  border-radius: 7px;
  border: 1px solid #D0D5DD;
  color: var(--cream-2);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .02em;
  cursor: pointer;
  transition: all .14s;
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--gold-mid);
  color: var(--gold);
  background: var(--gold-dim);
}

.btn-refresh:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.btn-refresh svg {
  width: 13px;
  height: 13px;
}

.btn-refresh svg.spinning {
  animation: spin .7s linear infinite;
}

/* ── Skeleton ── */
.logs-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
}

.sk-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sk {
  background: linear-gradient(90deg,
      rgba(16, 24, 40, 0.04) 25%, rgba(16, 24, 40, 0.09) 50%, rgba(16, 24, 40, 0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

.sk-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
}

.sk-type {
  height: 13px;
  width: 90px;
}

.sk-meta {
  height: 10px;
  width: 160px;
}

.sk-reason {
  height: 10px;
  width: 220px;
}

.sk-time-r {
  height: 14px;
  width: 55px;
  flex-shrink: 0;
}

/* ── Timeline ── */
.logs-timeline {
  display: flex;
  flex-direction: column;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 15px 10px;
  border-bottom: 1px solid var(--border-faint);
  transition: background .13s;
  border-radius: 6px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry:hover {
  background: #F9FAFB;
}

.log-icon-wrap {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.log-icon-wrap svg {
  width: 15px;
  height: 15px;
}

.entry-in .log-icon-wrap {
  border-color: var(--gold-mid);
  color: var(--gold);
  background: var(--gold-dim);
}

.entry-out .log-icon-wrap {
  border-color: var(--blue-border);
  color: var(--blue);
  background: var(--blue-dim);
}

.log-body {
  flex: 1;
  min-width: 0;
}

.log-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.log-type {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--cream);
}

.log-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border: 1px solid;
  border-radius: 5px;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.log-badge svg {
  width: 9px;
  height: 9px;
}

.log-source-badge {
  color: var(--cream-2);
  border-color: #D0D5DD;
  background: #F9FAFB;
}

.log-city-badge {
  color: var(--green);
  border-color: var(--green-border);
  background: var(--green-dim);
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.log-date {
  font-size: 11.5px;
  color: var(--cream-2);
}

.log-sep {
  color: var(--cream-3);
  font-size: 11.5px;
}

.log-time-inline {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--cream-2);
}

/* ── Reason in log ── */
.log-reason {
  display: inline-flex;
  align-items: flex-start;
  gap: 7px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--gold-dim);
  border: 1px solid rgba(21, 94, 99, 0.15);
  border-left: 2px solid var(--gold-mid);
  max-width: 100%;
}

.log-reason svg {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  color: var(--gold);
  margin-top: 1px;
}

.log-reason span {
  font-size: 11.5px;
  color: var(--cream-2);
  line-height: 1.5;
  word-break: break-word;
  font-style: italic;
}

/* Right side */
.log-time-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 2px;
}

.ltr-time {
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--cream);
}

.ltr-type {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .09em;
  padding: 1px 6px;
  border: 1px solid;
  border-radius: 4px;
}

.ltr-in {
  color: var(--gold);
  border-color: var(--gold-mid);
  background: var(--gold-dim);
}

.ltr-out {
  color: var(--blue);
  border-color: var(--blue-border);
  background: var(--blue-dim);
}

/* ── Empty ── */
.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 64px 20px;
  text-align: center;
}

.logs-empty svg {
  width: 44px;
  height: 44px;
  color: var(--cream-3);
}

.logs-empty p {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--cream);
}

.logs-empty span {
  font-size: 12.5px;
  color: var(--cream-2);
}

/* ── Pagination ── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  border-radius: 7px;
  color: var(--cream-2);
  cursor: pointer;
  transition: all .13s;
}

.page-btn svg {
  width: 14px;
  height: 14px;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--gold-mid);
  color: var(--gold);
  background: var(--gold-dim);
}

.page-btn:disabled {
  opacity: .35;
  cursor: not-allowed;
}

.page-info {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--cream-2);
}

/* ══════════════════════════════════════════════════
   REASON MODAL
══════════════════════════════════════════════════ */
.modal-backdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  overflow: hidden;
  background-color: transparent;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  isolation: isolate;
}

.modal-panel {
  background: var(--card-bg);
  color: var(--cream-2);
  border: 1px solid var(--border);
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  position: relative;
  /* The huge spread below paints the full-viewport dark scrim by casting an
     oversized shadow from the panel itself, clipped by .modal-backdrop's
     overflow:hidden. This avoids depending on the backdrop element's own
     background-color, which was being neutralized by the host page. */
  box-shadow:
    0 0 0 100vmax rgba(16, 24, 40, 0.72),
    0 24px 60px rgba(16, 24, 40, 0.25);
}

.modal-in {
  border-color: rgba(21, 94, 99, 0.30);
}

.modal-out {
  border-color: rgba(180, 35, 24, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px;
  color: var(--cream);
}

.modal-header-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: 1px solid;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-header-icon svg {
  width: 18px;
  height: 18px;
}

.mhi-in {
  border-color: var(--gold-mid);
  color: var(--gold);
  background: var(--gold-dim);
}

.mhi-out {
  border-color: var(--red-border);
  color: var(--red);
  background: var(--red-dim);
}

.modal-title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 700;
  color: var(--cream);
  letter-spacing: -.01em;
  line-height: 1.3;
}

.modal-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--cream-3);
  font-family: var(--font-body);
}

.modal-close {
  margin-left: auto;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 7px;
  background: transparent;
  border: 1px solid #D0D5DD;
  color: var(--cream-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .14s;
}

.modal-close:hover:not(:disabled) {
  border-color: var(--red-border);
  color: var(--red);
  background: var(--red-dim);
}

.modal-close:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.modal-close svg {
  width: 14px;
  height: 14px;
}

.modal-divider {
  height: 1px;
  background: var(--border);
}

.modal-body {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reason-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reason-label-text {
  font-family: var(--font-body);
  font-size: 12.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--cream-2);
}

.reason-required {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  padding: 2px 7px;
  border: 1px solid var(--red-border);
  border-radius: 5px;
  color: var(--red);
  background: var(--red-dim);
}

/* Quick presets */
.reason-presets {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.preset-chip {
  padding: 5px 12px;
  border: 1px solid #D0D5DD;
  border-radius: 999px;
  background: #FFFFFF;
  color: var(--cream-2);
  font-family: var(--font-body);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}

.preset-chip:hover {
  border-color: var(--gold-mid);
  color: var(--gold);
  background: var(--gold-dim);
}

.preset-active {
  border-color: var(--gold-mid) !important;
  color: var(--gold) !important;
  background: var(--gold-dim) !important;
}

/* Textarea wrapper */
.reason-input-wrap {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid #D0D5DD;
  border-radius: 8px;
  background: #FFFFFF;
  padding: 10px 12px;
  transition: border-color .2s, box-shadow .2s;
}

.input-focus {
  border-color: var(--gold-mid);
  box-shadow: 0 0 0 3px rgba(21, 94, 99, 0.10);
}

.input-error {
  border-color: var(--red-border);
  box-shadow: 0 0 0 3px rgba(180, 35, 24, 0.10);
}

.reason-input-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--cream-3);
  margin-top: 2px;
}

.reason-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--cream);
  line-height: 1.6;
  padding: 0;
  width: 100%;
}

.reason-textarea::placeholder {
  color: var(--cream-3);
}

.reason-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 18px;
}

.reason-hint {
  font-family: var(--font-body);
  font-size: 12.5px;
  color: var(--cream-3);
}

.reason-error-msg {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-body);
  font-size: 12.5px;
  color: var(--red);
  font-weight: 500;
}

.reason-error-msg svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.reason-char-count {
  font-family: var(--font-body);
  font-size: 11.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--cream-3);
  flex-shrink: 0;
}

.count-warn {
  color: var(--red);
}

/* Footer actions */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.modal-btn-cancel {
  padding: 10px 20px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #D0D5DD;
  color: var(--cream-2);
  font-family: var(--font-body);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: normal;
  cursor: pointer;
  transition: all .14s;
}

.modal-btn-cancel:hover:not(:disabled) {
  border-color: #98A2B3;
  color: var(--cream);
  background: #F9FAFB;
}

.modal-btn-cancel:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.modal-btn-confirm {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 22px;
  border: 1px solid;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: normal;
  transition: all .2s;
}

.modal-btn-confirm svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.confirm-in {
  background: #4338CA;
  border-color: #4338CA;
  color: #FFFFFF;
}

.confirm-in:hover:not(:disabled) {
  background: #4338CA;
  border-color: #4338CA;
  box-shadow: 0 4px 12px rgba(21, 94, 99, 0.20);
}

.confirm-out {
  background: var(--red);
  border-color: var(--red);
  color: #FFFFFF;
}

.confirm-out:hover:not(:disabled) {
  background: #942015;
  border-color: #942015;
  box-shadow: 0 4px 12px rgba(180, 35, 24, 0.20);
}

.confirm-in .btn-spinner,
.confirm-out .btn-spinner {
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #FFFFFF;
}

.modal-btn-confirm:disabled {
  opacity: .45;
  cursor: not-allowed;
}

/* ── Modal transitions ── */
.modal-enter-active {
  transition: all .25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all .18s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.94) translateY(12px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(6px);
}

/* ══════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════ */
.toast-notif {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 100000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  min-width: 280px;
  max-width: 420px;
  box-shadow: 0 16px 40px rgba(16, 24, 40, 0.18);
}

.toast-notif svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.toast-success {
  background: #ECFDF3;
  border: 1px solid var(--green-border);
  color: #067647;
}

.toast-error {
  background: #FEF3F2;
  border: 1px solid var(--red-border);
  color: #B42318;
}

.toast-enter-active {
  transition: all .28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all .2s ease;
}

.toast-enter-from {
  transform: translateY(16px);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(8px);
  opacity: 0;
}

/* ══════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .attendance-page {
    padding: 20px 16px;
  }

  .clock-card {
    padding: 24px 20px;
    gap: 28px;
  }

  .stats-strip {
    flex-direction: column;
  }

  .stat-tile {
    flex: none;
    padding: 16px 20px;
  }

  .stat-tile-divider {
    width: auto;
    height: 1px;
  }

  .log-time-right {
    display: none;
  }

  .logs-section {
    padding: 20px 16px;
  }

  .meta-strip {
    gap: 8px;
  }

  .today-summary-bar {
    padding: 12px 16px;
  }

  .modal-panel {
    max-width: 100%;
  }

  .modal-header {
    padding: 18px 18px;
  }

  .modal-body {
    padding: 18px 18px;
  }

  .modal-footer {
    padding: 14px 18px;
  }

  .reason-presets {
    gap: 6px;
  }
}

@media (max-width: 560px) {
  .clock-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
    padding: 24px 18px;
  }

  .status-ring-wrap,
  .status-ring {
    width: 100px;
    height: 100px;
  }

  .clock-info {
    align-items: center;
    width: 100%;
  }

  .clock-times {
    justify-content: center;
  }

  .meta-strip {
    justify-content: center;
  }

  .clock-btn {
    width: 100%;
    justify-content: center;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .live-clock {
    align-items: flex-start;
  }
}

@media (max-width: 420px) {
  .attendance-page {
    padding: 16px 12px;
  }

  .header-icon {
    width: 38px;
    height: 38px;
  }

  .page-title {
    font-size: 19px;
  }

  .clock-time {
    font-size: 19px;
  }

  .stat-tile {
    padding: 14px 16px;
    gap: 12px;
  }

  .stat-tile-icon {
    width: 34px;
    height: 34px;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-btn-cancel,
  .modal-btn-confirm {
    width: 100%;
    justify-content: center;
  }

  .toast-notif {
    left: 16px;
    right: 16px;
    bottom: 16px;
    min-width: 0;
  }
}
</style>