<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>⚡ Flash Sale Management</h1>
        <button class="add-btn" @click="openCreateModal">+ Add Flash Sale</button>
      </div>

      <!-- Filter Panel -->
      <FilterPanel
        title="Search & Filter"
        :fields="filterFields"
        v-model="searchFilters"
        @submit="handleSearch"
        @reset="handleReset"
      />

      <!-- Loading State -->
      <div v-if="isLoading && !items.length" class="loading-container">
        <div class="spinner-large"></div>
        <p>Loading flash sales...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError && !items.length" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Failed to Load Flash Sales</h3>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="loadData">Retry</button>
      </div>

      <!-- DataTable -->
      <div v-else class="table-container">
        <DataTable
          :data="paginatedData"
          :columns="tableColumns"
          :actions="tableActions"
          result-label="flash sales"
          @action="handleAction"
          @sort="handleSort"
        >
          <!-- Status badge -->
          <template #cell-status="{ value }">
            <span :class="['status-badge', value === 'active' ? 'badge-active' : 'badge-inactive']">
              {{ value || 'inactive' }}
            </span>
          </template>
        </DataTable>

        <!-- <Pagination
          v-model="currentPage"
          :total-items="filteredData.length"
          :page-size="itemsPerPage"
          :page-size-options="[5, 10, 20, 50]"
          item-label="flash sales"
          :show-first-last="true"
          :show-jump-to="true"
          @update:page-size="handlePageSizeChange"
          @page-change="handlePageChange"
        /> -->
      </div>
    </div>

    <!-- ===================== -->
    <!-- Create / Edit Modal   -->
    <!-- ===================== -->
    <BaseModal
      v-model="showFormModal"
      :mode="modalMode"
      entity-name="flash sale"
      :fields="formFields"
      :initial-data="selectedItem"
      :on-submit="handleFormSubmit"
      size="large"
      @success="handleModalSuccess"
      @error="handleModalError"
    />

    <!-- ===================== -->
    <!-- Delete Modal          -->
    <!-- ===================== -->
    <BaseModal
      v-model="showDeleteModal"
      mode="delete"
      entity-name="flash sale"
      :initial-data="selectedItem"
      :on-submit="handleDeleteSubmit"
      delete-message="This flash sale and all its products will be permanently removed."
      @success="handleDeleteSuccess"
      @error="handleModalError"
    />

    <!-- ========================== -->
    <!-- View Modal                 -->
    <!-- ========================== -->
    <BaseModal
      v-model="showViewModal"
      mode="view"
      entity-name="flash sale"
      :fields="formFields"
      :initial-data="selectedItem"
      size="large"
    />

    <!-- ========================== -->
    <!-- Flash Sale Products Modal  -->
    <!-- ========================== -->
    <Teleport to="body">
      <div v-if="showProductsModal" class="products-modal-overlay" @click.self="closeProductsModal">
        <div class="products-modal">
          <!-- Modal Header -->
          <div class="products-modal-header">
            <div class="products-modal-title">
              <span class="flash-icon">⚡</span>
              <div>
                <h2>Manage Products</h2>
                <p class="sale-name">{{ currentSale?.title }}</p>
              </div>
            </div>
            <button class="close-btn" @click="closeProductsModal">✕</button>
          </div>

          <div class="products-modal-body">
            <!-- Product Search Panel -->
            <div class="product-search-panel">
              <h3 class="panel-title">Add Products</h3>
              <div class="search-row">
                <input
                  v-model="productSearchQuery"
                  type="text"
                  class="product-search-input"
                  placeholder="Search products by name..."
                  @input="debouncedProductSearch"
                />
                <button class="search-btn" @click="searchProducts">
                  <span v-if="productSearchLoading" class="spinner-sm"></span>
                  <span v-else>🔍 Search</span>
                </button>
              </div>

              <!-- Search Results -->
              <div v-if="productSearchResults.length" class="search-results">
                <div
                  v-for="product in productSearchResults"
                  :key="product.id"
                  class="search-result-item"
                  :class="{ 'already-added': isProductAdded(product.id) }"
                >
                  <div class="product-info">
                    <img
                      v-if="product.image"
                      :src="product.image"
                      :alt="product.product_name"
                      class="product-thumb"
                    />
                    <div v-else class="product-thumb-placeholder">📦</div>
                    <div>
                      <div class="product-name">{{ product.product_name }}</div>
                      <div class="product-price">{{ product.price }}</div>
                    </div>
                  </div>
                  <button
                    v-if="!isProductAdded(product.id)"
                    class="add-product-btn"
                    @click="addProduct(product)"
                    :disabled="addingProductId === product.id"
                  >
                    <span v-if="addingProductId === product.id" class="spinner-sm"></span>
                    <span v-else>+ Add</span>
                  </button>
                  <span v-else class="added-label">✓ Added</span>
                </div>
              </div>
              <div v-else-if="productSearchQuery && !productSearchLoading" class="no-results">
                No products found
              </div>
            </div>

            <!-- Divider -->
            <div class="modal-divider"></div>

            <!-- Current Flash Sale Products -->
            <div class="sale-products-panel">
              <h3 class="panel-title">
                Products in this Sale
                <span class="count-badge">{{ saleProducts.length }}</span>
              </h3>

              <div v-if="saleProductsLoading" class="panel-loading">
                <div class="spinner-sm"></div>
                <span>Loading...</span>
              </div>

              <div v-else-if="!saleProducts.length" class="no-sale-products">
                <div class="empty-icon">🛒</div>
                <p>No products added yet</p>
              </div>

              <div v-else class="sale-products-list">
                <div
                  v-for="sp in saleProducts"
                  :key="sp.id"
                  class="sale-product-item"
                >
                  <div class="product-info">
                    <img
                      v-if="sp.product?.image"
                      :src="sp.product.image"
                      :alt="sp.product?.product_name"
                      class="product-thumb"
                    />
                    <div v-else class="product-thumb-placeholder">📦</div>
                    <div>
                      <div class="product-name">{{ sp.product?.product_name || sp.product_id }}</div>
                      <div class="product-price">{{ sp.product?.price }}</div>
                    </div>
                  </div>
                  <button
                    class="remove-product-btn"
                    @click="removeProduct(sp)"
                    :disabled="removingProductId === sp.id"
                  >
                    <span v-if="removingProductId === sp.id" class="spinner-sm"></span>
                    <span v-else>✕ Remove</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="products-modal-footer">
            <button class="close-modal-btn" @click="closeProductsModal">Done</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Notification Modal -->
    <NotificationModal
      v-model="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :details="notification.details"
      :list="notification.list"
      :confirm-label="notification.confirmLabel"
      :auto-close="notification.autoClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useCrudStore } from '@/store/crud';
