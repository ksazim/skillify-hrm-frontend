<template>
  <CrudLayout
    ref="layoutRef"
    title="Category Management"
    subtitle="Manage product categories, hierarchy and visibility"
    add-label="New Category"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading categories…"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Categories"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >

    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
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
      result-label="categories"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Icon cell -->
      <template #cell-icon="{ value }">
        <img v-if="value" :src="baseUrl + '/' + value" alt="icon" class="category-icon" />
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Parent category cell -->
      <template #cell-category_id="{ value }">
        <span v-if="value" class="parent-badge">{{ getCategoryName(value) }}</span>
        <span v-else class="root-badge">Root</span>
      </template>
    </DataTable>

    <!-- ── Pagination ── -->
    <template #pagination>
      <!-- <Pagination v-model="currentPage" … /> -->
    </template>

  </CrudLayout>

  <!-- ── Modals (outside CrudLayout so they teleport to body cleanly) ── -->
  <BaseModal
    v-model="showFormModal"
    :mode="modalMode"
    entity-name="category"
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
    entity-name="category"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This category will be permanently removed from the system."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />

  <BaseModal
    v-model="showViewModal"
    mode="view"
    entity-name="category"
    :fields="formFields"
    :initial-data="selectedItem"
    size="large"
  />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCrudStore } from '@/store/crud'
import CrudLayout  from './components/CrudLayout.vue'
import FilterPanel from './components/FilterComponent.vue'
import DataTable   from './components/TableComponent.vue'
import BaseModal   from './components/ActionModalComponent.vue'

const crudStore = useCrudStore()
const baseUrl   = process.env.VUE_APP_BASE_URL
const layoutRef = ref(null)

// ── Modal state ──────────────────────────────────────────────────────────────
const showFormModal   = ref(false)
const showDeleteModal = ref(false)
const showViewModal   = ref(false)
const modalMode       = ref('create')
const selectedItem    = ref({})
const allCategories   = ref([])

// ── Notification (passed to CrudLayout) ─────────────────────────────────────
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })

const notify = (type, message, { title = '', autoClose = 3000 } = {}) => {
  // Use the exposed method for instant banner — also drives the prop watcher as fallback
  layoutRef.value?.showBanner(type, message, { title, autoClose })
}

// ── Store computed ───────────────────────────────────────────────────────────
const items        = computed(() => crudStore.getAllItems)
const isLoading    = computed(() => crudStore.isLoading)
const hasError     = computed(() => crudStore.hasError)
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred')

// ── Header stats ─────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: 'Total',    value: items.value.length },
  { label: 'Active',   value: items.value.filter(i => i.status === 'active').length },
  { label: 'Inactive', value: items.value.filter(i => i.status === 'inactive').length },
])

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Category Management' },
]

const getCategoryName = (id) => {
  const cat = allCategories.value.find(c => c.id == id)
  return cat ? cat.name : `#${id}`
}

// ── Search / sort / pagination ───────────────────────────────────────────────
const searchFilters = ref({ search: '', status: '', date: '' })
const currentPage   = ref(1)
const itemsPerPage  = ref(10)
const sortConfig    = ref({ by: 'created_at', order: 'desc' })

// ── Form fields ──────────────────────────────────────────────────────────────
const formFields = computed(() => [
  {
    name: 'name', label: 'Category Name', type: 'text', required: true,
    placeholder: 'Enter category name…',
    description: 'Displayed to users across the platform'
  },
  {
    name: 'category_id', label: 'Parent Category', type: 'select', required: false,
    placeholder: 'None (Root Category)',
    options: allCategories.value.map(c => ({ value: c.id, label: c.name }))
  },
  { name: 'icon',  label: 'Icon',          type: 'file',   required: false, accept: 'image/*' },
  { name: 'order', label: 'Display Order', type: 'number', required: false, placeholder: '0' },
  {
    name: 'status', label: 'Status', type: 'radio', required: true, default: 'active',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]
  },
])

const filterFields = [
  { name: 'search', label: 'Category Name', type: 'text',   placeholder: 'Search by name…' },
  {
    name: 'status', label: 'Status', type: 'select', placeholder: 'All Status',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]
  },
  { name: 'date', label: 'Date', type: 'date' },
]

const tableColumns = [
  { key: 'id',          label: 'ID',              sortable: true  },
  { key: 'name',        label: 'Category Name',   sortable: true  },
  { key: 'icon',        label: 'Icon',            type: 'custom', sortable: false, width: '80px' },
  { key: 'category_id', label: 'Parent Category', type: 'custom', sortable: false },
  { key: 'order',       label: 'Order',           sortable: true  },
  { key: 'status',      label: 'Status',          type: 'status', sortable: true  },
  { key: 'actions',     label: 'Actions',         type: 'actions', align: 'center' },
]

const tableActions = [
  { name: 'view',   label: 'View',   class: 'btn-view'   },
  { name: 'edit',   label: 'Edit',   class: 'btn-edit'   },
  { name: 'delete', label: 'Delete', class: 'btn-delete' },
]

