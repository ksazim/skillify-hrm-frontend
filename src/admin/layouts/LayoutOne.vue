<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': isCollapsed }">

    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <SidebarComponent :collapsed="isCollapsed" />
    </aside>

    <!-- ── Mobile overlay ── -->
    <Transition name="overlay">
      <div
        v-if="isMobileOverlayVisible"
        class="sidebar-overlay"
        @click="closeSidebar"
        aria-hidden="true"
      />
    </Transition>

    <!-- ── Main ── -->
    <div class="main-container">

      <!-- Header -->
      <header class="layout-header">
        <HeaderComponent @toggle-sidebar="toggleSidebar" />
      </header>

      <!-- Page content -->
      <main class="layout-content">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="layout-footer">
        <FooterComponent />
      </footer>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import HeaderComponent from './components/HeaderComponent.vue'
import SidebarComponent from './components/SidebarComponent.vue'
import FooterComponent from './components/FooterComponent.vue'

const isMobile    = ref(false)
const isCollapsed = ref(false)

const isMobileOverlayVisible = computed(() => isMobile.value && !isCollapsed.value)

const checkScreenSize = () => {
  const mobile = window.innerWidth < 768
  isMobile.value   = mobile
  isCollapsed.value = mobile
}

const toggleSidebar = () => { isCollapsed.value = !isCollapsed.value }
const closeSidebar  = () => { if (isMobile.value) isCollapsed.value = true }

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})
onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
/* ── Design tokens ── */
.admin-layout {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.09);
  --onyx:           #0D0D0F;
  --onyx-2:         #131316;
  --onyx-3:         #1A1A1F;
  --onyx-4:         #222228;
  --border:         rgba(201,169,110,0.12);
  --border-strong:  rgba(201,169,110,0.28);
  --text-muted:     rgba(240,234,224,0.28);
  --sidebar-w:      268px;
  --sidebar-rail:    70px;
  --header-h:        64px;
  --footer-h:        48px;
}

/* ── Shell ── */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--onyx-3);
  font-family: 'Jost', 'Inter', sans-serif;
}

/* ─────────────────────────────────────
   SIDEBAR
───────────────────────────────────── */
.sidebar {
  position: fixed;
  left: 0; top: 0;
  height: 100vh;
  width: var(--sidebar-w);
  z-index: 1000;
  overflow-x: visible;
  overflow-y: auto;
  transition: width .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1);
  flex-shrink: 0;
  border-right: 1px solid var(--border);
}

/* Desktop collapsed → icon rail */
.sidebar-collapsed .sidebar { width: var(--sidebar-rail); }

/* Mobile → slide off-screen */
@media (max-width: 767px) {
  .sidebar { width: var(--sidebar-w); transform: translateX(0); }
  .sidebar-collapsed .sidebar { width: var(--sidebar-w); transform: translateX(-100%); }
}

.sidebar::-webkit-scrollbar       { width: 3px; }
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

/* ── Mobile overlay ── */
.sidebar-overlay {
  position: fixed; inset: 0;
  background: rgba(7,7,9,0.72);
  z-index: 999;
  backdrop-filter: blur(3px);
}

.overlay-enter-active { transition: opacity .22s ease; }
.overlay-leave-active { transition: opacity .18s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

/* ─────────────────────────────────────
   MAIN CONTAINER
───────────────────────────────────── */
.main-container {
  flex: 1;
  margin-left: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left .3s cubic-bezier(.4,0,.2,1);
  min-width: 0;
}

.sidebar-collapsed .main-container { margin-left: var(--sidebar-rail); }

@media (max-width: 767px) {
  .main-container { margin-left: 0 !important; }
}

/* ─────────────────────────────────────
   HEADER
───────────────────────────────────── */
.layout-header {
  position: sticky;
  top: 0;
  height: var(--header-h);
  z-index: 998;
  flex-shrink: 0;

  /* Dark luxury surface */
  background: var(--onyx-2);
  border-bottom: 1px solid var(--border);

  display: flex;
  align-items: center;
  padding: 0 24px;

  /* Gold hairline at very top */
  box-shadow: inset 0 2px 0 0 var(--gold-dim);
}

/* ─────────────────────────────────────
   CONTENT
───────────────────────────────────── */
.layout-content {
  flex: 1;
  padding: 28px 28px 24px;
  overflow-y: auto;
  background: var(--onyx-3);
  /* subtle gold-to-transparent top fade on content area */
  background-image:
    radial-gradient(ellipse 60% 160px at 50% 0%, rgba(201,169,110,0.04) 0%, transparent 100%);
}

@media (max-width: 1024px) { .layout-content { padding: 20px; } }
@media (max-width: 767px)  { .layout-content { padding: 16px; } .layout-header { padding: 0 16px; } }

/* ─────────────────────────────────────
   FOOTER (height only — styling in FooterComponent)
───────────────────────────────────── */
.layout-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  background: var(--onyx-2);
}

/* ── Print ── */
@media print {
  .sidebar, .layout-header, .layout-footer { display: none; }
  .main-container { margin-left: 0; }
  .layout-content { padding: 0; background: #fff; }
}
</style>