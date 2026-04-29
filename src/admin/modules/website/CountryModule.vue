<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Country Management</h1>
        <button class="add-btn" @click="openCreateModal">Add New Country</button>
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
          :data="paginatedData"
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
          :total-items="filteredData.length"
          :page-size="itemsPerPage"
          :page-size-options="[5, 10, 20, 50]"
          item-label="countries"
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
import FilterPanel from '../components/FilterComponent.vue';
import DataTable from '../components/TableComponent.vue';
import Pagination from '../components/PaginationComponent.vue';
import BaseModal from '../components/ActionModalComponent.vue';
import NotificationModal from '../components/NotificationModal.vue';

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
const items = computed(() => crudStore.getAllItems);
// const pagination = computed(() => crudStore.getPagination);
const isLoading = computed(() => crudStore.isLoading);
const hasError = computed(() => crudStore.hasError);
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred');

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
    label: 'Country Name',
    type: 'text',
    required: true,
    placeholder: 'Enter country name...',
    description: 'The name of the country as it will appear to customers'
  },
  {
    name: 'flag',
    label: 'Flag',
    type: 'file',
    required: false,
    accept: 'image/*'
  },
  {
    name: 'university_count',
    label: 'University Count',
    type: 'text',
    required: false
  },
  {
    name: 'international_students_count',
    label: 'International Students Count',
    type: 'text',
    required: false
  },
  {
    name: 'average_tution',
    label: 'Average Tution',
    type: 'text',
    required: false
  },
  {
    name: 'status',
    label: 'Status',
    type: 'radio',
    required: true,
    default: 'active',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  },
  {
    name: 'short_description',
    label: 'Short Description',
    type: 'textarea',
    placeholder: 'Enter country description...',
    rows: 4
  }
];

// Filter fields configuration
const filterFields = [
  {
    name: 'countryName',
    label: 'Country Name',
    type: 'text',
    placeholder: 'Enter country name...'
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
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
    label: 'Country Name',
    sortable: true
  },
  {
    key: 'flag',
    label: 'Flag',
    type: 'image',
    sortable: false,
    width: '80px' 
  },
  {
    key: 'university_count',
    label: 'University Count',
    sortable: false
  },
  {
    key: 'international_students_count',
    label: 'International Students Count',
    sortable: false
  },
  {
    key: 'average_tution',
    label: 'Average Tution',
    sortable: false
  },
  {
    key: 'status',
    label: 'Status',
    type: 'status',
    sortable: true
  },
  {
    key: 'createdDate',
    label: 'Created Date',
    type: 'date',
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
    name: 'view',
    label: 'View',
    class: 'btn-view'
  },
  {
    name: 'edit',
    label: 'Edit',
    class: 'btn-edit'
  },
  {
    name: 'delete',
    label: 'Delete',
    class: 'btn-delete'
  }
];

// Computed - Filtered services (client-side filtering)
const filteredData = computed(() => {
  let filtered = items.value.filter(service => {
    const matchesName = !searchFilters.value.serviceName || 
      service.name.toLowerCase().includes(searchFilters.value.serviceName.toLowerCase());
    
    const matchesCategory = !searchFilters.value.category || 
      service.category === searchFilters.value.category;
    
    const matchesStatus = !searchFilters.value.status || 
      service.status === searchFilters.value.status;
    
    const matchesDate = !searchFilters.value.date || 
      service.createdDate === searchFilters.value.date;
    
    return matchesName && matchesCategory && matchesStatus && matchesDate;
  });

  // Apply sorting
  if (sortConfig.value.by) {
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.value.by];
      const bVal = b[sortConfig.value.by];
      
      if (aVal < bVal) return sortConfig.value.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.value.order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return filtered;
});

// Computed - Paginated services
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

// Load services from API
const loadData = async () => {
  // Clear any previous errors
  crudStore.clearError();
  
  // Build query parameters
  const params = {
    page: currentPage.value,
    limit: itemsPerPage.value
  };
  
  // Add search filters if they exist
  if (searchFilters.value.serviceName) {
    params.search = searchFilters.value.serviceName;
  }
  if (searchFilters.value.category) {
    params.category = searchFilters.value.category;
  }
  if (searchFilters.value.status) {
    params.status = searchFilters.value.status;
  }
  if (searchFilters.value.date) {
    params.date = searchFilters.value.date;
  }
  
  // Add sorting
  if (sortConfig.value.by) {
    params.sort_by = sortConfig.value.by;
    params.sort_order = sortConfig.value.order;
  }
  
  const result = await crudStore.fetchAll('/admin/countries', params);
  
  if (!result.success) {
    showNotification('error', 'Failed to load countries', {
      details: result.error.message || 'Please try again later.'
    });
  }
};

// Modal handlers
const openCreateModal = () => {
  modalMode.value = 'create';
  selectedService.value = {};
  showFormModal.value = true;
};

const openEditModal = async (service) => {
  // Fetch full service details
  const result = await crudStore.fetchById('/admin/countries/', service.id);
  
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
  const result = await crudStore.fetchById('/admin/countries/', service.id);
  
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
      result = await crudStore.create('/admin/countries', data);
    } else {
      // For update, add ID and _method
      data.append('id', initialData.id);
      data.append('_method', 'PUT');
      console.log('Sending UPDATE request');
      result = await crudStore.post(`/admin/countries/${initialData.id}`, data);
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
      result = await crudStore.create('/admin/countries', formData);
    } else {
      formData.append('id', initialData.id);
      formData.append('_method', 'PUT');
      result = await crudStore.post(`/admin/countries/${initialData.id}`, formData);
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
  const result = await crudStore.delete('/admin/countries/', data.id);
  
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
  currentPage.value = 1;
  loadData();
  
  showNotification('info', 'Search filters applied', {
    details: `Found ${filteredData.value.length} country(s) matching your criteria.`,
    autoClose: 2000
  });
};

const handleReset = () => {
  // Reset filters
  searchFilters.value = {
    serviceName: '',
    category: '',
    status: '',
    date: ''
  };
  
  currentPage.value = 1;
  loadData();
  
  showNotification('info', 'Filters reset', {
    details: 'All filters have been cleared.',
    autoClose: 2000
  });
};

// Sorting handler
const handleSort = (sortData) => {
  sortConfig.value = sortData;
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
const handlePageChange = (page) => {
  currentPage.value = page;
  loadData();
};

const handlePageSizeChange = (newSize) => {
  itemsPerPage.value = newSize;
  currentPage.value = 1;
  loadData();
};

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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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