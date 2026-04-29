<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Contact Management</h1>
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
        <p>Loading countries...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError && !items.length" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Failed to Load Countries</h3>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="loadData">Retry</button>
      </div>

      <!-- DataTable Component -->
      <div v-else class="table-container">
        <DataTable
          :data="items"
          :columns="tableColumns"
          :actions="tableActions"
          result-label="countries"
          @action="handleAction"
          @sort="handleSort"
        >
          <!-- Custom slot for price column -->
          <template #cell-price="{ value }">
            <span class="price-value">{{ value }}</span>
          </template>
        </DataTable>

        <!-- Pagination Component -->
        <Pagination
          v-model="currentPage"
          :total-items="serverTotal"
          :item-count="items.length"
          :page-size="itemsPerPage"
          :page-size-options="[5, 10, 20, 50]"
          item-label="contacts"
          :show-first-last="true"
          :show-jump-to="true"
          @update:page-size="handlePageSizeChange"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <BaseModal
      v-model="showFormModal"
      :mode="modalMode"
      entity-name="country"
      :fields="formFields"
      :initial-data="selectedService"
      :on-submit="handleFormSubmit"
      size="large"
      @success="handleModalSuccess"
      @error="handleModalError"
    />

    <!-- Delete Confirmation Modal -->
    <BaseModal
      v-model="showDeleteModal"
      mode="delete"
      entity-name="country"
      :initial-data="selectedService"
      :on-submit="handleDeleteSubmit"
      delete-message="This country will be permanently removed from the system."
      @success="handleDeleteSuccess"
      @error="handleModalError"
    />

    <!-- View Modal -->
    <BaseModal
      v-model="showViewModal"
      mode="view"
      entity-name="country"
      :fields="formFields"
      :initial-data="selectedService"
      size="large"
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
import { ref, computed, onMounted } from 'vue';
import { useCrudStore } from '@/store/crud';
import FilterPanel from './components/FilterComponent.vue';
import DataTable from './components/TableComponent.vue';
import Pagination from './components/PaginationComponent.vue';
import BaseModal from './components/ActionModalComponent.vue';
import NotificationModal from './components/NotificationModal.vue';

// Store
const crudStore = useCrudStore();

// Modal states
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const modalMode = ref('create'); // 'create' or 'edit'
const selectedService = ref({});

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
  serviceName: '',
  status: '',
  date: ''
});

const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortConfig = ref({ by: '', order: 'asc' });

// Form fields configuration
const formFields = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Enter country name...',
    description: 'The name of the country as it will appear to customers'
  },
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    required: true
  },
  {
    name: 'subject',
    label: 'Subject',
    type: 'text',
    required: true
  },
  {
    name: 'message',
    label: 'Message',
    type: 'textarea',
    placeholder: 'Write your message ...',
    rows: 4,
    required: true
  }
];

// Filter fields configuration
const filterFields = [
  {
    name: 'read',
    label: 'Status',
    type: 'select',
    placeholder: 'All Status',
    options: [
      { value: 'yes', label: 'Seen' },
      { value: 'inano', label: 'Unseen' }
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
    key: 'name',
    label: 'Full Name',
    sortable: true
  },
  {
    key: 'email',
    label: 'Email',
    sortable: false
  },
  {
    key: 'subject',
    label: 'Subject',
    sortable: false
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
    name: 'view',
    label: 'View',
    class: 'btn-view'
  },
  {
    name: 'delete',
    label: 'Delete',
    class: 'btn-delete'
  }
];

// Load services from API
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
const result = await crudStore.fetchAll('/admin/contacts', params);
if (!result.success)
showNotification('error', 'Failed to load contacts', { details: result.error?.message });
};

const openEditModal = async (service) => {
  // Fetch full service details
  const result = await crudStore.fetchById('/admin/contacts/', service.id);
  
  if (result.success) {
    modalMode.value = 'edit';
    selectedService.value = { ...result.data };
    showFormModal.value = true;
  } else {
    showNotification('error', 'Failed to load service details', {
      details: result.error.message
    });
  }
};

const openDeleteModal = (service) => {
  selectedService.value = { ...service };
  showDeleteModal.value = true;
};

const openViewModal = async (service) => {
  // Fetch full service details
  const result = await crudStore.fetchById('/admin/contacts/', service.id);
  
  if (result.success) {
    selectedService.value = { ...result.data };
    showViewModal.value = true;
  } else {
    showNotification('error', 'Failed to load service details', {
      details: result.error.message
    });
  }
};