import FilterPanel from './components/FilterComponent.vue';
import DataTable from './components/TableComponent.vue';
// import Pagination from './components/PaginationComponent.vue';
import BaseModal from './components/ActionModalComponent.vue';
import NotificationModal from './components/NotificationModal.vue';
import axios from 'axios';

// ─── Store ────────────────────────────────────────────────
const crudStore = useCrudStore();

// ─── Flash Sale Modal States ──────────────────────────────
const showFormModal   = ref(false);
const showDeleteModal = ref(false);
const showViewModal   = ref(false);
const modalMode       = ref('create');
const selectedItem    = ref({});

// ─── Products Modal State ─────────────────────────────────
const showProductsModal    = ref(false);
const currentSale          = ref(null);
const saleProducts         = ref([]);
const saleProductsLoading  = ref(false);
const productSearchQuery   = ref('');
const productSearchResults = ref([]);
const productSearchLoading = ref(false);
const addingProductId      = ref(null);
const removingProductId    = ref(null);

const baseApi = process.env.VUE_APP_BASE_API

// ─── Notification ─────────────────────────────────────────
const notification = ref({
  show: false, type: 'success', title: '', message: '',
  details: '', list: [], confirmLabel: 'OK', autoClose: 0
});

const showNotification = (type, message, options = {}) => {
  notification.value = {
    show: true, type, message,
    title:        options.title        || '',
    details:      options.details      || '',
    list:         options.list         || [],
    confirmLabel: options.confirmLabel || 'OK',
    autoClose:    options.autoClose    || 0
  };
};

