<template>
  <div class="error-state">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="error-state__icon">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
    <span class="error-state__message">{{ message }}</span>
    <button class="error-state__retry" @click="$emit('retry')">Retry</button>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: 'Something went wrong.' }
})
defineEmits(['retry'])
</script>

<style scoped>
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 2.5rem;
  font-size: 13px;
  color: var(--red-text);
  background: var(--red-bg);
  border: 1px solid var(--red-border);
  border-radius: var(--radius-lg);
}
.error-state__icon { flex-shrink: 0; }
.error-state__retry {
  margin-left: 8px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  background: #fff;
  border: 1px solid var(--red-border);
  border-radius: var(--radius-sm);
  color: var(--red-text);
  cursor: pointer;
  transition: background .15s;
}
.error-state__retry:hover { background: var(--red-bg); }
</style>
