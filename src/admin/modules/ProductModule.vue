<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Product Management</h1>
        <button class="add-btn" @click="openCreateModal">Add New Product</button>
      </div>

      <!-- Filter Panel -->
      <FilterPanel title="Search & Filter" :fields="filterFields" v-model="searchFilters" @submit="handleSearch"
        @reset="handleReset" />

      <!-- Loading State -->
      <div v-if="isLoading && !items.length" class="loading-container">
        <div class="spinner-large"></div>
        <p>Loading products...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError && !items.length" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Failed to Load Products</h3>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="loadData">Retry</button>
      </div>

      <!-- DataTable -->
      <div v-else class="table-container">
        <DataTable :data="items" :columns="tableColumns" :actions="tableActions" result-label="products"
          @action="handleAction" @sort="handleSort">
          <template #cell-photos="{ row }">
            <div class="photo-thumbs">
              <img v-for="(photo, i) in (row.photos || []).slice(0, 3)" :key="i"
                :src="baseUrl + '/' + photo.file_path + '/' + photo.file_name" class="thumb" />
              <span v-if="(row.photos || []).length > 3" class="thumb-more">
                +{{ row.photos.length - 3 }}
              </span>
            </div>
          </template>

          <template #cell-regular_price="{ value }">
            <span class="price">{{ formatPrice(value) }}</span>
          </template>

          <template #cell-offer_price="{ value }">
            <span v-if="value" class="offer-price">{{ formatPrice(value) }}</span>
            <span v-else class="no-offer">—</span>
          </template>

          <template #cell-category="{ row }">
            <span class="cat-badge" v-if="row.category">{{ row.category.name ?? row.category }}</span>
            <span v-else class="no-cat">Uncategorized</span>
          </template>

          <template #cell-stock="{ value }">
            <span :class="value === 'yes' || value === 1 || value === true ? 'in-stock' : 'out-stock'">
              {{ (value === 'yes' || value === 1 || value === true) ? 'In Stock' : 'Out of Stock' }}
            </span>
          </template>
        </DataTable>

        <!-- <Pagination
          v-model="currentPage"
          :total-items="filteredData.length"
          :page-size="itemsPerPage"
          :page-size-options="[5, 10, 20, 50]"
          item-label="products"
          :show-first-last="true"
          :show-jump-to="true"
          @update:page-size="handlePageSizeChange"
          @page-change="handlePageChange"
        /> -->

        <Pagination v-model="currentPage" :total-items="serverTotal" :item-count="items.length"
          :page-size="itemsPerPage" :page-size-options="[5, 10, 20, 50]" item-label="products" :show-first-last="true"
          :show-jump-to="true" @update:page-size="handlePageSizeChange" @page-change="handlePageChange" />
      </div>
    </div>

    <!-- ===================== CREATE / EDIT MODAL ===================== -->
    <Teleport to="body">
      <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
        <div class="modal-box modal-large">
          <div class="modal-header">
            <h2 class="text-card-title">{{ modalMode === 'create' ? 'Add New Product' : 'Edit Product' }}</h2>
            <button class="modal-close" @click="closeFormModal">✕</button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="submitForm" novalidate>
              <div class="form-grid">

                <!-- Product Name -->
                <div class="form-group full">
                  <label class="text-label">Product Name <span class="req">*</span></label>
                  <input v-model="form.product_name" type="text" placeholder="Enter product name..."
                    class="form-input" />
                  <p v-if="formErrors.product_name" class="field-error">{{ formErrors.product_name }}</p>
                </div>

                <!-- Category -->
                <div class="form-group">
                  <label class="text-label">Category </label>
                  <select v-model="form.category_id" class="form-input">
                    <option value="">— Select Category —</option>
                    <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                      {{ cat.label }}
                    </option>
                  </select>
                </div>

                <!-- Stock (Yes / No) -->
                <div class="form-group">
                  <label class="text-label">In Stock <span class="req">*</span></label>
                  <select v-model="form.stock" class="form-input">
                    <option value="">— Select —</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                  <p v-if="formErrors.stock" class="field-error">{{ formErrors.stock }}</p>
                </div>

                <!-- Regular Price -->
                <div class="form-group">
                  <label class="text-label">Regular Price <span class="req">*</span></label>
                  <input v-model="form.regular_price" type="number" step="0.01" min="0" placeholder="0.00"
                    class="form-input" />
                  <p v-if="formErrors.regular_price" class="field-error">{{ formErrors.regular_price }}</p>
                </div>

                <!-- Offer Price -->
                <div class="form-group">
                  <label class="text-label">Offer Price</label>
                  <input v-model="form.offer_price" type="number" step="0.01" min="0" placeholder="0.00"
                    class="form-input" />
                </div>

                <!-- Description -->
                <div class="form-group full">
                  <label class="text-label">Description <span class="req">*</span></label>
                  <textarea v-model="form.description" rows="4" placeholder="Enter product description..."
                    class="form-input"></textarea>
                  <p v-if="formErrors.description" class="field-error">{{ formErrors.description }}</p>
                </div>

                <!-- ── Variants ── -->
                <div class="form-group full">
                  <label class="text-label">Variants</label>

                  <!-- Sizes -->
                  <div class="variant-block">
                    <p class="variant-group-label">Sizes</p>
                    <div class="variant-chips">
                      <button v-for="size in SIZES" :key="size" type="button"
                        :class="['chip', form.variants.sizes.includes(size) ? 'chip-active' : '']"
                        @click="toggleVariant('sizes', size)">{{ size }}</button>
                    </div>
                  </div>

                  <!-- Colors -->
                  <div class="variant-block">
                    <p class="variant-group-label">Colors</p>
                    <div class="variant-chips">
                      <button v-for="color in COLORS" :key="color.value" type="button"
                        :class="['chip chip-color', form.variants.colors.includes(color.value) ? 'chip-active' : '']"
                        @click="toggleVariant('colors', color.value)">
                        <span class="color-dot" :style="{ background: color.hex }"></span>
                        {{ color.label }}
                      </button>
                    </div>
                  </div>

                  <!-- Preview of what will be sent -->
                  <div v-if="form.variants.sizes.length || form.variants.colors.length" class="variant-preview">
                    <span class="preview-label">Will be saved as:</span>
                    <code>{{ variantsJson }}</code>
                  </div>
                </div>

                <!-- Photo Management -->
                <div class="form-group full">
                  <label class="text-label">Product Photos <span v-if="modalMode === 'create'"
                      class="req">*</span></label>

                  <!-- Existing photos (edit mode) -->
                  <div v-if="modalMode === 'edit' && existingPhotos.length" class="existing-photos">
                    <p class="section-label">Current Photos</p>
                    <div class="photo-grid">
                      <div v-for="photo in existingPhotos" :key="photo.id" class="photo-card">
                        <img :src="baseUrl + '/' + photo.file_path + '/' + photo.file_name" :alt="photo.file_name" />
                        <button type="button" class="photo-delete-btn" :disabled="deletingPhotoId === photo.id"
                          @click="deleteExistingPhoto(photo)">
                          <span v-if="deletingPhotoId === photo.id">⏳</span>
                          <span v-else>✕</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Drop zone -->
                  <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="onDrop">
                    <input ref="fileInputRef" type="file" multiple accept="image/jpeg,image/png,image/jpg"
                      class="hidden-input" @change="onFilesSelected" />
                    <div class="upload-placeholder">
                      <span class="upload-icon">📷</span>
                      <p>Click or drag & drop to add photos</p>
                      <p class="upload-hint">JPEG, PNG, JPG — max 2MB each</p>
                    </div>
                  </div>
                  <p v-if="formErrors.photos" class="field-error">{{ formErrors.photos }}</p>

                  <!-- New photo previews -->
                  <div v-if="newPhotoFiles.length" class="photo-grid mt-12">
                    <div v-for="(pf, i) in newPhotoFiles" :key="i" class="photo-card">
                      <img :src="pf.preview" :alt="pf.file.name" />
                      <button type="button" class="photo-delete-btn" @click="removeNewPhoto(i)">✕</button>
                      <span class="photo-name">{{ pf.file.name }}</span>
                    </div>
                  </div>
                </div>

              </div><!-- /form-grid -->

              <div class="modal-footer">
                <button type="button" class="btn-cancel" @click="closeFormModal">Cancel</button>
                <button type="submit" class="btn-submit" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="btn-spinner"></span>
                  {{ isSubmitting ? 'Saving...' : (modalMode === 'create' ? 'Create Product' : 'Update Product') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===================== VIEW MODAL ===================== -->
    <Teleport to="body">
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <div class="modal-box modal-large">
          <div class="modal-header">
            <h2 class="">Product Details</h2>
            <button class="modal-close" @click="showViewModal = false">✕</button>
          </div>
          <div class="modal-body" v-if="selectedItem">
            <div class="view-grid">
              <div class="view-photos">
                <div class="photo-grid">
                  <img v-for="(photo, i) in (selectedItem.photos || [])" :key="i"
                    :src="baseUrl + '/' + photo.file_path + '/' + photo.file_name" class="view-photo" />
                  <p v-if="!(selectedItem.photos || []).length" class="no-photos">No photos available</p>
                </div>
              </div>
              <div class="view-details">
                <div class="detail-row"><span class="detail-label">Name</span><span>{{ selectedItem.product_name
                }}</span>
                </div>
                <div class="detail-row"><span class="detail-label">Category</span><span>{{ selectedItem.category?.name
                  ??
                  '—' }}</span></div>
                <div class="detail-row">
                  <span class="detail-label">Stock</span>
                  <span :class="(selectedItem.stock === 'yes' || selectedItem.stock === 1) ? 'in-stock' : 'out-stock'">
                    {{ (selectedItem.stock === 'yes' || selectedItem.stock === 1) ? 'In Stock' : 'Out of Stock' }}
                  </span>
                </div>
                <div class="detail-row"><span class="detail-label">Regular Price</span><span class="price">{{
                  formatPrice(selectedItem.regular_price) }}</span></div>
                <div class="detail-row"><span class="detail-label">Offer Price</span><span class="offer-price">{{
                  selectedItem.offer_price ? formatPrice(selectedItem.offer_price) : '—' }}</span></div>
                <div class="detail-row"><span class="detail-label">Views</span><span>{{ selectedItem.view ?? 0 }}</span>
                </div>
                <div class="detail-row"><span class="detail-label">Orders</span><span>{{ selectedItem.orders ?? 0
                }}</span>
                </div>
                <div class="detail-row full"><span class="detail-label">Description</span>
                  <p class="detail-desc">{{ selectedItem.description }}</p>
                </div>

                <!-- Sizes -->
                <div v-if="viewVariants.sizes?.length" class="detail-row full">
                  <span class="detail-label">Sizes</span>
                  <div class="variants-view">
                    <span v-for="s in viewVariants.sizes" :key="s" class="variant-chip">{{ s }}</span>
                  </div>
                </div>

                <!-- Colors -->
                <div v-if="viewVariants.colors?.length" class="detail-row full">
                  <span class="detail-label">Colors</span>
                  <div class="variants-view">
                    <span v-for="c in viewVariants.colors" :key="c" class="variant-chip chip-color-view">
                      <span class="color-dot" :style="{ background: colorHex(c) }"></span>{{ c }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showViewModal = false">Close</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===================== DELETE MODAL ===================== -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-box modal-small">
          <div class="modal-header danger">
            <h2>Delete Product</h2>
            <button class="modal-close" @click="showDeleteModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="delete-confirm">
              <span class="delete-icon">🗑️</span>
              <p>Are you sure you want to delete <strong>{{ selectedItem?.product_name }}</strong>?</p>
              <p class="delete-warning">This product and all its photos will be permanently removed.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-danger" :disabled="isSubmitting" @click="confirmDelete">
              <span v-if="isSubmitting" class="btn-spinner"></span>
              {{ isSubmitting ? 'Deleting...' : 'Delete Product' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Notification -->
    <NotificationModal v-model="notification.show" :type="notification.type" :title="notification.title"
      :message="notification.message" :details="notification.details" :list="notification.list"
      :confirm-label="notification.confirmLabel" :auto-close="notification.autoClose" />
  </div>
</template>

<script setup>
import { useCrudStore } from '@/store/crud';
import axios from 'axios';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import FilterPanel from './components/FilterComponent.vue';
import NotificationModal from './components/NotificationModal.vue';
import Pagination from './components/PaginationComponent.vue';
import DataTable from './components/TableComponent.vue';

const baseApi = process.env.VUE_APP_BASE_API
const baseUrl = process.env.VUE_APP_BASE_URL

// ─── Constants ────────────────────────────────────────────────────────────────
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const COLORS = [
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' },
  { value: 'brown', label: 'Brown', hex: '#92400e' },
  { value: 'black', label: 'Black', hex: '#171717' },
  { value: 'white', label: 'White', hex: '#e5e7eb' },
];

const colorHex = (val) => COLORS.find(c => c.value === val)?.hex ?? '#ccc';

// ─── Store ────────────────────────────────────────────────────────────────────
const crudStore = useCrudStore();

// ─── UI state ─────────────────────────────────────────────────────────────────
const showFormModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const modalMode = ref('create');
const selectedItem = ref(null);
const isSubmitting = ref(false);
const deletingPhotoId = ref(null);
const fileInputRef = ref(null);
const categories = ref([]);
const existingPhotos = ref([]);
const newPhotoFiles = ref([]);

// ─── Form ─────────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  product_name: '',
  category_id: '',
  description: '',
  stock: '',
  regular_price: '',
  offer_price: '',
  variants: { sizes: [], colors: [] }
});
const form = ref(emptyForm());
const formErrors = ref({});

// Serialize variants to the JSON array format the backend stores
// Stored as: { sizes: ["S","M"], colors: ["red","blue"] }
// We send two separate keys: variants[sizes] and variants[colors]
// Or merge into one flat array — adjust to match your backend expectation.
// Here we keep them as one JSON object string per the controller: json_encode($request->input('variants'))
const variantsJson = computed(() =>
  JSON.stringify({
    sizes: form.value.variants.sizes,
    colors: form.value.variants.colors
  })
);

// ─── Notification ─────────────────────────────────────────────────────────────
const notification = ref({
  show: false, type: 'success', title: '', message: '',
  details: '', list: [], confirmLabel: 'OK', autoClose: 0
});
const showNotification = (type, message, options = {}) => {
  notification.value = {
    show: true, type, message,
    title: options.title || '', details: options.details || '',
    list: options.list || [], confirmLabel: options.confirmLabel || 'OK',
    autoClose: options.autoClose || 0
  };
};

const items = computed(() => crudStore.getAllItems);
const isLoading = computed(() => crudStore.isLoading);
const hasError = computed(() => crudStore.hasError);
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred');
const serverTotal = computed(() => crudStore.getPagination.totalItems);

// ─── Search / pagination ──────────────────────────────────────────────────────
const searchFilters = ref({ search: '', category: '', status: '', date: '' });
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortConfig = ref({ by: 'created_at', order: 'desc' });

const filterFields = computed(() => [
  { name: 'search', label: 'Product Name', type: 'text', placeholder: 'Search products...' },
  { name: 'category', label: 'Category', type: 'select', placeholder: 'All Categories', options: categories.value },
  {
    name: 'status', label: 'Status', type: 'select', placeholder: 'All Status',
    options: [{ value: 'yes', label: 'In stock' }, { value: 'no', label: 'Out stock' }]
  },
  { name: 'date', label: 'Date', type: 'date' }
]);

// ─── Table config ─────────────────────────────────────────────────────────────
const tableColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'product_name', label: 'Product', sortable: true },
  { key: 'photos', label: 'Photos', type: 'custom', sortable: false },
  { key: 'category', label: 'Category', type: 'custom', sortable: false },
  { key: 'stock', label: 'Stock', type: 'custom', sortable: true },
  { key: 'regular_price', label: 'Price', type: 'custom', sortable: true },
  { key: 'offer_price', label: 'Offer', type: 'custom', sortable: true },
  { key: 'status', label: 'Status', type: 'status', sortable: true },
  { key: 'actions', label: 'Actions', type: 'actions', align: 'center' }
];
const tableActions = [
  { name: 'view', label: 'View', class: 'btn-view' },
  { name: 'edit', label: 'Edit', class: 'btn-edit' },
  { name: 'delete', label: 'Delete', class: 'btn-delete' }
];

// ─── View modal variants ──────────────────────────────────────────────────────
const viewVariants = computed(() => {
  if (!selectedItem.value?.variants) return {};
  try {
    const raw = selectedItem.value.variants;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch { return {}; }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (v) =>
  v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v) : '—';

const toggleVariant = (group, value) => {
  const arr = form.value.variants[group];
  const idx = arr.indexOf(value);
  idx === -1 ? arr.push(value) : arr.splice(idx, 1);
};

// Parse stored variants back into { sizes, colors } for edit mode
const parseVariants = (raw) => {
  if (!raw) return { sizes: [], colors: [] };
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    // Support both { sizes, colors } object and legacy flat array
    if (Array.isArray(parsed)) {
      const sizes = parsed.filter(v => SIZES.includes(v));
      const colors = parsed.filter(v => COLORS.some(c => c.value === v));
      return { sizes, colors };
    }
    return {
      sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
      colors: Array.isArray(parsed.colors) ? parsed.colors : []
    };
  } catch { return { sizes: [], colors: [] }; }
};

// ─── API calls ────────────────────────────────────────────────────────────────
const loadData = async () => {
  crudStore.clearError();
  const params = {
    page: currentPage.value,
    limit: Number(itemsPerPage.value),
    sort_by: sortConfig.value.by,
    sort_order: sortConfig.value.order,
  };
  // Only append filter params that actually have a value
  if (searchFilters.value.search?.trim()) params.search = searchFilters.value.search.trim();
  if (searchFilters.value.category) params.category = searchFilters.value.category;
  if (searchFilters.value.status) params.status = searchFilters.value.status;
  if (searchFilters.value.date) params.date = searchFilters.value.date;
  const result = await crudStore.fetchAll('/admin/products', params);
  if (!result.success)
    showNotification('error', 'Failed to load products', { details: result.error?.message });
};

const loadCategories = async () => {
  try {
    const res = await axios.get(baseApi + '/system/categories');
    console.log(res.data.data)
    categories.value = res.data.data || [];
  } catch (e) { console.error('Failed to load categories', e); }
};

// ─── Modal control ────────────────────────────────────────────────────────────
const resetForm = () => {
  form.value = emptyForm();
  formErrors.value = {};
  existingPhotos.value = [];
  newPhotoFiles.value.forEach(pf => URL.revokeObjectURL(pf.preview));
  newPhotoFiles.value = [];
};

const closeFormModal = () => { showFormModal.value = false; resetForm(); };

const openCreateModal = () => {
  resetForm();
  modalMode.value = 'create';
  showFormModal.value = true;
};

const openEditModal = async (item) => {
  resetForm();
  const result = await crudStore.fetchById('/admin/products/', item.id);
  if (!result.success) {
    showNotification('error', 'Failed to load product', { details: result.error.message }); return;
  }
  const d = result.data;
  form.value = {
    product_name: d.product_name || '',
    category_id: d.category_id || '',
    description: d.description || '',
    stock: d.stock ?? '',
    regular_price: d.regular_price ?? '',
    offer_price: d.offer_price ?? '',
    variants: parseVariants(d.variants)
  };
  existingPhotos.value = d.photos || [];
  modalMode.value = 'edit';
  selectedItem.value = d;
  showFormModal.value = true;
};

const openViewModal = async (item) => {
  const result = await crudStore.fetchById('/admin/products/', item.id);
  if (result.success) { selectedItem.value = result.data; showViewModal.value = true; }
  else showNotification('error', 'Failed to load product', { details: result.error.message });
};

const openDeleteModal = (item) => {
  selectedItem.value = { ...item };
  showDeleteModal.value = true;
};

// ─── Photo management ─────────────────────────────────────────────────────────
const triggerFileInput = () => fileInputRef.value?.click();
const onFilesSelected = (e) => addFiles(Array.from(e.target.files));
const onDrop = (e) => addFiles(Array.from(e.dataTransfer.files));

const addFiles = (files) => {
  files.forEach(file => {
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) return;
    newPhotoFiles.value.push({ file, preview: URL.createObjectURL(file) });
  });
  if (fileInputRef.value) fileInputRef.value.value = '';
};

const removeNewPhoto = (i) => {
  URL.revokeObjectURL(newPhotoFiles.value[i].preview);
  newPhotoFiles.value.splice(i, 1);
};

const deleteExistingPhoto = async (photo) => {
  deletingPhotoId.value = photo.id;
  try {
    await axios.delete(`${baseApi}/admin/products/photo/${photo.id}`);
    existingPhotos.value = existingPhotos.value.filter(p => p.id !== photo.id);
    showNotification('success', 'Photo removed', { autoClose: 2000 });
  } catch (e) {
    showNotification('error', 'Failed to delete photo', { details: e.response?.data?.message || e.message });
  } finally { deletingPhotoId.value = null; }
};

// ─── Validation ───────────────────────────────────────────────────────────────
const validateForm = () => {
  const errs = {};
  if (!form.value.product_name?.trim()) errs.product_name = 'Product name is required.';
  if (!form.value.description?.trim()) errs.description = 'Description is required.';
  if (!form.value.stock) errs.stock = 'Please select stock status.';
  if (!form.value.regular_price) errs.regular_price = 'Regular price is required.';
  if (modalMode.value === 'create' && newPhotoFiles.value.length === 0)
    errs.photos = 'At least one product photo is required.';
  formErrors.value = errs;
  return Object.keys(errs).length === 0;
};

// ─── Submit ───────────────────────────────────────────────────────────────────
const submitForm = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;

  const fd = new FormData();
  fd.append('product_name', form.value.product_name);
  fd.append('category_id', form.value.category_id || '');
  fd.append('description', form.value.description);
  fd.append('stock', form.value.stock);
  fd.append('regular_price', form.value.regular_price);
  fd.append('offer_price', form.value.offer_price || '');
  // Send variants as JSON string — controller does json_encode on its end too,
  // but since we're sending via FormData, we serialize here.
  fd.append('variants', variantsJson.value);
  newPhotoFiles.value.forEach(pf => fd.append('photos[]', pf.file));

  try {
    let result;
    if (modalMode.value === 'create') {
      result = await crudStore.create('/admin/products', fd);
    } else {
      fd.append('_method', 'PUT');
      result = await crudStore.post(`/admin/products/${selectedItem.value.id}`, fd);
    }

    if (!result.success) {
      const errors = result.error?.response?.data?.errors;
      if (errors) {
        formErrors.value = Object.fromEntries(
          Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        );
      }
      throw new Error(result.error?.message || 'Request failed');
    }

    showNotification('success',
      `Product ${modalMode.value === 'create' ? 'created' : 'updated'} successfully!`,
      { autoClose: 3000 }
    );
    closeFormModal();
    loadData();
  } catch (e) {
    showNotification('error', e.message || 'An error occurred.', {
      details: 'Please check the form fields and try again.'
    });
  } finally { isSubmitting.value = false; }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDelete = async () => {
  isSubmitting.value = true;
  const result = await crudStore.delete('/admin/products/', selectedItem.value.id);
  isSubmitting.value = false;
  if (result.success) {
    showDeleteModal.value = false;
    showNotification('success', 'Product deleted!', { details: 'The product has been removed.', autoClose: 3000 });
    loadData();
  } else {
    showNotification('error', result.error?.message || 'Delete failed.');
  }
};

// ─── Event handlers ───────────────────────────────────────────────────────────
const handleAction = ({ action, row }) => ({ view: openViewModal, edit: openEditModal, delete: openDeleteModal })[action]?.(row);
const handleSearch = () => {
  // Reset to page 1 whenever a new search/filter is applied,
  // then fire loadData so the server receives the updated params.
  currentPage.value = 1;
  loadData();
};
const handleReset = () => {
  searchFilters.value = { search: '', category: '', status: '', date: '' };
  currentPage.value = 1;
  sortConfig.value = { by: 'created_at', order: 'desc' };
  loadData();
};
const handleSort = (s) => {
  sortConfig.value = s;
  currentPage.value = 1; // always go back to page 1 on sort change
  loadData();
};
const handlePageChange = (p) => {
  currentPage.value = p;
  loadData();
};
const handlePageSizeChange = (sz) => {
  itemsPerPage.value = Number(sz); // explicit cast — never a string/array
  currentPage.value = 1;
  loadData();
};

onMounted(() => { loadData(); loadCategories(); });
onBeforeUnmount(() => {
  newPhotoFiles.value.forEach(pf => URL.revokeObjectURL(pf.preview));
  crudStore.clearCurrentItem();
});
</script>

<style scoped>
/* ─── Layout ────────────────────────────────────────────────── */
.dashboard {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  background: #f0f2f5;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, .1);
  overflow: hidden;
}

/* ─── Header — neutral dark ─────────────────────────────────── */
.header {
  background: #1d283a;
  color: #fff;
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
  background: #fff;
  color: #1e1e2e;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all .25s;
}

.add-btn::before {
  content: '+';
  font-size: 20px;
  font-weight: bold;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, .25);
}

