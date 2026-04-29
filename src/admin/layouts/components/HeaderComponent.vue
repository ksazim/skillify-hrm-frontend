<template>
  <div class="header">

    <!-- ── Left ── -->
    <div class="header__left">

      <!-- Sidebar toggle -->
      <button class="header-btn header-btn--toggle" @click="emit('toggle-sidebar')" title="Toggle sidebar" aria-label="Toggle sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 6h16M4 12h10M4 18h16"/>
        </svg>
      </button>

      <!-- Divider -->
      <span class="header-divider" />

      <!-- Search -->
      <div class="search-wrap" :class="{ 'search-wrap--focused': searchFocused }">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="Search anything…"
          v-model="searchQuery"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          aria-label="Search"
        />
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
        <button
          class="user-trigger"
          :class="{ 'user-trigger--open': showUserMenu }"
          @click="toggleUserMenu"
          aria-haspopup="true"
          :aria-expanded="showUserMenu"
        >
          <div class="user-avatar">{{ getUserInitials() }}</div>
          <div class="user-meta" v-if="userData">
            <span class="user-name">{{ userData.name }}</span>
            <span class="user-role">{{ userData.roles[0].name || 'Administrator' }}</span>
          </div>
          <svg class="user-chevron" :class="{ 'user-chevron--up': showUserMenu }" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>

        <!-- User dropdown panel -->
        <Transition name="dropdown">
          <div v-if="showUserMenu" class="dropdown-panel" role="menu">

            <!-- User hero -->
            <div class="user-hero">
              <div class="user-hero__rule" />
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
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
                </div>
                <span>Settings</span>
                <svg class="dropdown-item__arrow" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
              </a>
            </nav>

            <div class="dropdown-sep" />

            <!-- Logout -->
            <button
              class="logout-btn"
              @click="handleLogout"
              :disabled="loggingOut"
              role="menuitem"
            >
              <div class="dropdown-item__icon dropdown-item__icon--danger">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/></svg>
              </div>
              <span>{{ loggingOut ? 'Signing out…' : 'Sign out' }}</span>
              <svg v-if="loggingOut" class="logout-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-opacity=".25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none"/>
              </svg>
            </button>

          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import axios from 'axios'

const emit    = defineEmits(['toggle-sidebar'])
const router  = useRouter()
const authStore = useAuthStore()

// ── State ──────────────────────────────────────────────────────────────────────
const userData    = ref(null)
const loggingOut  = ref(false)
const searchQuery = ref('')
const searchFocused = ref(false)
const showUserMenu  = ref(false)
const userRef       = ref(null)

// ── Clock ──────────────────────────────────────────────────────────────────────
const currentTime = ref('')
const currentDate = ref('')
let clockInterval = null

function updateClock() {
  const now  = new Date()
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
/* ── Tokens ── */
.header {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.09);
  --gold-glow-str:  rgba(201,169,110,0.18);
  --onyx-2:         #131316;
  --onyx-3:         #1A1A1F;
  --onyx-4:         #222228;
  --onyx-5:         #2C2C33;
  --smoke:          rgba(255,255,255,0.04);
  --smoke-hover:    rgba(255,255,255,0.07);
  --text-primary:   #F0EAE0;
  --text-secondary: rgba(240,234,224,0.55);
  --text-muted:     rgba(240,234,224,0.28);
  --border:         rgba(201,169,110,0.12);
  --border-strong:  rgba(201,169,110,0.28);
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
  font-family: 'Jost', 'Inter', sans-serif;
  background: transparent;
  box-sizing: border-box;
}

.header__left  { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
.header__right { display:flex; align-items:center; gap:12px; flex-shrink:0; }

/* ── Vertical divider ── */
.header-divider {
  width: 1px; height: 20px;
  background: var(--border-strong);
  flex-shrink: 0;
}

/* ── Toggle button ── */
.header-btn {
  width: 34px; height: 34px;
  background: none;
  border: 1px solid transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: color .15s, border-color .15s, background .15s;
  padding: 0;
}
.header-btn svg { width: 18px; height: 18px; }
.header-btn:hover { color: var(--gold); border-color: var(--border); background: var(--smoke); }

/* ── Search ── */
.search-wrap {
  position: relative;
  display: flex; align-items: center;
  max-width: 340px; width: 100%;
  border: 1px solid var(--border);
  background: var(--onyx-4);
  transition: border-color .18s, background .18s, box-shadow .18s;
}
.search-wrap--focused {
  border-color: var(--gold-dim);
  background: var(--onyx-5);
  box-shadow: 0 0 0 2px rgba(201,169,110,0.07);
}
.search-icon {
  position: absolute; left: 11px;
  width: 13px; height: 13px;
  color: var(--gold-dim);
  pointer-events: none; flex-shrink: 0;
}
.search-input {
  width: 100%;
  padding: 8px 36px 8px 34px;
  background: transparent; border: none; outline: none;
  color: var(--text-primary);
  font-family: inherit; font-size: 12.5px; letter-spacing: .02em;
}
.search-input::placeholder { color: var(--text-muted); }
.search-kbd {
  position: absolute; right: 10px;
  font-size: 9.5px; letter-spacing: .04em;
  color: var(--text-muted);
  border: 1px solid var(--border);
  background: var(--onyx-3);
  padding: 2px 6px;
  font-family: inherit;
  pointer-events: none;
}

/* ── Clock ── */
.header-clock {
  display: flex; flex-direction: column; align-items: flex-end; gap: 1px;
}
.clock-time {
  font-family: 'Cormorant Garamond','Georgia',serif;
  font-size: 16px; font-weight: 500;
  color: var(--gold-light); letter-spacing: .04em; line-height: 1;
}
.clock-date {
  font-size: 9px; text-transform: uppercase;
  letter-spacing: .14em; color: var(--text-muted); line-height: 1;
}

/* ── User trigger button ── */
.user-trigger {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 10px 5px 5px;
  background: none; border: 1px solid transparent;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.user-trigger:hover,
.user-trigger--open { border-color: var(--border); background: var(--smoke); }

.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--gold-glow);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond','Georgia',serif;
  font-size: 13px; font-weight: 500; color: var(--gold-light);
  flex-shrink: 0; letter-spacing: .04em;
}

