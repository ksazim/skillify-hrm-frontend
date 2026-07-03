<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-bar__tab"
      :class="{ 'tab-bar__tab--active': activeTab === tab.key }"
      @click="$emit('change', tab.key)"
    >
      {{ tab.label }}
      <span v-if="tab.badge" class="tab-bar__badge">{{ tab.badge }}</span>
    </button>

    <div class="tab-bar__spacer" />

    <div v-if="showSearch" class="search-input">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        :value="searchQuery"
        type="text"
        placeholder="Search employees…"
        @input="$emit('update:searchQuery', $event.target.value)"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  tabs:        { type: Array, required: true }, // [{ key, label, badge }]
  activeTab:   { type: String, required: true },
  searchQuery: { type: String, default: '' },
  showSearch:  { type: Boolean, default: true }
})
defineEmits(['change', 'update:searchQuery'])
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.tab-bar__tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 4px;
  margin-right: 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  color: var(--text-3);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color .15s, border-color .15s;
  white-space: nowrap;
  font-family: inherit;
}
.tab-bar__tab:hover { color: var(--text-2); }
.tab-bar__tab--active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-bar__badge {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: var(--surface-2);
  color: var(--text-3);
}
.tab-bar__tab--active .tab-bar__badge {
  background: var(--primary-light);
  color: var(--primary);
}
.tab-bar__spacer { flex: 1; }

.search-input {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  margin-bottom: 8px;
  color: var(--text-3);
}
.search-input input {
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-1);
  font-size: 13px;
  font-family: inherit;
  padding: 8px 0;
  width: 180px;
}
.search-input input::placeholder { color: var(--text-3); }

@media (max-width: 640px) {
  .search-input { width: 100%; margin-bottom: 10px; }
  .search-input input { width: 100%; }
}
</style>
