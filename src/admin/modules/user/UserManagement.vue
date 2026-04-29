<template>
  <CrudLayout
    ref="layoutRef"
    title="User Management"
    subtitle="Manage users, roles and access control"
    add-label="New User"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading users"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Users"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >

    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    </template>

    <!-- ── Filters ── -->
    <template #filters>
      <FilterPanel
        title="Search & Filter"
        :fields="filterFields"
        v-model="searchFilters"
        @submit="handleSearch"
        @reset="handleReset"
      />
    </template>

    <!-- ── Table ── -->
    <DataTable
      :data="paginatedData"
      :columns="tableColumns"
      :actions="tableActions"
      result-label="users"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Photo cell -->
      <template #cell-photo="{ value }">
        <img v-if="value" :src="baseUrl + '/' + value" alt="photo" class="user-avatar" />
        <div v-else class="user-avatar-placeholder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </template>

      <!-- Role cell -->
      <template #cell-roles="{ value }">
        <span v-if="value && value.length" class="role-badge">
          {{ Array.isArray(value) ? value.map(r => r.name ?? r).join(', ') : value }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>
    </DataTable>

    <!-- ── Pagination ── -->
    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="pagination.total"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]"
        item-label="users"
        :show-first-last="true"
        :show-labels="false"
        :show-jump-to="false"
        @update:page-size="handlePageSizeChange"
        @page-change="handlePageChange"
      />
    </template>

  </CrudLayout>

  <!-- ── Modals ── -->
  <BaseModal
    v-model="showFormModal"
    :mode="modalMode"
    entity-name="user"
    :fields="formFields"
    :initial-data="selectedItem"
    :on-submit="handleFormSubmit"
    size="large"
    @success="handleModalSuccess"
    @error="handleModalError"
  />

  <BaseModal
    v-model="showDeleteModal"
    mode="delete"
    entity-name="user"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This user will be permanently removed from the system."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />

  <BaseModal
    v-model="showViewModal"
    mode="view"
    entity-name="user"
    :fields="formFields"
    :initial-data="selectedItem"
    size="large"
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
const baseUrl   = process.env.VUE_APP_BASE_URL
const baseApi   = process.env.VUE_APP_BASE_API
const layoutRef = ref(null)

// ── Modal state ──────────────────────────────────────────────────────────────
const showFormModal   = ref(false)
const showDeleteModal = ref(false)
const showViewModal   = ref(false)
const modalMode       = ref('create')
const selectedItem    = ref({})
const allRoles        = ref([])

// ── Notification ─────────────────────────────────────────────────────────────
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })

const notify = (type, message, { title = '', autoClose = 3000 } = {}) => {
  if (layoutRef.value?.showBanner) {
    layoutRef.value.showBanner(type, message, { title, autoClose })
    return
  }
  notification.value = { show: false, type, title, message, autoClose }
  setTimeout(() => {
    notification.value = { show: true, type, title, message, autoClose }
  }, 0)
}

// ── Store computed ───────────────────────────────────────────────────────────
const items        = computed(() => crudStore.getAllItems)
const isLoading    = computed(() => crudStore.isLoading)
const hasError     = computed(() => crudStore.hasError)
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred')

// ── Pagination meta (from server response) ───────────────────────────────────
const pagination = ref({ current_page: 1, total_pages: 1, total: 0, per_page: 10 })

// ── Header stats ─────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: 'Total',    value: pagination.value.total },
  { label: 'Active',   value: items.value.filter(i => i.status === 'active').length },
  { label: 'Inactive', value: items.value.filter(i => i.status === 'inactive').length },
])

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'User Management' },
]

// ── Search / sort / pagination state ─────────────────────────────────────────
const searchFilters = ref({ search: '', status: '', date: '' })
const currentPage   = ref(1)
const itemsPerPage  = ref(10)
const sortConfig    = ref({ by: 'created_at', order: 'desc' })

// ── Form fields ──────────────────────────────────────────────────────────────
const formFields = computed(() => [
  {
    name: 'name', label: 'Full Name', type: 'text', required: true,
    placeholder: 'Enter full name…',
    description: "User's display name across the platform",
  },
  {
    name: 'email', label: 'Email Address', type: 'email', required: true,
    placeholder: 'Enter email address…',
  },
  {
    name: 'phone', label: 'Phone Number', type: 'text', required: true,
    placeholder: 'Enter phone number…',
  },
  {
    name: 'password', label: 'Password', type: 'password',
    required: modalMode.value === 'create',
    placeholder: modalMode.value === 'edit'
      ? 'Leave blank to keep current password…'
      : 'Enter password…',
    description: modalMode.value === 'edit' ? 'Leave blank to keep the current password' : '',
  },
  {
    name: 'role', label: 'Role', type: 'select', required: true,
    placeholder: 'Select a role…',
    options: allRoles.value,
  },
  { name: 'photo',  label: 'Profile Photo', type: 'file',  required: false, accept: 'image/*' },
  {
    name: 'status', label: 'Status', type: 'radio', required: true, default: 'active',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
  },
])