// ─── Store Computed ───────────────────────────────────────
const items        = computed(() => crudStore.getAllItems);
const isLoading    = computed(() => crudStore.isLoading);
const hasError     = computed(() => crudStore.hasError);
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred');

// ─── Search / Pagination State ────────────────────────────
const searchFilters = ref({ search: '', status: '', date: '' });
const currentPage   = ref(1);
const itemsPerPage  = ref(10);
const sortConfig    = ref({ by: '', order: 'asc' });

// ─── Form Fields ──────────────────────────────────────────
const formFields = [
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    required: true,
    placeholder: 'Enter flash sale title...'
  },
  {
    name: 'start_date',
    label: 'Start Date',
    type: 'date',
    required: true
  },
  {
    name: 'end_date',
    label: 'End Date',
    type: 'date',
    required: true
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active',   label: 'Active'   },
      { value: 'inactive', label: 'Inactive' }
    ]
  }
];

// ─── Filter Fields ────────────────────────────────────────
const filterFields = [
  {
    name: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by title...'
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All Status',
    options: [
      { value: 'active',   label: 'Active'   },
      { value: 'inactive', label: 'Inactive' }
    ]
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date'
  }
];

// ─── Table Config ─────────────────────────────────────────
const tableColumns = [
  { key: 'id',         label: 'ID',         sortable: true  },
  { key: 'title',      label: 'Title',      sortable: true  },
  { key: 'start_date', label: 'Start Date', sortable: true  },
  { key: 'end_date',   label: 'End Date',   sortable: true  },
  { key: 'status',     label: 'Status',     sortable: true  },
  { key: 'actions',    label: 'Actions',    type: 'actions', align: 'center' }
];

const tableActions = [
  { name: 'view',        label: 'View',         class: 'btn-view'        },
  { name: 'edit',        label: 'Edit',         class: 'btn-edit'        },
  { name: 'addProduct',  label: 'Add Product',  class: 'btn-add-product' },
  { name: 'delete',      label: 'Delete',       class: 'btn-delete'      }
];

// ─── Computed: Filtered / Paginated ──────────────────────
const filteredData = computed(() => {
  let filtered = items.value.filter(item => {
    const matchesSearch = !searchFilters.value.search ||
      item.title?.toLowerCase().includes(searchFilters.value.search.toLowerCase());
    const matchesStatus = !searchFilters.value.status ||
      item.status === searchFilters.value.status;
    const matchesDate = !searchFilters.value.date ||
      item.created_at?.startsWith(searchFilters.value.date);
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (sortConfig.value.by) {
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.value.by];
      const bVal = b[sortConfig.value.by];
      if (aVal < bVal) return sortConfig.value.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.value.order === 'asc' ? 1  : -1;
      return 0;
    });
  }
  return filtered;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredData.value.slice(start, start + itemsPerPage.value);
});

// ─── Load Flash Sales ─────────────────────────────────────
const loadData = async () => {
  crudStore.clearError();

  const params = {
    page:  currentPage.value,
    limit: itemsPerPage.value
  };
  if (searchFilters.value.search) params.search    = searchFilters.value.search;
  if (searchFilters.value.status) params.status    = searchFilters.value.status;
  if (searchFilters.value.date)   params.date      = searchFilters.value.date;
  if (sortConfig.value.by) {
    params.sort_by    = sortConfig.value.by;
    params.sort_order = sortConfig.value.order;
  }

  const result = await crudStore.fetchAll('/admin/flash-sales', params);
  if (!result.success) {
    showNotification('error', 'Failed to load flash sales', {
      details: result.error?.message || 'Please try again later.'
    });
  }
};

