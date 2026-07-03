<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-panel">
          <!-- Header -->
          <div class="modal-panel__head">
            <div class="modal-panel__head-left">
              <div class="modal-panel__icon modal-panel__icon--primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div>
                <h2 class="modal-panel__title">Generate Payroll</h2>
                <p class="modal-panel__subtitle">Process salary disbursements for the selected period</p>
              </div>
            </div>
            <button class="modal-panel__close" @click="$emit('update:modelValue', false)" aria-label="Close modal">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Notification -->
          <div v-if="notif.show" class="modal-notif" :class="`modal-notif--${notif.type}`" role="alert">
            <span class="modal-notif__icon">
              <svg v-if="notif.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <svg v-else-if="notif.type === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </span>
            {{ notif.message }}
          </div>

          <!-- Body -->
          <div class="modal-panel__body">
            <!-- Company Selector -->
            <div v-if="showCompanySelector" class="form-section">
              <div class="form-section__header">
                <div class="form-section__title-wrapper">
                  <span class="form-section__step">1</span>
                  <h3 class="form-section__title">Select Company</h3>
                </div>
                <span class="form-section__badge">REQUIRED</span>
              </div>

              <div class="form-field">
                <label class="form-field__label">
                  Choose a company to process payroll
                  <span class="form-field__required">*</span>
                </label>
                <div class="form-field__control">
                  <div class="select-container">
                    <select class="form-control" :value="form.company_id"
                      @change="updateField('company_id', Number($event.target.value))" :disabled="companiesLoading">
                      <option :value="0" disabled>— Select a company —</option>
                      <option v-for="c in companies" :key="c.value" :value="c.value">{{ c.label }}</option>
                    </select>
                    <span class="select-arrow">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                          stroke-linejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <div v-if="companiesLoading" class="form-field__loading">
                    <span class="spinner-sm" />
                    <span class="form-field__loading-text">Loading companies...</span>
                  </div>
                </div>
                <div v-if="!companiesLoading && !companies.length" class="form-field__help form-field__help--error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  No companies found. Please configure companies first.
                </div>
              </div>
            </div>

            <!-- Payroll Period -->
            <div class="form-section" :class="{ 'form-section--first': !showCompanySelector }">
              <div class="form-section__header">
                <div class="form-section__title-wrapper">
                  <span class="form-section__step" :class="{ 'form-section__step--single': !showCompanySelector }">
                    {{ showCompanySelector ? '2' : '1' }}
                  </span>
                  <h3 class="form-section__title">Payroll Period</h3>
                </div>
                <span class="form-section__badge form-section__badge--info">REQUIRED</span>
              </div>

              <div class="form-grid">
                <div class="form-field">
                  <label class="form-field__label">
                    Month <span class="form-field__required">*</span>
                  </label>
                  <div class="select-container">
                    <select class="form-control" :value="form.month"
                      @change="updateField('month', Number($event.target.value))">
                      <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
                    </select>
                    <span class="select-arrow">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                          stroke-linejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-field__label">
                    Year <span class="form-field__required">*</span>
                  </label>
                  <div class="select-container">
                    <select class="form-control" :value="form.year"
                      @change="updateField('year', Number($event.target.value))">
                      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                    </select>
                    <span class="select-arrow">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                          stroke-linejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary Cards -->
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-card__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div class="summary-card__content">
                  <span class="summary-card__label">COMPANY</span>
                  <span class="summary-card__value">{{ selectedCompanyName }}</span>
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-card__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div class="summary-card__content">
                  <span class="summary-card__label">PERIOD</span>
                  <span class="summary-card__value">{{ monthName(form.month) }} {{ form.year }}</span>
                </div>
              </div>

              <div class="summary-card summary-card--highlight">
                <div class="summary-card__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20M17 7H7M17 12H7M17 17H7"></path>
                  </svg>
                </div>
                <div class="summary-card__content">
                  <span class="summary-card__label">ESTIMATED NET PAY</span>
                  <span class="summary-card__value summary-card__value--accent">{{ formatCurrency(totalNet) }}</span>
                </div>
              </div>
            </div>

            <!-- Info Banner -->
            <div class="info-banner" role="note">
              <div class="info-banner__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div class="info-banner__content">
                <div class="info-banner__title">Existing Records Will Be Skipped</div>
                <div class="info-banner__text">Any payroll records already existing for the selected period will be
                  automatically skipped during generation.</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-panel__foot">
            <button class="btn btn--ghost" @click="$emit('update:modelValue', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </button>
            <button class="btn btn--primary" :disabled="saving || form.company_id === 0" @click="$emit('submit')">
              <span v-if="saving" class="spinner-sm" />
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              {{ saving ? 'Generating Payroll...' : 'Confirm & Generate' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { formatCurrency, monthName } from '@/utils/formatters'
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  form: { type: Object, required: true },
  companies: { type: Array, default: () => [] },
  companiesLoading: { type: Boolean, default: false },
  showCompanySelector: { type: Boolean, default: false },
  months: { type: Array, required: true },
  years: { type: Array, required: true },
  totalNet: { type: Number, default: 0 },
  saving: { type: Boolean, default: false },
  notif: { type: Object, default: () => ({ show: false, type: 'success', message: '' }) }
})