// ── Filter fields ─────────────────────────────────────────────────────────────
const filterFields = [
  { name: 'search', label: 'Name or Email', type: 'text', placeholder: 'Search by name or email…' },
  {
    name: 'status', label: 'Status', type: 'select', placeholder: 'All Status',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
  },
  { name: 'date', label: 'Date', type: 'date' },
]

// ── Table columns ─────────────────────────────────────────────────────────────
// FIX 1 — COLUMN MISMATCH:
// The DataTable iterates `columns` to render both <th> headers AND <td> cells.
// Every column key must match an actual field in the row data (or be type:'custom'
// / type:'actions' so DataTable knows to use the slot / actions renderer instead
// of trying to read row[key] as plain text).
//
// Each column gets both width (preferred) and minWidth (floor).
// DataTable renders these as :style on <th>. table-layout: auto (in scoped
// styles) lets the browser honour them without needing a <colgroup>.
const tableColumns = [
  { key: 'id',      label: 'ID',      sortable: true,  width: '60px',  minWidth: '60px'  },
  { key: 'photo',   label: 'Photo',   type: 'custom',  sortable: false, width: '76px',  minWidth: '76px',  align: 'center' },
  { key: 'name',    label: 'Name',    sortable: true,  width: '170px', minWidth: '120px' },
  { key: 'email',   label: 'Email',   sortable: true,  width: '210px', minWidth: '150px' },
  { key: 'phone',   label: 'Phone',   sortable: false, width: '130px', minWidth: '110px' },
  { key: 'roles',   label: 'Role',    type: 'custom',  sortable: false, width: '130px', minWidth: '100px' },
  { key: 'status',  label: 'Status',  type: 'status',  sortable: true,  width: '100px', minWidth: '90px',  align: 'center' },
  { key: 'actions', label: 'Actions', type: 'actions', sortable: false, width: '160px', minWidth: '160px', align: 'center' },
]

const tableActions = [
  { name: 'view',   label: 'View',   class: 'btn-view'   },
  { name: 'edit',   label: 'Edit',   class: 'btn-edit'   },
  { name: 'delete', label: 'Delete', class: 'btn-delete' },
]

// Server already paginates — pass items directly, no client-side slicing
const paginatedData = computed(() => items.value)

// ── API calls ─────────────────────────────────────────────────────────────────
const loadRoles = async () => {
  try {
    const response = await fetch(`${baseApi}/system/roles`)
    if (!response.ok) throw new Error('Non-200')
    const data = await response.json()
    allRoles.value = (data.countries ?? []).map(r => ({ value: r.label, label: r.label }))
  } catch {
    notify('warning', 'Could not load roles list.', { autoClose: 3000 })
  }
}

const loadData = async () => {
  crudStore.clearError()
  const params = {
    page:  currentPage.value,
    limit: itemsPerPage.value,
    ...(searchFilters.value.search && { search:     searchFilters.value.search }),
    ...(searchFilters.value.status && { status:     searchFilters.value.status }),
    ...(searchFilters.value.date   && { date:       searchFilters.value.date   }),
    ...(sortConfig.value.by        && { sort_by:    sortConfig.value.by,
                                        sort_order: sortConfig.value.order     }),
  }

  const result = await crudStore.fetchAll('/users', params)

  if (!result.success) {
    notify('error', result.error?.message || 'Failed to load users.')
    return
  }

  if (result.data?.pagination) {
    pagination.value = result.data.pagination
  } else {
    pagination.value = {
      current_page: currentPage.value,
      total_pages:  1,
      total:        items.value.length,
      per_page:     itemsPerPage.value,
    }
  }
}

// ── Modal openers ─────────────────────────────────────────────────────────────
const openCreateModal = () => {
  modalMode.value     = 'create'
  selectedItem.value  = {}
  showFormModal.value = true
}

const openEditModal = async (item) => {
  const result = await crudStore.fetchById('/users/', item.id)
  if (result.success) {
    modalMode.value     = 'edit'
    console.log(result.data)
    const roleName      = result.data?.role ?? result.data?.role ?? ''
    selectedItem.value  = { ...result.data, role: roleName, password: '' }
    showFormModal.value = true
  } else {
    notify('error', result.error?.message || 'Could not load user.')
  }
}

const openDeleteModal = (item) => {
  selectedItem.value    = { ...item }
  showDeleteModal.value = true
}

