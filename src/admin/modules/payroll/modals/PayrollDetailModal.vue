<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue && payroll" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-panel modal-panel--wide">
          <!-- Header -->
          <div class="modal-panel__head">
            <div class="modal-panel__head-left">
              <div class="avatar-wrapper">
                <AvatarInitials :name="payroll.employee?.user?.name" size="lg" />
                <div class="status-indicator" :class="`status-indicator--${payroll.status}`"></div>
              </div>
              <div>
                <h2 class="modal-panel__title">{{ payroll.employee?.user?.name ?? 'Employee' }}</h2>
                <div class="modal-panel__subtitle-wrapper">
                  <span class="modal-panel__period">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {{ monthName(payroll.month) }} {{ payroll.year }}
                  </span>
                  <StatusBadge :status="payroll.status" class="modal-panel__badge" />
                </div>
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

          <!-- Body -->
          <div class="modal-panel__body">
            <!-- Summary Cards -->
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-card__icon summary-card__icon--blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20M17 7H7M17 12H7M17 17H7"></path>
                  </svg>
                </div>
                <div class="summary-card__content">
                  <span class="summary-card__label">Gross Salary</span>
                  <span class="summary-card__value">{{ formatCurrency(payroll.gross_salary) }}</span>
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-card__icon summary-card__icon--red">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <div class="summary-card__content">
                  <span class="summary-card__label">Deductions</span>
                  <span class="summary-card__value summary-card__value--red">−{{ formatCurrency((payroll.late_deduction
                    || 0) + (payroll.leave_deduction || 0)) }}</span>
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-card__icon summary-card__icon--green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div class="summary-card__content">
                  <span class="summary-card__label">Overtime + Bonus</span>
                  <span class="summary-card__value summary-card__value--green">+{{
                    formatCurrency((payroll.overtime_amount || 0) + (payroll.bonus_amount || 0)) }}</span>
                </div>
              </div>

              <div class="summary-card summary-card--highlight">
                <div class="summary-card__icon summary-card__icon--primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div class="summary-card__content">
                  <span class="summary-card__label">Net Salary</span>
                  <span class="summary-card__value summary-card__value--accent">{{ formatCurrency(payroll.net_salary)
                    }}</span>
                </div>
              </div>
            </div>

            <!-- Breakdown Section -->
            <div class="breakdown-section">
              <div class="breakdown-grid">
                <!-- Earnings -->
                <div class="breakdown-col">
                  <div class="breakdown-header">
                    <div class="breakdown-header__icon breakdown-header__icon--green">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <h4 class="breakdown-header__title">Earnings</h4>
                    <span class="breakdown-header__count">{{ earnings.length }}</span>
                  </div>
                  <div class="breakdown-list">
                    <div v-for="item in earnings" :key="item.title" class="breakdown-item">
                      <span class="breakdown-item__label">{{ item.title }}</span>
                      <span class="breakdown-item__value breakdown-item__value--green">+{{ formatCurrency(item.amount)
                        }}</span>
                    </div>
                    <div v-if="!earnings.length" class="breakdown-empty">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>No earnings items</span>
                    </div>
                  </div>
                </div>

                <!-- Deductions -->
                <div class="breakdown-col">
                  <div class="breakdown-header">
                    <div class="breakdown-header__icon breakdown-header__icon--red">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <h4 class="breakdown-header__title">Deductions</h4>
                    <span class="breakdown-header__count">{{ deductions.length }}</span>
                  </div>
                  <div class="breakdown-list">
                    <div v-for="item in deductions" :key="item.title" class="breakdown-item">
                      <span class="breakdown-item__label">{{ item.title }}</span>
                      <span class="breakdown-item__value breakdown-item__value--red">−{{ formatCurrency(item.amount)
                        }}</span>
                    </div>
                    <div v-if="!deductions.length" class="breakdown-empty">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>No deductions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paid Stamp -->
            <div v-if="payroll.paid_at" class="paid-stamp">
              <div class="paid-stamp__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div class="paid-stamp__content">
                <span class="paid-stamp__title">Paid</span>
                <span class="paid-stamp__date">{{ formatDate(payroll.paid_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-panel__foot">
            <button class="btn btn--ghost" @click="$emit('update:modelValue', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Close
            </button>
            <div class="footer-actions">
              <button class="btn btn--download" @click="$emit('share-payslip', payroll)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Payslip
              </button>
              <button v-if="payroll.status === 'draft' && isAdmin" class="btn btn--primary"
                @click="$emit('mark-paid', payroll)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { formatCurrency, formatDate, monthName } from '@/utils/formatters'
import { computed } from 'vue'
import AvatarInitials from '../ui/AvatarInitials.vue'
import StatusBadge from '../ui/StatusBadge.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  payroll: { type: Object, default: null },
  isAdmin: { type: Boolean, default: false }
})
defineEmits(['update:modelValue', 'share-payslip', 'mark-paid'])

const earnings = computed(() =>
  props.payroll?.items?.filter(i => i.type === 'earning') ?? []
)
const deductions = computed(() =>
  props.payroll?.items?.filter(i => i.type === 'deduction') ?? []
)
</script>

<style scoped>
/* ── Modal Panel ────────────────────────────────────────────── */
.modal-panel {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
}

.modal-panel--wide {
  max-width: 820px;
}

/* ── Header ─────────────────────────────────────────────────── */
.modal-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
}