// Form submit handler (create/edit) - WITH DEBUGGING
const handleFormSubmit = async (data, mode, initialData) => {
  console.log('=== FORM SUBMIT DEBUG ===');
  console.log('Received data:', data);
  console.log('Data is FormData?', data instanceof FormData);
  console.log('Mode:', mode);
  
  let result;
  
  // BaseModal is sending FormData, we need to check if it has entries
  if (data instanceof FormData) {
    console.log('Data is FormData - checking entries...');
    
    let hasData = false;
    for (let pair of data.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
      hasData = true;
    }
    
    if (!hasData) {
      console.error('ERROR: FormData is empty!');
      throw new Error('No form data received');
    }
    
    // FormData already created by BaseModal, use it directly
    if (mode === 'create') {
      console.log('Sending CREATE request');
      result = await crudStore.create('/admin/contacts', data);
    } else {
      // For update, add ID and _method
      data.append('id', initialData.id);
      data.append('_method', 'PUT');
      console.log('Sending UPDATE request');
      result = await crudStore.post(`/admin/contacts/${initialData.id}`, data);
    }
  } else {
    // BaseModal sent plain object
    console.log('Data is plain object:', data);
    console.log('Data keys:', Object.keys(data));
    
    if (!data || Object.keys(data).length === 0) {
      console.error('ERROR: No data received!');
      throw new Error('No form data received');
    }
    
    // Convert to FormData
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    if (mode === 'create') {
      result = await crudStore.create('/admin/contacts', formData);
    } else {
      formData.append('id', initialData.id);
      formData.append('_method', 'PUT');
      result = await crudStore.post(`/admin/contacts/${initialData.id}`, formData);
    }
  }
  
  console.log('Result:', result);
  
  if (!result.success) {
    console.error('Request failed:', result.error);
    throw new Error(result.error.message);
  }
  
  return result.data;
};

// Delete submit handler
const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/admin/contacts/', data.id);
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
};

// Success handlers
const handleModalSuccess = ({ data, mode }) => {
  if (mode === 'create') {
    showNotification('success', 'country created successfully!', {
      details: `${data.name || 'The countrie'} has been added to your services.`,
      autoClose: 3000
    });
  } else if (mode === 'edit') {
    showNotification('success', 'Country updated successfully!', {
      details: `Changes to ${data.name || 'the country'} have been saved.`,
      autoClose: 3000
    });
  }
  
  // Reload services
  loadData();
};

const handleDeleteSuccess = () => {
  showNotification('success', 'Country deleted successfully!', {
    details: 'The country has been permanently removed from the system.',
    autoClose: 3000
  });
  
  // Reload services
  loadData();
};

// Error handler
const handleModalError = ({ error, mode }) => {
  console.error(`${mode} error:`, error);
  
  let errorMessage = error.message || 'An unexpected error occurred. Please try again.';
  let errorDetails = '';
  let errorList = [];
  
  // Check if it's a validation error from the store
  if (error.response?.data?.errors) {
    errorDetails = 'Please check the following fields:';
    errorList = Object.entries(error.response.data.errors).map(
      ([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
    );
  } else if (typeof error === 'object' && error.errors) {
    errorDetails = 'Please check the following fields:';
    errorList = Object.values(error.errors);
  }
  
  // Show error notification
  if (errorList.length > 0) {
    showNotification('error', errorMessage, {
      details: errorDetails,
      list: errorList
    });
  } else {
    showNotification('error', errorMessage, {
      details: errorDetails || 'Please check your input and try again.'
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
  switch (action) {
    case 'view':
      openViewModal(row);
      break;
    case 'edit':
      openEditModal(row);
      break;
    case 'delete':
      openDeleteModal(row);
      break;
  }
};

// Pagination handlers
const handlePageChange     = (p)  => { currentPage.value = p; loadData(); };
const handlePageSizeChange = (sz) => { itemsPerPage.value = Number(sz); currentPage.value = 1; loadData(); };

// Watch for filter changes (optional - for real-time filtering)
// Uncomment if you want to reload on every filter change
// watch(searchFilters, () => {
//   currentPage.value = 1;
//   loadData();
// }, { deep: true });

// Load services on mount
onMounted(() => {
  loadData();
});

// Cleanup on unmount
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  // Clear current item when leaving the page
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

.add-btn {
  background: white;
  color: #667eea;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.add-btn::before {
  content: '+';
  font-size: 20px;
  font-weight: bold;
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

.price-value {
  font-weight: 600;
  color: #667eea;
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