.user-meta { display:flex; flex-direction:column; align-items:flex-start; gap:1px; }
.user-name {
  font-size: 12.5px; font-weight: 500; letter-spacing: .02em;
  color: var(--text-primary); white-space: nowrap; line-height: 1;
}
.user-role {
  font-size: 9.5px; text-transform: uppercase; letter-spacing: .12em;
  color: var(--gold-dim); line-height: 1;
}

.user-chevron {
  width: 13px; height: 13px; color: var(--text-muted);
  transition: transform .22s; flex-shrink: 0;
}
.user-chevron--up { transform: rotate(180deg); }

/* ── Dropdown panel ── */
.dropdown-root { position: relative; }

.dropdown-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 270px;
  background: var(--onyx-2);
  border: 1px solid var(--border-strong);
  z-index: 2000;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3);
}

/* gold top accent */
.dropdown-panel::before {
  content: '';
  position: absolute; top:0; left:0; right:0; height:2px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), var(--gold), var(--gold-dim), transparent);
}

/* ── User hero ── */
.user-hero {
  background: var(--onyx-3);
}
.user-hero__rule {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), var(--gold), var(--gold-dim), transparent);
}
.user-hero__inner {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px 14px;
}
.user-hero__avatar {
  width: 44px; height: 44px; border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--gold-glow);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond','Georgia',serif;
  font-size: 18px; font-weight: 500;
  color: var(--gold-light); flex-shrink: 0; letter-spacing: .04em;
}
.user-hero__info { flex:1; min-width:0; }
.user-hero__name {
  font-family: 'Cormorant Garamond','Georgia',serif;
  font-size: 16px; font-weight: 500;
  color: var(--text-primary); letter-spacing: .04em;
  margin: 0 0 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.user-hero__email {
  font-size: 11px; color: var(--text-muted);
  letter-spacing: .04em; margin: 0;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* ── Status ── */
.user-status {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 18px;
  background: var(--onyx-3);
}
.status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #5DCAA5;
  box-shadow: 0 0 5px rgba(93,202,165,0.6);
  flex-shrink: 0;
}
.status-label { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #5DCAA5; }

/* ── Separator ── */
.dropdown-sep { height: 1px; background: var(--border); margin: 4px 0; }

/* ── Nav items ── */
.dropdown-nav { padding: 4px 0; }

.dropdown-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 18px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 12.5px; letter-spacing: .02em;
  transition: background .14s, color .14s;
  cursor: pointer;
}
.dropdown-item:hover { background: var(--smoke-hover); color: var(--text-primary); }

.dropdown-item__icon {
  width: 28px; height: 28px;
  border: 1px solid var(--border);
  background: var(--smoke);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--gold-dim);
  transition: border-color .14s, color .14s, background .14s;
}
.dropdown-item__icon svg { width: 13px; height: 13px; }
.dropdown-item:hover .dropdown-item__icon { border-color: var(--border-strong); color: var(--gold); background: var(--gold-glow); }

.dropdown-item__icon--danger { color: #F09595; border-color: rgba(240,149,149,0.25); }

.dropdown-item__arrow {
  width: 12px; height: 12px;
  color: var(--text-muted); margin-left: auto; flex-shrink: 0;
  opacity: 0; transition: opacity .14s, transform .14s;
}
.dropdown-item:hover .dropdown-item__arrow { opacity: 1; transform: translateX(2px); }

/* ── Logout button ── */
.logout-btn {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  padding: 10px 18px 12px;
  background: none; border: none;
  color: #F09595;
  font-family: inherit; font-size: 12.5px; letter-spacing: .02em;
  cursor: pointer;
  transition: background .14s;
  text-align: left;
}
.logout-btn:hover:not(:disabled) { background: rgba(240,149,149,0.06); }
.logout-btn:disabled { opacity: .5; cursor: not-allowed; }
.logout-btn .dropdown-item__icon--danger { color: #F09595; }

.logout-spinner {
  width: 13px; height: 13px;
  animation: spin .8s linear infinite; margin-left: auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Dropdown transition ── */
.dropdown-enter-active { transition: opacity .18s ease, transform .18s cubic-bezier(.22,.68,0,1.2); }
.dropdown-leave-active { transition: opacity .13s ease, transform .13s ease; }
.dropdown-enter-from   { opacity:0; transform:translateY(-8px) scale(.97); }
.dropdown-leave-to     { opacity:0; transform:translateY(-4px) scale(.98); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .search-wrap   { display: none; }
  .header-clock  { display: none; }
  .header-divider:nth-child(2) { display: none; }
  .user-meta     { display: none; }
  .user-trigger  { padding: 5px; }
  .dropdown-panel { right: -8px; min-width: 250px; }
}

@media (max-width: 480px) {
  .dropdown-panel { min-width: 240px; }
}
</style>