.modal-panel__head-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
}

.status-indicator--draft {
  background: #F59E0B;
}

.status-indicator--paid {
  background: #10B981;
}

.status-indicator--cancelled {
  background: #EF4444;
}

.modal-panel__title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.02em;
}

.modal-panel__subtitle-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.modal-panel__period {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
}

.modal-panel__period svg {
  color: #9CA3AF;
}

.modal-panel__badge {
  margin-left: 0;
}

.modal-panel__close {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1.5px solid #E5E7EB;
  border-radius: 8px;
  color: #9CA3AF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-panel__close:hover {
  border-color: #6B7280;
  color: #111827;
  background: #F3F4F6;
  transform: rotate(90deg);
}

/* ── Body ───────────────────────────────────────────────────── */
.modal-panel__body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

/* ── Summary Grid ──────────────────────────────────────────── */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 28px;
}

.summary-card {
  background: #F9FAFB;
  border: 1.5px solid #E5E7EB;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
}

.summary-card:hover {
  border-color: #D1D5DB;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.summary-card--highlight {
  background: #EEF2FF;
  border-color: #C7D2FE;
}

.summary-card--highlight:hover {
  border-color: #818CF8;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.15);
}

.summary-card__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-card__icon--blue {
  background: #EFF6FF;
  color: #2563EB;
}

.summary-card__icon--red {
  background: #FEF2F2;
  color: #DC2626;
}

.summary-card__icon--green {
  background: #ECFDF5;
  color: #059669;
}

.summary-card__icon--primary {
  background: #EEF2FF;
  color: #4F46E5;
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
  color: #6B7280;
}

.summary-card__value {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}

.summary-card__value--red {
  color: #DC2626;
}

.summary-card__value--green {
  color: #059669;
}

.summary-card__value--accent {
  color: #4F46E5;
  font-size: 17px;
}

/* ── Breakdown Section ─────────────────────────────────────── */
.breakdown-section {
  margin-bottom: 20px;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.breakdown-col {
  display: flex;
  flex-direction: column;
}

.breakdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 0 4px;
}

.breakdown-header__icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.breakdown-header__icon--green {
  background: #ECFDF5;
  color: #059669;
}

.breakdown-header__icon--red {
  background: #FEF2F2;
  color: #DC2626;
}

.breakdown-header__title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
}

.breakdown-header__count {
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  background: #F3F4F6;
  padding: 2px 8px;
  border-radius: 12px;
}

