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
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{
                'th--sortable':     column.sortable,
                'th--center':       column.align === 'center',
                'th--right':        column.align === 'right',
                'th--sorted':       sortBy === column.key,
              }"
              :style="{ minWidth: column.minWidth || 'auto', width: column.width || 'auto' }"
              @click="column.sortable && handleSort(column.key)"
            >
              <div class="th-inner">
                <span class="th-label">{{ column.label }}</span>
                <span v-if="column.sortable" class="sort-icon">
                  <svg
                    v-if="sortBy === column.key && sortOrder === 'asc'"
                    viewBox="0 0 20 20" fill="currentColor"
                  ><path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                  <svg
                    v-else-if="sortBy === column.key && sortOrder === 'desc'"
                    viewBox="0 0 20 20" fill="currentColor"
                  ><path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  <svg
                    v-else
                    viewBox="0 0 20 20" fill="currentColor" class="sort-idle"
                  ><path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM3 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM7 14a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/></svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, index) in data"
            :key="getRowKey(row, index)"
            :class="{
              'tr--clickable': rowClickable,
              'tr--selected':  isRowSelected(row),
            }"
            @click="handleRowClick(row)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="{
                'td--center': column.align === 'center',
                'td--right':  column.align === 'right',
              }"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getNestedValue(row, column.key)"
                :column="column"
              >
                <!-- Image -->
                <div v-if="column.type === 'image'" class="cell-image">
                  <img
                    v-if="getNestedValue(row, column.key)"
                    :src="getImageUrl(getNestedValue(row, column.key), column)"
                    :alt="column.label"
                    class="img-thumb"
                    @click.stop="handleImageClick(getNestedValue(row, column.key), column, row)"
                  />
                  <span v-else class="cell-empty">—</span>
                </div>

                <!-- Status badge -->
                <span
                  v-else-if="column.type === 'status'"
                  class="status-badge"
                  :class="`status--${getNestedValue(row, column.key)}`"
                >
                  <span class="status-dot" />
                  {{ formatValue(getNestedValue(row, column.key), column) }}
                </span>

                <!-- Generic badge -->
                <span
                  v-else-if="column.type === 'badge'"
                  class="cell-badge"
                  :style="{ '--badge-color': column.badgeColor?.(getNestedValue(row, column.key)) }"
                >
                  {{ formatValue(getNestedValue(row, column.key), column) }}
                </span>

                <!-- Boolean -->
                <span
                  v-else-if="column.type === 'boolean'"
                  class="cell-bool"
                  :class="getNestedValue(row, column.key) ? 'cell-bool--true' : 'cell-bool--false'"
                >
                  <svg v-if="getNestedValue(row, column.key)" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                </span>

                <!-- Actions -->
                <div v-else-if="column.type === 'actions'" class="cell-actions">
                  <slot name="actions" :row="row">
                    <button
                      v-for="action in actions"
                      :key="action.name"
                      class="action-btn"
                      :class="`action-btn--${action.class || action.name}`"
                      :disabled="action.disabled?.(row)"
                      @click.stop="handleAction(action.name, row)"
                    >
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
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
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
            </button>
            <img :src="currentImageUrl" alt="Preview" class="img-modal-preview" />
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  data:         { type: Array,   required: true },
  columns:      { type: Array,   required: true, validator: cols => cols.every(c => c.key && c.label) },
  actions:      { type: Array,   default: () => [] },
  rowKey:       { type: String,  default: 'id' },
  showHeader:   { type: Boolean, default: true },
  resultLabel:  { type: String,  default: 'records' },
  emptyTitle:   { type: String,  default: 'No data found' },
  emptyMessage: { type: String,  default: 'Try adjusting your filters or search criteria.' },
  rowClickable: { type: Boolean, default: false },
  selectedRows: { type: Array,   default: () => [] },
  sortable:     { type: Boolean, default: true },
  initialSort:  { type: Object,  default: () => ({ by: '', order: 'asc' }) },
  imageBaseUrl: { type: String,  default: '' },
})

const emit = defineEmits(['action', 'row-click', 'sort', 'image-click'])

const sortBy          = ref(props.initialSort.by)
const sortOrder       = ref(props.initialSort.order)
const showImageModal  = ref(false)
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
  showImageModal.value  = true
  emit('image-click', { value, column, row, url: currentImageUrl.value })
}

const closeImageModal = () => {
  showImageModal.value  = false
  currentImageUrl.value = ''
}

const formatValue = (value, column) => {
  if (value === null || value === undefined) return column.defaultValue || '—'
  if (column.formatter) return column.formatter(value)
  switch (column.type) {
    case 'date':       return new Date(value).toLocaleDateString()
    case 'datetime':   return new Date(value).toLocaleString()
    case 'currency':   return new Intl.NumberFormat('en-US', { style:'currency', currency: column.currency||'USD' }).format(value)
    case 'number':     return new Intl.NumberFormat('en-US').format(value)
    case 'percentage': return `${value}%`
    case 'status':
    case 'badge':      return typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value
    default:           return value
  }
}

