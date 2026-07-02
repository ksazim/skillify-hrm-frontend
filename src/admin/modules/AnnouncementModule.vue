<template>
  <CrudLayout
    ref="layoutRef"
    title="Announcements"
    subtitle="Create and manage company-wide announcements"
    add-label="New Announcement"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading announcements"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Announcements"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >
    <!-- Icon -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    </template>

    <!-- Filters -->
    <template #filters>
      <FilterPanel
        title="Search & Filter"
        :fields="filterFields"
        v-model="searchFilters"
        @submit="handleSearch"
        @reset="handleReset"
      />
    </template>

    <!-- Table -->
    <DataTable
      :data="paginatedData"
      :columns="tableColumns"
      :actions="tableActions"
      result-label="announcements"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Title cell -->
      <template #cell-name="{ row }">
        <div class="ann-name-cell">
          <span class="ann-name">{{ row.name }}</span>
          <span v-if="row.attachment" class="ann-attach-hint">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
            </svg>
            Attachment
          </span>
        </div>
      </template>

      <!-- Details cell -->
      <template #cell-details="{ row }">
        <span class="ann-details-preview">{{ truncateDetails(row.details) }}</span>
      </template>

      <!-- Date cell -->
      <template #cell-created_at="{ row }">
        <span class="ann-date">{{ formatDate(row.created_at) }}</span>
      </template>
    </DataTable>

    <!-- Pagination -->
    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="pagination.total"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]"
        item-label="announcements"
        :show-first-last="true"
        :show-labels="false"
        :show-jump-to="false"
        @update:page-size="handlePageSizeChange"
        @page-change="handlePageChange"
      />
    </template>
  </CrudLayout>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- CREATE / EDIT MODAL                                      -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showFormModal" class="ann-modal-backdrop" @click.self="closeModal">
      <div class="ann-modal-shell">

        <!-- Modal Header -->
        <div class="ann-modal-head">
          <div class="ann-modal-head-left">
            <div class="ann-modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <h2 class="ann-modal-title">{{ isEditMode ? 'Edit Announcement' : 'New Announcement' }}</h2>
              <p class="ann-modal-subtitle">{{ isEditMode ? 'Update announcement details' : 'Compose a new company announcement' }}</p>
            </div>
          </div>
          <button class="ann-modal-close" @click="closeModal">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <!-- Modal Notification -->
        <div v-if="modalNotif.show" class="modal-notif" :class="'notif-' + modalNotif.type">
          {{ modalNotif.message }}
        </div>

        <!-- Modal Body -->
        <div class="ann-modal-body">
          <div class="form-grid">

            <div class="form-field form-field--full">
              <label class="form-label">Title <span class="req">*</span></label>
              <input
                v-model="form.name"
                class="form-input"
                type="text"
                placeholder="Announcement title…"
              />
            </div>

            <div class="form-field form-field--full">
              <label class="form-label">Details <span class="req">*</span></label>
              <textarea
                v-model="form.details"
                class="form-textarea"
                rows="6"
                placeholder="Write the full announcement content here…"
              ></textarea>
            </div>

            <div class="form-field">
              <label class="form-label">Attachment</label>
              <div class="file-upload-wrap">
                <input
                  type="file"
                  class="file-input-hidden"
                  ref="fileInput"
                  @change="handleFileChange"
                />
                <button class="file-upload-btn" @click="$refs.fileInput.click()" type="button">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                  </svg>
                  {{ form.file ? form.file.name : 'Browse file…' }}
                </button>
                <button v-if="form.file" class="file-clear-btn" @click="form.file = null" type="button">×</button>
              </div>
              <span v-if="isEditMode && currentAttachment && !form.file" class="existing-file-hint">
                Current: {{ currentAttachment }}
              </span>
            </div>

            <div class="form-field" v-if="isEditMode">
              <label class="form-label">Status <span class="req">*</span></label>
              <div class="radio-group">
                <label class="radio-opt">
                  <input type="radio" v-model="form.status" value="active" />
                  <span>Active</span>
                </label>
                <label class="radio-opt">
                  <input type="radio" v-model="form.status" value="inactive" />
                  <span>Inactive</span>
                </label>
              </div>
            </div>

          </div>
        </div>

        <!-- Modal Footer -->
        <div class="ann-modal-foot">
          <button class="btn-cancel" @click="closeModal" :disabled="isSaving">Cancel</button>
          <button class="btn-submit" @click="handleSubmit" :disabled="isSaving">
            <span v-if="isSaving" class="spinner-sm"></span>
            {{ isSaving ? 'Saving…' : (isEditMode ? 'Update Announcement' : 'Create Announcement') }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- VIEW MODAL                                               -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showViewModal" class="ann-modal-backdrop" @click.self="showViewModal = false">
      <div class="ann-modal-shell ann-modal-view">
        <div class="ann-modal-head">
          <div class="ann-modal-head-left">
            <div class="ann-modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <h2 class="ann-modal-title">Announcement</h2>
              <p class="ann-modal-subtitle">{{ viewItem?.name }}</p>
            </div>
          </div>
          <button class="ann-modal-close" @click="showViewModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <div class="ann-modal-body view-body" v-if="viewItem">
          <div class="view-meta-row">
            <span class="card-status" :class="viewItem.status === 'active' ? 'status-active' : 'status-inactive'">
              {{ viewItem.status }}
            </span>
            <span class="ann-date view-date">{{ formatDate(viewItem.created_at) }}</span>
          </div>

          <h3 class="view-title">{{ viewItem.name }}</h3>

          <div class="view-section-title" style="margin-top: 20px;">Content</div>
          <div class="view-details-body">{{ parseDetails(viewItem.details) }}</div>

          <div v-if="viewItem.attachment" class="view-attachment">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
            </svg>
            <a :href="baseUrl + '/' + viewItem.attachment" target="_blank" class="view-attachment-link">
              View Attachment
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Confirm Modal -->
  <BaseModal
    v-model="showDeleteModal"
    mode="delete"
    entity-name="announcement"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This announcement will be permanently removed and will no longer be visible to employees."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCrudStore } from '@/store/crud'
import CrudLayout  from '../components/CrudLayout.vue'
import FilterPanel from '../components/FilterComponent.vue'
import DataTable   from '../components/TableComponent.vue'
import Pagination  from '../components/PaginationComponent.vue'
import BaseModal   from '../components/ActionModalComponent.vue'

const crudStore = useCrudStore()
const baseUrl   = process.env.VUE_APP_BASE_URL ?? ''
const layoutRef = ref(null)
const fileInput = ref(null)

// ── Modal state ───────────────────────────────────────────────────────────────
const showFormModal   = ref(false)
const showDeleteModal = ref(false)
const showViewModal   = ref(false)
const isEditMode      = ref(false)
const selectedItem    = ref({})
const viewItem        = ref(null)
const isSaving        = ref(false)
const currentAttachment = ref('')

// ── Form ──────────────────────────────────────────────────────────────────────
const defaultForm = () => ({ name: '', details: '', file: null, status: 'active' })
const form = ref(defaultForm())

// ── Notification ──────────────────────────────────────────────────────────────
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })
const modalNotif   = ref({ show: false, type: 'success', message: '' })