.breakdown-list {
  border: 1.5px solid #E5E7EB;
  border-radius: 10px;
  overflow: hidden;
  background: #FFFFFF;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #F3F4F6;
  transition: background 0.15s ease;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-item:hover {
  background: #F9FAFB;
}

.breakdown-item__label {
  font-size: 13px;
  color: #4B5563;
  font-weight: 500;
}

.breakdown-item__value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.breakdown-item__value--green {
  color: #059669;
}

.breakdown-item__value--red {
  color: #DC2626;
}

.breakdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  color: #9CA3AF;
  gap: 8px;
}

.breakdown-empty svg {
  color: #D1D5DB;
}

.breakdown-empty span {
  font-size: 13px;
  font-weight: 500;
}

/* ── Paid Stamp ────────────────────────────────────────────── */
.paid-stamp {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #ECFDF5;
  border: 1.5px solid #A7F3D0;
  border-radius: 10px;
  padding: 10px 16px;
  margin-top: 4px;
}

.paid-stamp__icon {
  flex-shrink: 0;
  color: #059669;
}

.paid-stamp__content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.paid-stamp__title {
  font-size: 13px;
  font-weight: 700;
  color: #059669;
  letter-spacing: 0.02em;
}

.paid-stamp__date {
  font-size: 13px;
  font-weight: 500;
  color: #047857;
}

/* ── Footer ─────────────────────────────────────────────────── */
.modal-panel__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 28px;
  border-top: 1px solid #E5E7EB;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── Buttons ────────────────────────────────────────────────── */
.btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  border: 1.5px solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  font-family: inherit;
  letter-spacing: -0.01em;
  cursor: pointer;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Ghost Button */
.btn--ghost {
  background: transparent;
  color: #6B7280;
  border-color: #E5E7EB;
}

.btn--ghost:hover:not(:disabled) {
  color: #111827;
  border-color: #D1D5DB;
  background: #F9FAFB;
  transform: translateY(-1px);
}

.btn--ghost:active:not(:disabled) {
  transform: translateY(0px) scale(0.98);
}

/* Download Button */
.btn--download {
  background: #EEF2FF;
  color: #4F46E5;
  border-color: #C7D2FE;
}

.btn--download:hover:not(:disabled) {
  background: #E0E7FF;
  border-color: #818CF8;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.15);
}

.btn--download:active:not(:disabled) {
  transform: translateY(0px) scale(0.98);
}

/* Primary Button */
.btn--primary {
  background: #4F46E5;
  color: #FFFFFF;
  border-color: #4F46E5;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.btn--primary:hover:not(:disabled) {
  background: #4338CA;
  border-color: #4338CA;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
}

.btn--primary:active:not(:disabled) {
  transform: translateY(0px) scale(0.98);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

/* ── Modal Transition ──────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(20px) scale(0.98);
  opacity: 0;
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 768px) {
  .modal-panel {
    max-width: 95vw;
    margin: 20px;
  }

  .modal-panel__head {
    padding: 18px 20px;
  }

  .modal-panel__body {
    padding: 18px 20px;
  }

  .modal-panel__foot {
    padding: 14px 20px;
    flex-direction: column-reverse;
  }

  .modal-panel__foot .btn {
    width: 100%;
    justify-content: center;
  }

  .footer-actions {
    width: 100%;
    flex-direction: column;
  }

  .footer-actions .btn {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .breakdown-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .modal-panel__title {
    font-size: 17px;
  }

  .modal-panel__subtitle-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .modal-panel {
    max-width: 100vw;
    margin: 10px;
    border-radius: 12px;
  }

  .modal-panel__head-left {
    flex-wrap: wrap;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card {
    padding: 12px 14px;
  }

  .breakdown-item {
    padding: 8px 12px;
    font-size: 12px;
  }

  .btn {
    font-size: 13px;
    padding: 8px 16px;
    height: 40px;
  }

  .modal-panel__close {
    width: 32px;
    height: 32px;
  }

  .paid-stamp {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>