const emit = defineEmits(['update:modelValue', 'update:form', 'submit'])

const updateField = (key, value) => {
  emit('update:form', { ...props.form, [key]: value })
}

const selectedCompanyName = computed(() => {
  const id = props.form.company_id
  if (!id) return 'Not selected'
  const found = props.companies.find(c => c.value === id)
  return found?.label ?? `Company #${id}`
})
</script>

<style scoped>
/* ── Professional Font Stack ─────────────────────────────── */
.modal-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Form Sections ────────────────────────────────────────── */
.form-section {
  margin-bottom: 32px;
}

.form-section--first {
  margin-top: 4px;
}

.form-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.form-section__title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-section__step {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--text-1);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.form-section__step--single {
  background: var(--primary-light);
  color: var(--primary);
}

.form-section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  margin: 0;
  letter-spacing: -0.01em;
}

.form-section__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 12px;
  background: var(--red-bg);
  color: var(--red-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-section__badge--info {
  background: var(--blue-bg);
  color: var(--blue-text);
}

/* ── Form Fields ──────────────────────────────────────────── */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  letter-spacing: -0.01em;
}

.form-field__required {
  color: var(--red-text);
  margin-left: 2px;
}

.form-field__control {
  position: relative;
}

.form-field__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--blue-bg);
  border-radius: var(--radius-sm);
  color: var(--blue-text);
  font-size: 13px;
}

.form-field__loading-text {
  font-weight: 500;
}

.form-field__help {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-3);
  margin-top: 6px;
  padding: 8px 12px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.form-field__help--error {
  color: var(--red-text);
  background: var(--red-bg);
}

/* ── Professional Select Container ────────────────────────── */
.select-container {
  position: relative;
  width: 100%;
  border: 1px solid gray;
  border-radius: 5px;
  /* background: #DDDDDD; */
}

.select-container .form-control {
  padding-right: 44px;
}

.select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-3);
  display: flex;
  align-items: center;
  transition: color 0.15s ease;
}

.select-container:hover .select-arrow {
  color: var(--text-2);
}

.select-container .form-control:focus~.select-arrow {
  color: var(--primary);
}

/* ── Professional Select Dropdown ──────────────────────────── */
.form-control {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-1);
  font-size: 14px;
  font-family: inherit;
  padding: 10px 14px;
  outline: none;
  width: 100%;
  height: 44px;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.form-control:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
  background: var(--surface);
}

.form-control:disabled {
  background: var(--surface-2);
  cursor: not-allowed;
  opacity: 0.7;
}

/* ── Professional Dropdown List Styling ────────────────────── */
.form-control option {
  padding: 10px 16px;
  font-size: 14px;
  font-family: inherit;
  background: var(--surface);
  color: var(--text-1);
  min-height: 40px;
  border-bottom: 1px solid var(--border);
  transition: all 0.15s ease;
}

.form-control option:last-child {
  border-bottom: none;
}