const handleSort = (key) => {
  if (!props.sortable) return
  sortOrder.value = sortBy.value === key ? (sortOrder.value === 'asc' ? 'desc' : 'asc') : 'asc'
  sortBy.value    = key
  emit('sort', { by: sortBy.value, order: sortOrder.value })
}

const handleRowClick = (row) => {
  if (props.rowClickable) emit('row-click', row)
}

const handleAction = (name, row) => emit('action', { action: name, row })
</script>

<style scoped>
/* ── Design tokens ── */
.data-table {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.08);
  --gold-glow-str:  rgba(201,169,110,0.16);
  --onyx:           #0D0D0F;
  --onyx-2:         #131316;
  --onyx-3:         #1A1A1F;
  --onyx-4:         #222228;
  --onyx-5:         #2C2C33;
  --smoke:          rgba(255,255,255,0.035);
  --smoke-hover:    rgba(255,255,255,0.06);
  --text-primary:   #F0EAE0;
  --text-secondary: rgba(240,234,224,0.55);
  --text-muted:     rgba(240,234,224,0.28);
  --border:         rgba(201,169,110,0.12);
  --border-strong:  rgba(201,169,110,0.28);
  font-family: 'Jost', 'Inter', sans-serif;
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
  gap: 10px;
}

.results-count {
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.results-count strong {
  font-family: 'Cormorant Garamond','Georgia',serif;
  font-size: 22px;
  font-weight: 500;
  color: var(--gold-light);
  letter-spacing: .04em;
  line-height: 1;
}
.results-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-muted);
}
.results-divider {
  width: 1px; height: 16px;
  background: var(--border-strong);
}
.results-hint {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: .06em;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* ── Wrapper ── */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid var(--border);
  background: var(--onyx-2);
  position: relative;
}

.table-wrapper::-webkit-scrollbar { height: 4px; }
.table-wrapper::-webkit-scrollbar-track { background: var(--onyx-3); }
.table-wrapper::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

/* top gold accent line */
.table-wrapper::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), var(--gold), var(--gold-dim), transparent);
  z-index: 2;
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
  background: var(--onyx-3);
  border-bottom: 1px solid var(--border-strong);
}

th {
  padding: 8px 14px;
  font-size: 10px;
  text-align: left;
  font-weight: 500;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
  border-right: 1px solid var(--border);
  position: relative;
}
th:last-child { border-right: none; }

th.th--sortable { cursor: pointer; user-select: none; }
th.th--sortable:hover { background: var(--smoke); color: var(--text-secondary); }
th.th--sorted { color: var(--gold); }
th.th--center .th-inner { justify-content: center; }
th.th--right  .th-inner { justify-content: flex-end; }

.th-inner {
  display: flex;
  align-items: center;
  gap: 7px;
}
.th-label { line-height: 1; }

.sort-icon { display:flex; align-items:center; }
.sort-icon svg { width:12px; height:12px; color:var(--gold); }
.sort-idle { color: var(--text-muted) !important; opacity:.5; }

/* ── Body rows ── */
tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background .14s;
  position: relative;
}
tbody tr:last-child { border-bottom: none; }

tbody tr::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--gold);
  transform: scaleY(0);
  transition: transform .15s;
}

tbody tr:hover { background: var(--smoke); }
tbody tr:hover::before { transform: scaleY(1); }
tbody tr.tr--clickable { cursor: pointer; }
tbody tr.tr--selected { background: var(--gold-glow); }
tbody tr.tr--selected::before { transform: scaleY(1); }

/* ── Cells ── */
td {
  padding: 8px 14px;
  font-size: 12px;
  color: var(--text-secondary);
  border-right: 1px solid var(--border);
  vertical-align: middle;
  line-height: 1.4;
}
td:last-child { border-right: none; }
td.td--center { text-align: center; }
td.td--right  { text-align: right; }

.cell-text {
  color: var(--text-secondary);
  letter-spacing: .01em;
}

/* ── Status badge ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 8px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid;
  white-space: nowrap;
}
.status-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status--active  { background:rgba(29,158,117,0.10); border-color:rgba(29,158,117,0.35); color:#5DCAA5; }
.status--active  .status-dot { background:#5DCAA5; box-shadow:0 0 5px rgba(93,202,165,0.6); }

.status--inactive, .status--disabled {
  background:rgba(201,60,60,0.08); border-color:rgba(201,60,60,0.3); color:#F09595;
}
.status--inactive .status-dot, .status--disabled .status-dot { background:#F09595; }

.status--pending  { background:rgba(201,169,110,0.10); border-color:rgba(201,169,110,0.3); color:var(--gold-light); }
.status--pending  .status-dot { background:var(--gold); box-shadow:0 0 5px rgba(201,169,110,0.5); }

.status--draft, .status--archived {
  background:var(--smoke); border-color:var(--border); color:var(--text-muted);
}
.status--draft .status-dot, .status--archived .status-dot { background:var(--text-muted); }

/* ── Generic badge ── */
.cell-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 10.5px;
  letter-spacing: .06em;
  text-transform: uppercase;
  background: var(--badge-color, var(--gold-glow));
  border: 1px solid var(--border-strong);
  color: var(--gold-light);
}

