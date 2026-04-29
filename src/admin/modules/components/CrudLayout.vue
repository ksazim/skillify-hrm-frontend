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
            <h1 class="page-title">{{ title }}</h1>
            <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
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
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
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
          <svg v-if="banner.type === 'success'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          <!-- error -->
          <svg v-else-if="banner.type === 'error'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          <!-- info / warning -->
          <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
        </div>
        <div class="banner__body">
          <p v-if="banner.title" class="banner__title">{{ banner.title }}</p>
          <p class="banner__message">{{ banner.message }}</p>
        </div>
        <button class="banner__close" @click="closeBanner">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    </Transition>

    <!-- ── Main content area ── -->
    <div class="content-area">

      <!-- Loading state -->
      <div v-if="loading && !hasData" class="state-view">
        <div class="state-view__spinner">
          <svg class="spinner-ring" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke-width="2" class="ring-track"/>
            <circle cx="22" cy="22" r="18" fill="none" stroke-width="2" class="ring-arc" stroke-dasharray="60 54"/>
          </svg>
        </div>
        <p class="state-view__label">{{ loadingMessage }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error && !hasData" class="state-view">
        <div class="state-view__mark state-view__mark--error">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
        </div>
        <p class="state-view__title">{{ errorTitle }}</p>
        <p class="state-view__body">{{ error }}</p>
        <button class="btn-retry" @click="$emit('retry')">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/></svg>
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
import { ref, defineExpose, watch, defineProps, defineEmits } from 'vue'

// ── Props ──────────────────────────────────────────────────────────────────────
const props = defineProps({
  // Page header
  title:       { type: String,  required: true },
  subtitle:    { type: String,  default: '' },
  addLabel:    { type: String,  default: '' },        // empty = no add button

  // Breadcrumbs: [{ label, to? }]
  breadcrumbs: { type: Array,   default: () => [] },

  // Header stat pills: [{ label, value }]
  stats:       { type: Array,   default: () => [] },

  // States
  loading:        { type: Boolean, default: false },
  loadingMessage: { type: String,  default: 'Loading data…' },
  error:          { type: String,  default: '' },
  errorTitle:     { type: String,  default: 'Failed to load data' },

  // Whether there is data to show (controls loading/error vs slot rendering)
  hasData:     { type: Boolean, default: false },

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
/* ── Design tokens ── */
.crud-layout {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.09);
  --gold-glow-str:  rgba(201,169,110,0.18);
  --onyx:           #0D0D0F;
  --onyx-2:         #131316;
  --onyx-3:         #1A1A1F;
  --onyx-4:         #222228;
  --onyx-5:         #2C2C33;
  --smoke:          rgba(255,255,255,0.04);
  --smoke-hover:    rgba(255,255,255,0.07);
  --text-primary:   #F0EAE0;
  --text-secondary: rgba(240,234,224,0.55);
  --text-muted:     rgba(240,234,224,0.28);
  --border:         rgba(201,169,110,0.12);
  --border-strong:  rgba(201,169,110,0.28);
  --radius:         0px; /* sharp luxury corners everywhere */

  font-family: 'Jost', 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--onyx-3);
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
  padding: 28px 32px 24px;
  background: var(--onyx-2);
  border-bottom: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

/* subtle top-left gold glow */
.page-header::before {
  content: '';
  position: absolute;
  top: -60px; left: -60px;
  width: 220px; height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201,169,110,0.07) 0%, transparent 70%);
  pointer-events: none;
}

/* thin gold line at top */
.page-header::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--gold-dim) 30%, var(--gold) 50%, var(--gold-dim) 70%, transparent 100%);
}

.page-header__left { display:flex; flex-direction:column; gap:8px; }
.page-header__right { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.breadcrumb__link    { color:var(--gold-dim); text-decoration:none; transition:color .14s; }
.breadcrumb__link:hover { color:var(--gold); }
.breadcrumb__current { color:var(--text-muted); }
.breadcrumb__sep     { color:var(--border-strong); font-size:12px; }

/* Title row */
.page-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.page-icon {
  width: 40px; height: 40px;
  border: 1px solid var(--gold-dim);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold);
  flex-shrink: 0;
  position: relative;
}
.page-icon::before {
  content: '';
  position: absolute; inset: 3px;
  border: 1px solid var(--gold);
  opacity: .25;
}
.page-title {
  font-family: 'Cormorant Garamond','Georgia',serif;
  font-size: 26px; font-weight: 400;
  letter-spacing: .05em;
  color: var(--text-primary);
  margin: 0; line-height: 1.1;
}
.page-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: .08em;
  margin: 3px 0 0;
}

