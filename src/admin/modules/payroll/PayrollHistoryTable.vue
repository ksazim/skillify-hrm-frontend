<template>
  <div class="table-card">
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>Period</th>
            <th class="ta-r">Employees</th>
            <th class="ta-r">Total Gross</th>
            <th class="ta-r">Total Net</th>
            <th class="ta-c">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="5">
              <EmptyState title="No payroll history" subtitle="Generated payroll periods will appear here." />
            </td>
          </tr>
          <tr v-for="row in rows" :key="row.period" class="data-row">
            <td><span class="period-chip">{{ row.period }}</span></td>
            <td class="ta-r num">{{ row.count }}</td>
            <td class="ta-r num">{{ formatCurrency(row.gross) }}</td>
            <td class="ta-r num num--primary">{{ formatCurrency(row.net) }}</td>
            <td class="ta-c">
              <span class="status-pill" :class="row.count > 0 ? 'status-pill--complete' : 'status-pill--empty'">
                {{ row.count > 0 ? 'Complete' : 'Empty' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '@/utils/formatters'
import EmptyState from './ui/EmptyState.vue'
// StatusBadge intentionally not used here — this view uses a
// simple Complete/Empty pill instead of draft/paid semantics.

defineProps({
  rows: { type: Array, required: true }
})
</script>

<style scoped>
.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}
.table-scroll { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 560px; }
.data-table thead tr { background: var(--surface-2); border-bottom: 1px solid var(--border); }
.data-table th {
  padding: .8rem 1rem;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--text-3);
  text-align: left;
}
.data-row { border-bottom: 1px solid var(--border); }
.data-row:last-child { border-bottom: none; }
.data-table td { padding: .8rem 1rem; color: var(--text-2); }
.ta-r { text-align: right; }
.ta-c { text-align: center; }

.period-chip {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 9px;
}
.num { font-weight: 600; color: var(--text-2); font-variant-numeric: tabular-nums; }
.num--primary { color: var(--primary); }

.status-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
}
.status-pill--complete { color: var(--green-text); background: var(--green-bg); border-color: var(--green-border); }
.status-pill--empty    { color: var(--text-3); background: var(--surface-2); border-color: var(--border); }
</style>
