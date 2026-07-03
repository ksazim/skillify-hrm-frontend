<template>
  <span class="status-badge" :class="`status-badge--${status}`">
    <span class="status-badge__dot" />
    {{ status }}
  </span>
</template>

<script setup>
defineProps({
  status: { type: String, required: true } // 'draft' | 'paid'
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .03em;
  text-transform: capitalize;
  border: 1px solid;
  line-height: 1.6;
}
.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-badge--draft {
  color: var(--amber-text);
  background: var(--amber-bg);
  border-color: var(--amber-border);
}
.status-badge--draft .status-badge__dot { background: var(--amber-text); }

.status-badge--paid {
  color: var(--green-text);
  background: var(--green-bg);
  border-color: var(--green-border);
}
.status-badge--paid .status-badge__dot { background: var(--green-text); }
</style>
