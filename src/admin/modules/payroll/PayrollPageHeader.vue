<template>
  <div class="page-header">
    <div class="page-header__left">
      <div class="page-header__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
        </svg>
      </div>
      <div>
        <h1 class="page-header__title">Payroll</h1>
        <p class="page-header__subtitle">Process payroll, manage deductions and download payslips</p>
      </div>
    </div>
    <button v-if="isAdmin" class="btn btn--primary" @click="$emit('run-payroll')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      Run Payroll
    </button>
  </div>
</template>

<script setup>
defineProps({
  isAdmin: { type: Boolean, default: false }
})
defineEmits(['run-payroll'])
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;
}
.page-header__left { display: flex; align-items: center; gap: 14px; }
.page-header__icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}
.page-header__title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-1);
  margin: 0 0 2px;
  letter-spacing: -.01em;
}
.page-header__subtitle {
  font-size: 13px;
  color: var(--text-3);
  margin: 0;
}

@media (max-width: 640px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .btn { width: 100%; justify-content: center; }
}
</style>
