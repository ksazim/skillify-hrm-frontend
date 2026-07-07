<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1 class="text-page-title">Order Management</h1>
        <button class="primary-button" @click="openCreateModal">+ New Order</button>
      </div>

      <!-- Filter Panel -->
      <FilterPanel title="Search & Filter" :fields="filterFields" v-model="searchFilters" @submit="handleSearch"
        @reset="handleReset" />

      <!-- Loading -->
      <div v-if="isLoading && !items.length" class="loading-container">
        <div class="spinner-large"></div>
        <p>Loading orders...</p>
      </div>

      <!-- Error -->
      <div v-else-if="hasError && !items.length" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Failed to Load Orders</h3>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="loadData">Retry</button>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <DataTable :data="items" :columns="tableColumns" :actions="tableActions" result-label="orders"
          @action="handleAction" @sort="handleSort">
          <template #cell-invoice_no="{ value }">
            <span class="invoice-no">#{{ value }}</span>
          </template>

          <template #cell-sell="{ row }">
            <div class="sell-summary">
              <span class="sell-count">{{ (row.sell || []).length }} item(s)</span>
            </div>
          </template>

          <template #cell-total="{ value }">
            <span class="price-bold">{{ formatPrice(value) }}</span>
          </template>

          <template #cell-status="{ value }">
            <span :class="['status-badge', 'status-' + value]">{{ capitalize(value) }}</span>
          </template>

          <template #cell-delivery_option="{ value }">
            <span class="delivery-badge">{{ capitalize(value) }}</span>
          </template>

          <template #cell-created_at="{ value }">
            <span>{{ formatDate(value) }}</span>
          </template>
        </DataTable>

        <Pagination v-model="currentPage" :total-items="serverTotal" :item-count="items.length"
          :page-size="itemsPerPage" :page-size-options="[5, 10, 20, 50]" item-label="orders" :show-first-last="true"
          :show-jump-to="true" @update:page-size="handlePageSizeChange" @page-change="handlePageChange" />
      </div>
    </div>

    <!-- ═══════════════════ CREATE ORDER MODAL ═══════════════════ -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <div class="modal-box modal-xl">
          <div class="modal-header">
            <h2>Create New Order</h2>
            <button class="modal-close" @click="closeCreateModal">✕</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitCreate" novalidate>
              <div class="order-layout">

                <!-- LEFT: Customer + Products -->
                <div class="order-left">

                  <!-- Customer Info -->
                  <div class="section-card">
                    <h3 class="section-title">Customer Information</h3>
                    <div class="form-grid-2">
                      <div class="form-group">
                        <label class="text-label">Recipient Name <span class="req">*</span></label>
                        <input v-model="createForm.recipient_name" type="text" class="form-input"
                          placeholder="Full name..." />
                        <p v-if="createErrors.recipient_name" class="field-error">{{ createErrors.recipient_name }}</p>
                      </div>
                      <div class="form-group">
                        <label class="text-label">Phone <span class="req">*</span></label>
                        <input v-model="createForm.recipient_phone" type="text" class="form-input"
                          placeholder="+880..." />
                        <p v-if="createErrors.recipient_phone" class="field-error">{{ createErrors.recipient_phone }}
                        </p>
                      </div>
                      <div class="form-group full">
                        <label class="text-label">Address <span class="req">*</span></label>
                        <textarea v-model="createForm.recipient_address" rows="2" class="form-input"
                          placeholder="Full delivery address..."></textarea>
                        <p v-if="createErrors.recipient_address" class="field-error">{{ createErrors.recipient_address
                        }}
                        </p>
                      </div>
                      <div class="form-group">
                        <label class="text-label">City</label>
                        <input v-model="createForm.city" type="text" class="form-input" placeholder="City..." />
                      </div>
                      <div class="form-group">
                        <label class="text-label">Delivery Option <span class="req">*</span></label>
                        <select v-model="createForm.delivery_option" class="form-input">
                          <option value="">— Select —</option>
                          <option value="inside_dhaka">Inside Dhaka</option>
                          <option value="outside_dhaka">Outside Dhaka</option>
                        </select>
                        <p v-if="createErrors.delivery_option" class="field-error">{{ createErrors.delivery_option }}
                        </p>
                      </div>
                      <div class="form-group">
                        <label class="text-label">Coupon Code</label>
                        <input v-model="createForm.coupon_code" type="text" class="form-input"
                          placeholder="Optional..." />
                      </div>
                      <div class="form-group">
                        <label class="text-label">Note</label>
                        <input v-model="createForm.note" type="text" class="form-input" placeholder="Order note..." />
                      </div>
                    </div>
                  </div>

                  <!-- Product Picker -->
                  <div class="section-card">
                    <h3 class="section-title">Add Products</h3>

                    <!-- Search products -->
                    <div class="product-search-wrap">
                      <input v-model="productSearchQuery" type="text" class="form-input"
                        placeholder="Search products by name..." @input="filterProducts" />
                    </div>

                    <!-- Product list -->
                    <div class="product-list" v-if="filteredProducts.length">
                      <div v-for="product in filteredProducts" :key="product.id" class="product-pick-row"
                        @click="addProductToOrder(product)">
                        <img v-if="product.photos && product.photos[0]"
                          :src="`${baseUrl}/${product.photos[0].file_path}/${product.photos[0].file_name}`"
                          class="product-pick-thumb" />
                        <div v-else class="product-pick-thumb no-img">📦</div>
                        <div class="product-pick-info">
                          <p class="product-pick-name">{{ product.product_name }}</p>
                          <p class="product-pick-price">{{ formatPrice(product.offer_price || product.regular_price) }}
                          </p>
                        </div>
                        <button type="button" class="btn-add-product">+ Add</button>
                      </div>
                    </div>
                    <p v-else-if="productSearchQuery" class="no-results">No products found.</p>
                    <p v-else class="search-hint">Type to search products...</p>
                    <p v-if="createErrors.products" class="field-error">{{ createErrors.products }}</p>
                  </div>

                  <!-- Selected Products -->
                  <div class="section-card" v-if="createForm.products.length">
                    <h3 class="section-title">Order Items</h3>
                    <div class="order-items">
                      <div v-for="(item, i) in createForm.products" :key="i" class="order-item-row">
                        <img v-if="item.product_photo" :src="`${baseUrl}/${item.product_photo}`"
                          class="order-item-thumb" />
                        <div v-else class="order-item-thumb no-img">📦</div>

                        <div class="order-item-details">
                          <p class="order-item-name">{{ item.product_name }}</p>

                          <!-- Variant selector -->
                          <div class="item-variants" v-if="getProductVariants(item.product_id)">
                            <div v-if="getProductVariants(item.product_id).sizes?.length" class="variant-mini-row">
                              <span class="variant-mini-label">Size:</span>
                              <button v-for="s in getProductVariants(item.product_id).sizes" :key="s" type="button"
                                :class="['mini-chip', item.variants?.size === s ? 'mini-chip-active' : '']"
                                @click="setVariant(i, 'size', s)">{{ s }}</button>
                            </div>
                            <div v-if="getProductVariants(item.product_id).colors?.length" class="variant-mini-row">
                              <span class="variant-mini-label">Color:</span>
                              <button v-for="c in getProductVariants(item.product_id).colors" :key="c" type="button"
                                :class="['mini-chip', item.variants?.color === c ? 'mini-chip-active' : '']"
                                @click="setVariant(i, 'color', c)">{{ c }}</button>
                            </div>
                          </div>
                        </div>

                        <!-- Price + Qty controls -->
                        <div class="order-item-controls">
                          <div class="price-control">
                            <label class="ctrl-label">Unit Price</label>
                            <div class="price-input-wrap">
                              <span class="currency">৳</span>
                              <input v-model.number="item.unit_price" type="number" step="0.01" min="0"
                                class="price-input" @input="recalculate" />
                            </div>
                          </div>
                          <div class="qty-control">
                            <label class="ctrl-label">Qty</label>
                            <div class="qty-wrap">
                              <button type="button" class="qty-btn" @click="changeQty(i, -1)">−</button>
                              <input v-model.number="item.quantity" type="number" min="1" class="qty-input"
                                @input="recalculate" />
                              <button type="button" class="qty-btn" @click="changeQty(i, 1)">+</button>
                            </div>
                          </div>
                          <div class="item-total">
                            <label class="ctrl-label">Total</label>
                            <span class="item-total-val">{{ formatPrice(item.unit_price * item.quantity) }}</span>
                          </div>
                          <button type="button" class="btn-remove-item" @click="removeProduct(i)">✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- RIGHT: Order Summary -->
                <div class="order-right">
                  <div class="summary-card">
                    <h3 class="section-title">Order Summary</h3>

                    <div class="summary-row">
                      <span>Subtotal</span>
                      <span class="summary-val">{{ formatPrice(createForm.subtotal) }}</span>
                    </div>

                    <!-- Shipping -->
                    <div class="summary-row editable-row">
                      <span class="text-label">Shipping Cost <span class="req">*</span></span>
                      <div class="inline-input-wrap">
                        <span class="currency">৳</span>
                        <input v-model.number="createForm.shipping_cost" type="number" step="0.01" min="0"
                          class="inline-input" @input="recalculate" />
                      </div>
                    </div>
                    <p v-if="createErrors.shipping_cost" class="field-error">{{ createErrors.shipping_cost }}</p>

                    <!-- VAT -->
                    <div class="summary-row editable-row">
                      <span class="text-label">VAT (%)</span>
                      <div class="inline-input-wrap">
                        <input v-model.number="vatPercent" type="number" step="0.1" min="0" max="100"
                          class="inline-input" @input="recalculate" />
                        <span class="currency">%</span>
                      </div>
                    </div>

                    <div class="summary-row" v-if="createForm.vat > 0">
                      <span>VAT Amount</span>
                      <span class="summary-val">{{ formatPrice(createForm.vat) }}</span>
                    </div>

                    <div class="summary-divider"></div>

                    <!-- Total — editable override -->
                    <div class="summary-row total-row">
                      <span>Total <span class="req">*</span></span>
                      <div class="inline-input-wrap">
                        <span class="currency">৳</span>
                        <input v-model.number="createForm.total" type="number" step="0.01" min="0"
                          class="inline-input total-input" />
                      </div>
                    </div>
                    <p v-if="createErrors.total" class="field-error">{{ createErrors.total }}</p>

                    <p class="summary-note">You can manually adjust the total if needed.</p>

                    <button type="submit" class="btn-submit-order" :disabled="isSubmitting">
                      <span v-if="isSubmitting" class="btn-spinner"></span>
                      {{ isSubmitting ? 'Placing Order...' : 'Place Order' }}
                    </button>
                  </div>
                </div>

              </div><!-- /order-layout -->
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════ VIEW ORDER MODAL ═══════════════════ -->
    <Teleport to="body">
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <div class="modal-box modal-large">
          <div class="modal-header">
            <h2>Order #{{ selectedOrder?.invoice_no }}</h2>
            <button class="modal-close" @click="showViewModal = false">✕</button>
          </div>
          <div class="modal-body" v-if="selectedOrder">
            <div class="view-layout">

              <!-- Order meta -->
              <div class="view-section">
                <h4 class="view-section-title">Customer Details</h4>
                <div class="detail-grid">
                  <div class="detail-item"><span class="detail-label">Name</span><span>{{ selectedOrder.recipient_name
                  }}</span></div>
                  <div class="detail-item"><span class="detail-label">Phone</span><span>{{ selectedOrder.recipient_phone
                  }}</span></div>
                  <div class="detail-item full"><span class="detail-label">Address</span><span>{{
                    selectedOrder.recipient_address }}</span></div>
                  <div class="detail-item"><span class="detail-label">City</span><span>{{ selectedOrder.city || '—'
                  }}</span></div>
                  <div class="detail-item"><span class="detail-label">Delivery</span><span>{{
                    capitalize(selectedOrder.delivery_option) }}</span></div>
                  <div class="detail-item"><span class="detail-label">Coupon</span><span>{{ selectedOrder.coupon_code ||
                    '—'
                      }}</span></div>
                  <div class="detail-item"><span class="detail-label">Status</span>
                    <span :class="['status-badge', 'status-' + selectedOrder.status]">{{
                      capitalize(selectedOrder.status)
                    }}</span>
                  </div>
                  <div v-if="selectedOrder.consignment" class="detail-item">
                    <span class="detail-label">Consignment</span><span>{{ selectedOrder.consignment }}</span>
                  </div>
                </div>
              </div>

              <!-- Order items -->
              <div class="view-section">
                <h4 class="view-section-title">Items Ordered</h4>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(sell, i) in (selectedOrder.sell || [])" :key="i">
                      <td>
                        <div class="sell-product-cell">
                          <img v-if="sell.product_photo" :src="`${baseUrl}/uploads/products/${sell.product_photo}`"
                            class="sell-thumb" />
                          <span>{{ sell.product_name }}</span>
                        </div>
                      </td>
                      <td>
                        <span v-if="sell.variants" class="variant-text">{{ formatVariants(sell.variants) }}</span>
                        <span v-else>—</span>
                      </td>
                      <td>{{ sell.quantity }}</td>
                      <td>{{ formatPrice(sell.unit_price) }}</td>
                      <td class="price-bold">{{ formatPrice(sell.unit_price * sell.quantity) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Order totals -->
              <div class="view-section view-totals">
                <div class="total-line"><span>Subtotal</span><span>{{ formatPrice(selectedOrder.subtotal) }}</span>
                </div>
                <div class="total-line"><span>Shipping</span><span>{{ formatPrice(selectedOrder.shipping_cost) }}</span>
                </div>
                <div class="total-line" v-if="selectedOrder.vat"><span>VAT</span><span>{{ formatPrice(selectedOrder.vat)
                }}</span></div>
                <div class="total-line grand-total"><span>Total</span><span>{{ formatPrice(selectedOrder.total)
                }}</span>
                </div>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showViewModal = false">Close</button>
            <button class="btn-status" @click="openStatusModal(selectedOrder)">Update Status</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════ UPDATE STATUS MODAL ═══════════════════ -->
    <Teleport to="body">
      <div v-if="showStatusModal" class="modal-overlay" @click.self="showStatusModal = false">
        <div class="modal-box modal-small">
          <div class="modal-header">
            <h2>Update Order Status</h2>
            <button class="modal-close" @click="showStatusModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="status-order-ref">Order #{{ selectedOrder?.invoice_no }}</p>
            <div class="form-group">
              <label>New Status <span class="req">*</span></label>
              <select v-model="statusForm.status" class="form-input">
                <option value="">— Select Status —</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered (Steadfast)</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <p v-if="statusErrors.status" class="field-error">{{ statusErrors.status }}</p>
            </div>

            <!-- Note (for delivered via Steadfast) -->
            <div class="form-group" v-if="statusForm.status === 'delivered'">
              <label>Note (optional)</label>
              <input v-model="statusForm.note" type="text" class="form-input" placeholder="Delivery note..." />
              <div class="form-group mt-12">
                <label>Order Type</label>
                <select v-model="statusForm.order_type" class="form-input">
                  <option value="single">Single</option>
                  <option value="bulk">Bulk</option>
                </select>
              </div>
            </div>

            <!-- Status flow hint -->
            <div class="status-flow">
              <span v-for="s in STATUS_FLOW" :key="s"
                :class="['flow-step', selectedOrder?.status === s ? 'flow-current' : '', statusForm.status === s ? 'flow-next' : '']">{{
                  capitalize(s) }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showStatusModal = false">Cancel</button>
            <button class="btn-submit" :disabled="isSubmitting" @click="submitStatus">
              <span v-if="isSubmitting" class="btn-spinner"></span>
              {{ isSubmitting ? 'Updating...' : 'Update Status' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════ DELETE MODAL ═══════════════════ -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-box modal-small">
          <div class="modal-header danger">
            <h2>Delete Order</h2>
            <button class="modal-close" @click="showDeleteModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="delete-confirm">
              <span class="delete-icon">🗑️</span>
              <p>Delete order <strong>#{{ selectedOrder?.invoice_no }}</strong>?</p>
              <p class="delete-warning">This action cannot be undone.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-danger" :disabled="isSubmitting" @click="confirmDelete">
              <span v-if="isSubmitting" class="btn-spinner"></span>
              {{ isSubmitting ? 'Deleting...' : 'Delete Order' }}
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

  <InvoiceModal v-model="showInvoiceModal" :order="invoiceOrder" />
</template>

<script setup>
import { useCrudStore } from '@/store/crud';
import axios from 'axios';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import FilterPanel from './components/FilterComponent.vue';
import InvoiceModal from './components/InvoiceModal.vue';
import NotificationModal from './components/NotificationModal.vue';
import Pagination from './components/PaginationComponent.vue';
import DataTable from './components/TableComponent.vue';

const baseApi = process.env.VUE_APP_BASE_API;
const baseUrl = process.env.VUE_APP_BASE_URL;

const showInvoiceModal = ref(false);
const invoiceOrder = ref(null);

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FLOW = ['pending', 'confirmed', 'paid', 'processing', 'delivered'];

// ─── Store ────────────────────────────────────────────────────────────────────
const crudStore = useCrudStore();

// ─── State ────────────────────────────────────────────────────────────────────
const showCreateModal = ref(false);
const showViewModal = ref(false);
const showStatusModal = ref(false);
const showDeleteModal = ref(false);
const selectedOrder = ref(null);
const isSubmitting = ref(false);

// Product search
const allProducts = ref([]);
const productSearchQuery = ref('');
const filteredProducts = ref([]);

// VAT percentage (UI control — actual vat amount goes in form)
const vatPercent = ref(0);

// ─── Create form ──────────────────────────────────────────────────────────────
const emptyCreateForm = () => ({
  recipient_name: '',
  recipient_phone: '',
  recipient_address: '',
  city: '',
  delivery_option: '',
  coupon_code: '',
  note: '',
  shipping_cost: 0,
  subtotal: 0,
  vat: 0,
  total: 0,
  products: []   // [{ product_id, product_name, product_photo, variants, quantity, unit_price }]
});
const createForm = ref(emptyCreateForm());
const createErrors = ref({});

// Status form
const statusForm = ref({ status: '', note: '', order_type: 'single' });
const statusErrors = ref({});

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

// ─── Store computed ───────────────────────────────────────────────────────────
const items = computed(() => crudStore.getAllItems);
const isLoading = computed(() => crudStore.isLoading);
const hasError = computed(() => crudStore.hasError);
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred');
// Real total from server pagination — never use filteredData.length / items.length
const serverTotal = computed(() => crudStore.getPagination.totalItems);

// ─── Search / pagination ──────────────────────────────────────────────────────
const searchFilters = ref({ search: '', invoice: '', status: '', date: '' });
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortConfig = ref({ by: 'created_at', order: 'desc' });

const filterFields = [
  { name: 'invoice', label: 'Invoice no.', type: 'text', placeholder: '1773612356' },
  { name: 'search', label: 'Recipient Name', type: 'text', placeholder: 'Search by name...' },
  {
    name: 'status', label: 'Status', type: 'select', placeholder: 'All Status',
    options: STATUS_FLOW.map(s => ({ value: s, label: capitalize(s) })).concat([{ value: 'cancelled', label: 'Cancelled' }])
  },
  { name: 'date', label: 'Date', type: 'date' }
];

// ─── Table ────────────────────────────────────────────────────────────────────
const tableColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'invoice_no', label: 'Invoice', type: 'custom', sortable: true },
  { key: 'recipient_name', label: 'Customer', sortable: true },
  { key: 'recipient_phone', label: 'Phone', sortable: false },
  { key: 'sell', label: 'Items', type: 'custom', sortable: false },
  { key: 'delivery_option', label: 'Delivery', type: 'custom', sortable: false },
  { key: 'total', label: 'Total', type: 'custom', sortable: true },
  { key: 'created_at', label: 'Order Date', type: 'custom', sortable: true },
  { key: 'status', label: 'Status', type: 'custom', sortable: true },
  { key: 'actions', label: 'Actions', type: 'actions', align: 'center' }
];
const tableActions = [
  { name: 'view', label: 'View', class: 'btn-view' },
  { name: 'invoice', label: 'Invoice', class: 'btn-invoice' },
  { name: 'status', label: 'Update Status', class: 'btn-edit' },
  { name: 'delete', label: 'Delete', class: 'btn-delete' }
];

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const formatPrice = (v) =>
  v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(v) : '—';

const formatVariants = (raw) => {
  if (!raw) return '—';
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Object.entries(v).map(([k, val]) => `${capitalize(k)}: ${val}`).join(', ');
  } catch { return String(raw); }
};

const getProductVariants = (productId) => {
  const product = allProducts.value.find(p => p.id === productId);
  if (!product?.variants) return null;
  try {
    const raw = typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants;
    return raw;
  } catch { return null; }
};

// ─── Price calculation ────────────────────────────────────────────────────────
const recalculate = () => {
  const subtotal = createForm.value.products.reduce(
    (sum, item) => sum + (item.unit_price * item.quantity), 0
  );
  const vat = +(subtotal * (vatPercent.value / 100)).toFixed(2);
  const total = +(subtotal + vat + (createForm.value.shipping_cost || 0)).toFixed(2);

  createForm.value.subtotal = +subtotal.toFixed(2);
  createForm.value.vat = vat;
  createForm.value.total = total;
};

// ─── Product management ───────────────────────────────────────────────────────
const filterProducts = () => {
  console.log("here")
  const q = productSearchQuery.value.toLowerCase().trim();
  if (!q) { filteredProducts.value = []; return; }
  filteredProducts.value = allProducts.value.filter(p =>
    p.product_name?.toLowerCase().includes(q)
  ).slice(0, 8);
};

const addProductToOrder = (product) => {
  // If already in order, increment qty
  const existing = createForm.value.products.find(p => p.product_id === product.id);
  if (existing) { existing.quantity += 1; recalculate(); return; }

  const photo = product.photos?.[0]
    ? `${product.photos[0].file_name}`
    : '';

  createForm.value.products.push({
    product_id: product.id,
    product_name: product.product_name,
    product_photo: photo,
    variants: {},
    quantity: 1,
    unit_price: +(product.offer_price || product.regular_price || 0)
  });

  recalculate();
};

const removeProduct = (index) => {
  createForm.value.products.splice(index, 1);
  recalculate();
};

const changeQty = (index, delta) => {
  const item = createForm.value.products[index];
  item.quantity = Math.max(1, (item.quantity || 1) + delta);
  recalculate();
};

const setVariant = (index, key, value) => {
  if (!createForm.value.products[index].variants) {
    createForm.value.products[index].variants = {};
  }
  createForm.value.products[index].variants[key] = value;
};

// ─── API calls ────────────────────────────────────────────────────────────────
const loadData = async () => {
  crudStore.clearError();
  const params = {
    page: currentPage.value,
    limit: Number(itemsPerPage.value), // always plain integer — prevents Laravel "Unsupported operand types"
    sort_by: sortConfig.value.by,
    sort_order: sortConfig.value.order,
  };
  if (searchFilters.value.search) params.search = searchFilters.value.search;
  if (searchFilters.value.invoice) params.invoice = searchFilters.value.invoice;
  if (searchFilters.value.status) params.status = searchFilters.value.status;
  if (searchFilters.value.date) params.date = searchFilters.value.date;
  const result = await crudStore.fetchAll('/admin/orders', params);
  if (!result.success)
    showNotification('error', 'Failed to load orders', { details: result.error?.message });
};

const loadAllProducts = async () => {
  try {
    const res = await axios.get(`${baseApi}/admin/products`, { params: { limit: 500 } });
    allProducts.value = res.data.list || [];
  } catch (e) { console.error('Failed to load products', e); }
};

// ─── Modals ───────────────────────────────────────────────────────────────────
const openCreateModal = () => {
  createForm.value = emptyCreateForm();
  createErrors.value = {};
  vatPercent.value = 0;
  productSearchQuery.value = '';
  filteredProducts.value = [];
  showCreateModal.value = true;
};
const closeCreateModal = () => { showCreateModal.value = false; };

const openViewModal = async (order) => {
  const result = await crudStore.fetchById('/admin/orders/', order.id);
  if (result.success) { selectedOrder.value = result.data; showViewModal.value = true; }
  else showNotification('error', 'Failed to load order', { details: result.error?.message });
};

const openStatusModal = (order) => {
  selectedOrder.value = order;
  statusForm.value = { status: order.status, note: '', order_type: 'single' };
  statusErrors.value = {};
  showViewModal.value = false;
  showStatusModal.value = true;
};

const openDeleteModal = (order) => {
  selectedOrder.value = order;
  showDeleteModal.value = true;
};

// ─── Validation ───────────────────────────────────────────────────────────────
const validateCreate = () => {
  const e = {};
  if (!createForm.value.recipient_name?.trim()) e.recipient_name = 'Recipient name is required.';
  if (!createForm.value.recipient_phone?.trim()) e.recipient_phone = 'Phone is required.';
  if (!createForm.value.recipient_address?.trim()) e.recipient_address = 'Address is required.';
  if (!createForm.value.delivery_option) e.delivery_option = 'Delivery option is required.';
  if (!createForm.value.shipping_cost && createForm.value.shipping_cost !== 0) e.shipping_cost = 'Shipping cost is required.';
  if (!createForm.value.products.length) e.products = 'Add at least one product.';
  if (!createForm.value.total) e.total = 'Total is required.';
  createErrors.value = e;
  return !Object.keys(e).length;
};

const validateStatus = () => {
  const e = {};
  if (!statusForm.value.status) e.status = 'Please select a status.';
  statusErrors.value = e;
  return !Object.keys(e).length;
};

// ─── Submit create ────────────────────────────────────────────────────────────
const submitCreate = async () => {
  if (!validateCreate()) return;
  isSubmitting.value = true;

  // Serialize variants per product
  const products = createForm.value.products.map(p => ({
    ...p,
    variants: JSON.stringify(p.variants || {})
  }));

  const payload = {
    recipient_name: createForm.value.recipient_name,
    recipient_phone: createForm.value.recipient_phone,
    recipient_address: createForm.value.recipient_address,
    city: createForm.value.city,
    delivery_option: createForm.value.delivery_option,
    coupon_code: createForm.value.coupon_code,
    note: createForm.value.note,
    shipping_cost: createForm.value.shipping_cost,
    subtotal: createForm.value.subtotal,
    vat: createForm.value.vat,
    total: createForm.value.total,
    products
  };

  try {
    const result = await crudStore.create('/admin/orders', payload);
    if (!result.success) {
      const errors = result.error?.response?.data?.errors;
      if (errors) {
        createErrors.value = Object.fromEntries(
          Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        );
      }
      throw new Error(result.error?.message || 'Failed to create order');
    }
    showNotification('success', 'Order placed successfully!', { autoClose: 3000 });
    closeCreateModal();
    loadData();
  } catch (e) {
    showNotification('error', e.message || 'An error occurred.', {
      details: 'Please check the form and try again.'
    });
  } finally { isSubmitting.value = false; }
};

// ─── Submit status ────────────────────────────────────────────────────────────
const submitStatus = async () => {
  if (!validateStatus()) return;
  isSubmitting.value = true;

  try {
    const result = await crudStore.update(
      `/admin/orders`,
      {
        id: selectedOrder.value.id,
        ...statusForm.value
      }
    );
    if (!result.success) throw new Error(result.error?.message || 'Update failed');

    showNotification('success', 'Order status updated!', { autoClose: 3000 });
    showStatusModal.value = false;
    loadData();
  } catch (e) {
    showNotification('error', e.message || 'Failed to update status.');
  } finally { isSubmitting.value = false; }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDelete = async () => {
  isSubmitting.value = true;
  const result = await crudStore.delete('/admin/orders/', selectedOrder.value.id);
  isSubmitting.value = false;
  if (result.success) {
    showDeleteModal.value = false;
    showNotification('success', 'Order deleted!', { autoClose: 3000 });
    loadData();
  } else {
    showNotification('error', result.error?.message || 'Delete failed.');
  }
};

// ─── Event handlers ───────────────────────────────────────────────────────────
const handleAction = ({ action, row }) => {
  if (action === 'view') openViewModal(row);
  if (action === 'invoice') openInvoiceModal(row);
  if (action === 'status') openStatusModal(row);
  if (action === 'delete') openDeleteModal(row);
};
const handleSearch = () => { currentPage.value = 1; loadData(); };
const handleReset = () => { searchFilters.value = { search: '', status: '', date: '' }; currentPage.value = 1; loadData(); };
const handleSort = (s) => { sortConfig.value = s; loadData(); };
const handlePageChange = (p) => { currentPage.value = p; loadData(); };
const handlePageSizeChange = (sz) => { itemsPerPage.value = Number(sz); currentPage.value = 1; loadData(); };
const openInvoiceModal = async (order) => {
  // Fetch full order details (includes sell items) before showing invoice
  const result = await crudStore.fetchById('/admin/orders/', order.id);
  if (result.success) {
    invoiceOrder.value = result.data;
    showInvoiceModal.value = true;
  } else {
    showNotification('error', 'Failed to load order for invoice', { details: result.error?.message });
  }
};

onMounted(() => { loadData(); loadAllProducts(); });
onBeforeUnmount(() => crudStore.clearCurrentItem());
</script>

<style scoped>
/* ─── Base ───────────────────────────────────────────────────── */
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

/* ─── Header ─────────────────────────────────────────────────── */
.header {
  background: var(--surface);
  color: #fff;
  padding: 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ─── Loading / Error ────────────────────────────────────────── */
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
  margin-top: 8px;
}

/* ─── Table ──────────────────────────────────────────────────── */
.table-container {
  padding: 40px;
}

.invoice-no {
  font-weight: 700;
  font-family: monospace;
  color: #1e1e2e;
}

.price-bold {
  font-weight: 700;
  color: #1e1e2e;
}

.sell-count {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
}

.delivery-badge {
  padding: 3px 10px;
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.status-pending {
  background: #fef9c3;
  color: #854d0e;
}

.status-confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.status-processing {
  background: #fce7f3;
  color: #9d174d;
}

.status-delivered {
  background: #dcfce7;
  color: #14532d;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

/* ─── Modal ──────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, .55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.modal-box {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, .3);
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: auto;
  animation: modalIn .2s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(.96) translateY(-8px);
  }
}

.modal-xl {
  max-width: 1100px;
}

.modal-large {
  max-width: 820px;
}

.modal-small {
  max-width: 460px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 14px 14px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: #1e1e2e;
}

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
  padding: 28px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 28px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 0 0 14px 14px;
}

/* ─── Order layout ───────────────────────────────────────────── */
.order-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

.order-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-right {
  position: sticky;
  top: 0;
}

.section-card {
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: .6px;
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

/* ─── Form ───────────────────────────────────────────────────── */
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group.full {
  grid-column: 1 / -1;
}

/* .form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
} */

.req {
  color: #dc3545;
}

.form-input {
  padding: 9px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1e1e2e;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color .2s, box-shadow .2s;
  background: #fff;
}

.form-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, .1);
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.field-error {
  color: #dc3545;
  font-size: 11px;
  margin: 2px 0 0;
}

.mt-12 {
  margin-top: 12px;
}

/* ─── Product search ─────────────────────────────────────────── */
.product-search-wrap {
  margin-bottom: 12px;
}

.product-list {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  max-height: 260px;
  overflow-y: auto;
}

.product-pick-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background .15s;
}

.product-pick-row:last-child {
  border-bottom: none;
}

.product-pick-row:hover {
  background: #f5f3ff;
}

.product-pick-thumb {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.product-pick-thumb.no-img {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  font-size: 20px;
  color: #9ca3af;
}

.product-pick-info {
  flex: 1;
  min-width: 0;
}

.product-pick-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e1e2e;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-pick-price {
  font-size: 13px;
  color: #6366f1;
  font-weight: 700;
  margin: 0;
}

.btn-add-product {
  padding: 6px 14px;
  background: #1e1e2e;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all .2s;
}

.btn-add-product:hover {
  background: #2d2d44;
}

.no-results,
.search-hint {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 16px;
  margin: 0;
}

/* ─── Order items ────────────────────────────────────────────── */
.order-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.order-item-thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.order-item-thumb.no-img {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  font-size: 24px;
  color: #9ca3af;
}

.order-item-details {
  flex: 1;
  min-width: 0;
}

.order-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e1e2e;
  margin: 0 0 6px;
}

/* Mini variant chips */
.item-variants {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variant-mini-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.variant-mini-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  min-width: 36px;
}

.mini-chip {
  padding: 3px 10px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #fff;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}

.mini-chip:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.mini-chip-active {
  background: #1e1e2e !important;
  border-color: #1e1e2e !important;
  color: #fff !important;
}

.order-item-controls {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.ctrl-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
}

.price-input-wrap,
.inline-input-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.currency {
  padding: 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  white-space: nowrap;
}

.price-input,
.inline-input {
  border: none;
  outline: none;
  padding: 7px 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1e1e2e;
  width: 80px;
  background: transparent;
}

.qty-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.qty-btn {
  padding: 6px 10px;
  background: #f9fafb;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  transition: background .15s;
}

.qty-btn:hover {
  background: #e5e7eb;
}

.qty-input {
  border: none;
  outline: none;
  width: 44px;
  text-align: center;
  padding: 6px 4px;
  font-size: 14px;
  font-weight: 600;
  color: #1e1e2e;
}

.item-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.item-total-val {
  font-size: 14px;
  font-weight: 700;
  color: #1e1e2e;
}

.btn-remove-item {
  background: #fee2e2;
  border: none;
  color: #dc3545;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  transition: all .2s;
  align-self: center;
}

.btn-remove-item:hover {
  background: #dc3545;
  color: #fff;
}

/* ─── Summary card ───────────────────────────────────────────── */
.summary-card {
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #374151;
}

.editable-row {
  align-items: center;
}

.summary-val {
  font-weight: 700;
  color: #1e1e2e;
}

.summary-divider {
  border-top: 1px dashed #e5e7eb;
  margin: 4px 0;
}

.total-row {
  font-size: 16px;
  font-weight: 700;
}

.total-row .inline-input-wrap {
  border-color: #6366f1;
}

.total-input {
  width: 100px;
  font-size: 16px;
  font-weight: 700;
  color: #1e1e2e;
}

.inline-input-wrap .currency {
  background: #ede9fe;
  color: #6366f1;
  border-color: #c4b5fd;
}

.summary-note {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
  text-align: center;
}

.btn-submit-order {
  width: 100%;
  padding: 13px;
  background: #1e1e2e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all .2s;
  margin-top: 4px;
}

.btn-submit-order:hover:not(:disabled) {
  background: #2d2d44;
  box-shadow: 0 4px 14px rgba(0, 0, 0, .2);
}

.btn-submit-order:disabled {
  opacity: .55;
  cursor: not-allowed;
}

/* ─── View modal ─────────────────────────────────────────────── */
.view-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-section {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px;
}

.view-section-title {
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: .6px;
  margin: 0 0 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: .5px;
}

/* Items table */
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.items-table th {
  text-align: left;
  padding: 8px 12px;
  background: #f9fafb;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .5px;
  border-bottom: 1px solid #e5e7eb;
}

.items-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.items-table tr:last-child td {
  border-bottom: none;
}

.sell-product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sell-thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 5px;
  border: 1px solid #e5e7eb;
}

.variant-text {
  font-size: 12px;
  color: #6b7280;
}

/* Totals */
.view-totals {
  background: #f9fafb;
}

.total-line {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.total-line:last-child {
  border-bottom: none;
}

.grand-total {
  font-size: 16px;
  font-weight: 700;
  color: #1e1e2e;
  padding-top: 10px;
}

/* ─── Status modal ───────────────────────────────────────────── */
.status-order-ref {
  font-size: 14px;
  font-weight: 700;
  color: #1e1e2e;
  margin: 0 0 16px;
  font-family: monospace;
}

.status-flow {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 16px;
  align-items: center;
}

.flow-step {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #f3f4f6;
  color: #9ca3af;
  border: 1px solid #e5e7eb;
}

.flow-current {
  background: #dbeafe;
  color: #1e40af;
  border-color: #bfdbfe;
}

.flow-next {
  background: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

/* ─── Delete ─────────────────────────────────────────────────── */
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

/* ─── Buttons ────────────────────────────────────────────────── */
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
}

.btn-submit:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.btn-status {
  padding: 10px 22px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}

.btn-status:hover {
  background: #4f46e5;
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

/* ─── Responsive ─────────────────────────────────────────────── */
@media (max-width: 900px) {
  .order-layout {
    grid-template-columns: 1fr;
  }

  .order-right {
    position: static;
  }

  .form-grid-2 {
    grid-template-columns: 1fr;
  }

  .form-group.full {
    grid-column: 1;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item.full {
    grid-column: 1;
  }
}

@media (max-width: 768px) {
  /* .header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  } */

  .table-container {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .order-item-row {
    flex-wrap: wrap;
  }

  .order-item-controls {
    flex-wrap: wrap;
  }
}

.btn-invoice {
  padding: 5px 12px;
  background: #0f3460;
  color: #60a5fa;
  border: none;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}

.btn-invoice:hover {
  background: #1e40af;
  color: #fff;
}
</style>