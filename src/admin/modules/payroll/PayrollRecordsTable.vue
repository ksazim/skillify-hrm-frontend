<template>
  <div>
    <LoadingState v-if="isLoading" message="Loading payroll data…" />
    <ErrorState v-else-if="hasError" :message="errorMessage" @retry="$emit('retry')" />

    <template v-else>
      <div class="table-card">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th class="ta-r">Gross</th>
                <th class="ta-r">Deductions</th>
                <th class="ta-r hide-sm">Overtime / Bonus</th>
                <th class="ta-r">Net Pay</th>
                <th class="ta-c">Status</th>
                <th class="ta-c">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rows.length === 0">
                <td colspan="8">
                  <EmptyState title="No payroll records found" subtitle="Try adjusting your filters or search." />
                </td>
              </tr>
              <tr v-for="row in rows" :key="row.id" class="data-row" @click="$emit('open-detail', row)">
                <td>
                  <div class="employee-cell">
                    <AvatarInitials :name="row.employee?.user?.name" size="md" />
                    <div>
                      <span class="employee-cell__name">{{ row.employee?.user?.name ?? '—' }}</span>
                      <span class="employee-cell__id">#{{ String(row.employee_id).padStart(4, '0') }}</span>
                    </div>
                  </div>
                </td>
                <td><span class="period-chip">{{ monthName(row.month) }} {{ row.year }}</span></td>
                <td class="ta-r num">{{ formatCurrency(row.gross_salary) }}</td>
                <td class="ta-r num num--red">−{{ formatCurrency((row.late_deduction || 0) + (row.leave_deduction || 0))
                }}</td>
                <td class="ta-r num num--green hide-sm">+{{ formatCurrency((row.overtime_amount || 0) +
                  (row.bonus_amount || 0)) }}</td>
                <td class="ta-r num num--primary">{{ formatCurrency(row.net_salary) }}</td>
                <td class="ta-c">
                  <StatusBadge :status="row.status" />
                </td>
                <td class="ta-c" @click.stop>
                  <div class="row-actions">
                    <button class="icon-btn icon-btn--view" title="View Details" @click="$emit('open-detail', row)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button class="icon-btn icon-btn--slip" title="Download Payslip"
                      @click="$emit('share-payslip', row)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </button>
                    <button v-if="row.status === 'draft' && isAdmin" class="icon-btn icon-btn--pay" title="Mark as Paid"
                      @click="$emit('mark-paid', row)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button v-if="row.status !== 'paid' && isAdmin" class="icon-btn icon-btn--del" title="Delete"
                      @click="$emit('delete', row)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <PayrollPagination :current-page="currentPage" :total-pages="totalPages"
        @update:current-page="$emit('update:currentPage', $event)" />
    </template>
  </div>
</template>

<script setup>
import { formatCurrency, monthName } from '@/utils/formatters'
import PayrollPagination from './PayrollPagination.vue'
import AvatarInitials from './ui/AvatarInitials.vue'
import EmptyState from './ui/EmptyState.vue'
import ErrorState from './ui/ErrorState.vue'
import LoadingState from './ui/LoadingState.vue'
import StatusBadge from './ui/StatusBadge.vue'

defineProps({
  rows: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  hasError: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 }
})

defineEmits(['open-detail', 'share-payslip', 'mark-paid', 'delete', 'retry', 'update:currentPage'])
</script>

<style scoped>
.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 760px;
}

.data-table thead tr {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.data-table th {
  padding: 0.9rem 1rem;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-2);
  text-align: left;
  white-space: nowrap;
}

.data-row {
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease;
  cursor: pointer;
}

.data-row:hover {
  background: var(--surface-2);
}

.data-row:last-child {
  border-bottom: none;
}

.data-table td {
  padding: 0.9rem 1rem;
  color: var(--text-2);
  vertical-align: middle;
}

.ta-r {
  text-align: right;
}

