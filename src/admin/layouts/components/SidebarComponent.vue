<template>
  <aside class="sidebar" :class="{ 'is-collapsed': collapsed }">
    <div class="glow glow--top" />
    <div class="glow glow--bottom" />

    <!-- Logo -->
    <div class="logo-wrap">
      <div class="logo-mark">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2L3 7v11h5v-5h4v5h5V7z" /></svg>
      </div>
      <Transition name="fade">
        <div v-if="!collapsed" class="logo-text-wrap">
          <span class="logo-name">Neuro</span>
          <span class="logo-sub">Human Resources</span>
        </div>
      </Transition>
    </div>

    <!-- Role Switcher — expanded + demo only (remove in prod, use :role prop) -->
    <Transition name="fade">
      <div v-if="!collapsed && !role" class="role-panel">
        <p class="panel-label">Viewing as role</p>
        <div class="role-tabs">
          <button
            v-for="r in roleList" :key="r.key"
            class="role-tab" :class="{ active: currentRole === r.key }"
            @click="switchRole(r.key)"
          >{{ r.short }}</button>
        </div>
      </div>
    </Transition>

    <!-- Role badge -->
    <Transition name="fade">
      <div v-if="!collapsed" class="role-badge">
        <span class="role-badge-name">{{ activeRoleConfig.label }}</span>
        <span class="role-badge-desc">{{ activeRoleConfig.desc }}</span>
      </div>
    </Transition>

    <!-- Navigation -->
    <nav class="nav">
      <template v-for="(section, sIdx) in visibleSections" :key="sIdx">

        <Transition name="fade">
          <p v-if="!collapsed" class="nav-section-label">{{ section.name }}</p>
        </Transition>
        <div v-if="collapsed" class="nav-section-divider" />

        <div
          v-for="menu in section.items"
          :key="menu.id"
          class="nav-item"
          :ref="el => { if (el) navItemRefs[menu.id] = el }"
          @mouseenter="collapsed ? handleItemEnter(menu) : null"
          @mouseleave="collapsed ? handleItemLeave() : null"
        >
          <!-- Icon / label row -->
          <div
            class="nav-link"
            :class="{
              open:               openMenus.has(menu.id) && !collapsed,
              'nav-link--active': activeMenuId === menu.id,
              'nav-link--flyout': collapsed && flyoutId === menu.id,
            }"
            @click="handleNavClick(menu)"
          >
            <div class="nav-icon" v-html="menu.icon" />
            <Transition name="fade">
              <span v-if="!collapsed" class="nav-text">{{ menu.label }}</span>
            </Transition>
            <Transition name="fade">
              <svg
                v-if="!collapsed && menu.filteredSubs.length"
                class="nav-chevron" :class="{ rotated: openMenus.has(menu.id) }"
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </Transition>
          </div>

          <!-- Inline submenu (expanded sidebar) -->
          <Transition name="submenu">
            <div
              v-if="!collapsed && openMenus.has(menu.id) && menu.filteredSubs.length"
              class="submenu"
            >
              <div
                v-for="sub in menu.filteredSubs" :key="sub.label"
                class="sub-item"
                :class="{ 'sub-item--active': route.path === sub.link }"
                @click="navigateTo(sub.link)"
              >{{ sub.label }}</div>
            </div>
          </Transition>
        </div>

      </template>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="user-row">
        <div class="avatar" :title="collapsed ? activeRoleConfig.userName : ''">
          {{ activeRoleConfig.initials }}
        </div>
        <Transition name="fade">
          <div v-if="!collapsed" class="user-info">
            <p class="user-name">{{ activeRoleConfig.userName }}</p>
            <p class="user-role-tag">{{ activeRoleConfig.label }}</p>
          </div>
        </Transition>
        <Transition name="fade">
          <button v-if="!collapsed" class="logout-btn" title="Sign out" @click="$emit('logout')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </Transition>
      </div>
    </div>
  </aside>

  <!-- ── Flyout (teleported to body — escapes all overflow/clip) ── -->
  <Teleport to="body">
    <Transition name="flyout-anim">
      <div
        v-if="collapsed && flyoutMenu"
        class="flyout-panel"
        :style="flyoutStyle"
        @mouseenter="handleFlyoutEnter"
        @mouseleave="handleFlyoutLeave"
      >
        <div class="flyout-heading">{{ flyoutMenu.label }}</div>
        <template v-if="flyoutMenu.filteredSubs.length">
          <div class="flyout-divider" />
          <div
            v-for="sub in flyoutMenu.filteredSubs"
            :key="sub.label"
            class="flyout-item"
            :class="{ 'flyout-item--active': route.path === sub.link }"
            @click="handleFlyoutClick(flyoutMenu.id, sub)"
          >
            <span class="flyout-dot" />
            {{ sub.label }}
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick, defineProps } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// ── Router ─────────────────────────────────────────────────────────────────────
const router = useRouter()
const route  = useRoute()

