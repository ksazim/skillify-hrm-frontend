<template>
  <div class="data-table">

    <!-- Table Header -->
    <div class="table-header" v-if="showHeader">
      <div class="results-meta">
        <span class="results-count">
          <strong>{{ data.length }}</strong>
          <span class="results-label">{{ resultLabel }}</span>
        </span>
        <span class="results-divider" />
        <span class="results-hint">results found</span>
      </div>
      <div class="table-actions">
        <slot name="header-actions" />
      </div>
    </div>

    <!-- Table wrapper -->
    <div class="table-wrapper">
      <table v-if="data.length > 0">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" :class="{
              'th--sortable': column.sortable,
              'th--center': column.align === 'center',
              'th--right': column.align === 'right',
              'th--sorted': sortBy === column.key,
            }" :style="{ minWidth: column.minWidth || 'auto', width: column.width || 'auto' }"
              @click="column.sortable && handleSort(column.key)">
              <div class="th-inner">
                <span class="th-label">{{ column.label }}</span>
                <span v-if="column.sortable" class="sort-icon">
                  <svg v-if="sortBy === column.key && sortOrder === 'asc'" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                      clip-rule="evenodd" />
                  </svg>
                  <svg v-else-if="sortBy === column.key && sortOrder === 'desc'" viewBox="0 0 20 20"
                    fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                      clip-rule="evenodd" />
                  </svg>
                  <svg v-else viewBox="0 0 20 20" fill="currentColor" class="sort-idle">
                    <path
                      d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM3 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM7 14a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, index) in data" :key="getRowKey(row, index)" :class="{
            'tr--clickable': rowClickable,
            'tr--selected': isRowSelected(row),
          }" @click="handleRowClick(row)">
            <td v-for="column in columns" :key="column.key" :class="{
              'td--center': column.align === 'center',
              'td--right': column.align === 'right',
            }">
              <slot :name="`cell-${column.key}`" :row="row" :value="getNestedValue(row, column.key)" :column="column">
                <!-- Image -->
                <div v-if="column.type === 'image'" class="cell-image">
                  <img v-if="getNestedValue(row, column.key)"
                    :src="getImageUrl(getNestedValue(row, column.key), column)" :alt="column.label" class="img-thumb"
                    @click.stop="handleImageClick(getNestedValue(row, column.key), column, row)" />
                  <span v-else class="cell-empty">—</span>
                </div>

                <!-- Status badge -->
                <span v-else-if="column.type === 'status'" class="status-badge"
                  :class="`status--${getNestedValue(row, column.key)}`">
                  <span class="status-dot" />
                  {{ formatValue(getNestedValue(row, column.key), column) }}
                </span>

                <!-- Generic badge -->
                <span v-else-if="column.type === 'badge'" class="cell-badge"
                  :style="{ '--badge-color': column.badgeColor?.(getNestedValue(row, column.key)) }">
                  {{ formatValue(getNestedValue(row, column.key), column) }}
                </span>

                <!-- Boolean -->
                <span v-else-if="column.type === 'boolean'" class="cell-bool"
                  :class="getNestedValue(row, column.key) ? 'cell-bool--true' : 'cell-bool--false'">
                  <svg v-if="getNestedValue(row, column.key)" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd" />
                  </svg>
                  <svg v-else viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd" />
                  </svg>
                </span>

                <!-- Actions -->
                <div v-else-if="column.type === 'actions'" class="cell-actions">
                  <slot name="actions" :row="row">
                    <button v-for="action in actions" :key="action.name" class="action-btn"
                      :class="`action-btn--${action.class || action.name}`" :disabled="action.disabled?.(row)"
                      @click.stop="handleAction(action.name, row)">
                      {{ action.label }}
                    </button>
                  </slot>
                </div>

                <!-- Default -->
                <span v-else class="cell-text">
                  {{ formatValue(getNestedValue(row, column.key), column) }}
                </span>

              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <slot name="empty">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <p class="empty-title">{{ emptyTitle }}</p>
          <p class="empty-message">{{ emptyMessage }}</p>
        </slot>
      </div>
    </div>

    <!-- Image modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showImageModal" class="img-modal-overlay" @click="closeImageModal">
          <div class="img-modal-box" @click.stop>
            <button class="img-modal-close" @click="closeImageModal">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
            <img :src="currentImageUrl" alt="Preview" class="img-modal-preview" />
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { defineEmits, defineProps, ref } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  columns: { type: Array, required: true, validator: cols => cols.every(c => c.key && c.label) },
  actions: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  showHeader: { type: Boolean, default: true },
  resultLabel: { type: String, default: 'records' },
  emptyTitle: { type: String, default: 'No data found' },
  emptyMessage: { type: String, default: 'Try adjusting your filters or search criteria.' },
  rowClickable: { type: Boolean, default: false },
  selectedRows: { type: Array, default: () => [] },
  sortable: { type: Boolean, default: true },
  initialSort: { type: Object, default: () => ({ by: '', order: 'asc' }) },
  imageBaseUrl: { type: String, default: '' },
})

