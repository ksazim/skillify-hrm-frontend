<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    </div>
    <span class="empty-state__title">{{ title }}</span>
    <span v-if="subtitle" class="empty-state__subtitle">{{ subtitle }}</span>
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, default: 'No records found' },
  subtitle: { type: String, default: '' }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .5rem;
  padding: 3.5rem 1rem;
  color: var(--text-3);
}
.empty-state__icon {
  color: var(--text-3);
  opacity: .5;
  margin-bottom: .25rem;
}
.empty-state__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
}
.empty-state__subtitle {
  font-size: 12px;
  color: var(--text-3);
}
</style>