// ── Props / Emits ──────────────────────────────────────────────────────────────
const props = defineProps({
  collapsed: { type: Boolean, default: false },
  // In production pass the role from your auth store: 'superadmin' | 'admin' | 'assistant' | 'employee'
  role: { type: String, default: null },
})
// const emit = defineEmits(['logout'])

// ── Icons ──────────────────────────────────────────────────────────────────────
const ICONS = {
  dashboard:   `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11l8-9 8 9v7a1 1 0 01-1 1h-4v-4H7v4H3a1 1 0 01-1-1v-7z"/></svg>`,
  company:     `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12H4V4zm2 1h2v2H6V5zm0 4h2v2H6V9zm0 4h2v2H6v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clip-rule="evenodd"/></svg>`,
  employee:    `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/></svg>`,
  attendance:  `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z" clip-rule="evenodd"/></svg>`,
  leave:       `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>`,
  payroll:     `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/></svg>`,
  user:        `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>`,
  project:     `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h9a1 1 0 100-2H3zm0 4a1 1 0 100 2h5a1 1 0 100-2H3zm11.293-.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L15.586 16H13a1 1 0 110-2h2.586l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`,
  recruitment: `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/></svg>`,
  training:    `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/></svg>`,
  performance: `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/></svg>`,
  reports:     `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>`,
  announce:    `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"/></svg>`,
  setup:       `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>`,
}