const emit = defineEmits(['action', 'row-click', 'sort', 'image-click'])

const sortBy = ref(props.initialSort.by)
const sortOrder = ref(props.initialSort.order)
const showImageModal = ref(false)
const currentImageUrl = ref('')

const getNestedValue = (obj, path) =>
  path.split('.').reduce((cur, key) => cur?.[key], obj)

const getRowKey = (row, index) =>
  getNestedValue(row, props.rowKey) ?? index

const isRowSelected = (row) => {
  const k = getNestedValue(row, props.rowKey)
  return props.selectedRows.some(s => getNestedValue(s, props.rowKey) === k)
}

const getImageUrl = (value, column) => {
  if (!value) return ''
  if (column.imageUrlBuilder) return column.imageUrlBuilder(value)
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const base = props.imageBaseUrl || process.env.VUE_APP_BASE_URL || ''
  const clean = base.endsWith('/') && value.startsWith('/') ? value.slice(1) : value
  return `${base}/${clean}`
}

const handleImageClick = (value, column, row) => {
  currentImageUrl.value = getImageUrl(value, column)
  showImageModal.value = true
  emit('image-click', { value, column, row, url: currentImageUrl.value })
}

const closeImageModal = () => {
  showImageModal.value = false
  currentImageUrl.value = ''
}

const formatValue = (value, column) => {
  if (value === null || value === undefined) return column.defaultValue || '—'
  if (column.formatter) return column.formatter(value)
  switch (column.type) {
    case 'date': return new Date(value).toLocaleDateString()
    case 'datetime': return new Date(value).toLocaleString()
    case 'currency': return new Intl.NumberFormat('en-US', { style: 'currency', currency: column.currency || 'USD' }).format(value)
    case 'number': return new Intl.NumberFormat('en-US').format(value)
    case 'percentage': return `${value}%`
    case 'status':
    case 'badge': return typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value
    default: return value
  }
}

const handleSort = (key) => {
  if (!props.sortable) return
  sortOrder.value = sortBy.value === key ? (sortOrder.value === 'asc' ? 'desc' : 'asc') : 'asc'
  sortBy.value = key
  emit('sort', { by: sortBy.value, order: sortOrder.value })
}

const handleRowClick = (row) => {
  if (props.rowClickable) emit('row-click', row)
}

const handleAction = (name, row) => emit('action', { action: name, row })
</script>

<style scoped>
/* ── Light Theme Variables ── */
.data-table {
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

  --success: #10B981;
  --success-light: #ECFDF5;
  --success-border: #A7F3D0;

  --error: #EF4444;
  --error-light: #FEF2F2;
  --error-border: #FECACA;

  --warning: #F59E0B;
  --warning-light: #FFFBEB;
  --warning-border: #FDE68A;

  --info: #3B82F6;
  --info-light: #EFF6FF;
  --info-border: #BFDBFE;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  padding: 16px 32px;
}

/* ── Table header ── */
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 2px;
}

.results-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.results-count strong {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.02em;
  line-height: 1;
}

.results-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.results-divider {
  width: 1px;
  height: 20px;
  background: var(--border-strong);
}

.results-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.table-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

/* ── Wrapper ── */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
}

.table-wrapper:hover {
  box-shadow: var(--shadow-md);
}

.table-wrapper::-webkit-scrollbar {
  height: 6px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* ── Table ── */
table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
}

/* ── Head ── */
thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

thead tr {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border);
}

th {
  padding: 12px 16px;
  font-size: 11px;
  text-align: left;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  white-space: nowrap;
  border-right: 1px solid var(--border);
  position: relative;
  transition: background 0.15s ease;
}

th:last-child {
  border-right: none;
}

th.th--sortable {
  cursor: pointer;
  user-select: none;
}

th.th--sortable:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

th.th--sorted {
  color: var(--primary);
}

th.th--center .th-inner {
  justify-content: center;
}

th.th--right .th-inner {
  justify-content: flex-end;
}

.th-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.th-label {
  line-height: 1;
}

.sort-icon {
  display: flex;
  align-items: center;
}

.sort-icon svg {
  width: 14px;
  height: 14px;
  color: var(--primary);
}

.sort-idle {
  color: var(--text-muted) !important;
  opacity: 0.4;
}

/* ── Body rows ── */
tbody tr {
  border-bottom: 1px solid var(--border);
  transition: all 0.15s ease;
  position: relative;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: var(--bg-hover);
}

tbody tr.tr--clickable {
  cursor: pointer;
}

tbody tr.tr--selected {
  background: var(--primary-light);
  border-left: 3px solid var(--primary);
}

/* ── Cells ── */
td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  border-right: 1px solid var(--border);
  vertical-align: middle;
  line-height: 1.5;
}

td:last-child {
  border-right: none;
}

td.td--center {
  text-align: center;
}

td.td--right {
  text-align: right;
}

.cell-text {
  color: var(--text-secondary);
  font-weight: 500;
}