const notify = (type, message, { title = '', autoClose = 3000 } = {}) => {
  if (layoutRef.value?.showBanner) {
    layoutRef.value.showBanner(type, message, { title, autoClose })
    return
  }
  notification.value = { show: false, type, title, message, autoClose }
  setTimeout(() => { notification.value = { show: true, type, title, message, autoClose } }, 0)
}

const showModalNotif = (type, message) => {
  modalNotif.value = { show: true, type, message }
  setTimeout(() => { modalNotif.value.show = false }, 4000)
}

// ── Store computed ────────────────────────────────────────────────────────────
const items        = computed(() => crudStore.getAllItems)
const isLoading    = computed(() => crudStore.isLoading)
const hasError     = computed(() => crudStore.hasError)
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred')
const pagination   = ref({ current_page: 1, total_pages: 1, total: 0, per_page: 10 })

// ── Page stats ────────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: 'Total',    value: pagination.value.total },
  { label: 'Active',   value: items.value.filter(i => i.status === 'active').length },
  { label: 'Inactive', value: items.value.filter(i => i.status === 'inactive').length },
])

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Announcements' },
]

// ── Search / sort / pagination ────────────────────────────────────────────────
const searchFilters = ref({ search: '', status: '', date: '' })
const currentPage   = ref(1)
const itemsPerPage  = ref(10)
const sortConfig    = ref({ by: 'created_at', order: 'desc' })

// ── Filter / table definitions ────────────────────────────────────────────────
const filterFields = [
  { name: 'search', label: 'Title', type: 'text', placeholder: 'Search by title…' },
  {
    name: 'status', label: 'Status', type: 'select', placeholder: 'All Status',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
  },
  { name: 'date', label: 'Date', type: 'date' },
]