/* Stat pills */
.header-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 14px;
  border: 1px solid var(--border);
  background: var(--smoke);
  gap: 1px;
  min-width: 72px;
}
.stat-pill__value {
  font-family: 'Cormorant Garamond','Georgia',serif;
  font-size: 18px; font-weight: 500;
  color: var(--gold-light);
  letter-spacing: .04em;
  line-height: 1;
}
.stat-pill__label {
  font-size: 8.5px; text-transform: uppercase;
  letter-spacing: .16em;
  color: var(--text-muted);
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Add button */
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--gold-dim), var(--gold));
  color: var(--onyx);
  border: none;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: box-shadow .2s, transform .15s, opacity .15s;
  position: relative;
  overflow: hidden;
}
.btn-add::before {
  content: '';
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.08);
  opacity: 0;
  transition: opacity .15s;
}
.btn-add:hover::before { opacity: 1; }
.btn-add:hover { box-shadow: 0 4px 20px rgba(201,169,110,0.30); transform: translateY(-1px); }
.btn-add:active { transform: translateY(0); }
.btn-add svg { width:14px; height:14px; flex-shrink:0; }

/* ══════════════════════════════════════
   FILTER BAR
══════════════════════════════════════ */
.filter-bar {
  background: var(--onyx-3);
  /* border-bottom: 1px solid var(--border); */
  padding: 16px 0;
}
/* .filter-bar__inner {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
} */

/* ══════════════════════════════════════
   BANNER NOTIFICATION
══════════════════════════════════════ */
.banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 32px;
  border-left: 3px solid;
  font-size: 13px;
  letter-spacing: .02em;
  position: relative;
}
.banner--success { background:rgba(29,158,117,0.08); border-color:rgba(29,158,117,0.5); }
.banner--error   { background:rgba(201,60,60,0.08);  border-color:rgba(201,60,60,0.5);  }
.banner--info    { background:var(--gold-glow);       border-color:var(--gold-dim);       }
.banner--warning { background:rgba(186,117,23,0.08); border-color:rgba(186,117,23,0.5); }

.banner__icon svg { width:16px; height:16px; flex-shrink:0; margin-top:1px; }
.banner--success .banner__icon svg { color:#5DCAA5; }
.banner--error   .banner__icon svg { color:#F09595; }
.banner--info    .banner__icon svg { color:var(--gold); }
.banner--warning .banner__icon svg { color:#EF9F27; }

.banner__body { flex:1; min-width:0; }
.banner__title   { font-weight:500; color:var(--text-primary); margin:0 0 2px; font-size:13px; }
.banner__message { color:var(--text-secondary); margin:0; }

.banner__close {
  width:24px; height:24px;
  background:none; border:none;
  color:var(--text-muted);
  cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
  transition:color .14s;
  padding:0;
}
.banner__close:hover { color:var(--text-primary); }
.banner__close svg   { width:12px; height:12px; }

/* ══════════════════════════════════════
   CONTENT AREA
══════════════════════════════════════ */
.content-area {
  flex: 1;
}

/* ── Loading / Error / Empty states ── */
.state-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  text-align: center;
  gap: 16px;
}

/* Spinner */
.state-view__spinner { width:48px; height:48px; }
.spinner-ring { width:100%; height:100%; animation: spin .9s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.ring-track { stroke:var(--border-strong); }
.ring-arc   { stroke:var(--gold); stroke-linecap:round; transform-origin:center; }

/* State mark (error icon box) */
.state-view__mark {
  width: 52px; height: 52px;
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.state-view__mark::before {
  content: '';
  position: absolute; inset: 4px;
  border: 1px solid;
  opacity: .3;
}
.state-view__mark--error { border-color:rgba(240,149,149,0.4); }
.state-view__mark--error::before { border-color:rgba(240,149,149,0.6); }
.state-view__mark--error svg { width:22px; height:22px; color:#F09595; }

.state-view__label { font-size:12px; color:var(--text-muted); letter-spacing:.1em; text-transform:uppercase; margin:0; }
.state-view__title {
  font-family:'Cormorant Garamond','Georgia',serif;
  font-size:20px; font-weight:400;
  color:var(--text-secondary); margin:0;
  letter-spacing:.04em;
}
.state-view__body  { font-size:12.5px; color:var(--text-muted); letter-spacing:.04em; margin:0; }

/* Retry button */
.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
  margin-top: 8px;
}
.btn-retry:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-glow); }
.btn-retry svg   { width:13px; height:13px; }

/* ══════════════════════════════════════
   PAGINATION BAR
══════════════════════════════════════ */
.pagination-bar {
  padding: 16px 32px;
  border-top: 1px solid var(--border);
  background: var(--onyx-2);
}

/* ── Banner transition ── */
.banner-enter-active { transition:max-height .22s ease, opacity .18s ease, transform .18s ease; max-height:120px; overflow:hidden; }
.banner-leave-active { transition:max-height .18s ease, opacity .14s ease; }
.banner-enter-from   { max-height:0; opacity:0; transform:translateY(-4px); }
.banner-leave-to     { max-height:0; opacity:0; }

/* ── Responsive ── */
@media (max-width:768px) {
  .page-header  { padding:20px 20px 18px; }
  .filter-bar   { padding:14px 20px; }
  .content-area { padding:20px; }
  .pagination-bar { padding:14px 20px; }
  .page-title   { font-size:22px; }
  .page-header__right { width:100%; justify-content:flex-start; }
  .header-stats { display:none; }
}
</style>