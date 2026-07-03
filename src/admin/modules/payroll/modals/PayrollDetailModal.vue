<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue && payroll" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-panel modal-panel--wide">
          <div class="modal-panel__head">
            <div class="modal-panel__head-left">
              <AvatarInitials :name="payroll.employee?.user?.name" size="lg" />
              <div>
                <h2 class="modal-panel__title">{{ payroll.employee?.user?.name ?? 'Employee' }}</h2>
                <p class="modal-panel__subtitle">
                  Payslip · {{ monthName(payroll.month) }} {{ payroll.year }}
                  <StatusBadge :status="payroll.status" class="modal-panel__badge" />
                </p>
              </div>
            </div>
            <button class="modal-panel__close" @click="$emit('update:modelValue', false)">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
            </button>
          </div>

          <div class="modal-panel__body">
            <div class="summary-strip">
              <div class="summary-strip__item">
                <span class="summary-strip__label">Gross Salary</span>
                <span class="summary-strip__value">{{ formatCurrency(payroll.gross_salary) }}</span>
              </div>
              <div class="summary-strip__sep" />
              <div class="summary-strip__item">
                <span class="summary-strip__label">Deductions</span>
                <span class="summary-strip__value summary-strip__value--red">−{{ formatCurrency((payroll.late_deduction || 0) + (payroll.leave_deduction || 0)) }}</span>
              </div>
              <div class="summary-strip__sep" />
              <div class="summary-strip__item">
                <span class="summary-strip__label">Overtime + Bonus</span>
                <span class="summary-strip__value summary-strip__value--green">+{{ formatCurrency((payroll.overtime_amount || 0) + (payroll.bonus_amount || 0)) }}</span>
              </div>
              <div class="summary-strip__sep" />
              <div class="summary-strip__item summary-strip__item--net">
                <span class="summary-strip__label">Net Salary</span>
                <span class="summary-strip__value summary-strip__value--accent">{{ formatCurrency(payroll.net_salary) }}</span>
              </div>
            </div>

            <div class="breakdown-grid">
              <div class="breakdown-col">
                <div class="section-title"><span class="dot dot--green" />Earnings</div>
                <div class="breakdown-list">
                  <div v-for="item in earnings" :key="item.title" class="breakdown-row">
                    <span class="breakdown-row__label">{{ item.title }}</span>
                    <span class="breakdown-row__value breakdown-row__value--green">{{ formatCurrency(item.amount) }}</span>
                  </div>
                  <div v-if="!earnings.length" class="breakdown-empty">No earnings items</div>
                </div>
              </div>
              <div class="breakdown-col">
                <div class="section-title"><span class="dot dot--red" />Deductions</div>
                <div class="breakdown-list">
                  <div v-for="item in deductions" :key="item.title" class="breakdown-row">
                    <span class="breakdown-row__label">{{ item.title }}</span>
                    <span class="breakdown-row__value breakdown-row__value--red">−{{ formatCurrency(item.amount) }}</span>
                  </div>
                  <div v-if="!deductions.length" class="breakdown-empty">No deductions</div>
                </div>
              </div>
            </div>

            <div v-if="payroll.paid_at" class="paid-stamp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Paid on {{ formatDate(payroll.paid_at) }}
            </div>
          </div>

          <div class="modal-panel__foot">
            <button class="btn btn--ghost" @click="$emit('update:modelValue', false)">Close</button>
            <button class="btn btn--success-outline" @click="$emit('share-payslip', payroll)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Download Payslip
            </button>
            <button
              v-if="payroll.status === 'draft' && isAdmin"
              class="btn btn--primary"
              @click="$emit('mark-paid', payroll)"
            >
              Mark as Paid
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency, formatDate, monthName } from '@/utils/formatters'
import AvatarInitials from '../ui/AvatarInitials.vue'
import StatusBadge from '../ui/StatusBadge.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  payroll:    { type: Object, default: null },
  isAdmin:    { type: Boolean, default: false }
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
.modal-panel__badge { margin-left: 8px; vertical-align: middle; }

.summary-strip {
  display: flex;
  flex-wrap: wrap;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  margin-bottom: 1.5rem;
  overflow: hidden;
}
.summary-strip__item { flex: 1; min-width: 110px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.summary-strip__item--net { background: var(--primary-light); }
.summary-strip__sep { width: 1px; background: var(--border); align-self: stretch; }
.summary-strip__label { font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--text-3); }
.summary-strip__value { font-size: 14px; font-weight: 700; color: var(--text-1); }
.summary-strip__value--red { color: var(--red-text); }
.summary-strip__value--green { color: var(--green-text); }
.summary-strip__value--accent { color: var(--primary); font-size: 16px; }

.breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
.breakdown-list { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
.breakdown-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 12px; border-bottom: 1px solid var(--border); font-size: 12.5px;
}
.breakdown-row:last-child { border-bottom: none; }
.breakdown-row__label { color: var(--text-2); }
.breakdown-row__value { font-weight: 600; color: var(--text-1); }
.breakdown-row__value--green { color: var(--green-text); }
.breakdown-row__value--red { color: var(--red-text); }
.breakdown-empty { padding: 14px; font-size: 12px; color: var(--text-3); font-style: italic; }

.paid-stamp {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--green-text);
  background: var(--green-bg); border: 1px solid var(--green-border);
  border-radius: 999px; padding: 6px 14px;
}

@media (max-width: 640px) {
  .breakdown-grid { grid-template-columns: 1fr; }
  .summary-strip__sep { display: none; }
}
</style>