const tableColumns = [
  { key: 'id',         label: 'ID',         sortable: true,  width: '60px',  minWidth: '60px'  },
  { key: 'name',       label: 'Title',      type: 'custom',  sortable: true,  width: '240px', minWidth: '160px' },
  { key: 'details',    label: 'Preview',    type: 'custom',  sortable: false, width: '300px', minWidth: '200px' },
  { key: 'created_at', label: 'Date',       type: 'custom',  sortable: true,  width: '130px', minWidth: '110px' },
  { key: 'status',     label: 'Status',     type: 'status',  sortable: true,  width: '100px', minWidth: '90px',  align: 'center' },
  { key: 'actions',    label: 'Actions',    type: 'actions', sortable: false, width: '160px', minWidth: '160px', align: 'center' },
]

const tableActions = [
  { name: 'view',   label: 'View',   class: 'btn-view'   },
  { name: 'edit',   label: 'Edit',   class: 'btn-edit'   },
  { name: 'delete', label: 'Delete', class: 'btn-delete' },
]

const paginatedData = computed(() => items.value)

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const parseDetails = (details) => {
  if (!details) return ''
  try { return JSON.parse(details) } catch { return details }
}

const truncateDetails = (details) => {
  const text = parseDetails(details)
  return text.length > 90 ? text.substring(0, 90) + '…' : text
}

// ── Main data ─────────────────────────────────────────────────────────────────
const loadData = async () => {
  crudStore.clearError()
  const params = {
    page:  currentPage.value,
    limit: itemsPerPage.value,
    ...(searchFilters.value.search && { search:   searchFilters.value.search }),
    ...(searchFilters.value.status && { status:   searchFilters.value.status }),
    ...(searchFilters.value.date   && { date:     searchFilters.value.date   }),
    ...(sortConfig.value.by        && { sort_by:  sortConfig.value.by, sort_order: sortConfig.value.order }),
  }
  const result = await crudStore.fetchAll('/announcements', params)
  if (!result.success) { notify('error', result.error?.message || 'Failed to load announcements.'); return }

  const raw = result.data
  if (raw?.pagination) {
    pagination.value = raw.pagination
  } else {
    const total = raw?.total ?? raw?.meta?.total ?? items.value.length
    pagination.value = {
      current_page: currentPage.value,
      total_pages:  Math.ceil(total / itemsPerPage.value) || 1,
      total,
      per_page:     itemsPerPage.value,
    }
  }
}

// ── File ──────────────────────────────────────────────────────────────────────
const handleFileChange = (e) => {
  form.value.file = e.target.files[0] ?? null
  e.target.value = ''
}

// ── Modal openers ─────────────────────────────────────────────────────────────
const openCreateModal = () => {
  isEditMode.value      = false
  form.value            = defaultForm()
  currentAttachment.value = ''
  modalNotif.value.show = false
  showFormModal.value   = true
}

const openEditModal = async (item) => {
  const result = await crudStore.fetchById('/announcements/', item.id)
  if (!result.success) { notify('error', 'Could not load announcement.'); return }

  const ann = result.data
  isEditMode.value = true
  currentAttachment.value = ann.attachment ?? ''
  form.value = {
    name:    ann.name    ?? '',
    details: parseDetails(ann.details),
    file:    null,
    status:  ann.status  ?? 'active',
  }
  selectedItem.value    = { ...ann }
  modalNotif.value.show = false
  showFormModal.value   = true
}

const openViewModal = async (item) => {
  const result = await crudStore.fetchById('/announcements/', item.id)
  if (!result.success) { notify('error', 'Could not load announcement.'); return }
  viewItem.value      = result.data
  showViewModal.value = true
}

const openDeleteModal = (item) => {
  selectedItem.value    = { ...item }
  showDeleteModal.value = true
}

const closeModal = () => { showFormModal.value = false }

// ── Submit ────────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  if (!form.value.name.trim()) { showModalNotif('error', 'Title is required.'); return }
  if (!form.value.details.trim()) { showModalNotif('error', 'Details are required.'); return }

  isSaving.value = true
  modalNotif.value.show = false

  try {
    const fd = new FormData()
    fd.append('name',    form.value.name)
    fd.append('details', form.value.details)
    if (form.value.file) fd.append('file', form.value.file)
    if (isEditMode.value) fd.append('status', form.value.status)

    let result
    if (isEditMode.value) {
      result = await crudStore.update('/announcements/', selectedItem.value.id, fd)
    } else {
      result = await crudStore.create('/announcements', fd)
    }

    if (!result.success) {
      const msg = result.error?.message || 'Save failed.'
      showModalNotif('error', msg)
      return
    }

    showFormModal.value = false
    notify('success', isEditMode.value ? 'Announcement updated successfully.' : 'Announcement created successfully.', { autoClose: 3000 })
    loadData()
  } catch (e) {
    showModalNotif('error', e.message || 'Network error.')
  } finally {
    isSaving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/announcements/', data.id)
  if (!result.success) throw new Error(result.error?.message ?? 'Delete failed')
  return result.data
}

