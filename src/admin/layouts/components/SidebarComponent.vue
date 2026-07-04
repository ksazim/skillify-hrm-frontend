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
/* ── Light Theme Tokens ── */
.sidebar {
  --primary: #4F46E5;
  --primary-light: #EEF2FF;
  --primary-hover: #4338CA;

  --bg: #FFFFFF;
  --bg-hover: #F8FAFC;
  --bg-active: #F1F5F9;
  --bg-secondary: #F8FAFC;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-light: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --border-focus: #818CF8;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
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
  height: 68px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  z-index: 1;
  overflow: hidden;
  background: var(--bg);
}

.logo-mark {
  width: 38px;
  height: 38px;
  border: 1.5px solid var(--primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  color: var(--primary);
  background: var(--primary-light);
  transition: all 0.2s ease;
}

.logo-mark:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.logo-mark svg {
  width: 18px;
  height: 18px;
}

.logo-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 1px;
  white-space: nowrap;
}

.logo-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1;
}

.logo-sub {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  line-height: 1;
}

/* ── Role badge ── */
.role-badge {
  margin: 12px 16px 8px;
  padding: 10px 14px;
  border-left: 3px solid var(--primary);
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  z-index: 1;
  overflow: hidden;
}

.role-badge-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
  white-space: nowrap;
}

.role-badge-desc {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Nav ── */
.nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0 20px;
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
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 14px 22px 6px;
  margin: 0;
  white-space: nowrap;
  font-weight: 600;
}

.nav-section-divider {
  height: 1px;
  background: var(--border);
  margin: 8px 14px;
}

/* ── Nav item ── */
.nav-item {
  position: relative;
}

/* ── Nav link ── */
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px 8px 18px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  border-radius: 0;
}

.nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--primary);
  transition: height 0.2s ease;
  border-radius: 0 2px 2px 0;
}

.nav-link:hover {
  background: var(--bg-hover);
}

.nav-link:hover::before {
  height: 55%;
}

.nav-link.open,
.nav-link--active,
.nav-link--flyout {
  background: var(--bg-active);
}

.nav-link.open::before,
.nav-link--active::before,
.nav-link--flyout::before {
  height: 65%;
}

/* Collapsed: center icon */
.is-collapsed .nav-link {
  padding: 10px 0;
  justify-content: center;
}

/* Icon */
.nav-icon {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--bg-hover);
  transition: all 0.15s ease;
  color: var(--text-secondary);
}

.nav-link:hover .nav-icon,
.nav-link.open .nav-icon,
.nav-link--active .nav-icon,
.nav-link--flyout .nav-icon {
  border-color: var(--primary-light);
  background: var(--primary-light);
  color: var(--primary);
}

/* Label */
.nav-text {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--text-secondary);
  flex: 1;
  transition: color 0.15s ease;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-link:hover .nav-text,
.nav-link.open .nav-text,
.nav-link--active .nav-text {
  color: var(--text-primary);
}

/* Chevron */
.nav-chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.25s ease, color 0.15s ease;
}

.nav-chevron.rotated {
  transform: rotate(90deg);
  color: var(--primary);
}

/* ── Inline submenu ── */
.submenu {
  overflow: hidden;
}

.sub-item {
  display: flex;
  align-items: center;
  padding: 7px 18px 7px 60px;
  font-size: 12.5px;
  letter-spacing: 0.01em;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  white-space: nowrap;
}

.sub-item::before {
  content: '';
  position: absolute;
  left: 46px;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 2px;
  background: var(--border-strong);
  transition: all 0.15s ease;
}

.sub-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.sub-item:hover::before {
  width: 10px;
  background: var(--primary);
}

.sub-item--active {
  color: var(--primary);
  font-weight: 500;
}

.sub-item--active::before {
  width: 10px;
  background: var(--primary);
}

/* ── Footer ── */
.sidebar-footer {
  padding: 14px 16px;
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
  gap: 12px;
  overflow: hidden;
}

.is-collapsed .user-row {
  justify-content: center;
}

.avatar {
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
  transition: all 0.15s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
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
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  margin: 0;
  white-space: nowrap;
  font-weight: 500;
}

.logout-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s ease;
  flex-shrink: 0;
  padding: 0;
}

.logout-btn:hover {
  color: #EF4444;
  border-color: #FECACA;
  background: #FEF2F2;
}

.logout-btn svg {
  width: 18px;
  height: 18px;
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
@media (max-width: 768px) {
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>

<!-- Global styles for the teleported flyout panel -->
<style>
.flyout-panel {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-left: 3px solid #4F46E5;
  border-radius: 8px;
  padding: 6px 0 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
  pointer-events: auto;
  margin-left: -1px;
}

.flyout-heading {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #0F172A;
  padding: 6px 16px 5px;
  white-space: nowrap;
}

.flyout-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 4px 12px;
}

.flyout-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 0.01em;
  color: #475569;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.flyout-item:hover {
  color: #0F172A;
  background: #F8FAFC;
}

.flyout-item--active {
  color: #4F46E5;
  font-weight: 500;
}

.flyout-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #CBD5E1;
  flex-shrink: 0;
  transition: all 0.12s ease;
}

.flyout-item:hover .flyout-dot {
  background: #4F46E5;
}

.flyout-item--active .flyout-dot {
  background: #4F46E5;
}
</style>