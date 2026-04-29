<template>
  <div class="dashboard-page">
    <!-- Welcome Header -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            Welcome back, <span class="user-name">{{ userName }}</span> 👋
          </h1>
          <p class="welcome-subtitle">
            {{ currentGreeting }} Here's what's happening with your business today.
          </p>
        </div>
        <div class="welcome-date">
          <div class="date-info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
            <div>
              <div class="current-date">{{ currentDate }}</div>
              <div class="current-time">{{ currentTime }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card stat-blue">
        <div class="stat-icon">
          <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">New Orders</div>
          <div class="stat-value">{{ stats.new_orders }}</div>
          <div class="stat-change up">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z"/>
            </svg>
            <span>Last 3 days</span>
          </div>
        </div>
      </div>

      <div class="stat-card stat-green">
        <div class="stat-icon">
          <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Active Products</div>
          <div class="stat-value">{{ stats.products }}</div>
          <div class="stat-change up">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z"/>
            </svg>
            <span>Available Products</span>
          </div>
        </div>
      </div>

      <div class="stat-card stat-purple">
        <div class="stat-icon">
          <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Categories</div>
          <div class="stat-value">{{ stats.categories }}</div>
          <div class="stat-change up">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z"/>
            </svg>
            <span>Categories available</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content: Two tables side by side -->
    <div class="content-grid">

      <!-- Recent Orders -->
      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
            Recent Orders
          </h2>
          <button class="view-all-btn" @click="$router.push('/admin/dashboard/orders')">View All</button>
        </div>

        <div v-if="ordersLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading Orders...</p>
        </div>

        <div v-else-if="!orders.length" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          <h3>No Orders yet</h3>
          <p>New orders will appear here</p>
        </div>

        <template v-else>
          <div class="simple-table">
            <div class="table-header">
              <div class="table-row orders-grid">
                <div class="table-cell">Invoice No</div>
                <div class="table-cell">Recipient Name</div>
                <div class="table-cell">Total</div>
                <div class="table-cell">Status</div>
              </div>
            </div>
            <div class="table-body">
              <div
                v-for="order in orders"
                :key="order.id"
                class="table-row orders-grid"
              >
                <div class="table-cell" data-label="Client">
                    {{ order.invoice_no }}
                </div>
                <div class="table-cell" data-label="Client">
                    {{ order.recipient_name }}
                </div>
                <div class="table-cell" data-label="Program">
                  {{ order.total }}
                </div>
                <div class="table-cell" data-label="Status">
                  <span class="status-badge" :class="getStatusClass(order)">
                    {{ getStatus(order) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Orders mini-pagination -->
          <div class="mini-pagination" v-if="ordersPagination.total_pages > 1">
            <button
              class="mini-pg-btn"
              :disabled="ordersPagination.current_page === 1"
              @click="fetchOrders(ordersPagination.current_page - 1)"
            >&#8592;</button>
            <span class="mini-pg-label">
              {{ ordersPagination.current_page }} / {{ ordersPagination.total_pages }}
            </span>
            <button
              class="mini-pg-btn"
              :disabled="ordersPagination.current_page === ordersPagination.total_pages"
              @click="fetchOrders(ordersPagination.current_page + 1)"
            >&#8594;</button>
          </div>
        </template>
      </div>

      <!-- Best Seller Products -->
      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Best Sellers
          </h2>
          <button class="view-all-btn" @click="$router.push('/admin/dashboard/products')">View All</button>
        </div>

        <div v-if="productsLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading Products...</p>
        </div>

        <div v-else-if="!products.length" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clip-rule="evenodd"/>
          </svg>
          <h3>No Products yet</h3>
          <p>Products will appear here</p>
        </div>

        <template v-else>
          <div class="simple-table">
            <div class="table-header">
              <div class="table-row products-grid">
                <div class="table-cell">Product</div>
                <div class="table-cell">Category</div>
                <div class="table-cell">Price</div>
                <div class="table-cell">Orders</div>
              </div>
            </div>
            <div class="table-body">
              <div
                v-for="product in products"
                :key="product.id"
                class="table-row products-grid"
              >
                <div class="table-cell" data-label="Product">
                  {{ product.product_name }}
                </div>
                <div class="table-cell" data-label="Category">
                  {{ product.category?.name || '—' }}
                </div>
                <div class="table-cell" data-label="Price">
                  ${{ product.offer_price ?? '—' }}
                </div>
                <div class="table-cell" data-label="Orders">
                  <span class="order-count-badge">{{ product.orders ?? 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Products mini-pagination -->
          <div class="mini-pagination" v-if="productsPagination.total_pages > 1">
            <button
              class="mini-pg-btn"
              :disabled="productsPagination.current_page === 1"
              @click="fetchBestSellers(productsPagination.current_page - 1)"
            >&#8592;</button>
            <span class="mini-pg-label">
              {{ productsPagination.current_page }} / {{ productsPagination.total_pages }}
            </span>
            <button
              class="mini-pg-btn"
              :disabled="productsPagination.current_page === productsPagination.total_pages"
              @click="fetchBestSellers(productsPagination.current_page + 1)"
            >&#8594;</button>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import axios from 'axios'

const authStore = useAuthStore()

const userName    = ref('Admin')
const currentDate = ref('')
const currentTime = ref('')

const stats = ref({ new_orders: 0, products: 0, categories: 0 })

// Orders
const orders           = ref([])
const ordersLoading    = ref(false)
const ordersPagination = ref({ current_page: 1, total_pages: 1, total: 0, per_page: 5 })

// Products
const products           = ref([])
const productsLoading    = ref(false)
const productsPagination = ref({ current_page: 1, total_pages: 1, total: 0, per_page: 5 })

// const programMapping = { 9: 'Graduate', 10: 'Undergraduate', 11: 'Post Graduate', 3: 'Diploma' }
// const countryMapping = { 2: 'UK', 3: 'USA', 4: 'Canada' }

const currentGreeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning!'
  if (h < 18) return 'Good afternoon!'
  return 'Good evening!'
})

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${authStore.token}` }
})

const fetchStats = async () => {
  try {
    const { data } = await axios.get(
      `${process.env.VUE_APP_BASE_API}/admin/dashboard/stats`,
      authHeaders()
    )
    stats.value = {
      new_orders: data.new_orders ?? 0,
      products:   data.products   ?? 0,
      categories: data.categories ?? 0,
    }
  } catch (e) {
    console.error('Stats error:', e)
  }
}

const fetchOrders = async (page = 1) => {
  ordersLoading.value = true
  try {
    const { data } = await axios.get(
      `${process.env.VUE_APP_BASE_API}/admin/dashboard/latest-orders`,
      { ...authHeaders(), params: { page, limit: 5 } }
    )
    orders.value           = data.list       ?? []
    ordersPagination.value = data.pagination ?? ordersPagination.value
  } catch (e) {
    console.error('Orders error:', e)
  } finally {
    ordersLoading.value = false
  }
}

const fetchBestSellers = async (page = 1) => {
  productsLoading.value = true
  try {
    const { data } = await axios.get(
      `${process.env.VUE_APP_BASE_API}/admin/dashboard/best-sellers`,
      { ...authHeaders(), params: { page, limit: 5 } }
    )
    products.value           = data.list       ?? []
    productsPagination.value = data.pagination ?? productsPagination.value
  } catch (e) {
    console.error('Best sellers error:', e)
  } finally {
    productsLoading.value = false
  }
}

const fetchUserData = async () => {
  try {
    const { data } = await axios.get(
      `${process.env.VUE_APP_BASE_API}/admin/user`,
      authHeaders()
    )
    if (data?.user) userName.value = data.user.name || 'Admin'
  } catch (e) {
    console.error('User error:', e)
  }
}

// const getInitials    = (first, last) => ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || 'U'
// const getProgramName = (id) => programMapping[id] ?? `Program ${id}`
// const getCountryName = (id) => countryMapping[id] ?? `Country ${id}`

// const formatDate = (dateString) => {
//   if (!dateString) return 'Not specified'
//   const date     = new Date(dateString)
//   const today    = new Date()
//   const tomorrow = new Date(today)
//   tomorrow.setDate(tomorrow.getDate() + 1)
//   if (date.toDateString() === today.toDateString())    return 'Today'
//   if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
//   return date.toLocaleDateString('en-US', {
//     month: 'short', day: 'numeric',
//     year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
//   })
// }

const getStatus = (order) => {
  const d = new Date(order.preferred_appointment_date)
  const t = new Date(); t.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0)
  if (d < t)                   return 'Completed'
  if (d.getTime() === t.getTime()) return 'Today'
  return 'Pending'
}

const getStatusClass = (order) => {
  const s = getStatus(order)
  return s === 'Completed' ? 'completed' : s === 'Today' ? 'today' : 'pending'
}

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  currentTime.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

let timeInterval
onMounted(() => {
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 1000)
  fetchUserData()
  fetchStats()
  fetchOrders()
  fetchBestSellers()
})
onUnmounted(() => clearInterval(timeInterval))
</script>

<style scoped>
.dashboard-page {
  padding: 30px;
  max-width: 1600px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

/* ── Welcome ───────────────────────────────────────────── */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 30px;
  box-shadow: 0 10px 40px rgba(102, 126, 234, .2);
}
.welcome-content  { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.welcome-title    { font-size: 32px; font-weight: 700; color: white; margin: 0 0 12px; }
.user-name        { background: rgba(255,255,255,.2); padding: 4px 12px; border-radius: 8px; }
.welcome-subtitle { font-size: 16px; color: rgba(255,255,255,.9); margin: 0; }
.welcome-date     { background: rgba(255,255,255,.15); backdrop-filter: blur(10px); padding: 16px 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,.2); }
.date-info        { display: flex; align-items: center; gap: 12px; color: white; }
.current-date     { font-size: 14px; font-weight: 600; }
.current-time     { font-size: 12px; opacity: .9; }

/* ── Stats ─────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}
.stat-card    { background: white; border-radius: 12px; padding: 24px; display: flex; gap: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.05); transition: all .3s; border-left: 4px solid transparent; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
.stat-blue    { border-left-color: #3b82f6; }
.stat-green   { border-left-color: #10b981; }
.stat-purple  { border-left-color: #8b5cf6; }
.stat-icon    { width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-blue   .stat-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
.stat-green  .stat-icon { background: linear-gradient(135deg, #10b981, #059669); color: white; }
.stat-purple .stat-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
.stat-label   { font-size: 13px; color: #6b7280; font-weight: 500; margin-bottom: 8px; }
.stat-value   { font-size: 32px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
.stat-change  { font-size: 12px; display: flex; align-items: center; gap: 4px; color: #6b7280; }
.stat-change.up { color: #10b981; }

/* ── Content grid ──────────────────────────────────────── */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 30px;
}
.content-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  display: flex;
  flex-direction: column;
}
.card-header  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f3f4f6; }
.card-title   { font-size: 18px; font-weight: 600; color: #1f2937; margin: 0; display: flex; align-items: center; gap: 8px; }
.view-all-btn { background: none; border: none; color: #667eea; font-size: 13px; font-weight: 600; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all .3s; }
.view-all-btn:hover { background: #f3f4f6; }

/* ── Table ─────────────────────────────────────────────── */
.simple-table  { overflow-x: auto; flex: 1; }
.orders-grid   { grid-template-columns: 1fr 2fr 1fr 1.2fr !important; }
.products-grid { grid-template-columns: 2fr 1.2fr 1fr 1fr !important; }
.table-row     { display: grid; gap: 12px; padding: 12px 16px; align-items: center; }
.table-header  { background: #f9fafb; border-radius: 8px; margin-bottom: 8px; }
.table-header .table-cell { font-weight: 600; color: #6b7280; text-transform: uppercase; font-size: 11px; letter-spacing: .5px; }
.table-body .table-row { border-bottom: 1px solid #f3f4f6; transition: all .2s; }
.table-body .table-row:last-child { border-bottom: none; }
.table-body .table-row:hover { background: #f9fafb; }
.table-body .table-cell { font-size: 13px; color: #374151; }

.client-info   { display: flex; align-items: center; gap: 10px; }
.client-avatar, .product-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 14px; flex-shrink: 0;
}
.product-avatar { background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; }

.appointment-datetime { display: flex; flex-direction: column; gap: 4px; }
.time-badge { display: inline-block; padding: 2px 8px; background: #f3f4f6; border-radius: 4px; font-size: 11px; font-weight: 600; color: #6b7280; }
.order-count-badge { padding: 3px 10px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 12px; font-weight: 700; }

.status-badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: capitalize; display: inline-block; }
.status-badge.today     { background: #fef3c7; color: #92400e; }
.status-badge.pending   { background: #dbeafe; color: #1e40af; }
.status-badge.completed { background: #d1fae5; color: #065f46; }

/* ── Mini pagination ───────────────────────────────────── */
.mini-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
}
.mini-pg-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s;
  flex-shrink: 0;
}
.mini-pg-btn:hover:not(:disabled) { background: #667eea; color: white; border-color: #667eea; }
.mini-pg-btn:disabled { opacity: .35; cursor: not-allowed; }
.mini-pg-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  min-width: 40px;
  text-align: center;
}

/* ── Loading / Empty ───────────────────────────────────── */
.loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #6b7280; text-align: center; }
.spinner { width: 36px; height: 36px; border: 4px solid #f3f4f6; border-top-color: #667eea; border-radius: 50%; animation: spin .8s linear infinite; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state svg { color: #d1d5db; margin-bottom: 12px; }
.empty-state h3  { font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 6px; }
.empty-state p   { font-size: 13px; margin: 0; }

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 1100px) {
  .content-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .dashboard-page  { padding: 20px 15px; }
  .welcome-content { flex-direction: column; align-items: flex-start; }
  .welcome-title   { font-size: 24px; }
  .welcome-date    { width: 100%; }
  .stats-grid      { grid-template-columns: 1fr; }
  .table-header    { display: none; }
  .orders-grid, .products-grid { grid-template-columns: 1fr !important; gap: 10px; }
  .table-body .table-row { background: #f9fafb; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e5e7eb; }
  .table-cell { display: flex; justify-content: space-between; align-items: center; }
  .table-cell::before { content: attr(data-label); font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
}
</style>