.ta-c {
  text-align: center;
}

/* ── Employee Cell ─────────────────────────────────────────── */
.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-cell__name {
  display: block;
  font-size: 14px;
  color: var(--text-1);
  font-weight: 600;
}

.employee-cell__id {
  display: block;
  font-size: 11px;
  color: var(--text-3);
  margin-top: 1px;
}

.period-chip {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 10px;
  white-space: nowrap;
}

/* ── Numbers ────────────────────────────────────────────────── */
.num {
  font-weight: 600;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

.num--red {
  color: var(--red-text);
}

.num--green {
  color: var(--green-text);
}

.num--primary {
  color: var(--primary);
}

/* ── Action Buttons ────────────────────────────────────────── */
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-3);
  transition: all 0.2s ease;
  position: relative;
  padding: 0;
}

.icon-btn svg {
  transition: transform 0.2s ease;
}

.icon-btn:hover {
  transform: translateY(-1px);
}

.icon-btn:active {
  transform: scale(0.95);
}

/* View Button */
.icon-btn--view {
  border-color: var(--border);

  background: var(--blue-bg);
  color: var(--blue-text);
  border-color: var(--blue-border);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.icon-btn--view:hover {
  background: var(--blue-bg);
  color: var(--blue-text);
  border-color: var(--blue-border);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.icon-btn--view:hover svg {
  transform: scale(1.1);
}

/* Payslip Button */
.icon-btn--slip {
  /* border-color: var(--border);
  color: var(--text-3); */

  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.icon-btn--slip:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.icon-btn--slip:hover svg {
  transform: scale(1.1);
}

/* Pay Button */
.icon-btn--pay {
  /* border-color: var(--border);
  color: var(--text-3); */

  background: var(--green-bg);
  color: var(--green-text);
  border-color: var(--green-border);
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);
}

.icon-btn--pay:hover {
  background: var(--green-bg);
  color: var(--green-text);
  border-color: var(--green-border);
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);
}

.icon-btn--pay:hover svg {
  transform: scale(1.15);
}

/* Delete Button */
.icon-btn--del {
  /* border-color: var(--border);
  color: var(--text-3); */

  background: var(--red-bg);
  color: var(--red-text);
  border-color: var(--red-border);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
}

.icon-btn--del:hover {
  background: var(--red-bg);
  color: var(--red-text);
  border-color: var(--red-border);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
}

.icon-btn--del:hover svg {
  transform: scale(1.1);
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 900px) {
  .hide-sm {
    display: none;
  }
}

@media (max-width: 640px) {
  .icon-btn {
    width: 28px;
    height: 28px;
  }

  .icon-btn svg {
    width: 14px;
    height: 14px;
  }

  .row-actions {
    gap: 4px;
  }

  .data-table td,
  .data-table th {
    padding: 0.6rem 0.7rem;
    font-size: 12px;
  }

  .employee-cell__name {
    font-size: 13px;
  }
}
</style>


<!-- <template>
  <div>
    <LoadingState v-if="isLoading" message="Loading payroll data…" />
    <ErrorState v-else-if="hasError" :message="errorMessage" @retry="$emit('retry')" />

    <template v-else>
      <div class="table-card">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th class="ta-r">Gross</th>
                <th class="ta-r">Deductions</th>
                <th class="ta-r hide-sm">Overtime / Bonus</th>
                <th class="ta-r">Net Pay</th>
                <th class="ta-c">Status</th>
                <th class="ta-c">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rows.length === 0">
                <td colspan="8">
                  <EmptyState title="No payroll records found" subtitle="Try adjusting your filters or search." />
                </td>
              </tr>
              <tr v-for="row in rows" :key="row.id" class="data-row" @click="$emit('open-detail', row)">
                <td>
                  <div class="employee-cell">
                    <AvatarInitials :name="row.employee?.user?.name" size="md" />
                    <div>
                      <span class="employee-cell__name">{{ row.employee?.user?.name ?? '—' }}</span>
                      <span class="employee-cell__id">#{{ String(row.employee_id).padStart(4, '0') }}</span>
                    </div>
                  </div>
                </td>
                <td><span class="period-chip">{{ monthName(row.month) }} {{ row.year }}</span></td>
                <td class="ta-r num">{{ formatCurrency(row.gross_salary) }}</td>
                <td class="ta-r num num--red">−{{ formatCurrency((row.late_deduction || 0) + (row.leave_deduction || 0))
                  }}</td>
                <td class="ta-r num num--green hide-sm">+{{ formatCurrency((row.overtime_amount || 0) +
                  (row.bonus_amount || 0)) }}</td>
                <td class="ta-r num num--primary">{{ formatCurrency(row.net_salary) }}</td>
                <td class="ta-c">
                  <StatusBadge :status="row.status" />
                </td>
                <td class="ta-c" @click.stop>
                  <div class="row-actions">
                    <button class="icon-btn icon-btn--view" title="View" @click="$emit('open-detail', row)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button class="icon-btn icon-btn--slip" title="Download Payslip"
                      @click="$emit('share-payslip', row)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button v-if="row.status === 'draft' && isAdmin" class="icon-btn icon-btn--pay" title="Mark as Paid"
                      @click="$emit('mark-paid', row)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button v-if="row.status !== 'paid' && isAdmin" class="icon-btn icon-btn--del" title="Delete"
                      @click="$emit('delete', row)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <PayrollPagination :current-page="currentPage" :total-pages="totalPages"
        @update:current-page="$emit('update:currentPage', $event)" />
    </template>
  </div>
</template>

<script setup>
import { formatCurrency, monthName } from '@/utils/formatters'
import PayrollPagination from './PayrollPagination.vue'
import AvatarInitials from './ui/AvatarInitials.vue'
import EmptyState from './ui/EmptyState.vue'
import ErrorState from './ui/ErrorState.vue'
import LoadingState from './ui/LoadingState.vue'
import StatusBadge from './ui/StatusBadge.vue'

defineProps({
  rows: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  hasError: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 }
})

