<template>
  <div class="pagination-wrapper" v-if="totalPages > 1 || totalItems > 0">
    <!-- Info row -->
    <div class="pagination-info" v-if="showInfo">
      <span class="showing-text">
        Showing <strong>{{ startItem }}</strong> to <strong>{{ endItem }}</strong> of <strong>{{ totalItems }}</strong> {{ itemLabel }}
      </span>
      
      <div class="items-per-page" v-if="showPageSize">
        <label for="page-size">Per page:</label>
        <select 
          id="page-size"
          :value="internalPageSize"
          @change="handlePageSizeChange"
        >
          <option 
            v-for="size in pageSizeOptions" 
            :key="size"
            :value="size"
          >
            {{ size }}
          </option>
        </select>
      </div>
    </div>

    <!-- Pagination controls -->
    <div class="pagination-controls" v-if="totalPages > 1">
      <!-- First page -->
      <button
        v-if="showFirstLast"
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
        title="First page"
      >
        <span class="btn-icon">⟪</span>
      </button>

      <!-- Previous -->
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        title="Previous page"
      >
        <span class="btn-icon">‹</span>
        <span v-if="showLabels" class="btn-label">Prev</span>
      </button>

      <!-- Page numbers -->
      <div class="page-numbers">
        <!-- First page if not in visible range -->
        <button
          v-if="displayPages[0] > 1"
          class="pagination-btn page-number"
          @click="goToPage(1)"
        >
          1
        </button>

        <!-- Ellipsis before -->
        <span v-if="displayPages[0] > 2" class="pagination-ellipsis">…</span>

        <!-- Visible pages -->
        <button
          v-for="page in displayPages"
          :key="page"
          :class="['pagination-btn', 'page-number', { active: currentPage === page }]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>

        <!-- Ellipsis after -->
        <span v-if="displayPages[displayPages.length - 1] < totalPages - 1" class="pagination-ellipsis">
          …
        </span>

        <!-- Last page if not in visible range -->
        <button
          v-if="displayPages[displayPages.length - 1] < totalPages"
          class="pagination-btn page-number"
          @click="goToPage(totalPages)"
        >
          {{ totalPages }}
        </button>
      </div>

      <!-- Next -->
      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        title="Next page"
      >
        <span v-if="showLabels" class="btn-label">Next</span>
        <span class="btn-icon">›</span>
      </button>

      <!-- Last page -->
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
    <div class="jump-to-page" v-if="showJumpTo && totalPages > 1">
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
  // v-model: current page number
  modelValue: {
    type: Number,
    required: true
  },
  // Total number of ALL items (not just current page)
  totalItems: {
    type: Number,
    required: true
  },
  // How many items per page
  pageSize: {
    type: Number,
    default: 10
  },
  pageSizeOptions: {
    type: Array,
    default: () => [5, 10, 20, 50]
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  },
  showFirstLast: {
    type: Boolean,
    default: false
  },
  showLabels: {
    type: Boolean,
    default: false
  },
  showInfo: {
    type: Boolean,
    default: true
  },
  showPageSize: {
    type: Boolean,
    default: true
  },
  showJumpTo: {
    type: Boolean,
    default: false
  },
  itemLabel: {
    type: String,
    default: 'items'
  }
});

const emit = defineEmits(['update:modelValue', 'update:pageSize', 'page-change']);

// Internal page size — synced from prop
const internalPageSize = ref(props.pageSize);
const jumpToPageNumber = ref(props.modelValue);

// Keep internalPageSize in sync if parent changes pageSize prop
watch(() => props.pageSize, (val) => {
  internalPageSize.value = val;
});

// Derived: current page from modelValue
const currentPage = computed(() => props.modelValue);

// Total pages based on internalPageSize
const totalPages = computed(() => {
  if (props.totalItems === 0) return 1;
  return Math.ceil(props.totalItems / internalPageSize.value);
});

// What "Showing X to Y of Z" displays
const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (currentPage.value - 1) * internalPageSize.value + 1;
});

const endItem = computed(() => {
  const end = currentPage.value * internalPageSize.value;
  return Math.min(end, props.totalItems);
});

// Which page numbers to show around the current page
const displayPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const maxVisible = props.maxVisiblePages;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(current - half, 1);
  let end = start + maxVisible - 1;

  if (end > total) {
    end = total;
    start = Math.max(end - maxVisible + 1, 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// Navigate to a specific page
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  jumpToPageNumber.value = page;
  emit('update:modelValue', page);
  emit('page-change', { page, pageSize: internalPageSize.value });
};

// Change page size
const handlePageSizeChange = (event) => {
  const newSize = parseInt(event.target.value);
  internalPageSize.value = newSize;

  // If current page is now beyond total, reset to last valid page
  const newTotal = Math.ceil(props.totalItems / newSize);
  const safePage = Math.min(currentPage.value, newTotal || 1);

  emit('update:pageSize', newSize);
  emit('update:modelValue', safePage);
  emit('page-change', { page: safePage, pageSize: newSize });
};

// Jump to page via input
const handleJumpToPage = () => {
  const page = jumpToPageNumber.value;
  if (page >= 1 && page <= totalPages.value) {
    goToPage(page);
  } else {
    jumpToPageNumber.value = currentPage.value;
  }
};

// Keep jumpToPageNumber in sync when parent changes page
watch(() => props.modelValue, (val) => {
  jumpToPageNumber.value = val;
});
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 14px;
  color: #6c757d;
}

.showing-text strong {
  color: #333;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
}

.items-per-page label {
  font-size: 14px;
  color: #495057;
  white-space: nowrap;
}

.items-per-page select {
  padding: 6px 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.items-per-page select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.pagination-btn {
  min-width: 38px;
  height: 38px;
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  user-select: none;
}

.pagination-btn:hover:not(:disabled):not(.active) {
  background: #f0f4ff;
  border-color: #667eea;
  color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8f9fa;
}

.pagination-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.35);
}

.pagination-btn.page-number {
  min-width: 38px;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.btn-label {
  font-size: 13px;
}

.pagination-ellipsis {
  padding: 0 6px;
  color: #9ca3af;
  font-weight: bold;
  font-size: 16px;
  line-height: 38px;
}

.jump-to-page {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
}

.jump-to-page label {
  color: #495057;
  font-weight: 500;
}

.jump-to-page input {
  width: 70px;
  padding: 6px 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  transition: border-color 0.2s;
}

.jump-to-page input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-jump {
  padding: 6px 16px;
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.btn-jump:hover:not(:disabled) {
  background: #5568d3;
  border-color: #5568d3;
}

.jump-to-page input[type="number"]::-webkit-inner-spin-button,
.jump-to-page input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.jump-to-page input[type="number"] {
  -moz-appearance: textfield;
}

@media (max-width: 768px) {
  .pagination-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-controls {
    width: 100%;
  }

  .pagination-btn .btn-label {
    display: none;
  }
}

@media (max-width: 480px) {
  .pagination-btn {
    min-width: 32px;
    height: 32px;
    padding: 4px 8px;
    font-size: 13px;
  }
}
</style>