// ── Filtered + paginated data ────────────────────────────────────────────────
const filteredData = computed(() => {
  let list = items.value.filter(item => {
    const matchName   = !searchFilters.value.search  || item.name.toLowerCase().includes(searchFilters.value.search.toLowerCase())
    const matchStatus = !searchFilters.value.status  || item.status === searchFilters.value.status
    const matchDate   = !searchFilters.value.date    || item.created_at?.startsWith(searchFilters.value.date)
    return matchName && matchStatus && matchDate
  })
  if (sortConfig.value.by) {
    list.sort((a, b) => {
      const av = a[sortConfig.value.by], bv = b[sortConfig.value.by]
      if (av < bv) return sortConfig.value.order === 'asc' ? -1 : 1
      if (av > bv) return sortConfig.value.order === 'asc' ?  1 : -1
      return 0
    })
  }
  return list
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredData.value.slice(start, start + itemsPerPage.value)
})

// ── API calls ────────────────────────────────────────────────────────────────
const loadData = async () => {
  crudStore.clearError()
  const params = {
    page: currentPage.value, limit: itemsPerPage.value,
    ...(searchFilters.value.search && { search: searchFilters.value.search }),
    ...(searchFilters.value.status && { status: searchFilters.value.status }),
    ...(searchFilters.value.date   && { date:   searchFilters.value.date   }),
    ...(sortConfig.value.by        && { sort_by: sortConfig.value.by, sort_order: sortConfig.value.order }),
  }
  const result = await crudStore.fetchAll('/admin/categries', params)
  if (!result.success) {
    notify('error', result.error.message || 'Failed to load categories.')
  } else {
    allCategories.value = result.data?.list ?? items.value
  }
}

// ── Modal openers ────────────────────────────────────────────────────────────
const openCreateModal = () => {
  modalMode.value   = 'create'
  selectedItem.value = {}
  showFormModal.value = true
}

const openEditModal = async (item) => {
  const result = await crudStore.fetchById('/admin/categries/', item.id)
  if (result.success) { modalMode.value = 'edit'; selectedItem.value = { ...result.data }; showFormModal.value = true }
  else notify('error', result.error.message)
}

const openDeleteModal = (item) => {
  selectedItem.value  = { ...item }
  showDeleteModal.value = true
}

const openViewModal = async (item) => {
  const result = await crudStore.fetchById('/admin/categries/', item.id)
  if (result.success) { selectedItem.value = { ...result.data }; showViewModal.value = true }
  else notify('error', result.error.message)
}

// ── Submit handlers ──────────────────────────────────────────────────────────
const handleFormSubmit = async (data, mode, initialData) => {
  const fd = data instanceof FormData ? data : (() => {
    const f = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') f.append(k, v instanceof File ? v : String(v)) })
    return f
  })()

  const result = mode === 'create'
    ? await crudStore.create('/admin/categries', fd)
    : (() => { fd.append('_method', 'PUT'); return crudStore.post(`/admin/categries/${initialData.id}`, fd) })()

  if (!(await result).success) throw new Error((await result).error.message)
  return (await result).data
}

const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/admin/categries/', data.id)
  if (!result.success) throw new Error(result.error.message)
  return result.data
}

// ── Success / error handlers ─────────────────────────────────────────────────
const handleModalSuccess = ({ data, mode }) => {
  notify('success', `Category ${mode === 'create' ? 'created' : 'updated'} successfully!`, {
    title: data?.name, autoClose: 3000
  })
  loadData()
}

const handleDeleteSuccess = () => {
  notify('success', 'Category deleted successfully.', { autoClose: 3000 })
  loadData()
}

const handleModalError = ({ error }) => {
  let msg = error.message || 'An unexpected error occurred.'
  if (error.response?.data?.errors) {
    msg = Object.entries(error.response.data.errors)
      .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`)
      .join(' · ')
  }
  notify('error', msg)
}

// ── Sort / search handlers ───────────────────────────────────────────────────
const handleSearch = () => { currentPage.value = 1; loadData(); notify('info', `${filteredData.value.length} result(s) found.`, { autoClose: 2000 }) }
const handleReset  = () => { searchFilters.value = { search:'', status:'', date:'' }; currentPage.value = 1; loadData() }
const handleSort   = (s) => { sortConfig.value = s; loadData() }
const handleAction = ({ action, row }) => ({ view: openViewModal, edit: openEditModal, delete: openDeleteModal })[action]?.(row)

onMounted(() => loadData())
onBeforeUnmount(() => crudStore.clearCurrentItem())
</script>

<style scoped>
/* Luxury slot overrides — category-specific */
.category-icon {
  width: 38px; height: 38px;
  object-fit: cover;
  border: 1px solid rgba(201,169,110,0.20);
}

.cell-dash {
  color: rgba(240,234,224,0.25);
  font-size: 14px;
}

.parent-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .06em;
  text-transform: uppercase;
  background: rgba(201,169,110,0.09);
  border: 1px solid rgba(201,169,110,0.28);
  color: #E8D5B0;
}

.root-badge {
  font-size: 10.5px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(240,234,224,0.28);
}
</style>