// ── Menu definitions ───────────────────────────────────────────────────────────
const menuItems = [
  { section:'Core',          id:'dashboard',   label:'Dashboard',           icon:ICONS.dashboard,   link:'/admin/dashboard',
    submenu:[{label:'Overview',link:'/admin/dashboard'}] },
  { 
    section:'Organization',  
    id:'company',     
    label:'Company',             
    icon:ICONS.company,
    submenu:[
      {label:'Companies',link:'/admin/company/list'},
      // {label:'Branches',link:'/admin/company/branches'},
      // {label:'Departments',link:'/admin/company/departments'},
      // {label:'Designations',link:'/admin/company/designations'},
      // {label:'Reporting hierarchy',link:'/admin/company/hierarchy'}
    ] },
  { section:'Organization',  
  id:'employee',    
  label:'Employee',            
  icon:ICONS.employee,
    submenu:[
      {label:'Employee list',link:'/admin/employee/list'},
      // {label:'Add employee',link:'/admin/employee/add'},
      // {label:'Employee profile',link:'/admin/employee/profile'},
      // {label:'Documents',link:'/admin/employee/documents'},
      // {label:'Transfer & promotion',link:'/admin/employee/transfer'},
      // {label:'Termination',link:'/admin/employee/termination'}
    ] },
  { section:'Time & Leave',  id:'attendance',  label:'Attendance',          icon:ICONS.attendance,
    submenu:[
    {label:'Daily attendance',link:'/admin/attendance/daily'},
    {label:'Attendance log',link:'/admin/attendance/log'},
    {label:'Attendance',link:'/attendance'},
    // {label:'Shift management',link:'/admin/attendance/shifts'},
    // {label:'Overtime calculation',link:'/admin/attendance/overtime'},
    // {label:'Late & early departure',link:'/admin/attendance/late'},
    // {label:'Attendance policies',link:'/admin/attendance/policies'}
  ] },
  { section:'Time & Leave',  
  id:'leave',       
  label:'Leave',               
  icon:ICONS.leave,
    submenu:[
      // {label:'Leave types',link:'/admin/leave/types'},
      // {label:'Leave balance',link:'/admin/leave/balance'},
      {label:'Leave requests',link:'/leave/requests'},
      // {label:'Leave approval',link:'/admin/leave/approval'},
      // {label:'Holidays',link:'/admin/leave/holidays'},
      // {label:'Leave policies',link:'/admin/leave/policies'}
    ] },
  { section:'Finance',       
  id:'payroll',     
  label:'Payroll',             
  icon:ICONS.payroll,
    submenu:[
      {label:'Salary structure',link:'/admin/payroll/salary-structure'},
      {label:'Allowances & deductions',link:'/admin/payroll/allowances'},
      {label:'Overtime pay',link:'/admin/payroll/overtime'},
      {label:'Bonus & incentives',link:'/admin/payroll/bonus'},
      {label:'Tax & statutory',link:'/admin/payroll/tax'},
      {label:'Payroll processing',link:'/admin/payroll/processing'},
      {label:'Payslips',link:'/admin/payroll/payslips'}
    ] },
  { section:'Access',        
  id:'user',        
  label:'User',                
  icon:ICONS.user,
    submenu:[
      {label:'Users',link:'/admin/dashboard/users'},
      {label:'Roles & Permissions',link:'/admin/users/roles'}
    ] },
  { section:'Work',          id:'project',     label:'Project',             icon:ICONS.project,
    submenu:[{label:'Projects',link:'/admin/project/list'},{label:'Tasks',link:'/admin/project/tasks'},{label:'Team assignment',link:'/admin/project/teams'},{label:'Milestones',link:'/admin/project/milestones'},{label:'Time tracking',link:'/admin/project/time'}] },
  // { section:'Talent',        id:'recruitment', label:'Recruitment',         icon:ICONS.recruitment,
  //   submenu:[{label:'Job postings',link:'/admin/recruitment/jobs'},{label:'Applications',link:'/admin/recruitment/applications'},{label:'Shortlist',link:'/admin/recruitment/shortlist'},{label:'Interviews',link:'/admin/recruitment/interviews'},{label:'Offers',link:'/admin/recruitment/offers'},{label:'Onboarding',link:'/admin/recruitment/onboarding'}] },
  // { section:'Talent',        id:'training',    label:'Training',            icon:ICONS.training,
  //   submenu:[{label:'Training programs',link:'/admin/training/programs'},{label:'Enrollments',link:'/admin/training/enrollments'},{label:'Trainers',link:'/admin/training/trainers'},{label:'Skills & competencies',link:'/admin/training/skills'},{label:'Certifications',link:'/admin/training/certificates'}] },
  // { section:'Talent',        id:'performance', label:'Performance',         icon:ICONS.performance,
  //   submenu:[{label:'Appraisal cycles',link:'/admin/performance/cycles'},{label:'KPIs & goals',link:'/admin/performance/kpis'},{label:'360° feedback',link:'/admin/performance/feedback'},{label:'Performance reviews',link:'/admin/performance/reviews'},{label:'Improvement plans',link:'/admin/performance/pip'}] },
  // { section:'Insights',      id:'reports',     label:'Reports & Analytics', icon:ICONS.reports,
  //   submenu:[{label:'Employee report',link:'/admin/reports/employee'},{label:'Attendance report',link:'/admin/reports/attendance'},{label:'Leave report',link:'/admin/reports/leave'},{label:'Payroll report',link:'/admin/reports/payroll'},{label:'Recruitment report',link:'/admin/reports/recruitment'},{label:'Performance report',link:'/admin/reports/performance'}] },
  { section:'Communication', id:'announce',    label:'Announcements',       icon:ICONS.announce,
    submenu:[{label:'All announcements',link:'/admin/announcements/all'},{label:'Create announcement',link:'/admin/announcements/create'},{label:'Notice board',link:'/admin/announcements/notice'}] },
  { section:'System',        id:'setup',       label:'Setup',               icon:ICONS.setup,
    submenu:[{label:'General settings',link:'/admin/setup/general'},{label:'Email templates',link:'/admin/setup/email'},{label:'Notification settings',link:'/admin/setup/notifications'},{label:'Integrations',link:'/admin/setup/integrations'},{label:'Audit logs',link:'/admin/setup/audit'}] },
]

