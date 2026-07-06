<template>
  <div class="crud-layout">

    <!-- ── Page header ── -->
    <div class="page-header">
      <div class="page-header__left">
        <!-- Breadcrumb -->
        <nav v-if="breadcrumbs.length" class="breadcrumb" aria-label="breadcrumb">
          <template v-for="(crumb, i) in breadcrumbs" :key="i">
            <router-link v-if="crumb.to" :to="crumb.to" class="breadcrumb__link">{{ crumb.label }}</router-link>
            <span v-else class="breadcrumb__current">{{ crumb.label }}</span>
            <span v-if="i < breadcrumbs.length - 1" class="breadcrumb__sep">›</span>
          </template>
        </nav>

        <div class="page-title-row">
          <!-- optional icon slot -->
          <div v-if="$slots.icon" class="page-icon">
            <slot name="icon" />
          </div>
          <div class="page-title-text">
            <h1 class="text-page-title">{{ title }}</h1>
            <p v-if="subtitle" class="text-subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </div>

      <div class="page-header__right">
        <!-- Stats pills -->
        <div v-if="stats.length" class="header-stats">
          <div v-for="stat in stats" :key="stat.label" class="stat-pill">
            <span class="stat-pill__value">{{ stat.value }}</span>
            <span class="stat-pill__label">{{ stat.label }}</span>
          </div>
        </div>

        <!-- Primary action & extra actions slot -->
        <div class="header-actions">
          <slot name="header-actions" />
          <button v-if="addLabel" class="btn-add" @click="$emit('add')">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clip-rule="evenodd" />
            </svg>
            {{ addLabel }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Filter / search bar ── -->
    <div v-if="$slots.filters" class="filter-bar">
      <div class="filter-bar__inner">
        <slot name="filters" />
      </div>
    </div>

    <!-- ── Inline notification banner ── -->
    <Transition name="banner">
      <div v-if="banner.show" class="banner" :class="`banner--${banner.type}`">
        <div class="banner__icon">
          <!-- success -->
          <svg v-if="banner.type === 'success'" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
          </svg>
          <!-- error -->
          <svg v-else-if="banner.type === 'error'" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd" />
          </svg>
          <!-- info / warning -->
          <svg v-else viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div class="banner__body">
          <p v-if="banner.title" class="banner__title">{{ banner.title }}</p>
          <p class="banner__message">{{ banner.message }}</p>
        </div>
        <button class="banner__close" @click="closeBanner">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </Transition>

    <!-- ── Main content area ── -->
    <div class="content-area">

      <!-- Loading state -->
      <div v-if="loading && !hasData" class="state-view">
        <div class="state-view__spinner">
          <svg class="spinner-ring" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke-width="2.5" class="ring-track" />
            <circle cx="22" cy="22" r="18" fill="none" stroke-width="2.5" class="ring-arc" stroke-dasharray="60 54" />
          </svg>
        </div>
        <p class="state-view__label">{{ loadingMessage }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error && !hasData" class="state-view">
        <div class="state-view__mark state-view__mark--error">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <p class="state-view__title">{{ errorTitle }}</p>
        <p class="state-view__body">{{ error }}</p>
        <button class="btn-retry" @click="$emit('retry')">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clip-rule="evenodd" />
          </svg>
          Retry
        </button>
      </div>

      <!-- Data slot -->
      <slot v-else />

    </div>

    <!-- ── Pagination slot ── -->
    <div v-if="$slots.pagination" class="pagination-bar">
      <slot name="pagination" />
    </div>

  </div>
</template>

<script setup>
import { defineEmits, defineExpose, defineProps, ref, watch } from 'vue'

// ── Props ──────────────────────────────────────────────────────────────────────
const props = defineProps({
  // Page header
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  addLabel: { type: String, default: '' },        // empty = no add button

  // Breadcrumbs: [{ label, to? }]
  breadcrumbs: { type: Array, default: () => [] },

  // Header stat pills: [{ label, value }]
  stats: { type: Array, default: () => [] },

  // States
  loading: { type: Boolean, default: false },
  loadingMessage: { type: String, default: 'Loading data…' },
  error: { type: String, default: '' },
  errorTitle: { type: String, default: 'Failed to load data' },

  // Whether there is data to show (controls loading/error vs slot rendering)
  hasData: { type: Boolean, default: false },

  // Banner notification (programmatic — or use showBanner() exposed method)
  notification: {
    type: Object,
    default: () => ({ show: false, type: 'info', title: '', message: '' })
  },
})

defineEmits(['add', 'retry'])

// ── Banner state ───────────────────────────────────────────────────────────────
const banner = ref({ show: false, type: 'info', title: '', message: '' })
let bannerTimer = null

// Watch for external notification prop changes
watch(() => props.notification, (n) => {
  if (n?.show && n?.message) showBanner(n.type, n.message, { title: n.title, autoClose: n.autoClose })
}, { deep: true })

function showBanner(type, message, { title = '', autoClose = 0 } = {}) {
  if (bannerTimer) clearTimeout(bannerTimer)
  banner.value = { show: true, type, title, message }
  if (autoClose > 0) bannerTimer = setTimeout(closeBanner, autoClose)
}

function closeBanner() {
  banner.value.show = false
}

// Expose showBanner so parent can call it via template ref
defineExpose({ showBanner })
</script>

<style scoped>
/* ── Light Theme Variables ── */
.crud-layout {
  --primary: #4F46E5;
  --primary-light: #EEF2FF;
  --primary-hover: #4338CA;
  --primary-dark: #4338CA;

  --bg: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-hover: #F1F5F9;
  --bg-active: #EEF2FF;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-light: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --border-focus: #818CF8;

  --success: #10B981;
  --success-light: #ECFDF5;
  --success-border: #A7F3D0;

  --error: #EF4444;
  --error-light: #FEF2F2;
  --error-border: #FECACA;

  --warning: #F59E0B;
  --warning-light: #FFFBEB;
  --warning-border: #FDE68A;

  --info: #3B82F6;
  --info-light: #EFF6FF;
  --info-border: #BFDBFE;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--bg-secondary);
  min-height: 100%;
  color: var(--text-primary);
}

/* ══════════════════════════════════════
   PAGE HEADER
══════════════════════════════════════ */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  padding: 24px 32px 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  position: relative;
}

/* Top accent line */
.page-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 50%, var(--primary) 100%);
  opacity: 0.6;
}

