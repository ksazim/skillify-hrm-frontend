<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="pagination__btn" :disabled="currentPage === 1" @click="$emit('update:currentPage', currentPage - 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6" /></svg>
    </button>
    <span class="pagination__info">Page {{ currentPage }} of {{ totalPages }}</span>
    <button class="pagination__btn" :disabled="currentPage === totalPages" @click="$emit('update:currentPage', currentPage + 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6" /></svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentPage: { type: Number, required: true },
  totalPages:  { type: Number, required: true }
})
defineEmits(['update:currentPage'])
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 1.5rem;
}
.pagination__btn {
  width: 30px;
  height: 30px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  transition: all .15s;
}
.pagination__btn:hover:not(:disabled) { border-color: var(--primary-border); color: var(--primary); }
.pagination__btn:disabled { opacity: .35; cursor: not-allowed; }
.pagination__info { font-size: 12px; color: var(--text-3); font-weight: 500; }
</style>
