<template>
  <div class="loading-state">
    <span class="loading-state__spinner" />
    {{ message }}
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: 'Loading…' }
})
</script>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3.5rem;
  font-size: 13px;
  color: var(--text-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.loading-state__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--primary-border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
