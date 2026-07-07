<template>
  <div class="header">

    <!-- ── Left ── -->
    <div class="header__left">

      <!-- Sidebar toggle -->
      <button class="header-btn header-btn--toggle" @click="emit('toggle-sidebar')" title="Toggle sidebar"
        aria-label="Toggle sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      </button>

      <!-- Divider -->
      <span class="header-divider" />

      <!-- Search -->
      <div class="search-wrap" :class="{ 'search-wrap--focused': searchFocused }">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clip-rule="evenodd" />
        </svg>
        <input type="text" class="search-input" placeholder="Search anything…" v-model="searchQuery"
          @focus="searchFocused = true" @blur="searchFocused = false" aria-label="Search" />
        <kbd v-if="!searchFocused && !searchQuery" class="search-kbd">⌘K</kbd>
      </div>
    </div>

    <!-- ── Right ── -->
    <div class="header__right">

      <!-- Clock -->
      <div class="header-clock">
        <span class="clock-time">{{ currentTime }}</span>
        <span class="clock-date">{{ currentDate }}</span>
      </div>

      <span class="header-divider" />

      <!-- User dropdown -->
      <div class="dropdown-root" ref="userRef">
        <button class="user-trigger" :class="{ 'user-trigger--open': showUserMenu }" @click="toggleUserMenu"
          aria-haspopup="true" :aria-expanded="showUserMenu">
          <div class="user-avatar">{{ getUserInitials() }}</div>
          <div class="user-meta" v-if="userData">
            <span class="user-name">{{ userData.name }}</span>
            <span class="user-role">{{ userData.roles[0]?.name || 'Administrator' }}</span>
          </div>
          <svg class="user-chevron" :class="{ 'user-chevron--up': showUserMenu }" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </button>

        <!-- User dropdown panel -->
        <Transition name="dropdown">
          <div v-if="showUserMenu" class="dropdown-panel" role="menu">

            <!-- User hero -->
            <div class="user-hero">
              <div class="user-hero__inner">
                <div class="user-hero__avatar">{{ getUserInitials() }}</div>
                <div class="user-hero__info" v-if="userData">
                  <p class="user-hero__name">{{ userData.name }}</p>
                  <p class="user-hero__email">{{ userData.email }}</p>
                </div>
              </div>
            </div>

            <!-- Online indicator -->
            <div class="user-status">
              <span class="status-dot" />
              <span class="status-label">Active session</span>
            </div>

            <div class="dropdown-sep" />

            <!-- Menu items -->
            <nav class="dropdown-nav">
              <a href="#" class="dropdown-item" role="menuitem" @click.prevent="goToSettings">
                <div class="dropdown-item__icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                      clip-rule="evenodd" />
                  </svg>
                </div>
                <span>Settings</span>
                <svg class="dropdown-item__arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd" />
                </svg>
              </a>
            </nav>

            <div class="dropdown-sep" />

            <!-- Logout -->
            <button class="logout-btn" @click="handleLogout" :disabled="loggingOut" role="menuitem">
              <div class="dropdown-item__icon dropdown-item__icon--danger">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <span>{{ loggingOut ? 'Signing out…' : 'Sign out' }}</span>
              <svg v-if="loggingOut" class="logout-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                  stroke-opacity=".25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" />
              </svg>
            </button>

          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
import axios from 'axios'
import { defineEmits, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()
const authStore = useAuthStore()

// ── State ──────────────────────────────────────────────────────────────────────
const userData = ref(null)
const loggingOut = ref(false)
const searchQuery = ref('')
const searchFocused = ref(false)
const showUserMenu = ref(false)
const userRef = ref(null)

// ── Clock ──────────────────────────────────────────────────────────────────────
const currentTime = ref('')
const currentDate = ref('')
let clockInterval = null

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  currentDate.value = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── User ───────────────────────────────────────────────────────────────────────
const fetchUserData = async () => {
  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
    const res = await axios.get(process.env.VUE_APP_BASE_API + '/user')
    if (res.data?.user) userData.value = res.data.user
  } catch (err) {
    if (err.response?.status === 401) { authStore.logout(); router.push('/') }
  }
}

const getUserInitials = () => {
  if (!userData.value?.name) return 'U'
  const parts = userData.value.name.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : userData.value.name.substring(0, 2).toUpperCase()
}

// ── Menus ──────────────────────────────────────────────────────────────────────
const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value }

const goToSettings = () => { router.push('/settings'); showUserMenu.value = false }

const handleLogout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
    await axios.post(process.env.VUE_APP_BASE_API + '/logout')
  } catch { /* still logout locally */ } finally {
    authStore.logout()
    router.push('/')
    loggingOut.value = false
  }
}

// ── Click outside ──────────────────────────────────────────────────────────────
const handleClickOutside = (e) => {
  if (userRef.value && !userRef.value.contains(e.target)) showUserMenu.value = false
}

onMounted(() => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)
  document.addEventListener('click', handleClickOutside)
  fetchUserData()
})