const handleDeleteSuccess = () => {
  showDeleteModal.value = false
  notify('success', 'Announcement deleted successfully.', { autoClose: 3000 })
  loadData()
}

const handleModalError = ({ error }) => {
  notify('error', error?.message || 'An unexpected error occurred.')
}

// ── Search / sort / pagination ────────────────────────────────────────────────
const handleSearch         = () => { currentPage.value = 1; loadData() }
const handleReset          = () => { searchFilters.value = { search: '', status: '', date: '' }; currentPage.value = 1; loadData() }
const handleSort           = (s) => { sortConfig.value = s; currentPage.value = 1; loadData() }
const handlePageChange     = (page) => { currentPage.value = page; loadData() }
const handlePageSizeChange = (size) => { itemsPerPage.value = size; currentPage.value = 1; loadData() }
const handleAction         = ({ action, row }) =>
  ({ view: openViewModal, edit: openEditModal, delete: openDeleteModal })[action]?.(row)

onMounted(() => { loadData() })
onBeforeUnmount(() => crudStore.clearCurrentItem())
</script>

<style scoped>
/* ── Title cell ── */
.ann-name-cell   { display: flex; flex-direction: column; gap: 3px; }
.ann-name        { font-size: 13px; color: #F0EAE0; font-weight: 500; }
.ann-attach-hint {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; color: rgba(201,169,110,0.60); letter-spacing: .04em;
}

/* ── Details preview ── */
.ann-details-preview {
  font-size: 12px; color: rgba(240,234,224,0.45); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ── Date ── */
.ann-date { font-size: 12px; color: rgba(240,234,224,0.50); white-space: nowrap; }

/* ══════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════ */
.ann-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 24px 16px; z-index: 9999; overflow-y: auto;
}
.ann-modal-shell {
  background: #17171D; border: 1px solid rgba(201,169,110,0.25);
  width: 100%; max-width: 680px;
  display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 28px 80px rgba(0,0,0,0.65);
}
.ann-modal-view { max-width: 620px; }

/* Modal Head */
.ann-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 28px 16px; border-bottom: 1px solid rgba(201,169,110,0.15);
  flex-shrink: 0;
}
.ann-modal-head-left { display: flex; align-items: center; gap: 12px; }
.ann-modal-icon {
  width: 38px; height: 38px;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.28);
  display: flex; align-items: center; justify-content: center; color: #C9A96E; flex-shrink: 0;
}
.ann-modal-title    { font-size: 16px; font-weight: 600; color: #F0EAE0; margin: 0; }
.ann-modal-subtitle { font-size: 11px; color: rgba(240,234,224,0.40); margin: 3px 0 0; }
.ann-modal-close {
  width: 32px; height: 32px; background: transparent; border: 1px solid rgba(240,234,224,0.12);
  color: rgba(240,234,224,0.45); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .13s; flex-shrink: 0;
}
.ann-modal-close:hover { border-color: rgba(240,234,224,0.30); color: #F0EAE0; }
.ann-modal-close svg   { width: 14px; height: 14px; }

/* Notification inside modal */
.modal-notif {
  padding: 10px 28px; font-size: 12px; letter-spacing: .03em; flex-shrink: 0;
}
.notif-success { background: rgba(110,207,169,0.12); color: #6ECFA9; border-bottom: 1px solid rgba(110,207,169,0.20); }
.notif-error   { background: rgba(239,107,107,0.12); color: #EF6B6B; border-bottom: 1px solid rgba(239,107,107,0.20); }

/* Modal Body */
.ann-modal-body { flex: 1; overflow-y: auto; padding: 28px; }

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}
.form-field       { display: flex; flex-direction: column; gap: 6px; }
.form-field--full { grid-column: 1 / -1; }
.form-label {
  font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
  color: rgba(240,234,224,0.45);
}
.req { color: rgba(239,107,107,0.80); margin-left: 2px; }
.form-input, .form-textarea {
  background: rgba(18,18,24,0.98); border: 1px solid rgba(201,169,110,0.22);
  color: #F0EAE0; font-size: 13px; padding: 10px 13px; outline: none;
  font-family: inherit; transition: border-color .14s; box-sizing: border-box; width: 100%;
}
.form-input:focus, .form-textarea:focus {
  border-color: rgba(201,169,110,0.55); background: rgba(22,22,28,0.99);
}
.form-input::placeholder, .form-textarea::placeholder { color: rgba(240,234,224,0.22); }
.form-textarea { resize: vertical; min-height: 120px; }

/* File upload */
.file-upload-wrap   { display: flex; align-items: center; gap: 8px; }
.file-input-hidden  { display: none; }
.file-upload-btn {
  display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px;
  background: rgba(201,169,110,0.08); border: 1px solid rgba(201,169,110,0.28);
  color: rgba(201,169,110,0.70); font-size: 11px; font-family: inherit;
  letter-spacing: .05em; cursor: pointer; transition: all .14s; flex: 1;
  text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.file-upload-btn:hover { background: rgba(201,169,110,0.14); color: #C9A96E; }
.file-clear-btn {
  background: transparent; border: 1px solid rgba(239,107,107,0.30);
  color: rgba(239,107,107,0.65); font-size: 16px; line-height: 1;
  width: 32px; height: 38px; cursor: pointer; transition: all .13s; flex-shrink: 0;
}
.file-clear-btn:hover { background: rgba(239,107,107,0.10); color: #EF6B6B; }
.existing-file-hint {
  font-size: 10px; color: rgba(240,234,224,0.30); letter-spacing: .04em; margin-top: 2px;
}

/* Radio */
.radio-group { display: flex; gap: 16px; align-items: center; padding: 10px 0; }
.radio-opt { display: flex; align-items: center; gap: 7px; cursor: pointer; font-size: 13px; color: rgba(240,234,224,0.65); }
.radio-opt input { accent-color: #C9A96E; }

/* Modal footer */
.ann-modal-foot {
  display: flex; align-items: center; justify-content: flex-end;
  padding: 14px 28px; border-top: 1px solid rgba(201,169,110,0.15);
  flex-shrink: 0; gap: 10px;
}
.btn-cancel {
  padding: 9px 20px; background: transparent; border: 1px solid rgba(240,234,224,0.15);
  color: rgba(240,234,224,0.45); font-size: 11px; font-weight: 500; letter-spacing: .06em;
  text-transform: uppercase; cursor: pointer; transition: all .14s;
}
.btn-cancel:hover:not(:disabled) { border-color: rgba(240,234,224,0.35); color: rgba(240,234,224,0.75); }
.btn-submit {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 22px; background: rgba(201,169,110,0.14); border: 1px solid rgba(201,169,110,0.50);
  color: #C9A96E; font-size: 11px; font-weight: 500; letter-spacing: .06em;
  text-transform: uppercase; cursor: pointer; transition: all .14s;
}
.btn-submit:hover:not(:disabled) { background: rgba(201,169,110,0.22); }
.btn-cancel:disabled, .btn-submit:disabled { opacity: .45; cursor: not-allowed; }

/* Spinner */
.spinner-sm {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.15);
  border-top-color: currentColor; border-radius: 50%; animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── View modal ── */
.view-body        { display: flex; flex-direction: column; gap: 16px; }
.view-meta-row    { display: flex; align-items: center; gap: 12px; }
.view-date        { font-size: 11px; color: rgba(240,234,224,0.30); }
.view-title       { font-size: 20px; font-weight: 600; color: #F0EAE0; margin: 0; line-height: 1.3; }
.view-section-title {
  font-size: 10px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
  color: rgba(201,169,110,0.70); padding-bottom: 10px; border-bottom: 1px solid rgba(201,169,110,0.15);
  margin-bottom: 12px;
}
.view-details-body {
  font-size: 13px; color: rgba(240,234,224,0.70); line-height: 1.75;
  white-space: pre-wrap; word-break: break-word;
}
.view-attachment {
  display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px;
  background: rgba(201,169,110,0.07); border: 1px solid rgba(201,169,110,0.22);
  color: rgba(201,169,110,0.70); font-size: 12px; margin-top: 8px;
}
.view-attachment-link {
  color: #C9A96E; text-decoration: none; font-size: 12px;
}
.view-attachment-link:hover { text-decoration: underline; }

/* Status badges */
.card-status {
  font-size: 10px; font-weight: 500; letter-spacing: .07em; text-transform: uppercase;
  padding: 3px 9px; border: 1px solid; display: inline-block;
}
.status-active   { color: #6ECFA9; border-color: rgba(110,207,169,0.35); background: rgba(110,207,169,0.08); }
.status-inactive { color: rgba(240,234,224,0.35); border-color: rgba(240,234,224,0.15); }
</style>