/* ── Status badge ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 20px;
  border: 1.5px solid;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status--active {
  background: var(--success-light);
  border-color: var(--success-border);
  color: var(--success);
}

.status--active .status-dot {
  background: var(--success);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(0.85);
  }
}

.status--inactive,
.status--disabled {
  background: var(--error-light);
  border-color: var(--error-border);
  color: var(--error);
}

.status--inactive .status-dot,
.status--disabled .status-dot {
  background: var(--error);
}

.status--pending {
  background: var(--warning-light);
  border-color: var(--warning-border);
  color: var(--warning);
}

.status--pending .status-dot {
  background: var(--warning);
}

.status--draft,
.status--archived {
  background: var(--bg-secondary);
  border-color: var(--border);
  color: var(--text-muted);
}

.status--draft .status-dot,
.status--archived .status-dot {
  background: var(--text-muted);
}

/* ── Generic badge ── */
.cell-badge {
  display: inline-block;
  padding: 3px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 4px;
  background: var(--badge-color, var(--primary-light));
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
}

/* ── Boolean ── */
.cell-bool {
  display: inline-flex;
  align-items: center;
}

.cell-bool svg {
  width: 18px;
  height: 18px;
}

.cell-bool--true svg {
  color: var(--success);
}

.cell-bool--false svg {
  color: var(--error);
}

/* ── Image cell ── */
.cell-image {
  display: flex;
  align-items: center;
}

.img-thumb {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  cursor: pointer;
  border: 2px solid var(--border);
  transition: all 0.2s ease;
}

.img-thumb:hover {
  border-color: var(--primary);
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.cell-empty {
  font-size: 13px;
  color: var(--text-muted);
}

/* ── Action buttons ── */
.cell-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.action-btn {
  padding: 4px 12px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border: 1.5px solid;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn:not(:disabled):active {
  transform: scale(0.95);
}

/* View */
.action-btn--view,
.action-btn--btn-view {
  color: var(--info);
  border-color: var(--info-border);
}

.action-btn--view:hover:not(:disabled),
.action-btn--btn-view:hover:not(:disabled) {
  background: var(--info-light);
  border-color: var(--info);
}

/* Edit */
.action-btn--edit,
.action-btn--btn-edit {
  color: var(--primary);
  border-color: var(--border-strong);
}

.action-btn--edit:hover:not(:disabled),
.action-btn--btn-edit:hover:not(:disabled) {
  background: var(--primary-light);
  border-color: var(--primary);
}

/* Delete */
.action-btn--delete,
.action-btn--btn-delete {
  color: var(--error);
  border-color: var(--error-border);
}

.action-btn--delete:hover:not(:disabled),
.action-btn--btn-delete:hover:not(:disabled) {
  background: var(--error-light);
  border-color: var(--error);
}

/* Primary */
.action-btn--primary,
.action-btn--btn-primary {
  color: var(--success);
  border-color: var(--success-border);
}

.action-btn--primary:hover:not(:disabled),
.action-btn--btn-primary:hover:not(:disabled) {
  background: var(--success-light);
  border-color: var(--success);
}

/* Secondary */
.action-btn--secondary,
.action-btn--btn-secondary {
  color: var(--text-secondary);
  border-color: var(--border);
}

.action-btn--secondary:hover:not(:disabled),
.action-btn--btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

/* Success */
.action-btn--success,
.action-btn--btn-success {
  color: var(--success);
  border-color: var(--success-border);
}

.action-btn--success:hover:not(:disabled),
.action-btn--btn-success:hover:not(:disabled) {
  background: var(--success-light);
  border-color: var(--success);
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.2s ease;
}

.empty-icon svg {
  width: 28px;
  height: 28px;
  color: var(--text-muted);
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.empty-message {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

/* ── Image modal ── */
.img-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 24px;
}

.img-modal-box {
  position: relative;
  max-width: 88vw;
  max-height: 88vh;
}

.img-modal-close {
  position: absolute;
  top: -48px;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1.5px solid var(--border);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.img-modal-close:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.img-modal-close svg {
  width: 16px;
  height: 16px;
}

.img-modal-preview {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  display: block;
  border-radius: var(--radius-md);
  border: 2px solid var(--border);
  background: var(--bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* ── Modal transition ── */
.modal-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.modal-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  table {
    min-width: 560px;
  }

  td,
  th {
    padding: 10px 12px;
  }

  .cell-actions {
    flex-wrap: wrap;
  }

  .action-btn {
    font-size: 10px;
    padding: 3px 10px;
  }

  .img-thumb {
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .results-meta {
    flex-wrap: wrap;
    gap: 6px;
  }

  .results-count strong {
    font-size: 18px;
  }

  .results-label {
    font-size: 12px;
  }

  td,
  th {
    padding: 8px 10px;
    font-size: 12px;
  }

  .status-badge {
    font-size: 10px;
    padding: 3px 8px 3px 6px;
  }

  .cell-badge {
    font-size: 10px;
    padding: 2px 8px;
  }
}
</style>