.page-header__left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.page-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.breadcrumb__link {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.breadcrumb__link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.breadcrumb__current {
  color: var(--text-secondary);
  font-weight: 600;
}

.breadcrumb__sep {
  color: var(--border-strong);
  font-size: 14px;
}

/* Title row */
.page-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--primary-light);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.page-icon:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 4px 0 0;
  font-weight: 400;
}

/* Stat pills */
.header-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  gap: 2px;
  min-width: 80px;
  transition: all 0.2s ease;
}

.stat-pill:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.stat-pill__value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.stat-pill__label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Add button */
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--primary);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.btn-add::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-add:hover::before {
  width: 300px;
  height: 300px;
}

.btn-add:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
}

.btn-add:active {
  transform: translateY(0px) scale(0.98);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.btn-add svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ══════════════════════════════════════
   FILTER BAR
══════════════════════════════════════ */
.filter-bar {
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 16px 32px;
}

.filter-bar__inner {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  max-width: 100%;
}

/* ══════════════════════════════════════
   BANNER NOTIFICATION
══════════════════════════════════════ */
.banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 32px;
  border-left: 4px solid;
  border-radius: var(--radius-sm);
  font-size: 14px;
  position: relative;
  margin: 0;
}

.banner--success {
  background: var(--success-light);
  border-color: var(--success);
  color: var(--success);
}

.banner--error {
  background: var(--error-light);
  border-color: var(--error);
  color: var(--error);
}

.banner--info {
  background: var(--info-light);
  border-color: var(--info);
  color: var(--info);
}

.banner--warning {
  background: var(--warning-light);
  border-color: var(--warning);
  color: var(--warning);
}

.banner__icon svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.banner__body {
  flex: 1;
  min-width: 0;
}

