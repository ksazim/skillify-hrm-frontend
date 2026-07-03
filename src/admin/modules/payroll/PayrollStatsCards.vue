<template>
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-card__label">Employees</span>
      <span class="stat-card__value">{{ employeeCount }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-card__label">Total Gross</span>
      <span class="stat-card__value">{{ formatCurrency(totalGross) }}</span>
    </div>
    <div class="stat-card stat-card--highlight">
      <span class="stat-card__label">Total Net</span>
      <span class="stat-card__value">{{ formatCurrency(totalNet) }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-card__label">Pending</span>
      <span class="stat-card__value">{{ draftCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '@/utils/formatters'

defineProps({
  employeeCount: { type: Number, default: 0 },
  totalGross:    { type: Number, default: 0 },
  totalNet:      { type: Number, default: 0 },
  draftCount:    { type: Number, default: 0 }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 1.75rem;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 1.1rem 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}
.stat-card--highlight {
  background: var(--primary-light);
  border-color: var(--primary-border);
}
.stat-card__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--text-3);
}
.stat-card--highlight .stat-card__label { color: var(--primary); opacity: .8; }
.stat-card__value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -.02em;
}
.stat-card--highlight .stat-card__value { color: var(--primary); }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
