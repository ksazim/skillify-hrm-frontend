<template>
  <div class="pagination-wrapper" v-if="totalPages > 0">

    <!-- Info row -->
    <div class="pagination-info" v-if="showInfo">
      <span class="showing-text">
        Showing
        <strong>{{ startItem }}</strong>
        –
        <strong>{{ startItem + itemCount - 1 }}</strong>
        of <strong>{{ totalItems }}</strong> {{ itemLabel }}
      </span>

      <div class="items-per-page" v-if="showPageSize">
        <label for="page-size">Items per page:</label>
        <select
          id="page-size"
          :value="pageSize"
          @change="onPageSizeChange"
        >
          <option
            v-for="size in pageSizeOptions"
            :key="size"
            :value="size"
          >{{ size }}</option>
        </select>
      </div>
    </div>

    <!-- Page controls -->
    <div class="pagination-controls">
      <button
        v-if="showFirstLast"
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
        title="First page"
      >
        <span class="btn-icon">⟪</span>
      </button>

      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        title="Previous page"
      >
        <span class="btn-icon">‹</span>
        <span v-if="showLabels" class="btn-label">Previous</span>
      </button>

      <div class="page-numbers">
        <button
          v-if="displayPages[0] > 1"
          class="pagination-btn page-number"
          @click="goToPage(1)"
        >1</button>

        <span v-if="displayPages[0] > 2" class="pagination-ellipsis">…</span>

        <button
          v-for="page in displayPages"
          :key="page"
          :class="['pagination-btn', 'page-number', { active: currentPage === page }]"
          @click="goToPage(page)"
        >{{ page }}</button>

        <span
          v-if="displayPages[displayPages.length - 1] < totalPages - 1"
          class="pagination-ellipsis"
        >…</span>

        <button
          v-if="displayPages[displayPages.length - 1] < totalPages"
          class="pagination-btn page-number"
          @click="goToPage(totalPages)"
        >{{ totalPages }}</button>
      </div>

      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        title="Next page"
      >
        <span v-if="showLabels" class="btn-label">Next</span>
        <span class="btn-icon">›</span>
      </button>

      <button
        v-if="showFirstLast"
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
        title="Last page"
      >
        <span class="btn-icon">⟫</span>
      </button>
    </div>

    <!-- Jump to page -->
    <div class="jump-to-page" v-if="showJumpTo">
      <label for="jump-page">Go to page:</label>
      <input
        type="number"
        id="jump-page"
        :min="1"
        :max="totalPages"
        v-model.number="jumpToPageNumber"
        @keyup.enter="handleJumpToPage"
      />
      <button class="pagination-btn btn-jump" @click="handleJumpToPage">Go</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits, defineProps } from 'vue';

const props = defineProps({
  /** Current page — controlled via v-model */
  modelValue: {
    type: Number,
    required: true,
    validator: (v) => v >= 1
  },
  /** Total items across ALL pages (from server) */
  totalItems: {
    type: Number,
    required: true,
    validator: (v) => v >= 0
  },
  /**
   * Items per page.
   * IMPORTANT: this must be the parent's authoritative value.
   * The component never stores its own copy — it is fully controlled.
   */
  pageSize: {
    type: Number,
    default: 10,
    validator: (v) => v > 0
  },
  /**
   * The actual number of items rendered on the current page.
   * Pass items.length from the parent — reflects what the server returned.
   * Defaults to pageSize so the component works without this prop.
   */
  itemCount: {
    type: Number,
    default: null
  },
  pageSizeOptions: {
    type: Array,
    default: () => [5, 10, 20, 50]
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  },
  showFirstLast: { type: Boolean, default: false },
  showLabels:    { type: Boolean, default: false },
  showInfo:      { type: Boolean, default: true  },
  showPageSize:  { type: Boolean, default: true  },
  showJumpTo:    { type: Boolean, default: false },
  itemLabel:     { type: String,  default: 'items' }
});

const emit = defineEmits(['update:modelValue', 'update:page-size', 'page-change']);

const currentPage = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.totalItems / props.pageSize))
);

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (currentPage.value - 1) * props.pageSize + 1;
});

const itemCount = computed(() => {
  if (props.totalItems === 0) return 0;
  if (props.itemCount !== null) return props.itemCount;
  return Math.min(props.pageSize, props.totalItems - (currentPage.value - 1) * props.pageSize);
});