const openViewModal = async (item) => {
  const result = await crudStore.fetchById('/users/', item.id)
  if (result.success) {
    selectedItem.value  = { ...result.data }
    showViewModal.value = true
  } else {
    notify('error', result.error?.message || 'Could not load user.')
  }
}

// ── Submit handlers ───────────────────────────────────────────────────────────
const handleFormSubmit = async (data, mode, initialData) => {
  const fd    = new FormData()
  const plain = data instanceof FormData ? Object.fromEntries(data.entries()) : data

  Object.entries(plain).forEach(([k, v]) => {
    if (k === 'password' && mode === 'edit' && !v) return
    if (v !== null && v !== undefined && v !== '') {
      fd.append(k, v instanceof File ? v : String(v))
    }
  })

  let result
  if (mode === 'create') {
    result = await crudStore.create('/users', fd)
  } else {
    fd.append('_method', 'PUT')
    result = await crudStore.post(`/users/${initialData.id}`, fd)
  }

  if (!result.success) throw new Error(result.error?.message ?? 'Request failed')
  return result.data
}

const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/users/', data.id)
  if (!result.success) throw new Error(result.error?.message ?? 'Delete failed')
  return result.data
}

// ── Success / error handlers ──────────────────────────────────────────────────
// FIX 2 — MODALS NOT CLOSING:
// BaseModal closes itself by emitting update:modelValue=false after @success fires.
// The parent must NOT close the modal manually here — doing so races with
// BaseModal's own close logic and can cause a double-close or stuck state.
// Instead: just show the notification and reload data. Let v-model handle closing.
const handleModalSuccess = ({ data, mode }) => {
  showFormModal.value = false   // explicit close as safety net if BaseModal v-model binding lags
  notify('success', `User ${mode === 'create' ? 'created' : 'updated'} successfully!`, {
    title: data?.name, autoClose: 3000,
  })
  loadData()
}

const handleDeleteSuccess = () => {
  showDeleteModal.value = false  // explicit close as safety net
  notify('success', 'User deleted successfully.', { autoClose: 3000 })
  loadData()
}

const handleModalError = ({ error }) => {
  let msg = error?.message || 'An unexpected error occurred.'
  if (error?.response?.data?.errors) {
    msg = Object.entries(error.response.data.errors)
      .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`)
      .join(' · ')
  }
  notify('error', msg)
}

// ── Sort / search handlers ────────────────────────────────────────────────────
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  searchFilters.value = { search: '', status: '', date: '' }
  currentPage.value   = 1
  loadData()
}

const handleSort = (s) => {
  sortConfig.value  = s
  currentPage.value = 1
  loadData()
}

// FIX 3 — PAGINATION @page-change EMIT SHAPE:
// The Pagination component emits `page-change` with a plain Number (just `page`),
// NOT an object { page, pageSize }. The previous handler destructured an object,
// so both values were undefined — page never updated, itemsPerPage never updated.
//
// page-size changes are emitted separately via `update:page-size` (a plain Number).
// Handle them on separate listeners to keep concerns clean.
const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

const handlePageSizeChange = (pageSize) => {
  itemsPerPage.value = pageSize
  currentPage.value  = 1      // reset to page 1 whenever limit changes
  loadData()
}

const handleAction = ({ action, row }) =>
  ({ view: openViewModal, edit: openEditModal, delete: openDeleteModal })[action]?.(row)

onMounted(() => { loadRoles(); loadData() })
onBeforeUnmount(() => crudStore.clearCurrentItem())
</script>

<style scoped>
/* ── Avatar ── */
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(201, 169, 110, 0.25);
}

.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.08);
  border: 1px solid rgba(201, 169, 110, 0.20);
  color: rgba(240, 234, 224, 0.35);
}

/* ── Role badge ── */
.role-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .06em;
  text-transform: uppercase;
  background: rgba(201, 169, 110, 0.09);
  border: 1px solid rgba(201, 169, 110, 0.28);
  color: #E8D5B0;
  white-space: nowrap;
}

.cell-dash {
  color: rgba(240, 234, 224, 0.25);
  font-size: 14px;
}

/*
  table-layout: auto — lets the browser honour minWidth on <th> naturally.
  DataTable sets both width and minWidth via :style on <th>; auto layout
  respects these as hints, keeping ID/photo narrow and actions wide enough.
  DO NOT use fixed here — DataTable has no <colgroup>, so fixed layout reads
  widths from <td> cells (which have no width set), collapsing narrow columns.
*/
:deep(table) {
  table-layout: auto;
  width: 100%;
}

/* Only clamp text cells — never clip photo/status/actions cells */
:deep(td .cell-text) {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

/* Ensure action buttons always have room and never get clipped */
:deep(td .cell-actions) {
  white-space: nowrap;
  overflow: visible;
}
</style>