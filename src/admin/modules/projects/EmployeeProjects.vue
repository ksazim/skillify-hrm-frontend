<template>
  <div class="emp-projects-page">
    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="page-header-inner">
        <div class="page-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 0 0-6 0c0 .14.11.56.18 1H10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v18h20V8a2 2 0 0 0-2-2zm-7-1a1 1 0 0 1 2 0c0 .63-.45 1.41-1 2.17C13.45 6.41 13 5.63 13 5zM4 4h4v2H4V4zm0 4h4v2H4V8zm4 10H4v-2h4v2zm0-4H4v-2h4v2zm10 4h-8v-2h8v2zm0-4h-8v-2h8v2zm0-4h-8v-2h8v2z"/>
          </svg>
        </div>
        <div>
          <h1 class="page-title">My Projects</h1>
          <p class="page-subtitle">Track your assigned projects and tasks</p>
        </div>
      </div>
      <div class="page-stats">
        <div class="stat-chip">
          <span class="stat-value">{{ projects.length }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ projects.filter(p => p.project?.status === 'active').length }}</span>
          <span class="stat-label">Active</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ projects.filter(p => p.project?.status === 'completed').length }}</span>
          <span class="stat-label">Completed</span>
        </div>
      </div>
    </div>

    <!-- ── Notification Banner ── -->
    <Transition name="banner-slide">
      <div v-if="banner.show" :class="['banner', `banner-${banner.type}`]">
        <svg v-if="banner.type === 'success'" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        <span>{{ banner.message }}</span>
        <button class="banner-close" @click="banner.show = false">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    </Transition>

    <!-- ── Loading ── -->
    <div v-if="isLoading" class="state-container">
      <div class="loading-ring"></div>
      <p class="state-text">Loading your projects…</p>
    </div>

    <!-- ── Error ── -->
    <div v-else-if="hasError" class="state-container">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" class="state-icon error">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p class="state-text">Failed to load projects</p>
      <button class="btn-retry" @click="loadProjects">Retry</button>
    </div>

    <!-- ── Empty ── -->
    <div v-else-if="!projects.length" class="state-container">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" class="state-icon empty">
        <path d="M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 0 0-6 0c0 .14.11.56.18 1H10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v18h20V8a2 2 0 0 0-2-2z"/>
      </svg>
      <p class="state-text">No projects assigned yet</p>
      <p class="state-sub">You'll see your projects here once you're added as a contributor.</p>
    </div>

    <!-- ── Projects Grid ── -->
    <div v-else class="projects-grid">
      <div
        v-for="contrib in projects"
        :key="contrib.id"
        class="project-card"
        @click="openDrawer(contrib)"
      >
        <!-- Card thumbnail strip -->
        <div class="card-thumb-strip">
          <img v-if="contrib.project?.thumbnail" :src="baseUrl + '/' + contrib.project.thumbnail" class="card-thumb-img" alt="thumb" />
          <div v-else class="card-thumb-placeholder">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
          </div>
          <span :class="['card-priority', `priority-${contrib.project?.priority}`]">{{ contrib.project?.priority }}</span>
        </div>

        <div class="card-body">
          <h3 class="card-name">{{ contrib.project?.name || '—' }}</h3>
          <p class="card-desc">{{ contrib.project?.description || 'No description provided.' }}</p>

          <div class="card-meta-row">
            <span :class="['status-pill', `status-${contrib.project?.status}`]">{{ contrib.project?.status }}</span>
            <span class="card-role">{{ contrib.role }}</span>
          </div>

          <div class="card-progress-row">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (contrib.progress ?? 0) + '%' }"></div>
            </div>
            <span class="progress-label">{{ contrib.progress ?? 0 }}%</span>
          </div>

          <div class="card-dates">
            <span class="card-date">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
              {{ contrib.project?.start_date || '—' }}
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="date-arrow"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
            <span class="card-date">{{ contrib.project?.end_date || '—' }}</span>
          </div>
        </div>

        <div class="card-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         DETAIL DRAWER
    ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="drawer-fade">
        <div v-if="showDrawer" class="drawer-overlay" @click.self="closeDrawer">
          <div class="detail-drawer">

            <!-- Drawer Header -->
            <div class="drawer-header">
              <div class="drawer-header-left">
                <img
                  v-if="activeContrib?.project?.thumbnail"
                  :src="baseUrl + '/' + activeContrib.project.thumbnail"
                  class="drawer-thumb"
                  alt="thumb"
                />
                <div v-else class="drawer-thumb-placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
                </div>
                <div>
                  <h2 class="drawer-title">{{ activeContrib?.project?.name }}</h2>
                  <p class="drawer-subtitle">
                    <span :class="['status-pill small', `status-${activeContrib?.project?.status}`]">{{ activeContrib?.project?.status }}</span>
                    <span class="drawer-role">· {{ activeContrib?.role }}</span>
                  </p>
                </div>
              </div>
              <button class="drawer-close" @click="closeDrawer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>

            <!-- Drawer Tabs -->
            <div class="drawer-tabs">
              <button
                v-for="tab in ['overview', 'tasks']"
                :key="tab"
                :class="['drawer-tab', { active: activeTab === tab }]"
                @click="activeTab = tab"
              >
                <svg v-if="tab === 'overview'" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                {{ tab === 'overview' ? 'Overview' : 'My Tasks' }}
                <span v-if="tab === 'tasks'" class="tab-count">{{ myTasks.length }}</span>
              </button>
            </div>

            <!-- ── Tab: Overview ── -->
            <div v-if="activeTab === 'overview'" class="drawer-body">
              <div class="detail-grid">
                <div class="detail-card">
                  <span class="detail-card-label">Status</span>
                  <span :class="['status-pill', `status-${activeContrib?.project?.status}`]">{{ activeContrib?.project?.status }}</span>
                </div>
                <div class="detail-card">
                  <span class="detail-card-label">Priority</span>
                  <span :class="['priority-badge', `priority-${activeContrib?.project?.priority}`]">{{ activeContrib?.project?.priority }}</span>
                </div>
                <div class="detail-card">
                  <span class="detail-card-label">Budget</span>
                  <span class="detail-card-value">${{ Number(activeContrib?.project?.budget ?? 0).toLocaleString() }}</span>
                </div>
                <div class="detail-card">
                  <span class="detail-card-label">My Progress</span>
                  <div class="progress-wrapper">
                    <div class="progress-bar"><div class="progress-fill" :style="{ width: (activeContrib?.progress ?? 0) + '%' }"></div></div>
                    <span class="progress-label">{{ activeContrib?.progress ?? 0 }}%</span>
                  </div>
                </div>
                <div class="detail-card">
                  <span class="detail-card-label">Start Date</span>
                  <span class="detail-card-value">{{ activeContrib?.project?.start_date || '—' }}</span>
                </div>
                <div class="detail-card">
                  <span class="detail-card-label">End Date</span>
                  <span class="detail-card-value">{{ activeContrib?.project?.end_date || '—' }}</span>
                </div>
                <div class="detail-card">
                  <span class="detail-card-label">My Role</span>
                  <span class="detail-card-value">{{ activeContrib?.role || '—' }}</span>
                </div>
                <div class="detail-card">
                  <span class="detail-card-label">My Status</span>
                  <span :class="['status-pill', `status-${activeContrib?.status}`]">{{ activeContrib?.status }}</span>
                </div>
              </div>

              <div v-if="activeContrib?.project?.description" class="detail-description">
                <span class="detail-card-label">Description</span>
                <p>{{ activeContrib.project.description }}</p>
              </div>

              <div v-if="activeContrib?.note" class="detail-description" style="margin-top: 10px">
                <span class="detail-card-label">My Note</span>
                <p>{{ activeContrib.note }}</p>
              </div>
            </div>

            <!-- ── Tab: My Tasks ── -->
            <div v-if="activeTab === 'tasks'" class="drawer-body">
              <div v-if="tasksLoading" class="tab-loading">
                <div class="loading-ring small"></div>
                <span>Loading tasks…</span>
              </div>

              <div v-else-if="!myTasks.length" class="tab-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                <p>No tasks assigned to you yet.</p>
              </div>

              <div v-else class="tasks-list">
                <TransitionGroup name="task-list">
                  <div
                    v-for="task in myTasks"
                    :key="task.id"
                    class="task-card"
                    :class="{ 'task-updating': updatingTaskId === task.id }"
                  >
                    <div class="task-dot-col">
                      <div :class="['task-status-dot', `dot-${task.status}`]"></div>
                    </div>

                    <div class="task-content">
                      <span class="task-name">{{ task.task }}</span>

                      <!-- Status selector -->
                      <div class="task-status-row">
                        <select
                          :value="task.status"
                          class="task-status-select"
                          :class="`select-${task.status}`"
                          :disabled="updatingTaskId === task.id"
                          @change="updateTaskStatus(task, $event.target.value)"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        <span v-if="updatingTaskId === task.id" class="task-saving">
                          <div class="loading-ring tiny"></div>
                        </span>
                      </div>
                    </div>

                    <!-- Delete -->
                    <button
                      class="icon-btn delete"
                      title="Delete task"
                      :disabled="deletingTaskId === task.id"
                      @click.stop="confirmDeleteTask(task)"
                    >
                      <div v-if="deletingTaskId === task.id" class="loading-ring tiny"></div>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                </TransitionGroup>
              </div>

              <!-- Task stats footer -->
              <div v-if="myTasks.length" class="tasks-footer">
                <div class="task-stat">
                  <div class="task-stat-dot dot-completed"></div>
                  <span>{{ myTasks.filter(t => t.status === 'completed').length }} done</span>
                </div>
                <div class="task-stat">
                  <div class="task-stat-dot dot-in_progress"></div>
                  <span>{{ myTasks.filter(t => t.status === 'in_progress').length }} in progress</span>
                </div>
                <div class="task-stat">
                  <div class="task-stat-dot dot-pending"></div>
                  <span>{{ myTasks.filter(t => t.status === 'pending').length }} pending</span>
                </div>
                <div class="task-stat">
                  <div class="task-stat-dot dot-blocked"></div>
                  <span>{{ myTasks.filter(t => t.status === 'blocked').length }} blocked</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════
         DELETE CONFIRM MODAL
    ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-pop">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
          <div class="confirm-modal">
            <div class="confirm-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </div>
            <h3 class="confirm-title">Delete Task</h3>
            <p class="confirm-message">Are you sure you want to delete this task? This action cannot be undone.</p>
            <p class="confirm-task-name">{{ taskToDelete?.task }}</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="showDeleteConfirm = false">Cancel</button>
              <button class="btn-danger" @click="executeDeleteTask" :disabled="!!deletingTaskId">
                <div v-if="deletingTaskId" class="loading-ring tiny white"></div>
                <span v-else>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const baseUrl = process.env.VUE_APP_BASE_URL