onBeforeUnmount(() => {
  clearInterval(clockInterval)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ── Light Theme Tokens ── */
.header {
  --primary: #4F46E5;
  --primary-light: #EEF2FF;
  --primary-dark: #4338CA;
  --primary-hover: #4338CA;

  --bg: #FFFFFF;
  --bg-hover: #F8FAFC;
  --bg-active: #F1F5F9;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-light: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --border-focus: #818CF8;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* ── Shell ── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 0 4px;
  background: var(--bg);
  box-sizing: border-box;
  border-bottom: 1px solid var(--border);
}

.header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.header__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* ── Vertical divider ── */
.header-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  flex-shrink: 0;
}

/* ── Toggle button ── */
.header-btn {
  width: 38px;
  height: 38px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
  padding: 0;
}

.header-btn svg {
  width: 20px;
  height: 20px;
}

.header-btn:hover {
  color: var(--primary);
  border-color: var(--border);
  background: var(--bg-hover);
}

.header-btn:active {
  transform: scale(0.95);
}

/* ── Search ── */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 340px;
  width: 100%;
  border: 1.5px solid var(--border);
  background: var(--bg);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.search-wrap--focused {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 9px 40px 9px 38px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.01em;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-kbd {
  position: absolute;
  right: 10px;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border: 1px solid var(--border);
  background: var(--bg-hover);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: inherit;
  pointer-events: none;
  font-weight: 500;
}

/* ── Clock ── */
.header-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.clock-time {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  line-height: 1;
}

.clock-date {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  line-height: 1;
  font-weight: 500;
}

/* ── User trigger button ── */
.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 5px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-trigger:hover,
.user-trigger--open {
  border-color: var(--border);
  background: var(--bg-hover);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.02em;
  transition: all 0.2s ease;
}

.user-trigger:hover .user-avatar {
  background: var(--primary);
  color: white;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin-bottom: 8px;
  color: var(--text-primary);
  white-space: nowrap;
  line-height: 1;
}

.user-role {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  line-height: 1;
  font-weight: 500;
}

.user-chevron {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.user-chevron--up {
  transform: rotate(180deg);
}

/* ── Dropdown panel ── */
.dropdown-root {
  position: relative;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 280px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  z-index: 2000;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

/* ── User hero ── */
.user-hero {
  background: var(--bg-hover);
  padding: 4px 0 0;
}

.user-hero__inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px 14px;
}

.user-hero__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.user-hero__info {
  flex: 1;
  min-width: 0;
}

.user-hero__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.01em;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-hero__email {
  font-size: 12px;
  color: var(--text-secondary);
  letter-spacing: 0.01em;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Status ── */
.user-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 20px 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
  flex-shrink: 0;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(0.9);
  }
}

.status-label {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #10B981;
  font-weight: 600;
}

/* ── Separator ── */
.dropdown-sep {
  height: 1px;
  background: var(--border);
  margin: 4px 16px;
}

/* ── Nav items ── */
.dropdown-nav {
  padding: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  letter-spacing: 0.01em;
  transition: all 0.15s ease;
  cursor: pointer;
  border-radius: 0;
}

.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-item__icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: all 0.15s ease;
}

.dropdown-item__icon svg {
  width: 16px;
  height: 16px;
}

.dropdown-item:hover .dropdown-item__icon {
  background: var(--primary-light);
  color: var(--primary);
}

.dropdown-item__icon--danger {
  color: #EF4444;
  background: #FEF2F2;
}

.dropdown-item:hover .dropdown-item__icon--danger {
  background: #FEE2E2;
  color: #DC2626;
}

.dropdown-item__arrow {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.2s ease;
}

.dropdown-item:hover .dropdown-item__arrow {
  opacity: 1;
  transform: translateX(3px);
  color: var(--primary);
}

/* ── Logout button ── */
.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 20px 14px;
  background: transparent;
  border: none;
  color: #EF4444;
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.logout-btn:hover:not(:disabled) {
  background: #FEF2F2;
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logout-btn .dropdown-item__icon--danger {
  color: #EF4444;
  background: #FEF2F2;
}

.logout-btn:hover .dropdown-item__icon--danger {
  background: #FEE2E2;
  color: #DC2626;
}

.logout-spinner {
  width: 14px;
  height: 14px;
  animation: spin 0.8s linear infinite;
  margin-left: auto;
  color: #EF4444;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Dropdown transition ── */
.dropdown-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.22, 0.68, 0, 1.2);
}

.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .search-wrap {
    display: none;
  }

  .header-clock {
    display: none;
  }

  .header-divider:nth-child(2) {
    display: none;
  }

  .user-meta {
    display: none;
  }

  .user-trigger {
    padding: 5px;
  }

  .dropdown-panel {
    right: -8px;
    min-width: 250px;
  }
}

@media (max-width: 480px) {
  .dropdown-panel {
    min-width: 220px;
  }

  .header-btn {
    width: 34px;
    height: 34px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
</style>