// ─── Open Modals ──────────────────────────────────────────
const openCreateModal = () => {
  modalMode.value   = 'create';
  selectedItem.value = {};
  showFormModal.value = true;
};

const openEditModal = async (item) => {
  const result = await crudStore.fetchById('/admin/flash-sales/', item.id);
  if (result.success) {
    modalMode.value    = 'edit';
    selectedItem.value = { ...result.data };
    showFormModal.value = true;
  } else {
    showNotification('error', 'Failed to load flash sale details', {
      details: result.error?.message
    });
  }
};

const openDeleteModal = (item) => {
  selectedItem.value  = { ...item };
  showDeleteModal.value = true;
};

const openViewModal = async (item) => {
  const result = await crudStore.fetchById('/admin/flash-sales/', item.id);
  if (result.success) {
    selectedItem.value = { ...result.data };
    showViewModal.value = true;
  } else {
    showNotification('error', 'Failed to load flash sale details', {
      details: result.error?.message
    });
  }
};

// ─── Products Modal ───────────────────────────────────────
const openProductsModal = async (item) => {
  currentSale.value         = item;
  productSearchQuery.value  = '';
  productSearchResults.value = [];
  showProductsModal.value   = true;
  await loadSaleProducts(item.id);
};

const closeProductsModal = () => {
  showProductsModal.value    = false;
  currentSale.value          = null;
  saleProducts.value         = [];
  productSearchResults.value = [];
  productSearchQuery.value   = '';
};

const loadSaleProducts = async (saleId) => {
  saleProductsLoading.value = true;
  try {
    const response = await axios.get(`${baseApi}/admin/flash-sale-products/${saleId}`);
    // Handle both { list: [...] } and direct array responses
    saleProducts.value = response.data?.list || response.data || [];
  } catch (e) {
    showNotification('error', 'Failed to load sale products', {
      details: e.response?.data?.message || e.message
    });
  } finally {
    saleProductsLoading.value = false;
  }
};

const isProductAdded = (productId) => {
  return saleProducts.value.some(
    sp => sp.product_id === productId || sp.product?.id === productId
  );
};

// Debounce helper
let searchTimeout = null;
const debouncedProductSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchProducts, 400);
};

const searchProducts = async () => {
  if (!productSearchQuery.value.trim()) {
    productSearchResults.value = [];
    return;
  }
  productSearchLoading.value = true;
  try {
    const response = await axios.get(`${baseApi}/admin/products`, {
      params: { search: productSearchQuery.value, limit: 20 }
    });
    productSearchResults.value = response.data?.list || response.data || [];
  } catch (e) {
    showNotification('error', 'Failed to search products', {
      details: e.response?.data?.message || e.message
    });
  } finally {
    productSearchLoading.value = false;
  }
};

const addProduct = async (product) => {
  addingProductId.value = product.id;
  try {
    await axios.post(`${baseApi}/admin/flash-sale-products/store/${currentSale.value.id}`, {
      flash_sale_id: currentSale.value.id,
      product_id:    product.id
    });
    // Refresh sale products list
    await loadSaleProducts(currentSale.value.id);
    showNotification('success', `"${product.product_name}" added to flash sale!`, { autoClose: 2000 });
  } catch (e) {
    showNotification('error', 'Failed to add product', {
      details: e.response?.data?.message || e.message
    });
  } finally {
    addingProductId.value = null;
  }
};

