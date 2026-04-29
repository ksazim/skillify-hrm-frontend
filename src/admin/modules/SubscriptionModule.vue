<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Subscription Management</h1>
      </div>

      <!-- Filter Panel Component -->
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
        <p>Loading subscriptions...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError && !items.length" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Failed to Load Subscriptions</h3>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="loadData">Retry</button>
      </div>

      <!-- DataTable Component -->
      <div v-else class="table-container">
        <DataTable
          :data="items"
          :columns="tableColumns"
          :actions="tableActions"
          result-label="subscriptions"
          @action="handleAction"
          @sort="handleSort"
        />

        <!-- Pagination Component -->
        <Pagination
          v-model="currentPage"
          :total-items="serverTotal"
          :item-count="items.length"
          :page-size="itemsPerPage"
          :page-size-options="[5, 10, 20, 50]"
          item-label="subscriptions"
          :show-first-last="true"
          :show-jump-to="true"
          @update:page-size="handlePageSizeChange"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <BaseModal
      v-model="showDeleteModal"
      mode="delete"
      entity-name="subscription"
      :initial-data="selectedItem"
      :on-submit="handleDeleteSubmit"
      delete-message="This subscription will be permanently removed from the system."
      @success="handleDeleteSuccess"
      @error="handleModalError"
    />

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
import Pagination from './components/PaginationComponent.vue';
import BaseModal from './components/ActionModalComponent.vue';
import NotificationModal from './components/NotificationModal.vue';

// Store
const crudStore = useCrudStore();

// Modal states
const showDeleteModal = ref(false);
const selectedItem = ref({});

// Notification state
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
  details: '',
  list: [],
  confirmLabel: 'OK',
  autoClose: 0
});

// Helper function to show notifications
const showNotification = (type, message, options = {}) => {
  notification.value = {
    show: true,
    type,
    message,
    title: options.title || '',
    details: options.details || '',
    list: options.list || [],
    confirmLabel: options.confirmLabel || 'OK',
    autoClose: options.autoClose || 0
  };
};

// Computed properties from store
const items        = computed(() => crudStore.getAllItems);
const isLoading    = computed(() => crudStore.isLoading);
const hasError     = computed(() => crudStore.hasError);
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred');
// Real total from server pagination — never use filteredData.length / items.length
const serverTotal  = computed(() => crudStore.getPagination.totalItems);

// Search and pagination state
const searchFilters = ref({
  search: '',
  status: '',
  date: ''
});

const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortConfig = ref({ by: '', order: 'asc' });

// Filter fields configuration
const filterFields = [
  {
    name: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by name or email...'
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
  },
  {
    name: 'date',
    label: 'Date',
    type: 'date'
  }
];

// Table configuration
const tableColumns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true
  },
  {
    key: 'created_at',
    label: 'Subscribed At',
    sortable: true
  },
  {
    key: 'actions',
    label: 'Actions',
    type: 'actions',
    align: 'center'
  }
];

const tableActions = [
  {
    name: 'delete',
    label: 'Delete',
    class: 'btn-delete'
  }
];

// Load data from API
const loadData = async () => {
  crudStore.clearError();
  const params = {
  page:       currentPage.value,
  limit:      Number(itemsPerPage.value), // always plain integer — prevents Laravel "Unsupported operand types"
  sort_by:    sortConfig.value.by,
  sort_order: sortConfig.value.order,
  };
  if (searchFilters.value.search)   params.search   = searchFilters.value.search;
  if (searchFilters.value.category) params.category = searchFilters.value.category;
  if (searchFilters.value.status)   params.status   = searchFilters.value.status;
  if (searchFilters.value.date)     params.date     = searchFilters.value.date;
  const result = await crudStore.fetchAll('/admin/subscriptions', params);
  if (!result.success)
  showNotification('error', 'Failed to load products', { details: result.error?.message });
};

const openDeleteModal = (item) => {
  selectedItem.value = { ...item };
  showDeleteModal.value = true;
};

// Delete submit handler
const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/admin/subscriptions/', data.id);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
};

// Success handler
const handleDeleteSuccess = () => {
  showNotification('success', 'Subscription deleted successfully!', {
    details: 'The subscription has been permanently removed from the system.',
    autoClose: 3000
  });

  loadData();
};

// Error handler
const handleModalError = ({ error, mode }) => {
  console.error(`${mode} error:`, error);

  let errorDetails = '';
  let errorList = [];

  if (error.response?.data?.errors) {
    errorDetails = 'Please check the following fields:';
    errorList = Object.entries(error.response.data.errors).map(
      ([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
    );
  }

  if (errorList.length > 0) {
    showNotification('error', error.message || 'An unexpected error occurred.', {
      details: errorDetails,
      list: errorList
    });
  } else {
    showNotification('error', error.message || 'An unexpected error occurred.', {
      details: errorDetails || 'Please try again.'
    });
  }
};

// Search and filter handlers
const handleSearch = () => {
// Reset to page 1 whenever a new search/filter is applied,
// then fire loadData so the server receives the updated params.
currentPage.value = 1;
loadData();
};
const handleReset = () => {
searchFilters.value = { search: '', category: '', status: '', date: '' };
currentPage.value   = 1;
sortConfig.value    = { by: 'created_at', order: 'desc' };
loadData();
};
const handleSort = (s) => {
sortConfig.value  = s;
currentPage.value = 1; // always go back to page 1 on sort change
loadData();
};

// Table action handler
const handleAction = ({ action, row }) => {
  if (action === 'delete') {
    openDeleteModal(row);
  }
};

// Pagination handlers
const handlePageChange     = (p)  => { currentPage.value = p; loadData(); };
const handlePageSizeChange = (sz) => { itemsPerPage.value = Number(sz); currentPage.value = 1; loadData(); };

// Lifecycle
onMounted(() => {
  loadData();
});

onBeforeUnmount(() => {
  crudStore.clearCurrentItem();
});
</script>

<style scoped>
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

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

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-container h3 {
  font-size: 24px;
  color: #dc3545;
  margin: 0 0 10px 0;
}

.error-container p {
  font-size: 16px;
  color: #6c757d;
  margin: 0 0 20px 0;
}

.retry-btn {
  padding: 12px 32px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Table Container */
.table-container {
  padding: 40px;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .table-container,
  .loading-container,
  .error-container {
    padding: 20px;
  }

  .dashboard {
    padding: 10px;
  }
}
</style>