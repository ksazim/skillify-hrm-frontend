<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Carousel Management</h1>
        <button class="add-btn" @click="openCreateModal">Add New Banner</button>
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
        <p>Loading banners...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError && !items.length" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Failed to Load Banners</h3>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="loadData">Retry</button>
      </div>

      <!-- DataTable Component -->
      <div v-else class="table-container">
        <DataTable
          :data="paginatedData"
          :columns="tableColumns"
          :actions="tableActions"
          result-label="banners"
          @action="handleAction"
          @sort="handleSort"
        >
          <!-- Custom slot for image column - FIXED: Use getImageUrl helper -->
          <template #cell-file_name="{ value }">
            <img v-if="value" :src="getImageUrl(value)" alt="Banner" class="banner-thumbnail" />
            <span v-else class="no-image">No Image</span>
          </template>
        </DataTable>

        <!-- Pagination Component -->
        <!-- <Pagination
          v-model="currentPage"
          :total-items="filteredData.length"
          :page-size="itemsPerPage"
          :page-size-options="[5, 10, 20, 50]"
          item-label="banners"
          :show-first-last="true"
          :show-jump-to="true"
          @update:page-size="handlePageSizeChange"
          @page-change="handlePageChange"
        /> -->
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <BaseModal
      v-model="showFormModal"
      :mode="modalMode"
      entity-name="banner"
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
      entity-name="banner"
      :initial-data="selectedService"
      :on-submit="handleDeleteSubmit"
      delete-message="This banner will be permanently removed from the system."
      @success="handleDeleteSuccess"
      @error="handleModalError"
    />

    <!-- View Modal -->
    <BaseModal
      v-model="showViewModal"
      mode="view"
      entity-name="banner"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useCrudStore } from '@/store/crud';
import FilterPanel from '../components/FilterComponent.vue';
import DataTable from '../components/TableComponent.vue';
// import Pagination from '../components/PaginationComponent.vue';
import BaseModal from '../components/ActionModalComponent.vue';
import NotificationModal from '../components/NotificationModal.vue';

// Store
const crudStore = useCrudStore();

// FIXED: Get API base URL from environment or store
const API_BASE_URL = process.env.VUE_APP_BASE_URL;

// FIXED: Helper function to construct full image URL
const getImageUrl = (filePath) => {
  if (!filePath) return '';
  
  // If already a complete URL, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // Construct full URL: base URL + file path
  return `${API_BASE_URL}/${cleanPath}`;
};

// Modal states
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const modalMode = ref('create');
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

// Form fields configuration - FIXED: Backend expects 'file_name'
const formFields = [
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    required: true,
    placeholder: 'Enter banner title...'
  },
  {
    name: 'file_name',  // Backend expects 'file_name'
    label: 'Banner Image',
    type: 'file',
    required: true,
    accept: 'image/*',
    description: 'Upload banner image (JPG, PNG, GIF)'
  },
  {
    name: 'secondary_title',
    label: 'Secondary Title',
    type: 'text',
    required: false,
    placeholder: 'Enter secondary title (optional)...'
  },
  {
    name: 'link_title',
    label: 'Link Title',
    type: 'text',
    required: false,
    placeholder: 'Enter link title (optional)...'
  },
  {
    name: 'link_path',
    label: 'Link Path',
    type: 'text',
    required: false,
    placeholder: 'Enter link path (optional)...'
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
  }
];