const removeProduct = async (saleProduct) => {
  removingProductId.value = saleProduct.id;
  try {
    await axios.delete(`${baseApi}/admin/flash-sale-products/delete/${saleProduct.id}`);
    saleProducts.value = saleProducts.value.filter(sp => sp.id !== saleProduct.id);
    showNotification('success', 'Product removed from flash sale!', { autoClose: 2000 });
  } catch (e) {
    showNotification('error', 'Failed to remove product', {
      details: e.response?.data?.message || e.message
    });
  } finally {
    removingProductId.value = null;
  }
};

// ─── Form Submit ──────────────────────────────────────────
const handleFormSubmit = async (data, mode, initialData) => {
  let result;

  const payload = data instanceof FormData ? data : (() => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') fd.append(k, String(v));
    });
    return fd;
  })();

  if (mode === 'create') {
    result = await crudStore.create('/admin/flash-sales', payload);
  } else {
    payload.append('_method', 'PUT');
    result = await crudStore.post(`/admin/flash-sales/${initialData.id}`, payload);
  }

  if (!result.success) throw new Error(result.error?.message);
  return result.data;
};

// ─── Delete Submit ────────────────────────────────────────
const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/admin/flash-sales/', data.id);
  if (!result.success) throw new Error(result.error?.message);
  return result.data;
};

// ─── Success / Error Handlers ─────────────────────────────
const handleModalSuccess = ({ mode }) => {
  const msg = mode === 'create'
    ? 'Flash sale created successfully!'
    : 'Flash sale updated successfully!';
  showNotification('success', msg, { autoClose: 3000 });
  loadData();
};

const handleDeleteSuccess = () => {
  showNotification('success', 'Flash sale deleted successfully!', { autoClose: 3000 });
  loadData();
};

