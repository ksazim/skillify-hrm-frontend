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
        <select id="page-size" :value="pageSize" @change="onPageSizeChange">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>

    <!-- Page controls -->
    <div class="pagination-controls">
      <button v-if="showFirstLast" class="pagination-btn" :disabled="currentPage === 1" @click="goToPage(1)"
        title="First page">
        <span class="btn-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd" />
            <path fill-rule="evenodd"
              d="M8.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L4.414 10l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd" />
          </svg>
        </span>
      </button>

      <button class="pagination-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)"
        title="Previous page">
        <span class="btn-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clip-rule="evenodd" />
          </svg>
        </span>
        <span v-if="showLabels" class="btn-label">Previous</span>
      </button>

      <div class="page-numbers">
        <button v-if="displayPages[0] > 1" class="pagination-btn page-number" @click="goToPage(1)">1</button>

        <span v-if="displayPages[0] > 2" class="pagination-ellipsis">…</span>

        <button v-for="page in displayPages" :key="page"
          :class="['pagination-btn', 'page-number', { active: currentPage === page }]" @click="goToPage(page)">{{ page
          }}</button>

        <span v-if="displayPages[displayPages.length - 1] < totalPages - 1" class="pagination-ellipsis">…</span>

        <button v-if="displayPages[displayPages.length - 1] < totalPages" class="pagination-btn page-number"
          @click="goToPage(totalPages)">{{ totalPages }}</button>
      </div>

      <button class="pagination-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)"
        title="Next page">
        <span v-if="showLabels" class="btn-label">Next</span>
        <span class="btn-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
          </svg>
        </span>
      </button>

      <button v-if="showFirstLast" class="pagination-btn" :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)" title="Last page">
        <span class="btn-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
            <path fill-rule="evenodd"
              d="M11.293 15.707a1 1 0 010-1.414L15.586 10 11.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
          </svg>
        </span>
      </button>
    </div>

    <!-- Jump to page -->
    <div class="jump-to-page" v-if="showJumpTo">
      <label for="jump-page">Go to page:</label>
      <input type="number" id="jump-page" :min="1" :max="totalPages" v-model.number="jumpToPageNumber"
        @keyup.enter="handleJumpToPage" />
      <button class="pagination-btn btn-jump" @click="handleJumpToPage">Go</button>
    </div>

  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, ref, watch } from 'vue';

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
  showLabels: { type: Boolean, default: false },
  showInfo: { type: Boolean, default: true },
  showPageSize: { type: Boolean, default: true },
  showJumpTo: { type: Boolean, default: false },
  itemLabel: { type: String, default: 'items' }
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
  const total = totalPages.value;
  const current = currentPage.value;
  const max = props.maxVisiblePages;

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(max / 2);
  let start = Math.max(current - half, 1);
  let end = Math.min(start + max - 1, total);

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
/* ── Light Theme Variables ── */
.pagination-wrapper {
  --primary: #4F46E5;
  --primary-light: #EEF2FF;
  --primary-hover: #4338CA;

  --bg: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-hover: #F1F5F9;
  --bg-active: #EEF2FF;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-light: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --border-focus: #818CF8;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;

  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 24px 20px;
  background: var(--bg);
  border-top: 1px solid var(--border);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
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
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.showing-text strong {
  font-weight: 700;
  color: var(--text-primary);
}

/* ── Items-per-page select ── */
.items-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
}

.items-per-page label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}

.items-per-page select {
  appearance: none;
  -webkit-appearance: none;
  padding: 6px 32px 6px 12px;
  background-color: var(--bg);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 70px;
}

.items-per-page select:hover {
  border-color: var(--border-strong);
}

.items-per-page select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.items-per-page select option {
  background: var(--bg);
  color: var(--text-primary);
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
  gap: 4px;
  align-items: center;
  margin: 0 8px;
}

/* ── Base button ── */
.pagination-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
  user-select: none;
  position: relative;
}

.pagination-btn .btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn .btn-icon svg {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: color 0.15s ease;
}

.pagination-btn:hover:not(:disabled):not(.active) {
  background: var(--bg-hover);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.pagination-btn:hover:not(:disabled):not(.active) .btn-icon svg {
  color: var(--text-secondary);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):active {
  transform: scale(0.95);
}

/* ── Active / current page ── */
.pagination-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #FFFFFF;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.pagination-btn.active:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.pagination-btn.page-number {
  min-width: 36px;
}

.btn-label {
  font-size: 12px;
  font-weight: 500;
}

/* ── Ellipsis ── */
.pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 36px;
  font-size: 14px;
  color: var(--text-muted);
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
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.jump-to-page input {
  width: 60px;
  height: 36px;
  padding: 0 10px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  transition: all 0.15s ease;
}

.jump-to-page input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.jump-to-page input:hover {
  border-color: var(--border-strong);
}

.btn-jump {
  height: 36px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-jump:hover:not(:disabled) {
  background: var(--primary);
  border-color: var(--primary);
  color: #FFFFFF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.btn-jump:active:not(:disabled) {
  transform: translateY(0px) scale(0.95);
}

/* Remove number spinners */
.jump-to-page input[type='number']::-webkit-inner-spin-button,
.jump-to-page input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.jump-to-page input[type='number'] {
  -moz-appearance: textfield;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .pagination-wrapper {
    padding: 12px 16px 16px;
    gap: 12px;
  }

  .pagination-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-controls {
    width: 100%;
    overflow-x: auto;
    padding: 4px 0;
    justify-content: flex-start;
  }

  .btn-label {
    display: none;
  }

  .jump-to-page {
    width: 100%;
    flex-wrap: wrap;
  }

  .pagination-btn {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
    padding: 0 8px;
  }

  .pagination-btn .btn-icon svg {
    width: 14px;
    height: 14px;
  }

  .pagination-btn.page-number {
    min-width: 32px;
  }

  .page-numbers {
    gap: 3px;
  }

  .pagination-ellipsis {
    width: 24px;
    height: 32px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .pagination-wrapper {
    padding: 10px 12px 14px;
  }

  .showing-text {
    font-size: 12px;
  }

  .items-per-page label {
    font-size: 11px;
  }

  .items-per-page select {
    font-size: 12px;
    padding: 4px 28px 4px 8px;
    min-width: 60px;
  }

  .pagination-btn {
    min-width: 28px;
    height: 28px;
    font-size: 11px;
    padding: 0 6px;
    border-width: 1px;
  }

  .pagination-btn .btn-icon svg {
    width: 12px;
    height: 12px;
  }

  .pagination-btn.page-number {
    min-width: 28px;
  }

  .page-numbers {
    gap: 2px;
  }

  .pagination-ellipsis {
    width: 20px;
    height: 28px;
    font-size: 11px;
  }

  .jump-to-page label {
    font-size: 11px;
  }

  .jump-to-page input {
    width: 50px;
    height: 28px;
    font-size: 12px;
    padding: 0 6px;
  }

  .btn-jump {
    height: 28px;
    padding: 0 12px;
    font-size: 11px;
  }
}
</style>