// ── Role permissions ───────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  superadmin: {
    label:'Super Administrator', desc:'Full system access · All modules', initials:'SA', userName:'Alexandra Mercer',
    menus:{ dashboard:{sub:null},company:{sub:null},employee:{sub:null},attendance:{sub:null},leave:{sub:null},payroll:{sub:null},user:{sub:null},project:{sub:null},recruitment:{sub:null},training:{sub:null},performance:{sub:null},reports:{sub:null},announce:{sub:null},setup:{sub:null} },
  },
  admin: {
    label:'Administrator', desc:'Full operational access · All modules', initials:'AD', userName:'Daniel Harrington',
    menus:{ dashboard:{sub:null},company:{sub:null},employee:{sub:null},attendance:{sub:null},leave:{sub:null},payroll:{sub:null},user:{sub:null},project:{sub:null},recruitment:{sub:null},training:{sub:null},performance:{sub:null},reports:{sub:null},announce:{sub:null},setup:{sub:null} },
  },
  assistant: {
    label:'Assistant Administrator', desc:'Limited access · HR operations', initials:'AA', userName:'Priya Anand',
    menus:{ dashboard:{sub:['Overview']},employee:{sub:null},attendance:{sub:null},leave:{sub:null},payroll:{sub:['Salary structure','Payroll processing','Payslips']},announce:{sub:['All announcements','Notice board']} },
  },
  employee: {
    label:'Employee', desc:'Self-service access · Personal modules', initials:'EM', userName:'James Okonkwo',
    menus:{ dashboard:{sub:['Overview']},attendance:{sub:['Daily attendance']},leave:{sub:['Leave balance','Leave requests']},project:{sub:['Tasks','Time tracking']},announce:{sub:['All announcements','Notice board']} },
  },
}

// ── State ──────────────────────────────────────────────────────────────────────
const currentRole = ref(props.role || 'superadmin')
const openMenus   = reactive(new Set())

// Active state driven by current route — auto-highlights on page load / back-nav
const activeMenuId = computed(() => {
  for (const menu of menuItems) {
    if (menu.submenu?.some(s => route.path === s.link)) return menu.id
    if (route.path === menu.link) return menu.id
  }
  return ''
})

// Flyout state
const flyoutMenu  = ref(null)
const flyoutId    = computed(() => flyoutMenu.value?.id ?? null)
const flyoutStyle = ref({})
const navItemRefs = reactive({})
let   closeTimer  = null

const roleList = [
  { key:'superadmin', short:'Super Admin' },
  { key:'admin',      short:'Admin' },
  { key:'assistant',  short:'Asst. Admin' },
  { key:'employee',   short:'Employee' },
]

watch(() => props.role,      val => { if (val) { currentRole.value = val; openMenus.clear() } })
watch(() => props.collapsed, val => { if (val) { openMenus.clear(); closeFlyoutNow() } })

// Auto-open the parent menu for the current route on load
watch(route, () => { syncOpenMenuToRoute() }, { immediate: true })

function syncOpenMenuToRoute() {
  for (const menu of menuItems) {
    if (menu.submenu?.some(s => route.path === s.link)) {
      openMenus.add(menu.id)
    }
  }
}

// ── Computed ───────────────────────────────────────────────────────────────────
const activeRoleConfig = computed(() => ROLE_PERMISSIONS[currentRole.value])

const visibleSections = computed(() => {
  const perms = activeRoleConfig.value.menus
  const map   = new Map()
  menuItems.forEach(menu => {
    if (!perms[menu.id]) return
    const { sub } = perms[menu.id]
    const filteredSubs = sub === null ? menu.submenu : menu.submenu.filter(s => sub.includes(s.label))
    if (!map.has(menu.section)) map.set(menu.section, [])
    map.get(menu.section).push({ ...menu, filteredSubs })
  })
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
})