// Filter fields configuration
const filterFields = [
  // {
  //   name: 'title',
  //   label: 'Banner Title',
  //   type: 'text',
  //   placeholder: 'Search by title...'
  // },
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
    key: 'file_name',
    label: 'Banner Image',
    sortable: false,
    width: '120px',
    type: 'file',
    accept: 'image/*'
  },
  {
    key: 'title',
    label: 'Title',
    sortable: true
  },
  {
    key: 'secondary_title',
    label: 'Secondary Title',
    sortable: false
  },
  {
    key: 'link_title',
    label: 'Link Title',
    sortable: false
  },
  {
    key: 'link_path',
    label: 'Link Path',
    sortable: false
  },
  {
    key: 'status',
    label: 'Status',
    type: 'status',
    sortable: true
  },
  {
    key: 'created_at',
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

// Computed - Filtered data
const filteredData = computed(() => {
  let filtered = items.value.filter(item => {
    const matchesTitle = !searchFilters.value.title || 
      item.title?.toLowerCase().includes(searchFilters.value.title.toLowerCase());
    
    const matchesStatus = !searchFilters.value.status || 
      item.status === searchFilters.value.status;
    
    const matchesDate = !searchFilters.value.date || 
      item.created_at === searchFilters.value.date;
    
    return matchesTitle && matchesStatus && matchesDate;
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

// Computed - Paginated data
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

// Load data from API
const loadData = async () => {
  crudStore.clearError();
  
  const params = {
    page: currentPage.value,
    limit: itemsPerPage.value
  };
  
  if (searchFilters.value.title) {
    params.search = searchFilters.value.title;
  }
  if (searchFilters.value.status) {
    params.status = searchFilters.value.status;
  }
  if (searchFilters.value.date) {
    params.date = searchFilters.value.date;
  }
  
  if (sortConfig.value.by) {
    params.sort_by = sortConfig.value.by;
    params.sort_order = sortConfig.value.order;
  }
  
  const result = await crudStore.fetchAll('/admin/carousel', params);
  
  if (!result.success) {
    showNotification('error', 'Failed to load banners', {
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
  const result = await crudStore.fetchById('/admin/carousel/', service.id);
  
  if (result.success) {
    modalMode.value = 'edit';
    selectedService.value = { ...result.data };
    showFormModal.value = true;
  } else {
    showNotification('error', 'Failed to load banner details', {
      details: result.error.message
    });
  }
};

const openDeleteModal = (service) => {
  selectedService.value = { ...service };
  showDeleteModal.value = true;
};

const openViewModal = async (service) => {
  const result = await crudStore.fetchById('/admin/carousel/', service.id);
  
  if (result.success) {
    selectedService.value = { ...result.data };
    showViewModal.value = true;
  } else {
    showNotification('error', 'Failed to load banner details', {
      details: result.error.message
    });
  }
};

// Form submit handler
const handleFormSubmit = async (data, mode, initialData) => {
  console.log('=== CAROUSEL FORM SUBMIT DEBUG ===');
  console.log('Received data:', data);
  console.log('Data is FormData?', data instanceof FormData);
  console.log('Mode:', mode);
  
  let result;
  
  if (data instanceof FormData) {
    console.log('Data is FormData - checking entries...');
    
    // Check if FormData has any entries
    const entries = Array.from(data.entries());
    console.log('Total entries:', entries.length);
    
    if (entries.length === 0) {
      console.error('ERROR: FormData is empty!');
      throw new Error('No form data received');
    }
    
    // Log all entries for debugging - ESPECIALLY FILE
    for (let [key, value] of entries) {
      if (value instanceof File) {
        console.log(`  ${key}: [FILE] ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    // Check if file_name exists and is a File
    const fileEntry = data.get('file_name');
    if (!fileEntry || !(fileEntry instanceof File)) {
      console.error('ERROR: file_name is not a File object!', fileEntry);
      throw new Error('Please select an image file to upload');
    }
    
    if (fileEntry.size === 0) {
      console.error('ERROR: file_name is empty (0 bytes)!');
      throw new Error('The selected file is empty');
    }
    
    console.log('File validation passed:', {
      name: fileEntry.name,
      size: fileEntry.size,
      type: fileEntry.type
    });
    
    // FormData already created by BaseModal, use it directly
    if (mode === 'create') {
      console.log('Sending CREATE request to /admin/carousel');
      result = await crudStore.create('/admin/carousel', data);
    } else {
      // For update, add ID and _method
      data.append('id', initialData.id);
      data.append('_method', 'PUT');
      console.log('Sending UPDATE request to /admin/carousel/' + initialData.id);
      result = await crudStore.post(`/admin/carousel/${initialData.id}`, data);
    }
  } else {
    // BaseModal sent plain object
    console.log('Data is plain object:', data);
    console.log('Data keys:', Object.keys(data));
    
    if (!data || Object.keys(data).length === 0) {
      console.error('ERROR: No data received!');
      throw new Error('No form data received');
    }
    
    // Check if file_name exists
    if (!data.file_name || !(data.file_name instanceof File)) {
      console.error('ERROR: file_name missing or not a File!', data.file_name);
      throw new Error('Please select an image file to upload');
    }
    
    // Convert to FormData
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof File) {
          console.log(`Adding file: ${key} = ${value.name} (${value.size} bytes)`);
          formData.append(key, value);
        } else {
          console.log(`Adding field: ${key} = ${value}`);
          formData.append(key, String(value));
        }
      }
    });
    
    if (mode === 'create') {
      result = await crudStore.create('/admin/carousel', formData);
    } else {
      formData.append('id', initialData.id);
      formData.append('_method', 'PUT');
      result = await crudStore.post(`/admin/carousel/${initialData.id}`, formData);
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
  const result = await crudStore.delete('/admin/carousel/', data.id);
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
};

// Success handlers
const handleModalSuccess = ({ data, mode }) => {
  if (mode === 'create') {
    showNotification('success', 'Banner created successfully!', {
      details: `${data.title || 'The banner'} has been added.`,
      autoClose: 3000
    });
  } else if (mode === 'edit') {
    showNotification('success', 'Banner updated successfully!', {
      details: `Changes to ${data.title || 'the banner'} have been saved.`,
      autoClose: 3000
    });
  }
  
  loadData();
};

const handleDeleteSuccess = () => {
  showNotification('success', 'Banner deleted successfully!', {
    details: 'The banner has been permanently removed from the system.',
    autoClose: 3000
  });
  
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
    details: `Found ${filteredData.value.length} banner(s) matching your criteria.`,
    autoClose: 2000
  });
};

const handleReset = () => {
  searchFilters.value = {
    title: '',
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
// const handlePageChange = (page) => {
//   currentPage.value = page;
//   loadData();
// };

// const handlePageSizeChange = (newSize) => {
//   itemsPerPage.value = newSize;
//   currentPage.value = 1;
//   loadData();
// };

// Load data on mount
onMounted(() => {
  loadData();
});

// Cleanup on unmount
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

/* Banner Thumbnail */
.banner-thumbnail {
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.no-image {
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
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
  
  .banner-thumbnail {
    width: 80px;
    height: 48px;
  }
}
</style>