<template>
  <aside class="sidebar" :class="{ 'is-collapsed': collapsed }">
    <!-- Logo -->
    <div class="logo-wrap">
      <div class="logo-mark">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2L3 7v11h5v-5h4v5h5V7z" />
        </svg>
      </div>
      <Transition name="fade">
        <div v-if="!collapsed" class="logo-text-wrap">
          <span class="logo-name">Neuro</span>
          <span class="logo-sub">Human Resources</span>
        </div>
      </Transition>
    </div>

    <!-- Role badge -->
    <Transition name="fade">
      <div v-if="!collapsed" class="role-badge">
        <span class="role-badge-name">{{ authStore.roles[0] ?? 'User' }}</span>
        <span class="role-badge-desc">{{ authStore.user?.email }}</span>
      </div>
    </Transition>

    <!-- Navigation -->
    <nav class="nav">
      <template v-for="(section, sIdx) in visibleSections" :key="sIdx">

        <Transition name="fade">
          <p v-if="!collapsed" class="nav-section-label">{{ section.name }}</p>
        </Transition>
        <div v-if="collapsed" class="nav-section-divider" />

        <div v-for="menu in section.items" :key="menu.id" class="nav-item"
          :ref="el => { if (el) navItemRefs[menu.id] = el }" @mouseenter="collapsed ? handleItemEnter(menu) : null"
          @mouseleave="collapsed ? handleItemLeave() : null">
          <!-- Icon / label row -->
          <div class="nav-link" :class="{
            open: openMenus.has(menu.id) && !collapsed,
            'nav-link--active': activeMenuId === menu.id,
            'nav-link--flyout': collapsed && flyoutId === menu.id,
          }" @click="handleNavClick(menu)">
            <div class="nav-icon" v-html="menu.icon" />
            <Transition name="fade">
              <span v-if="!collapsed" class="nav-text">{{ menu.label }}</span>
            </Transition>
            <Transition name="fade">
              <svg v-if="!collapsed && menu.filteredSubs.length" class="nav-chevron"
                :class="{ rotated: openMenus.has(menu.id) }" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd" />
              </svg>
            </Transition>
          </div>

          <!-- Inline submenu (expanded sidebar) -->
          <Transition name="submenu">
            <div v-if="!collapsed && openMenus.has(menu.id) && menu.filteredSubs.length" class="submenu">
              <div v-for="sub in menu.filteredSubs" :key="sub.label" class="sub-item"
                :class="{ 'sub-item--active': route.path === sub.link }" @click="navigateTo(sub.link)">{{ sub.label }}
              </div>
            </div>
          </Transition>
        </div>

      </template>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="user-row">
        <div class="avatar" :title="collapsed ? (authStore.user?.name ?? '') : ''">
          {{ userInitials }}
        </div>
        <Transition name="fade">
          <div v-if="!collapsed" class="user-info">
            <p class="user-name">{{ authStore.user?.name }}</p>
            <p class="user-role-tag">{{ authStore.roles[0] ?? '' }}</p>
          </div>
        </Transition>
        <Transition name="fade">
          <button v-if="!collapsed" class="logout-btn" title="Sign out" @click="$emit('logout')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </Transition>
      </div>
    </div>
  </aside>

  <!-- Flyout (teleported to body — escapes all overflow/clip) -->
  <Teleport to="body">
    <Transition name="flyout-anim">
      <div v-if="collapsed && flyoutMenu" class="flyout-panel" :style="flyoutStyle" @mouseenter="handleFlyoutEnter"
        @mouseleave="handleFlyoutLeave">
        <div class="flyout-heading">{{ flyoutMenu.label }}</div>
        <template v-if="flyoutMenu.filteredSubs.length">
          <div class="flyout-divider" />
          <div v-for="sub in flyoutMenu.filteredSubs" :key="sub.label" class="flyout-item"
            :class="{ 'flyout-item--active': route.path === sub.link }" @click="handleFlyoutClick(flyoutMenu.id, sub)">
            <span class="flyout-dot" />
            {{ sub.label }}
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
import { computed, defineProps, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ── Router ─────────────────────────────────────────────────────────────────────
const router = useRouter()
const route = useRoute()

// ── Auth store ─────────────────────────────────────────────────────────────────
const authStore = useAuthStore()

// ── Props ──────────────────────────────────────────────────────────────────────
const props = defineProps({
  collapsed: { type: Boolean, default: false },
})

// ── Icons ──────────────────────────────────────────────────────────────────────
const ICONS = {
  dashboard: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11l8-9 8 9v7a1 1 0 01-1 1h-4v-4H7v4H3a1 1 0 01-1-1v-7z"/></svg>`,
  company: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12H4V4zm2 1h2v2H6V5zm0 4h2v2H6V9zm0 4h2v2H6v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clip-rule="evenodd"/></svg>`,
  employee: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/></svg>`,
  attendance: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z" clip-rule="evenodd"/></svg>`,
  leave: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>`,
  payroll: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/></svg>`,
  user: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>`,
  project: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h9a1 1 0 100-2H3zm0 4a1 1 0 100 2h5a1 1 0 100-2H3zm11.293-.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L15.586 16H13a1 1 0 110-2h2.586l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`,
  announce: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"/></svg>`,
  setup: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>`,
}

// ── Menu definitions ────────────────────────────────────────────────────────────
const menuItems = [
  {
    section: 'Core',
    id: 'dashboard',
    label: 'Dashboard',
    icon: ICONS.dashboard,
    perms: null,
    submenu: [
      { label: 'Overview', link: '/admin/dashboard', perm: null },
    ],
  },
  {
    section: 'Organization',
    id: 'company',
    label: 'Company',
    icon: ICONS.company,
    perms: ['company'],
    submenu: [
      { label: 'Companies', link: '/admin/company/list', perm: 'view company' },
    ],
  },
  {
    section: 'Organization',
    id: 'employee',
    label: 'Employee',
    icon: ICONS.employee,
    perms: ['employee'],
    submenu: [
      { label: 'Employee list', link: '/admin/employee/list', perm: 'view employee' },
    ],
  },
  {
    section: 'Time & Leave',
    id: 'attendance',
    label: 'Attendance',
    icon: ICONS.attendance,
    perms: ['attendance', 'attendance summary', 'todays employee'],
    submenu: [
      { label: 'Daily attendance', link: '/admin/attendance/daily', perm: 'view todays employee' },
      { label: 'Attendance log', link: '/admin/attendance/log', perm: 'view attendance summary' },
      { label: 'Attendance', link: '/attendance', perm: 'view attendance' },
    ],
  },
  {
    section: 'Time & Leave',
    id: 'leave',
    label: 'Leave',
    icon: ICONS.leave,
    perms: ['leave', 'leave policy', 'leave balance', 'leave approval hierarchy'],
    submenu: [
      { label: 'Leave requests', link: '/leave/requests', perm: 'view leave' },
    ],
  },
  {
    section: 'Finance',
    id: 'payroll',
    label: 'Payroll',
    icon: ICONS.payroll,
    perms: ['payroll'],
    submenu: [
      { label: 'Payroll processing', link: '/admin/payroll', perm: 'view payroll' },
    ],
  },
  {
    section: 'Access',
    id: 'user',
    label: 'User',
    icon: ICONS.user,
    perms: ['user', 'role', 'permission'],
    submenu: [
      { label: 'Users', link: '/admin/dashboard/users', perm: 'view user' },
      { label: 'Roles & Permissions', link: '/admin/users/roles', perm: 'view role' },
    ],
  },
  {
    section: 'Work',
    id: 'project',
    label: 'Project',
    icon: ICONS.project,
    perms: ['project', 'project task', 'project contributor'],
    submenu: [
      { label: 'Projects', link: '/admin/project/list', perm: 'view project' },
      { label: 'My Projects', link: '/my-projects', perm: 'view project' },
    ],
  },
  {
    section: 'Communication',
    id: 'announce',
    label: 'Announcements',
    icon: ICONS.announce,
    perms: ['announcement'],
    submenu: [
      { label: 'All announcements', link: '/admin/announcements/all', perm: 'view announcement' },
      { label: 'Notice board', link: '/announcements/notice', perm: 'view notice' },
    ],
  },
  {
    section: 'System',
    id: 'setup',
    label: 'Setup',
    icon: ICONS.setup,
    perms: ['settings', 'system'],
    submenu: [
      { label: 'General settings', link: '/admin/setup/general', perm: 'view settings' },
      { label: 'Email templates', link: '/admin/setup/email', perm: 'edit settings' },
      { label: 'Notification settings', link: '/admin/setup/notifications', perm: 'edit settings' },
      { label: 'Integrations', link: '/admin/setup/integrations', perm: 'edit settings' },
      { label: 'Audit logs', link: '/admin/setup/audit', perm: 'view system' },
    ],
  },
]

// ── State ──────────────────────────────────────────────────────────────────────
const openMenus = reactive(new Set())
const flyoutMenu = ref(null)
const flyoutStyle = ref({})
const navItemRefs = reactive({})
let closeTimer = null

// ── Computed ───────────────────────────────────────────────────────────────────
const userInitials = computed(() => {
  const name = authStore.user?.name ?? ''
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

const activeMenuId = computed(() => {
  for (const menu of menuItems) {
    if (menu.submenu?.some(s => route.path === s.link)) return menu.id
    if (route.path === menu.link) return menu.id
  }
  return ''
})

const flyoutId = computed(() => flyoutMenu.value?.id ?? null)

const visibleSections = computed(() => {
  const userPerms = authStore.permissions
  const map = new Map()

  menuItems.forEach(menu => {
    if (menu.perms !== null) {
      const menuAccessible = menu.perms.some(keyword =>
        userPerms.some(p => p.includes(keyword))
      )
      if (!menuAccessible) return
    }

    const filteredSubs = menu.submenu.filter(sub => {
      if (sub.perm === null) return true
      return userPerms.includes(sub.perm)
    })

    if (filteredSubs.length === 0) return

    if (!map.has(menu.section)) map.set(menu.section, [])
    map.get(menu.section).push({ ...menu, filteredSubs })
  })

  return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
})

// ── Watchers ───────────────────────────────────────────────────────────────────
watch(() => props.collapsed, val => {
  if (val) { openMenus.clear(); closeFlyoutNow() }
})

watch(route, () => { syncOpenMenuToRoute() }, { immediate: true })

function syncOpenMenuToRoute() {
  for (const menu of menuItems) {
    if (menu.submenu?.some(s => route.path === s.link)) {
      openMenus.add(menu.id)
    }
  }
}

// ── Navigation ─────────────────────────────────────────────────────────────────
function navigateTo(link) {
  if (!link) return
  if (route.path !== link) router.push(link)
}

// ── Flyout ─────────────────────────────────────────────────────────────────────
function updateFlyoutPosition(menuId) {
  const el = navItemRefs[menuId]
  if (!el) return
  const rect = el.getBoundingClientRect()
  const panelH = (flyoutMenu.value?.filteredSubs?.length ?? 0) * 37 + 52
  const maxTop = window.innerHeight - panelH - 8
  flyoutStyle.value = {
    position: 'fixed',
    top: Math.min(rect.top, maxTop) + 'px',
    left: rect.right + 'px',
    zIndex: 99999,
    minWidth: '210px',
  }
}

function handleItemEnter(menu) {
  cancelClose()
  flyoutMenu.value = menu
  nextTick(() => updateFlyoutPosition(menu.id))
}

function handleItemLeave() { scheduleClose() }
function handleFlyoutEnter() { cancelClose() }
function handleFlyoutLeave() { scheduleClose() }

function scheduleClose() { closeTimer = setTimeout(closeFlyoutNow, 80) }
function cancelClose() { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null } }
function closeFlyoutNow() { flyoutMenu.value = null }

// ── Menu click handlers ────────────────────────────────────────────────────────
function handleNavClick(menu) {
  if (props.collapsed) {
    if (!menu.filteredSubs.length && menu.link) navigateTo(menu.link)
    return
  }
  if (!menu.filteredSubs.length) {
    navigateTo(menu.link)
    return
  }
  openMenus.has(menu.id) ? openMenus.delete(menu.id) : openMenus.add(menu.id)
}

function handleFlyoutClick(menuId, sub) {
  navigateTo(sub.link)
  closeFlyoutNow()
}
</script>

<style scoped>
/* ── Design tokens ── */
.sidebar {
  --primary: #4338CA;
  --primary-hover: #3730A3;
  --primary-soft: #EEF2FF;

  --bg: #FFFFFF;
  --bg-hover: #F9FAFB;
  --bg-active: #F3F4F6;
  --bg-secondary: #F9FAFB;

  --text-primary: #111827;
  --text-secondary: #4B5563;
  --text-muted: #9CA3AF;

  --border: #EAECEF;
  --border-strong: #D1D5DB;
  --border-focus: #A5B4FC;

  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 6px 16px -4px rgba(15, 23, 42, 0.10);
  --shadow-lg: 0 20px 40px -12px rgba(15, 23, 42, 0.16);

  --radius-sm: 7px;
  --radius-md: 10px;
  --radius-lg: 14px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif;
}

/* ── Shell ── */
.sidebar {
  width: 100%;
  height: 100%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  box-sizing: border-box;
}

/* ── Logo ── */
.logo-wrap {
  height: 64px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  z-index: 1;
  overflow: hidden;
  background: var(--bg);
}

.is-collapsed .logo-wrap {
  padding: 0;
  justify-content: center;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  color: #FFFFFF;
  background: var(--primary);
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.logo-mark:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.logo-mark svg {
  width: 18px;
  height: 18px;
}

.logo-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}

.logo-name {
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  line-height: 1;
}

.logo-sub {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  line-height: 1;
}

/* ── Role badge ── */
.role-badge {
  margin: 14px 14px 6px;
  padding: 10px 12px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  z-index: 1;
  overflow: hidden;
}

.role-badge-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  white-space: nowrap;
}

.role-badge-desc {
  font-size: 11.5px;
  color: var(--text-muted);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Nav ── */
.nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0 20px;
  z-index: 1;
}

.nav::-webkit-scrollbar {
  width: 4px;
}

.nav::-webkit-scrollbar-track {
  background: transparent;
}

.nav::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 2px;
}

.nav-section-label {
  font-size: 10.5px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 16px 22px 7px;
  margin: 0;
  white-space: nowrap;
  font-weight: 700;
}

.nav-section-divider {
  height: 1px;
  background: var(--border);
  margin: 10px 16px;
}

/* ── Nav item ── */
.nav-item {
  position: relative;
  padding: 0 10px;
}

.is-collapsed .nav-item {
  padding: 0;
}

/* ── Nav link ── */
.nav-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  margin: 1px 0;
  cursor: pointer;
  transition: background-color 0.15s ease;
  position: relative;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.nav-link:hover {
  background: var(--bg-hover);
}

.nav-link.open,
.nav-link--active,
.nav-link--flyout {
  background: var(--bg-active);
}

/* Collapsed: center icon, no rounded pill */
.is-collapsed .nav-link {
  padding: 10px 0;
  margin: 1px 6px;
  justify-content: center;
}

/* Icon */
.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: color 0.15s ease;
}

.nav-link:hover .nav-icon,
.nav-link.open .nav-icon,
.nav-link--active .nav-icon,
.nav-link--flyout .nav-icon {
  color: var(--primary);
}

/* Label */
.nav-text {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.001em;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Chevron */
.nav-chevron {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s ease;
}

.nav-chevron.rotated {
  transform: rotate(90deg);
  color: var(--primary);
}

/* ── Inline submenu ── */
.submenu {
  overflow: hidden;
  padding: 2px 0 4px;
}

.sub-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7.5px 12px 7.5px 41px;
  margin: 1px 10px 1px 0;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.002em;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
  position: relative;
  white-space: nowrap;
  border-radius: var(--radius-sm);
}

.sub-item::before {
  content: '';
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--border-strong);
  transition: background-color 0.15s ease;
}

.sub-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.sub-item:hover::before {
  background: var(--primary);
}

.sub-item--active {
  color: var(--primary);
  font-weight: 600;
  background: var(--primary-soft);
}

.sub-item--active::before {
  background: var(--primary);
}

/* ── Footer ── */
.sidebar-footer {
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  z-index: 1;
  background: var(--bg);
}

.is-collapsed .sidebar-footer {
  padding: 12px 0;
  display: flex;
  justify-content: center;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 11px;
  overflow: hidden;
  padding: 6px;
  border-radius: var(--radius-md);
  transition: background-color 0.15s ease;
}

.user-row:hover {
  background: var(--bg-hover);
}

.is-collapsed .user-row {
  justify-content: center;
  padding: 0;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0.02em;
  transition: transform 0.15s ease;
}

.avatar:hover {
  transform: translateY(-1px);
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.user-role-tag {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
  margin: 0;
  white-space: nowrap;
  font-weight: 500;
}

.logout-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s ease;
  flex-shrink: 0;
  padding: 0;
}

.logout-btn:hover {
  color: #DC2626;
  background: #FEF2F2;
}

.logout-btn svg {
  width: 17px;
  height: 17px;
}

/* ── Transitions ── */
.submenu-enter-active {
  transition: max-height 0.26s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  max-height: 600px;
}

.submenu-leave-active {
  transition: max-height 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.16s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

.fade-enter-active {
  transition: opacity 0.18s ease;
}

.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.flyout-anim-enter-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.flyout-anim-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.flyout-anim-enter-from {
  opacity: 0;
  transform: translateX(-6px);
}

.flyout-anim-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .nav-text {
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .logo-wrap {
    height: 58px;
  }
}
</style>

<!-- Global styles for the teleported flyout panel -->
<style>
.flyout-panel {
  background: #FFFFFF;
  border: 1px solid #EAECEF;
  border-radius: 12px;
  padding: 8px 0;
  box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.16), 0 4px 10px -4px rgba(15, 23, 42, 0.06);
  pointer-events: auto;
}

.flyout-heading {
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #9CA3AF;
  padding: 4px 16px 8px;
  white-space: nowrap;
}

.flyout-divider {
  height: 1px;
  background: #EAECEF;
  margin: 2px 0 4px;
}

.flyout-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  font-size: 13.5px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 0.005em;
  color: #4B5563;
  cursor: pointer;
  transition: color 0.12s ease, background-color 0.12s ease;
  white-space: nowrap;
}

.flyout-item:hover {
  color: #111827;
  background: #F9FAFB;
}

.flyout-item--active {
  color: #4338CA;
  font-weight: 600;
  background: #EEF2FF;
}

.flyout-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #D1D5DB;
  flex-shrink: 0;
  transition: background-color 0.12s ease;
}

.flyout-item:hover .flyout-dot {
  background: #4338CA;
}

.flyout-item--active .flyout-dot {
  background: #4338CA;
}
</style>