// ── Core navigation function — used everywhere ─────────────────────────────────
function navigateTo(link) {
  if (!link) return
  if (route.path !== link) {
    router.push(link)
  }
}

// ── Flyout ─────────────────────────────────────────────────────────────────────
function updateFlyoutPosition(menuId) {
  const el = navItemRefs[menuId]
  if (!el) return
  const rect   = el.getBoundingClientRect()
  const panelH = (flyoutMenu.value?.filteredSubs?.length ?? 0) * 37 + 52
  const maxTop = window.innerHeight - panelH - 8
  flyoutStyle.value = {
    position: 'fixed',
    top:      Math.min(rect.top, maxTop) + 'px',
    left:     rect.right + 'px',
    zIndex:   99999,
    minWidth: '210px',
  }
}

function handleItemEnter(menu) {
  cancelClose()
  flyoutMenu.value = menu
  nextTick(() => updateFlyoutPosition(menu.id))
}

function handleItemLeave()  { scheduleClose() }
function handleFlyoutEnter(){ cancelClose() }
function handleFlyoutLeave(){ scheduleClose() }

function scheduleClose() { closeTimer = setTimeout(closeFlyoutNow, 80) }
function cancelClose()   { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null } }
function closeFlyoutNow(){ flyoutMenu.value = null }

// ── Menu click handlers ────────────────────────────────────────────────────────
function switchRole(role) {
  currentRole.value = role
  openMenus.clear()
}

function handleNavClick(menu) {
  // Collapsed mode: only direct links navigate (submenus shown via flyout hover)
  if (props.collapsed) {
    if (!menu.filteredSubs.length && menu.link) navigateTo(menu.link)
    return
  }

  // Direct link (no submenus) — navigate immediately
  if (!menu.filteredSubs.length) {
    navigateTo(menu.link)
    return
  }

  // Has submenus — toggle open/close
  openMenus.has(menu.id) ? openMenus.delete(menu.id) : openMenus.add(menu.id)
}

function handleFlyoutClick(menuId, sub) {
  navigateTo(sub.link)
  closeFlyoutNow()
}
</script>

<style scoped>
/* ── Tokens ── */
.sidebar {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.10);
  --onyx-2:         #131316;
  --onyx-5:         #2C2C33;
  --smoke:          rgba(255,255,255,0.05);
  --smoke-hover:    rgba(255,255,255,0.08);
  --text-primary:   #F0EAE0;
  --text-secondary: rgba(240,234,224,0.55);
  --text-muted:     rgba(240,234,224,0.28);
  --border:         rgba(201,169,110,0.13);
  --border-strong:  rgba(201,169,110,0.30);
  --radius-md:      6px;
}

/* ── Shell ── */
.sidebar {
  width: 100%; height: 100%;
  background: var(--onyx-2);
  display: flex; flex-direction: column;
  position: relative;
  overflow-x: hidden; overflow-y: auto;
  font-family: 'Jost', 'Inter', sans-serif;
}

/* Glows */
.glow { position:absolute; pointer-events:none; border-radius:50%; z-index:0; }
.glow--top    { top:-100px; left:-60px; width:240px; height:240px; background:radial-gradient(circle,rgba(201,169,110,0.08) 0%,transparent 70%); }
.glow--bottom { bottom:40px; right:-80px; width:200px; height:200px; background:radial-gradient(circle,rgba(201,169,110,0.05) 0%,transparent 70%); }

/* ── Logo ── */
.logo-wrap { height:64px; padding:0 18px; display:flex; align-items:center; gap:12px; border-bottom:1px solid var(--border); flex-shrink:0; z-index:1; overflow:hidden; }
.logo-mark { width:34px; height:34px; border:1px solid var(--gold-dim); display:flex; align-items:center; justify-content:center; position:relative; flex-shrink:0; color:var(--gold); }
.logo-mark::before { content:''; position:absolute; inset:3px; border:1px solid var(--gold); opacity:.35; }
.logo-mark svg { width:16px; height:16px; }
.logo-text-wrap { display:flex; flex-direction:column; gap:1px; white-space:nowrap; }
.logo-name { font-family:'Cormorant Garamond','Georgia',serif; font-size:20px; font-weight:500; letter-spacing:.08em; color:var(--text-primary); line-height:1; }
.logo-sub  { font-size:9px; font-weight:300; letter-spacing:.22em; text-transform:uppercase; color:var(--gold); line-height:1; }