/* ── Boolean ── */
.cell-bool { display:inline-flex; align-items:center; }
.cell-bool svg { width:15px; height:15px; }
.cell-bool--true  svg { color:#5DCAA5; }
.cell-bool--false svg { color:#F09595; }

/* ── Image cell ── */
.cell-image { display:flex; align-items:center; }
.img-thumb {
  width: 44px; height: 44px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: border-color .15s, transform .15s;
}
.img-thumb:hover {
  border-color: var(--gold);
  transform: scale(1.06);
}
.cell-empty { font-size:12px; color:var(--text-muted); letter-spacing:.04em; }

/* ── Action buttons ── */
.cell-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
}

.action-btn {
  padding: 5px 12px;
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid;
  background: transparent;
  cursor: pointer;
  transition: background .14s, color .14s, border-color .14s, transform .12s;
  white-space: nowrap;
}
.action-btn:disabled { opacity:.4; cursor:not-allowed; }
.action-btn:not(:disabled):active { transform: scale(.97); }

/* view */
.action-btn--view, .action-btn--btn-view {
  color: #85B7EB; border-color: rgba(133,183,235,0.35);
}
.action-btn--view:hover:not(:disabled), .action-btn--btn-view:hover:not(:disabled) {
  background: rgba(133,183,235,0.10); border-color: #85B7EB;
}

/* edit */
.action-btn--edit, .action-btn--btn-edit {
  color: var(--gold); border-color: var(--border-strong);
}
.action-btn--edit:hover:not(:disabled), .action-btn--btn-edit:hover:not(:disabled) {
  background: var(--gold-glow); border-color: var(--gold);
}

/* delete */
.action-btn--delete, .action-btn--btn-delete {
  color: #F09595; border-color: rgba(240,149,149,0.3);
}
.action-btn--delete:hover:not(:disabled), .action-btn--btn-delete:hover:not(:disabled) {
  background: rgba(240,149,149,0.08); border-color: #F09595;
}

/* primary */
.action-btn--primary, .action-btn--btn-primary {
  color: #9FE1CB; border-color: rgba(159,225,203,0.3);
}
.action-btn--primary:hover:not(:disabled), .action-btn--btn-primary:hover:not(:disabled) {
  background: rgba(159,225,203,0.08); border-color: #9FE1CB;
}

/* secondary */
.action-btn--secondary, .action-btn--btn-secondary {
  color: var(--text-secondary); border-color: var(--border);
}
.action-btn--secondary:hover:not(:disabled), .action-btn--btn-secondary:hover:not(:disabled) {
  background: var(--smoke); border-color: var(--border-strong);
}

/* success */
.action-btn--success, .action-btn--btn-success {
  color: #5DCAA5; border-color: rgba(93,202,165,0.3);
}
.action-btn--success:hover:not(:disabled), .action-btn--btn-success:hover:not(:disabled) {
  background: rgba(93,202,165,0.08); border-color: #5DCAA5;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
}
.empty-icon {
  width: 56px; height: 56px;
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
  position: relative;
}
.empty-icon::before {
  content: '';
  position: absolute; inset: 4px;
  border: 1px solid var(--border);
  opacity: .4;
}
.empty-icon svg { width:24px; height:24px; color:var(--gold-dim); }
.empty-title   { font-family:'Cormorant Garamond','Georgia',serif; font-size:20px; font-weight:400; color:var(--text-secondary); margin:0 0 8px; letter-spacing:.04em; }
.empty-message { font-size:12px; color:var(--text-muted); letter-spacing:.06em; margin:0; }

/* ── Image modal ── */
.img-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(7,7,9,0.92);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000;
  padding: 24px;
  backdrop-filter: blur(4px);
}
.img-modal-box {
  position: relative;
  max-width: 88vw; max-height: 88vh;
}
.img-modal-close {
  position: absolute;
  top: -44px; right: 0;
  width: 36px; height: 36px;
  background: var(--onyx-4);
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: border-color .15s, color .15s;
  padding: 0;
}
.img-modal-close:hover { border-color: var(--gold); color: var(--gold); }
.img-modal-close svg { width:14px; height:14px; }
.img-modal-preview {
  max-width: 100%; max-height: 85vh;
  object-fit: contain;
  display: block;
  border: 1px solid var(--border);
}

/* ── Modal transition ── */
.modal-enter-active { transition: opacity .22s ease, transform .22s ease; }
.modal-leave-active { transition: opacity .15s ease; }
.modal-enter-from   { opacity:0; transform:scale(.96); }
.modal-leave-to     { opacity:0; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .table-header { flex-direction:column; align-items:flex-start; }
  table         { min-width:560px; }
  td, th        { padding:12px 14px; }
  .cell-actions { flex-direction:column; }
  .action-btn   { width:100%; text-align:center; }
  .img-thumb    { width:36px; height:36px; }
}
</style>