const displayPages = computed(() => {
  const total   = totalPages.value;
  const current = currentPage.value;
  const max     = props.maxVisiblePages;

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(max / 2);
  let start  = Math.max(current - half, 1);
  let end    = Math.min(start + max - 1, total);

  if (end === total) start = Math.max(total - max + 1, 1);

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const jumpToPageNumber = ref(props.modelValue);
watch(() => props.modelValue, (val) => { jumpToPageNumber.value = val; });

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  currentPage.value = page;
  emit('page-change', page);
};

const onPageSizeChange = (event) => {
  const newSize = Number(event.target.value);
  if (!newSize || newSize < 1) return;
  emit('update:page-size', newSize);
};

const handleJumpToPage = () => {
  const page = jumpToPageNumber.value;
  if (page >= 1 && page <= totalPages.value) {
    goToPage(page);
  } else {
    jumpToPageNumber.value = currentPage.value;
  }
};
</script>

<style scoped>
/* ── Design tokens — mirror DataTable exactly ── */
.pagination-wrapper {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201, 169, 110, 0.08);
  --gold-glow-str:  rgba(201, 169, 110, 0.18);
  --onyx-2:         #131316;
  --onyx-3:         #1A1A1F;
  --onyx-4:         #222228;
  --border:         rgba(201, 169, 110, 0.12);
  --border-strong:  rgba(201, 169, 110, 0.28);
  --text-secondary: rgba(240, 234, 224, 0.55);
  --text-muted:     rgba(240, 234, 224, 0.28);
  font-family: 'Jost', 'Inter', sans-serif;

  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px 24px;
  border-top: 1px solid var(--border);
  background: var(--onyx-2);
  position: relative;
}

/* Bottom gold hairline echoes the table's top accent */
.pagination-wrapper::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  opacity: .45;
}

/* ── Info row ── */
.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.showing-text {
  font-size: 11px;
  letter-spacing: .10em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Numbers inside the label get the Cormorant serif treatment */
.showing-text strong {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--gold-light);
  letter-spacing: .04em;
  font-style: normal;
}

/* ── Items-per-page select ── */
.items-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
}

.items-per-page label {
  font-size: 10px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
}

.items-per-page select {
  appearance: none;
  -webkit-appearance: none;
  padding: 5px 28px 5px 10px;
  background-color: var(--onyx-3);
  /* Custom chevron in gold-dim */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238B6F47' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 9px center;
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 12px;
  letter-spacing: .04em;
  cursor: pointer;
  transition: border-color .15s, background-color .15s;
  min-width: 64px;
}

.items-per-page select:hover {
  border-color: var(--gold);
  background-color: var(--onyx-4);
}

.items-per-page select:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 2px var(--gold-glow-str);
}

.items-per-page select option {
  background: var(--onyx-3);
  color: var(--text-secondary);
}

/* ── Page controls row ── */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.page-numbers {
  display: flex;
  gap: 3px;
  align-items: center;
  margin: 0 6px;
}

/* ── Base button ── */
.pagination-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .06em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: background .14s, color .14s, border-color .14s, transform .12s;
  user-select: none;
  position: relative;
  /* Sharp corners to match the table aesthetic */
  border-radius: 0;
}

.pagination-btn .btn-icon {
  font-size: 15px;
  line-height: 1;
  color: var(--gold-dim);
  transition: color .14s;
}

.pagination-btn:hover:not(:disabled):not(.active) {
  background: var(--gold-glow);
  border-color: var(--gold);
  color: var(--gold-light);
}

.pagination-btn:hover:not(:disabled):not(.active) .btn-icon {
  color: var(--gold);
}

.pagination-btn:disabled {
  opacity: .28;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):active {
  transform: scale(.94);
}

/* ── Active / current page ── */
.pagination-btn.active {
  background: var(--gold-glow-str);
  border-color: var(--gold);
  color: var(--gold-light);
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: .06em;
}

/* Gold top-edge accent identical to the table's row hover bar */
.pagination-btn.active::before {
  content: '';
  position: absolute;
  top: -1px; left: 0; right: 0;
  height: 2px;
  background: var(--gold);
}

.pagination-btn.page-number {
  min-width: 34px;
}

.btn-label {
  font-size: 10px;
  letter-spacing: .10em;
  text-transform: uppercase;
}

/* ── Ellipsis ── */
.pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 34px;
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: .1em;
  cursor: default;
  user-select: none;
}

/* ── Jump-to-page ── */
.jump-to-page {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.jump-to-page label {
  font-size: 10px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.jump-to-page input {
  width: 56px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid var(--border-strong);
  background: var(--onyx-3);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 12px;
  text-align: center;
  letter-spacing: .04em;
  border-radius: 0;
  transition: border-color .15s;
}

.jump-to-page input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 2px var(--gold-glow-str);
}

.btn-jump {
  height: 34px;
  padding: 0 14px;
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
  background: var(--gold-glow);
  border-color: var(--gold);
  color: var(--gold-light);
}

.btn-jump:hover:not(:disabled) {
  background: var(--gold-glow-str);
  color: var(--gold-light);
}

/* Remove number spinners */
.jump-to-page input[type='number']::-webkit-inner-spin-button,
.jump-to-page input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.jump-to-page input[type='number'] { -moz-appearance: textfield; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .pagination-wrapper  { padding: 16px; gap: 14px; }
  .pagination-info     { flex-direction: column; align-items: flex-start; }
  .pagination-controls { width: 100%; overflow-x: auto; padding: 4px 0; }
  .btn-label           { display: none; }
  .jump-to-page        { width: 100%; }
}

@media (max-width: 480px) {
  .pagination-btn      { min-width: 30px; height: 30px; font-size: 10px; }
  .page-numbers        { gap: 2px; }
  .pagination-controls { gap: 3px; }
}
</style>