.form-control option:hover,
.form-control option:checked {
  background: var(--primary-light) !important;
  color: var(--primary);
}

.form-control option:disabled {
  color: var(--text-3);
  background: var(--surface-2);
  cursor: not-allowed;
}

.form-control optgroup {
  font-weight: 600;
  color: var(--text-2);
  background: var(--surface-2);
  padding: 8px 16px;
}

/* ── Form Grid ────────────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ── Summary Cards ─────────────────────────────────────────── */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin: 24px 0;
}

.summary-card {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.15s ease;
}

.summary-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-xs);
}

.summary-card--highlight {
  background: var(--primary-light);
  border-color: var(--primary-border);
}

.summary-card--highlight:hover {
  border-color: var(--primary);
}

.summary-card__icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
}

.summary-card--highlight .summary-card__icon {
  background: var(--primary);
  color: white;
}

.summary-card__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.summary-card__label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3);
}

.summary-card__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.summary-card__value--accent {
  color: var(--primary);
  font-size: 16px;
}

/* ── Info Banner ──────────────────────────────────────────── */
.info-banner {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: var(--amber-bg);
  border: 2px solid var(--amber-border);
  border-radius: var(--radius-md);
  margin-top: 8px;
}

.info-banner__icon {
  flex-shrink: 0;
  color: var(--amber-text);
  margin-top: 1px;
}

.info-banner__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--amber-text);
  letter-spacing: -0.01em;
}

.info-banner__text {
  font-size: 13px;
  color: var(--amber-text);
  line-height: 1.5;
  opacity: 0.9;
}

/* ── Notification ──────────────────────────────────────────── */
.modal-notif {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
  border-bottom: 2px solid transparent;
  letter-spacing: -0.01em;
}

.modal-notif__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.modal-notif--success {
  background: var(--green-bg);
  color: var(--green-text);
  border-bottom-color: var(--green-border);
}

.modal-notif--error {
  background: var(--red-bg);
  color: var(--red-text);
  border-bottom-color: var(--red-border);
}

/* ── Modal Enhancements ────────────────────────────────────── */
.modal-panel {
  border-radius: 14px;
}

.modal-panel__icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-panel__icon--primary {
  background: var(--primary-light);
  color: var(--primary);
}

.modal-panel__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
  letter-spacing: -0.02em;
}

.modal-panel__subtitle {
  font-size: 13px;
  color: var(--text-3);
  margin: 2px 0 0;
  letter-spacing: -0.01em;
}

.modal-panel__close {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.modal-panel__close:hover {
  border-color: var(--text-2);
  color: var(--text-1);
  background: var(--surface-2);
  transform: rotate(90deg);
}

/* ── Buttons ────────────────────────────────────────────────── */
.btn {
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  font-family: inherit;
  letter-spacing: -0.01em;
  border-radius: 5px;
}

.btn--primary {
  background: var(--primary);
  color: #111;
  border-color: var(--primary);


}

.btn--primary:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.btn--primary:active:not(:disabled) {
  transform: translateY(0px);
}

.btn--ghost {
  background: transparent;
  color: var(--text-2);
  border-color: var(--border);
}

.btn--ghost:hover {
  border-color: var(--border-strong);
  color: var(--text-1);
  background: var(--surface-2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* ── Spinner ───────────────────────────────────────────────── */
.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: payroll-spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes payroll-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Modal Transition ───────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-panel__body {
    padding: 20px;
  }

  .modal-panel__head {
    padding: 16px 20px;
  }

  .modal-panel__foot {
    padding: 14px 20px;
    flex-direction: column-reverse;
    gap: 8px;
  }

  .modal-panel__foot .btn {
    width: 100%;
    justify-content: center;
  }

  .form-section__header {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .modal-panel__head-left {
    flex-wrap: wrap;
  }

  .summary-card {
    padding: 12px 14px;
  }

  .info-banner {
    flex-direction: column;
    padding: 12px 14px;
  }

  .form-control {
    font-size: 13px;
    padding: 8px 36px 8px 12px;
    height: 40px;
  }

  .select-arrow svg {
    width: 10px;
    height: 7px;
  }
}
</style>