/* ─── Loading / Error ───────────────────────────────────────── */
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
  width: 56px;
  height: 56px;
  border: 4px solid #e9ecef;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.error-container h3 {
  font-size: 22px;
  color: #dc3545;
  margin: 0 0 8px;
}

.retry-btn {
  padding: 10px 28px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  margin-top: 8px;
}

.retry-btn:hover {
  background: #4f51d8;
}

/* ─── Table helpers ─────────────────────────────────────────── */
.table-container {
  padding: 40px;
}

.photo-thumbs {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.thumb {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 5px;
  border: 1px solid #dee2e6;
}

.thumb-more {
  font-size: 12px;
  color: #6c757d;
  font-weight: 600;
}

.price {
  font-weight: 700;
  color: #1e1e2e;
}

.offer-price {
  font-weight: 600;
  color: #e67e22;
}

.no-offer,
.no-cat {
  color: #adb5bd;
}

.cat-badge {
  padding: 3px 10px;
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.in-stock {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  background: #d1fae5;
  color: #065f46;
  font-size: 12px;
  font-weight: 600;
}

.out-stock {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 12px;
  font-weight: 600;
}

/* ─── Modal overlay ─────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, .55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, .3);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  width: 100%;
  animation: modalIn .2s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(.96) translateY(-8px);
  }
}

.modal-large {
  max-width: 860px;
}

.modal-small {
  max-width: 440px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

/* .modal-header h2 { margin: 0; font-size: 19px; font-weight: 700; color: #1e1e2e; } */
.modal-header.danger {
  background: #fff5f5;
}

.modal-header.danger h2 {
  color: #dc3545;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6c757d;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all .2s;
}

.modal-close:hover {
  background: #e9ecef;
  color: #1e1e2e;
}

.modal-body {
  overflow-y: auto;
  padding: 28px;
  flex: 1;
}

.modal-footer {
  padding: 16px 28px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8f9fa;
}

/* ─── Form ──────────────────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full {
  grid-column: 1 / -1;
}

/* .form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
} */

.req {
  color: #dc3545;
}

.form-input {
  padding: 10px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1e1e2e;
  background: #fff;
  transition: border-color .2s, box-shadow .2s;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, .12);
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.field-error {
  color: #dc3545;
  font-size: 12px;
  margin: 2px 0 0;
}

/* Buttons */
.btn-cancel {
  padding: 10px 22px;
  border: 1.5px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: #374151;
  transition: all .2s;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-submit {
  padding: 10px 26px;
  background: #1e1e2e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all .2s;
}

.btn-submit:hover:not(:disabled) {
  background: #2d2d44;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .2);
}

.btn-submit:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.btn-danger {
  padding: 10px 26px;
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all .2s;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, .35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

/* ─── Variants ──────────────────────────────────────────────── */
.variant-block {
  margin-bottom: 16px;
}

.variant-block:last-child {
  margin-bottom: 0;
}

.variant-group-label {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .6px;
  margin: 0 0 8px;
}

.variant-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 7px 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 20px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .18s;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.chip:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f5f3ff;
}

.chip-active {
  background: #1e1e2e !important;
  border-color: #1e1e2e !important;
  color: #fff !important;
}

.chip-color.chip-active .color-dot {
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px #1e1e2e;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, .15);
  display: inline-block;
  flex-shrink: 0;
}

.variant-preview {
  margin-top: 12px;
  padding: 10px 14px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.variant-preview code {
  font-size: 12px;
  color: #374151;
  word-break: break-all;
  font-family: 'Courier New', monospace;
}

/* ─── Photo upload ──────────────────────────────────────────── */
.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all .2s;
  background: #fafafa;
  margin-top: 4px;
}

.upload-area:hover {
  border-color: #6366f1;
  background: #f5f3ff;
}

.hidden-input {
  display: none;
}

.upload-placeholder {
  pointer-events: none;
}

.upload-icon {
  font-size: 34px;
  display: block;
  margin-bottom: 8px;
}

.upload-placeholder p {
  margin: 4px 0;
  font-size: 14px;
  color: #374151;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af !important;
}

.existing-photos {
  margin-bottom: 16px;
}

.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 10px;
}

.photo-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid #e5e7eb;
  aspect-ratio: 1;
  background: #f9fafb;
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(220, 53, 69, .85);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s;
}

.photo-delete-btn:hover:not(:disabled) {
  background: #dc3545;
  transform: scale(1.1);
}

.photo-delete-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.photo-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, .55);
  color: #fff;
  font-size: 10px;
  padding: 3px 5px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mt-12 {
  margin-top: 12px;
}

/* ─── View modal ────────────────────────────────────────────── */
.view-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.view-photo {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.no-photos {
  color: #9ca3af;
  font-style: italic;
  font-size: 14px;
}

.view-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: .6px;
}

.detail-desc {
  margin: 4px 0 0;
  color: #374151;
  line-height: 1.6;
  font-size: 14px;
}

.variants-view {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.variant-chip {
  padding: 4px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 13px;
  color: #374151;
  font-weight: 600;
}

.chip-color-view {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ─── Delete confirm ────────────────────────────────────────── */
.delete-confirm {
  text-align: center;
  padding: 16px 0;
}

.delete-icon {
  font-size: 52px;
  display: block;
  margin-bottom: 16px;
}

.delete-confirm p {
  margin: 0 0 8px;
  font-size: 15px;
  color: #1e1e2e;
}

.delete-warning {
  font-size: 13px !important;
  color: #6b7280 !important;
}

/* ─── Responsive ────────────────────────────────────────────── */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .table-container {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full {
    grid-column: 1;
  }

  .view-grid {
    grid-template-columns: 1fr;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    padding: 12px 16px;
  }
}
</style>