const handleModalError = ({ error }) => {
  let errorList = [];
  if (error.response?.data?.errors) {
    errorList = Object.entries(error.response.data.errors).map(
      ([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
    );
  }
  showNotification('error', error.message || 'An unexpected error occurred.', {
    details: errorList.length ? 'Please check the following fields:' : 'Please try again.',
    list: errorList
  });
};

// ─── Search / Filter / Sort / Pagination ──────────────────
const handleSearch = () => {
  currentPage.value = 1;
  loadData();
  showNotification('info', 'Search filters applied', {
    details: `Found ${filteredData.value.length} flash sale(s).`,
    autoClose: 2000
  });
};

const handleReset = () => {
  searchFilters.value = { search: '', status: '', date: '' };
  currentPage.value   = 1;
  loadData();
  showNotification('info', 'Filters reset', { details: 'All filters cleared.', autoClose: 2000 });
};

const handleSort = (sortData) => {
  sortConfig.value = sortData;
  loadData();
};

const handleAction = ({ action, row }) => {
  switch (action) {
    case 'view':       openViewModal(row);     break;
    case 'edit':       openEditModal(row);     break;
    case 'addProduct': openProductsModal(row); break;
    case 'delete':     openDeleteModal(row);   break;
  }
};

// const handlePageChange     = (page)    => { currentPage.value  = page;    loadData(); };
// const handlePageSizeChange = (newSize) => { itemsPerPage.value = newSize; currentPage.value = 1; loadData(); };

// ─── Lifecycle ────────────────────────────────────────────
onMounted(() => loadData());
onBeforeUnmount(() => crudStore.clearCurrentItem());
</script>

<style scoped>
/* ─── Dashboard Shell ──────────────────────────────────── */
.dashboard {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  background: #f0f2f5;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* ─── Header ───────────────────────────────────────────── */
.header {
  background: #1d283a;
  color: white;
  padding: 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.add-btn {
  background: white;
  color: #f97316;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* ─── Status Badge ─────────────────────────────────────── */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}
.badge-active   { background: #dcfce7; color: #16a34a; }
.badge-inactive { background: #fee2e2; color: #dc2626; }

/* ─── Loading / Error ──────────────────────────────────── */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.spinner-large {
  width: 60px; height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #f97316;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0%   { transform: rotate(0deg);   }
  100% { transform: rotate(360deg); }
}

.loading-container p { font-size: 16px; color: #6c757d; margin: 0; }

.error-icon           { font-size: 64px; margin-bottom: 20px; }
.error-container h3   { font-size: 24px; color: #dc3545; margin: 0 0 10px 0; }
.error-container p    { font-size: 16px; color: #6c757d; margin: 0 0 20px 0; }

.retry-btn {
  padding: 12px 32px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
.retry-btn:hover {
  background: #ea6c08;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249,115,22,0.3);
}

.table-container { padding: 40px; }

/* ─── Products Modal Overlay ───────────────────────────── */
.products-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* ─── Products Modal ───────────────────────────────────── */
.products-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0,0,0,0.25);
  overflow: hidden;
}

.products-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  color: white;
  flex-shrink: 0;
}

.products-modal-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.flash-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.products-modal-title h2 {
  margin: 0 0 2px 0;
  font-size: 20px;
  font-weight: 700;
}

.sale-name {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 36px; height: 36px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background: rgba(255,255,255,0.35); }

/* ─── Modal Body ───────────────────────────────────────── */
.products-modal-body {
  display: grid;
  grid-template-columns: 1fr 4px 1fr;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.product-search-panel,
.sale-products-panel {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-divider {
  background: #f1f5f9;
  width: 100%;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: #f97316;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
}

/* ─── Search Row ───────────────────────────────────────── */
.search-row {
  display: flex;
  gap: 8px;
}

.product-search-input {
  flex: 1;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.product-search-input:focus { border-color: #f97316; }

.search-btn {
  background: #f97316;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  display: flex; align-items: center; gap: 6px;
}
.search-btn:hover { background: #ea6c08; }

/* ─── Search Results ───────────────────────────────────── */
.search-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.search-result-item,
.sale-product-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  transition: border-color 0.2s, background 0.2s;
}

.search-result-item:hover   { border-color: #f97316; background: #fff7ed; }
.search-result-item.already-added { opacity: 0.55; }

.product-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.product-thumb {
  width: 40px; height: 40px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.product-thumb-placeholder {
  width: 40px; height: 40px;
  background: #f3f4f6;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.product-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.product-price {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.add-product-btn {
  background: #f0fdf4;
  color: #16a34a;
  border: 1.5px solid #bbf7d0;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex; align-items: center; gap: 4px;
  flex-shrink: 0;
}
.add-product-btn:hover:not(:disabled) { background: #16a34a; color: white; border-color: #16a34a; }
.add-product-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.added-label {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  flex-shrink: 0;
}

.remove-product-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1.5px solid #fecaca;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex; align-items: center; gap: 4px;
  flex-shrink: 0;
}
.remove-product-btn:hover:not(:disabled) { background: #dc2626; color: white; border-color: #dc2626; }
.remove-product-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ─── Sale Products List ───────────────────────────────── */
.sale-products-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sale-product-item { border-color: #e5e7eb; }

/* ─── Empty / Loading States ───────────────────────────── */
.no-results {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 16px;
}

.no-sale-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  color: #9ca3af;
}

.empty-icon  { font-size: 40px; }
.no-sale-products p { font-size: 13px; margin: 0; }

.panel-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
  padding: 16px 0;
}

/* ─── Spinner SM ───────────────────────────────────────── */
.spinner-sm {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ─── Footer ───────────────────────────────────────────── */
.products-modal-footer {
  padding: 16px 28px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.close-modal-btn {
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.close-modal-btn:hover { opacity: 0.9; }

/* ─── Responsive ───────────────────────────────────────── */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .table-container,
  .loading-container,
  .error-container {
    padding: 20px;
  }

  .products-modal-body {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 4px 1fr;
  }

  .modal-divider {
    width: 100%;
    height: 4px;
  }

  .product-name { max-width: 120px; }
}
</style>