/* ── Role panel ── */
.role-panel { padding:12px 16px 11px; border-bottom:1px solid var(--border); flex-shrink:0; z-index:1; overflow:hidden; }
.panel-label { font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-muted); margin:0 0 8px 2px; }
.role-tabs { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
.role-tab { padding:6px 4px; font-size:10.5px; font-weight:400; letter-spacing:.04em; text-align:center; color:var(--text-secondary); background:transparent; border:1px solid transparent; cursor:pointer; transition:all .18s; white-space:nowrap; font-family:inherit; }
.role-tab:hover  { color:var(--gold-light); border-color:var(--border); background:var(--smoke); }
.role-tab.active { color:var(--gold); border-color:var(--border-strong); background:var(--gold-glow); font-weight:500; }

/* ── Role badge ── */
.role-badge { margin:10px 16px 4px; padding:7px 12px; border-left:2px solid var(--gold); background:var(--gold-glow); display:flex; flex-direction:column; gap:2px; flex-shrink:0; z-index:1; overflow:hidden; }
.role-badge-name { font-family:'Cormorant Garamond','Georgia',serif; font-size:14px; font-weight:500; letter-spacing:.06em; color:var(--gold-light); line-height:1.2; white-space:nowrap; }
.role-badge-desc { font-size:10px; color:var(--text-muted); letter-spacing:.03em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* ── Nav ── */
.nav { flex:1; overflow-y:auto; overflow-x:hidden; padding:8px 0 20px; z-index:1; }
.nav::-webkit-scrollbar       { width:3px; }
.nav::-webkit-scrollbar-track { background:transparent; }
.nav::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:2px; }
.nav-section-label   { font-size:8.5px; letter-spacing:.22em; text-transform:uppercase; color:var(--text-muted); padding:14px 22px 5px; margin:0; white-space:nowrap; }
.nav-section-divider { height:1px; background:var(--border); margin:8px 10px; }

/* ── Nav item ── */
.nav-item { position:relative; }

/* ── Nav link ── */
.nav-link { display:flex; align-items:center; gap:11px; padding:9px 14px 9px 18px; cursor:pointer; transition:background .16s; position:relative; user-select:none; white-space:nowrap; overflow:hidden; }
.nav-link::before { content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:2px; height:0; background:var(--gold); transition:height .2s; border-radius:0 2px 2px 0; }
.nav-link:hover               { background:var(--smoke); }
.nav-link:hover::before       { height:55%; }
.nav-link.open,
.nav-link--active,
.nav-link--flyout             { background:var(--smoke-hover); }
.nav-link.open::before,
.nav-link--active::before,
.nav-link--flyout::before     { height:65%; }

/* Collapsed: center icon */
.is-collapsed .nav-link { padding:9px 0; justify-content:center; }

/* Icon */
.nav-icon { width:32px; height:32px; border-radius:var(--radius-md); border:1px solid transparent; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:var(--smoke); transition:border-color .18s,background .18s; color:var(--text-secondary); }
.nav-link:hover .nav-icon,
.nav-link.open  .nav-icon,
.nav-link--active .nav-icon,
.nav-link--flyout .nav-icon { border-color:var(--border-strong); background:var(--gold-glow); color:var(--gold); }

/* Label */
.nav-text { font-size:13px; font-weight:400; letter-spacing:.02em; color:var(--text-secondary); flex:1; transition:color .16s; overflow:hidden; text-overflow:ellipsis; }
.nav-link:hover .nav-text,
.nav-link.open  .nav-text,
.nav-link--active .nav-text { color:var(--text-primary); }

/* Chevron */
.nav-chevron { width:14px; height:14px; flex-shrink:0; color:var(--text-muted); transition:transform .22s,color .16s; }
.nav-chevron.rotated { transform:rotate(90deg); color:var(--gold-dim); }

/* ── Inline submenu ── */
.submenu { overflow:hidden; }
.sub-item { display:flex; align-items:center; padding:7px 18px 7px 60px; font-size:12px; letter-spacing:.02em; color:var(--text-muted); cursor:pointer; transition:color .14s,background .14s; position:relative; white-space:nowrap; }
.sub-item::before { content:''; position:absolute; left:46px; top:50%; transform:translateY(-50%); width:5px; height:1px; background:var(--gold-dim); transition:width .14s,background .14s; }
.sub-item:hover              { color:var(--gold-light); background:var(--smoke); }
.sub-item:hover::before      { width:9px; background:var(--gold); }
.sub-item--active            { color:var(--gold); }
.sub-item--active::before    { width:9px; background:var(--gold); }

/* ── Footer ── */
.sidebar-footer { padding:12px 16px; border-top:1px solid var(--border); flex-shrink:0; z-index:1; }
.is-collapsed .sidebar-footer { padding:12px 0; display:flex; justify-content:center; }
.user-row { display:flex; align-items:center; gap:10px; overflow:hidden; }
.is-collapsed .user-row { justify-content:center; }
.avatar { width:34px; height:34px; border-radius:50%; border:1px solid var(--border-strong); background:var(--onyx-5); display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond','Georgia',serif; font-size:13px; font-weight:500; color:var(--gold-light); flex-shrink:0; letter-spacing:.05em; }
.user-info { flex:1; min-width:0; overflow:hidden; }
.user-name     { font-size:12.5px; font-weight:500; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:0; }
.user-role-tag { font-size:10px; color:var(--gold-dim); letter-spacing:.04em; margin:0; white-space:nowrap; }
.logout-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; background:none; border:none; cursor:pointer; color:var(--gold-dim); opacity:.55; transition:opacity .15s,color .15s; flex-shrink:0; padding:0; }
.logout-btn:hover { opacity:1; color:var(--gold); }
.logout-btn svg  { width:15px; height:15px; }

/* ── Transitions ── */
.submenu-enter-active { transition:max-height .26s cubic-bezier(.4,0,.2,1),opacity .2s ease; max-height:600px; }
.submenu-leave-active { transition:max-height .22s cubic-bezier(.4,0,.2,1),opacity .16s ease; }
.submenu-enter-from, .submenu-leave-to { max-height:0; opacity:0; }
.fade-enter-active { transition:opacity .18s ease; }
.fade-leave-active { transition:opacity .1s ease; }
.fade-enter-from, .fade-leave-to { opacity:0; }
.flyout-anim-enter-active { transition:opacity .14s ease,transform .14s ease; }
.flyout-anim-leave-active { transition:opacity .1s ease,transform .1s ease; }
.flyout-anim-enter-from   { opacity:0; transform:translateX(-6px); }
.flyout-anim-leave-to     { opacity:0; transform:translateX(-4px); }
</style>

<!-- Global styles for the teleported flyout panel -->
<style>
.flyout-panel {
  background: #1C1C22;
  border: 1px solid rgba(201,169,110,0.28);
  border-left: 2px solid #C9A96E;
  padding: 6px 0 8px;
  box-shadow: 6px 12px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3);
  pointer-events: auto;
  margin-left: -1px;
}
.flyout-heading {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 13px; font-weight: 500; letter-spacing: 0.08em;
  color: #E8D5B0;
  padding: 6px 16px 5px;
  white-space: nowrap;
}
.flyout-divider {
  height: 1px;
  background: rgba(201,169,110,0.15);
  margin: 4px 0;
}
.flyout-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 16px;
  font-size: 12.5px;
  font-family: 'Jost', 'Inter', sans-serif;
  letter-spacing: 0.02em;
  color: rgba(240,234,224,0.55);
  cursor: pointer;
  transition: color .12s, background .12s;
  white-space: nowrap;
}
.flyout-item:hover           { color: #E8D5B0; background: rgba(255,255,255,0.05); }
.flyout-item--active         { color: #C9A96E; }
.flyout-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: rgba(201,169,110,0.35);
  flex-shrink: 0;
  transition: background .12s;
}
.flyout-item:hover .flyout-dot   { background: #C9A96E; }
.flyout-item--active .flyout-dot { background: #C9A96E; }
</style>