.banner__title {
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px;
  font-size: 14px;
}

.banner__message {
  color: var(--text-secondary);
  margin: 0;
  font-size: 13px;
}

.banner__close {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
  padding: 0;
}

.banner__close:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.banner__close svg {
  width: 14px;
  height: 14px;
}

/* ══════════════════════════════════════
   CONTENT AREA
══════════════════════════════════════ */
.content-area {
  flex: 1;
  padding: 0;
}

/* ── Loading / Error / Empty states ── */
.state-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  text-align: center;
  gap: 20px;
}

/* Spinner */
.state-view__spinner {
  width: 56px;
  height: 56px;
}

.spinner-ring {
  width: 100%;
  height: 100%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ring-track {
  stroke: var(--border-strong);
}

.ring-arc {
  stroke: var(--primary);
  stroke-linecap: round;
  transform-origin: center;
}

/* State mark (error icon box) */
.state-view__mark {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  transition: all 0.2s ease;
}

.state-view__mark--error {
  border-color: var(--error-border);
  background: var(--error-light);
}

.state-view__mark--error svg {
  width: 28px;
  height: 28px;
  color: var(--error);
}

.state-view__label {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 500;
  margin: 0;
}

.state-view__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.state-view__body {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  max-width: 480px;
}

/* Retry button */
.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: transparent;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
}

.btn-retry:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-retry:active {
  transform: translateY(0px) scale(0.98);
}

.btn-retry svg {
  width: 16px;
  height: 16px;
}

/* ══════════════════════════════════════
   PAGINATION BAR
══════════════════════════════════════ */
.pagination-bar {
  padding: 16px 32px;
  border-top: 1px solid var(--border);
  background: var(--bg);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

/* ── Banner transition ── */
.banner-enter-active {
  transition: max-height 0.25s ease, opacity 0.2s ease, transform 0.2s ease;
  max-height: 150px;
  overflow: hidden;
}

.banner-leave-active {
  transition: max-height 0.2s ease, opacity 0.15s ease;
  overflow: hidden;
}

.banner-enter-from {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.banner-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .page-header {
    padding: 20px 24px 16px;
  }

  .filter-bar {
    padding: 14px 24px;
  }

  .pagination-bar {
    padding: 14px 24px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px 20px 14px;
  }

  .page-header__right {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .header-stats {
    flex: 1;
    gap: 8px;
  }

  .stat-pill {
    flex: 1;
    min-width: 60px;
    padding: 4px 12px;
  }

  .stat-pill__value {
    font-size: 16px;
  }

  .stat-pill__label {
    font-size: 9px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-icon {
    width: 38px;
    height: 38px;
  }

  .filter-bar {
    padding: 12px 20px;
  }

  .content-area {
    padding: 0;
  }

  .state-view {
    padding: 60px 20px;
  }

  .pagination-bar {
    padding: 12px 20px;
  }

  .header-actions {
    width: 100%;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .banner {
    padding: 12px 20px;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 12px 16px 10px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .page-title-row {
    gap: 10px;
  }

  .page-icon {
    width: 32px;
    height: 32px;
  }

  .page-icon svg {
    width: 16px;
    height: 16px;
  }

  .header-stats {
    flex-wrap: wrap;
  }

  .stat-pill {
    min-width: 50px;
    padding: 3px 8px;
  }

  .stat-pill__value {
    font-size: 14px;
  }

  .stat-pill__label {
    font-size: 8px;
  }

  .filter-bar {
    padding: 10px 16px;
  }

  .pagination-bar {
    padding: 10px 16px;
  }

  .state-view {
    padding: 40px 16px;
    gap: 14px;
  }

  .state-view__title {
    font-size: 18px;
  }

  .state-view__body {
    font-size: 13px;
  }

  .btn-add {
    padding: 8px 16px;
    font-size: 12px;
  }

  .breadcrumb {
    font-size: 10px;
    gap: 4px;
  }

  .banner {
    padding: 10px 16px;
    gap: 10px;
  }

  .banner__title {
    font-size: 13px;
  }

  .banner__message {
    font-size: 12px;
  }
}
</style>