<template>
  <div class="filters-bar">
    <div class="filter-pills">
      <button v-for="s in statusFilters" :key="s.value" class="filter-pills__item"
        :class="{ 'filter-pills__item--active': modelValue === s.value }" @click="$emit('update:modelValue', s.value)">
        {{ s.label }}
        <span class="filter-pills__count">{{ s.count }}</span>
      </button>
    </div>

    <div class="period-filters">
      <select class="select-input" :value="month" @change="$emit('update:month', $event.target.value)">
        <option value="">All Months</option>
        <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
      <select class="select-input" :value="year" @change="$emit('update:year', $event.target.value)">
        <option value="">All Years</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
defineProps({
  statusFilters: { type: Array, required: true },
  modelValue: { type: String, required: true },
  month: { type: [String, Number], default: '' },
  year: { type: [String, Number], default: '' },
  months: { type: Array, required: true },
  years: { type: Array, required: true }
})
defineEmits(['update:modelValue', 'update:month', 'update:year'])
</script>

<style scoped>
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.filter-pills {
  display: flex;
  gap: 4px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 3px;
}

.filter-pills__item {
  background: none;
  border: none;
  border-radius: calc(var(--radius-md) - 3px);
  padding: 7px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  cursor: pointer;
  transition: all .15s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-pills__item:hover {
  color: var(--text-2);
}

.filter-pills__item--active {
  background: var(--surface);
  color: var(--primary);
  box-shadow: var(--shadow-xs);
}

.filter-pills__count {
  font-size: 10px;
  font-weight: 700;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--surface-2);
  color: inherit;
}

.filter-pills__item--active .filter-pills__count {
  background: var(--primary-light);
}

.period-filters {
  display: flex;
  gap: 8px;
}

.select-input {
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 7px 30px 7px 12px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color .15s;
}

.select-input:focus {
  border-color: var(--primary-border);
}

@media (max-width: 640px) {
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-pills {
    overflow-x: auto;
  }

  .period-filters {
    flex-direction: column;
  }

  .select-input {
    width: 100%;
  }
}
</style>