defineEmits(['open-detail', 'share-payslip', 'mark-paid', 'delete', 'retry', 'update:currentPage'])
</script>

<style scoped>
.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 760px;
}

.data-table thead tr {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.data-table th {
  padding: .8rem 1rem;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--text-1);
  text-align: left;
  white-space: nowrap;
}

.data-row {
  border-bottom: 1px solid var(--border);
  transition: background .12s;
  cursor: pointer;
}

.data-row:hover {
  background: var(--surface-2);
}

.data-row:last-child {
  border-bottom: none;
}

.data-table td {
  padding: .8rem 1rem;
  color: var(--text-2);
  vertical-align: middle;
}

.ta-r {
  text-align: right;
}

.ta-c {
  text-align: center;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-cell__name {
  display: block;
  font-size: 14px;
  color: var(--text-1);
  font-weight: 600;
}

.employee-cell__id {
  display: block;
  font-size: 11px;
  color: var(--text-3);
  margin-top: 1px;
}

.period-chip {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 9px;
}

.num {
  font-weight: 600;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

.num--red {
  color: var(--red-text);
}

.num--green {
  color: var(--green-text);
}

.num--primary {
  color: var(--primary);
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-3);
  transition: all .15s;
}

.icon-btn--view:hover {
  background: var(--blue-bg);
  color: var(--blue-text);
  border-color: var(--blue-border);
}

.icon-btn--slip:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
}

.icon-btn--pay:hover {
  background: var(--green-bg);
  color: var(--green-text);
  border-color: var(--green-border);
}

.icon-btn--del:hover {
  background: var(--red-bg);
  color: var(--red-text);
  border-color: var(--red-border);
}

@media (max-width: 900px) {
  .hide-sm {
    display: none;
  }
}
</style> -->