const baseApi = process.env.VUE_APP_BASE_API

// ── Auth ──────────────────────────────────────────────────────────────────────
const getAuthToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('token') ||
  sessionStorage.getItem('auth_token') ||
  sessionStorage.getItem('token') ||
  ''

const apiFetch = async (url, options = {}) => {
  const token = getAuthToken()
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${baseApi}${url}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── State ─────────────────────────────────────────────────────────────────────
const projects      = ref([])
const isLoading     = ref(false)
const hasError      = ref(false)

const showDrawer    = ref(false)
const activeContrib = ref(null)
const activeTab     = ref('overview')

const myTasks         = ref([])
const tasksLoading    = ref(false)
const updatingTaskId  = ref(null)
const deletingTaskId  = ref(null)

const showDeleteConfirm = ref(false)
const taskToDelete      = ref(null)

const banner = ref({ show: false, type: 'success', message: '' })
let bannerTimer = null

// ── Helpers ───────────────────────────────────────────────────────────────────
const notify = (type, message) => {
  if (bannerTimer) clearTimeout(bannerTimer)
  banner.value = { show: true, type, message }
  bannerTimer = setTimeout(() => { banner.value.show = false }, 3500)
}

// ── Load my projects ──────────────────────────────────────────────────────────
const loadProjects = async () => {
  isLoading.value = true
  hasError.value = false
  try {
    const data = await apiFetch(`/projects/contributors/my-projects`)
    projects.value = data.contributors ?? []
  } catch (e) {
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

// ── Load my tasks for a project+contributor ───────────────────────────────────
const loadMyTasks = async () => {
  if (!activeContrib.value) return
  tasksLoading.value = true
  myTasks.value = []
  try {
    const projectId = activeContrib.value.project_id ?? activeContrib.value.project?.id
    const contribId = activeContrib.value.id
    const data = await apiFetch(`/projects/contributor-tasks/${projectId}/${contribId}`)
    myTasks.value = data.tasks ?? []
  } catch {
    myTasks.value = []
  } finally {
    tasksLoading.value = false
  }
}

// ── Drawer ────────────────────────────────────────────────────────────────────
const openDrawer = async (contrib) => {
  activeContrib.value = contrib
  activeTab.value = 'overview'
  showDrawer.value = true
  await loadMyTasks()
}

const closeDrawer = () => {
  showDrawer.value = false
  activeContrib.value = null
  myTasks.value = []
}

// ── Update task status ────────────────────────────────────────────────────────
const updateTaskStatus = async (task, newStatus) => {
  if (updatingTaskId.value) return
  updatingTaskId.value = task.id
  try {
    await apiFetch(`/projects/contributor-tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assigned_task: task.assigned_task,
        deadline:      task.deadline,
        company_id:    activeContrib.value.company_id,
        project_id:    activeContrib.value.project_id ?? activeContrib.value.project?.id,
        employee_id:   activeContrib.value.employee_id,
        contributor_id: activeContrib.value.id,
        status:        newStatus,
      }),
    })
    // Update local state immediately
    const t = myTasks.value.find(t => t.id === task.id)
    if (t) t.status = newStatus
    notify('success', 'Task status updated.')
  } catch (e) {
    notify('error', e.message || 'Failed to update status.')
  } finally {
    updatingTaskId.value = null
  }
}

// ── Delete task ───────────────────────────────────────────────────────────────
const confirmDeleteTask = (task) => {
  taskToDelete.value = task
  showDeleteConfirm.value = true
}

const executeDeleteTask = async () => {
  if (!taskToDelete.value) return
  deletingTaskId.value = taskToDelete.value.id
  try {
    await apiFetch(`/projects/contributor-tasks/${taskToDelete.value.id}`, { method: 'DELETE' })
    myTasks.value = myTasks.value.filter(t => t.id !== taskToDelete.value.id)
    showDeleteConfirm.value = false
    taskToDelete.value = null
    notify('success', 'Task deleted.')
  } catch (e) {
    notify('error', e.message || 'Failed to delete task.')
  } finally {
    deletingTaskId.value = null
  }
}

onMounted(loadProjects)
</script>

<style scoped>
/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
.emp-projects-page {
  min-height: 100vh;
  padding: 28px 32px;
  background: #110f0c;
  font-family: 'Segoe UI', sans-serif;
  color: rgba(240, 234, 224, 0.85);
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(201, 169, 110, 0.12);
}
.page-header-inner { display: flex; align-items: center; gap: 14px; }
.page-icon {
  width: 42px; height: 42px; border-radius: 10px;
  background: rgba(201, 169, 110, 0.1);
  border: 1px solid rgba(201, 169, 110, 0.25);
  display: flex; align-items: center; justify-content: center;
  color: #c9a96e;
}
.page-title { margin: 0; font-size: 20px; font-weight: 700; color: rgba(240, 234, 224, 0.95); }
.page-subtitle { margin: 3px 0 0; font-size: 12.5px; color: rgba(240, 234, 224, 0.38); }

.page-stats { display: flex; gap: 10px; flex-wrap: wrap; }
.stat-chip {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 18px; background: rgba(201, 169, 110, 0.05);
  border: 1px solid rgba(201, 169, 110, 0.15); border-radius: 8px;
  min-width: 64px;
}
.stat-value { font-size: 20px; font-weight: 700; color: #c9a96e; line-height: 1; }
.stat-label { font-size: 10.5px; color: rgba(240, 234, 224, 0.38); margin-top: 3px; letter-spacing: 0.05em; text-transform: uppercase; }

/* ── Banner ── */
.banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: 7px; margin-bottom: 20px;
  font-size: 13px;
}
.banner-success { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.3); color: #86efac; }
.banner-error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.3);  color: #fca5a5; }
.banner-close {
  margin-left: auto; background: none; border: none; cursor: pointer;
  color: inherit; opacity: 0.6; padding: 2px;
}
.banner-close:hover { opacity: 1; }
.banner-slide-enter-active, .banner-slide-leave-active { transition: all .25s ease; }
.banner-slide-enter-from, .banner-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ══════════════════════════════════════════
   STATES
══════════════════════════════════════════ */
.state-container {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 14px; padding: 80px 20px;
}
.state-icon { color: rgba(240, 234, 224, 0.15); }
.state-icon.error { color: rgba(239, 68, 68, 0.4); }
.state-text { font-size: 15px; color: rgba(240, 234, 224, 0.45); margin: 0; }
.state-sub { font-size: 13px; color: rgba(240, 234, 224, 0.3); margin: 0; text-align: center; max-width: 340px; line-height: 1.6; }
.btn-retry {
  padding: 8px 20px; border-radius: 5px;
  background: rgba(201, 169, 110, 0.1); border: 1px solid rgba(201, 169, 110, 0.3);
  color: #c9a96e; font-size: 13px; cursor: pointer; transition: background .2s;
}
.btn-retry:hover { background: rgba(201, 169, 110, 0.2); }

/* ══════════════════════════════════════════
   PROJECT CARDS GRID
══════════════════════════════════════════ */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.project-card {
  background: rgba(240, 234, 224, 0.025);
  border: 1px solid rgba(201, 169, 110, 0.12);
  border-radius: 10px; overflow: hidden;
  cursor: pointer; position: relative;
  transition: border-color .22s, transform .22s, box-shadow .22s;
  display: flex; flex-direction: column;
}
.project-card:hover {
  border-color: rgba(201, 169, 110, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

/* Thumb strip */
.card-thumb-strip {
  height: 90px; position: relative;
  background: rgba(201, 169, 110, 0.06);
  overflow: hidden;
}
.card-thumb-img { width: 100%; height: 100%; object-fit: cover; }
.card-thumb-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: rgba(201, 169, 110, 0.25);
}
.card-priority {
  position: absolute; top: 10px; right: 10px;
  padding: 3px 9px; font-size: 10px; font-weight: 600;
  letter-spacing: 0.07em; text-transform: uppercase;
  border-radius: 3px; backdrop-filter: blur(4px);
}

/* Card body */
.card-body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.card-name { margin: 0; font-size: 14.5px; font-weight: 600; color: rgba(240, 234, 224, 0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-desc { margin: 0; font-size: 12px; color: rgba(240, 234, 224, 0.38); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.card-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-role { font-size: 11px; color: rgba(240, 234, 224, 0.4); font-style: italic; }

.card-progress-row { display: flex; align-items: center; gap: 8px; }
.card-progress-row .progress-bar { flex: 1; }

.card-dates { display: flex; align-items: center; gap: 6px; }
.card-date { font-size: 11px; color: rgba(240, 234, 224, 0.35); display: flex; align-items: center; gap: 4px; }
.date-arrow { color: rgba(240, 234, 224, 0.2); }

.card-arrow {
  position: absolute; right: 12px; bottom: 14px;
  color: rgba(201, 169, 110, 0.3);
  transition: color .2s, right .2s;
}
.project-card:hover .card-arrow { color: rgba(201, 169, 110, 0.7); right: 10px; }

/* ══════════════════════════════════════════
   PRIORITY BADGES
══════════════════════════════════════════ */
.priority-badge { display: inline-block; padding: 3px 10px; font-size: 10.5px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; border-radius: 3px; }
.priority-low      { background: rgba(34,197,94,.1);  border: 1px solid rgba(34,197,94,.3);  color: #86efac; }
.priority-medium   { background: rgba(234,179,8,.1);  border: 1px solid rgba(234,179,8,.3);  color: #fde047; }
.priority-high     { background: rgba(249,115,22,.1); border: 1px solid rgba(249,115,22,.3); color: #fdba74; }
.priority-critical { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.3);  color: #fca5a5; }

/* ══════════════════════════════════════════
   STATUS PILLS
══════════════════════════════════════════ */
.status-pill { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 10.5px; font-weight: 500; letter-spacing: 0.05em; text-transform: capitalize; }
.status-pill.small { font-size: 10px; padding: 2px 7px; }
.status-active    { background: rgba(34,197,94,.1);   border: 1px solid rgba(34,197,94,.3);   color: #86efac; }
.status-inactive  { background: rgba(156,163,175,.1); border: 1px solid rgba(156,163,175,.3); color: #d1d5db; }
.status-on_hold   { background: rgba(234,179,8,.1);   border: 1px solid rgba(234,179,8,.3);   color: #fde047; }
.status-completed { background: rgba(99,102,241,.1);  border: 1px solid rgba(99,102,241,.3);  color: #a5b4fc; }
.status-cancelled { background: rgba(239,68,68,.1);   border: 1px solid rgba(239,68,68,.3);   color: #fca5a5; }
.status-pending   { background: rgba(234,179,8,.08);  border: 1px solid rgba(234,179,8,.25);  color: #fde047; }
.status-in_progress { background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.3); color: #93c5fd; }
.status-blocked   { background: rgba(239,68,68,.1);   border: 1px solid rgba(239,68,68,.3);   color: #fca5a5; }

/* ══════════════════════════════════════════
   PROGRESS
══════════════════════════════════════════ */
.progress-wrapper { display: flex; align-items: center; gap: 8px; }
.progress-bar { flex: 1; height: 6px; background: rgba(240,234,224,.1); border-radius: 99px; overflow: hidden; min-width: 50px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, rgba(201,169,110,.7), #c9a96e); border-radius: 99px; transition: width .3s ease; }
.progress-label { font-size: 11px; color: rgba(240,234,224,.55); min-width: 28px; text-align: right; }

/* ══════════════════════════════════════════
   DRAWER
══════════════════════════════════════════ */
.drawer-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.55); backdrop-filter: blur(3px);
  display: flex; justify-content: flex-end;
}
.detail-drawer {
  width: 520px; max-width: 100vw; height: 100%;
  background: #1a1610;
  border-left: 1px solid rgba(201,169,110,.18);
  display: flex; flex-direction: column; overflow: hidden;
}
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(201,169,110,.12);
  background: rgba(201,169,110,.03); flex-shrink: 0;
}
.drawer-header-left { display: flex; align-items: center; gap: 14px; }
.drawer-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(201,169,110,.3); }
.drawer-thumb-placeholder {
  width: 48px; height: 48px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(201,169,110,.08); border: 1px solid rgba(201,169,110,.2);
  color: rgba(240,234,224,.3);
}
.drawer-title { font-size: 16px; font-weight: 600; color: rgba(240,234,224,.92); margin: 0 0 4px; }
.drawer-subtitle { margin: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.drawer-role { font-size: 11px; color: rgba(240,234,224,.38); }
.drawer-close {
  background: none; border: none; cursor: pointer; padding: 6px;
  color: rgba(240,234,224,.4); border-radius: 4px; transition: color .2s, background .2s;
}
.drawer-close:hover { color: rgba(240,234,224,.8); background: rgba(240,234,224,.08); }

.drawer-tabs {
  display: flex; border-bottom: 1px solid rgba(201,169,110,.1);
  flex-shrink: 0; background: rgba(0,0,0,.15);
}
.drawer-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 20px; background: none; border: none;
  font-size: 12.5px; font-weight: 500; cursor: pointer;
  color: rgba(240,234,224,.4); border-bottom: 2px solid transparent;
  transition: color .2s, border-color .2s; white-space: nowrap;
}
.drawer-tab.active { color: #c9a96e; border-bottom-color: #c9a96e; }
.drawer-tab:hover:not(.active) { color: rgba(240,234,224,.7); }
.tab-count {
  background: rgba(201,169,110,.15); border: 1px solid rgba(201,169,110,.2);
  border-radius: 10px; padding: 1px 6px; font-size: 10px; color: #c9a96e;
}

.drawer-body { flex: 1; overflow-y: auto; padding: 20px 24px; }

/* ── Detail Grid ── */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.detail-card {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px 14px; background: rgba(240,234,224,.03);
  border: 1px solid rgba(201,169,110,.1); border-radius: 6px;
}
.detail-card-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(240,234,224,.35); }
.detail-card-value { font-size: 13.5px; color: rgba(240,234,224,.8); font-weight: 500; }
.detail-description {
  padding: 14px; background: rgba(240,234,224,.02);
  border: 1px solid rgba(201,169,110,.1); border-radius: 6px;
  display: flex; flex-direction: column; gap: 8px;
}
.detail-description p { margin: 0; font-size: 13px; color: rgba(240,234,224,.65); line-height: 1.6; }

/* ══════════════════════════════════════════
   TASKS
══════════════════════════════════════════ */
.tab-loading { display: flex; align-items: center; gap: 10px; padding: 32px; justify-content: center; color: rgba(240,234,224,.4); font-size: 13px; }
.tab-empty {
  padding: 40px 16px; text-align: center;
  color: rgba(240,234,224,.35); font-size: 13px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.tab-empty svg { color: rgba(240,234,224,.18); }
.tab-empty p { margin: 0; }

.tasks-list { display: flex; flex-direction: column; gap: 8px; }
.task-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: rgba(240,234,224,.03);
  border: 1px solid rgba(201,169,110,.1); border-radius: 7px;
  transition: border-color .2s, opacity .2s;
}
.task-card:hover { border-color: rgba(201,169,110,.22); }
.task-card.task-updating { opacity: 0.7; }

.task-dot-col { flex-shrink: 0; }
.task-status-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-pending     { background: #fde047; box-shadow: 0 0 5px rgba(253,224,71,.5); }
.dot-in_progress { background: #93c5fd; box-shadow: 0 0 5px rgba(147,197,253,.5); }
.dot-completed   { background: #86efac; box-shadow: 0 0 5px rgba(134,239,172,.5); }
.dot-blocked     { background: #fca5a5; box-shadow: 0 0 5px rgba(252,165,165,.5); }

.task-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.task-name { font-size: 13px; color: rgba(240,234,224,.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-status-row { display: flex; align-items: center; gap: 8px; }
.task-status-select {
  padding: 3px 8px; border-radius: 4px;
  font-size: 11.5px; font-weight: 500;
  border: 1px solid; cursor: pointer; outline: none;
  transition: all .2s; background: transparent;
}
.select-pending     { border-color: rgba(234,179,8,.3);   color: #fde047; }
.select-in_progress { border-color: rgba(59,130,246,.3);  color: #93c5fd; }
.select-completed   { border-color: rgba(99,102,241,.3);  color: #a5b4fc; }
.select-blocked     { border-color: rgba(239,68,68,.3);   color: #fca5a5; }
.select-pending option, .select-in_progress option,
.select-completed option, .select-blocked option { background: #1a1610; color: rgba(240,234,224,.85); }
.task-saving { display: flex; align-items: center; }

.icon-btn {
  width: 28px; height: 28px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid transparent;
  cursor: pointer; transition: all .2s; flex-shrink: 0;
}
.icon-btn.delete { color: rgba(239,68,68,.5); }
.icon-btn.delete:hover:not(:disabled) { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.25); color: #fca5a5; }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Tasks footer */
.tasks-footer {
  display: flex; gap: 16px; flex-wrap: wrap; margin-top: 16px;
  padding-top: 14px; border-top: 1px solid rgba(201,169,110,.1);
}
.task-stat { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: rgba(240,234,224,.4); }
.task-stat-dot { width: 7px; height: 7px; border-radius: 50%; }

/* ══════════════════════════════════════════
   DELETE CONFIRM MODAL
══════════════════════════════════════════ */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(0,0,0,.65); backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.confirm-modal {
  background: #1a1610; border: 1px solid rgba(239,68,68,.25);
  border-radius: 12px; width: 380px; max-width: 100%;
  padding: 28px 24px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.confirm-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25);
  display: flex; align-items: center; justify-content: center;
  color: #fca5a5;
}
.confirm-title { margin: 0; font-size: 17px; font-weight: 700; color: rgba(240,234,224,.9); }
.confirm-message { margin: 0; font-size: 13px; color: rgba(240,234,224,.45); line-height: 1.6; }
.confirm-task-name {
  margin: 0; font-size: 13px; font-style: italic;
  color: rgba(240,234,224,.6); padding: 8px 14px;
  background: rgba(240,234,224,.04); border-radius: 5px;
  border: 1px solid rgba(240,234,224,.1); width: 100%; box-sizing: border-box;
}
.confirm-actions { display: flex; gap: 10px; justify-content: center; margin-top: 4px; }
.btn-cancel {
  padding: 9px 18px; border-radius: 6px;
  background: transparent; border: 1px solid rgba(240,234,224,.15);
  color: rgba(240,234,224,.5); font-size: 13px;
  cursor: pointer; transition: all .2s;
}
.btn-cancel:hover { border-color: rgba(240,234,224,.3); color: rgba(240,234,224,.75); }
.btn-danger {
  padding: 9px 18px; border-radius: 6px;
  background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.35);
  color: #fca5a5; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background .2s;
  display: flex; align-items: center; gap: 6px; min-width: 90px; justify-content: center;
}
.btn-danger:hover:not(:disabled) { background: rgba(239,68,68,.25); }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* ══════════════════════════════════════════
   LOADING RINGS
══════════════════════════════════════════ */
.loading-ring {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid rgba(201,169,110,.15);
  border-top-color: #c9a96e;
  animation: spin .8s linear infinite;
}
.loading-ring.small { width: 20px; height: 20px; border-width: 2px; }
.loading-ring.tiny  { width: 13px; height: 13px; border-width: 2px; }
.loading-ring.white { border-color: rgba(255,255,255,.2); border-top-color: #fff; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════
   TRANSITIONS
══════════════════════════════════════════ */
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity .25s ease; }
.drawer-fade-enter-active .detail-drawer, .drawer-fade-leave-active .detail-drawer { transition: transform .3s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-fade-enter-from .detail-drawer, .drawer-fade-leave-to .detail-drawer { transform: translateX(100%); }

.modal-pop-enter-active, .modal-pop-leave-active { transition: opacity .2s ease; }
.modal-pop-enter-active .confirm-modal, .modal-pop-leave-active .confirm-modal { transition: transform .2s ease, opacity .2s ease; }
.modal-pop-enter-from, .modal-pop-leave-to { opacity: 0; }
.modal-pop-enter-from .confirm-modal, .modal-pop-leave-to .confirm-modal { transform: scale(.93); opacity: 0; }

.task-list-enter-active, .task-list-leave-active { transition: all .25s ease; }
.task-list-enter-from { opacity: 0; transform: translateY(-6px); }
.task-list-leave-to   { opacity: 0; transform: translateX(12px); }
</style>