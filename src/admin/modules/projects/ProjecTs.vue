<template>
  <CrudLayout
    ref="layoutRef"
    title="Project Management"
    subtitle="Manage projects, timelines and team assignments"
    add-label="New Project"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading projects"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Projects"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >
    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 0 0-6 0c0 .14.11.56.18 1H10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v18h20V8a2 2 0 0 0-2-2zm-7-1a1 1 0 0 1 2 0c0 .63-.45 1.41-1 2.17C13.45 6.41 13 5.63 13 5zM4 4h4v2H4V4zm0 4h4v2H4V8zm4 10H4v-2h4v2zm0-4H4v-2h4v2zm10 4h-8v-2h8v2zm0-4h-8v-2h8v2zm0-4h-8v-2h8v2z"/>
      </svg>
    </template>

    <!-- ── Company Selector Bar ── -->
    <template #before-filters>
      <div class="company-selector-bar">
        <div class="company-selector-inner">
          <span class="company-selector-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            Company
          </span>
          <select class="company-select" v-model="selectedCompanyId" @change="onCompanyChange">
            <option value="">— Select a company —</option>
            <option v-for="c in allCompanies" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
          <span v-if="selectedCompanyLabel" class="company-active-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            {{ selectedCompanyLabel }}
          </span>
        </div>
      </div>
    </template>

    <!-- ── Filters ── -->
    <template #filters>
      <FilterPanel
        title="Search & Filter"
        :fields="filterFields"
        v-model="searchFilters"
        @submit="handleSearch"
        @reset="handleReset"
      />
    </template>

    <!-- ── Table ── -->
    <DataTable
      :data="paginatedData"
      :columns="tableColumns"
      :actions="tableActions"
      result-label="projects"
      @action="handleAction"
      @sort="handleSort"
    >
      <template #cell-thumbnail="{ value }">
        <img v-if="value" :src="baseUrl + '/' + value" alt="thumbnail" class="project-thumbnail" />
        <div v-else class="project-thumbnail-placeholder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
        </div>
      </template>

      <template #cell-priority="{ value }">
        <span v-if="value" :class="['priority-badge', `priority-${value}`]">{{ value }}</span>
        <span v-else class="cell-dash">—</span>
      </template>

      <template #cell-progress="{ value }">
        <div class="progress-wrapper">
          <div class="progress-bar"><div class="progress-fill" :style="{ width: (value ?? 0) + '%' }"></div></div>
          <span class="progress-label">{{ value ?? 0 }}%</span>
        </div>
      </template>
    </DataTable>

    <!-- ── Pagination ── -->
    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="pagination.total"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]"
        item-label="projects"
        :show-first-last="true"
        :show-labels="false"
        :show-jump-to="false"
        @update:page-size="handlePageSizeChange"
        @page-change="handlePageChange"
      />
    </template>
  </CrudLayout>

  <!-- ══════════════════════════════════════════════
       PROJECT FORM MODAL (Create / Edit)
  ══════════════════════════════════════════════ -->
  <BaseModal
    v-model="showFormModal"
    :mode="modalMode"
    entity-name="project"
    :fields="formFields"
    :initial-data="selectedItem"
    :on-submit="handleFormSubmit"
    size="large"
    @success="handleModalSuccess"
    @error="handleModalError"
  />

  <!-- ══════════════════════════════════════════════
       DELETE PROJECT MODAL
  ══════════════════════════════════════════════ -->
  <BaseModal
    v-model="showDeleteModal"
    mode="delete"
    entity-name="project"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This project and all its data will be permanently removed from the system."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />

  <!-- ══════════════════════════════════════════════
       PROJECT DETAIL DRAWER
  ══════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="showDetailDrawer" class="drawer-overlay" @click.self="closeDetailDrawer">
        <div class="detail-drawer">
          <!-- Drawer Header -->
          <div class="drawer-header">
            <div class="drawer-header-left">
              <img v-if="detailProject?.thumbnail" :src="baseUrl + '/' + detailProject.thumbnail" class="drawer-thumb" />
              <div v-else class="drawer-thumb-placeholder">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
              </div>
              <div>
                <h2 class="drawer-title">{{ detailProject?.name }}</h2>
                <p class="drawer-subtitle">{{ detailProject?.status }}</p>
              </div>
            </div>
            <button class="drawer-close" @click="closeDetailDrawer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>

          <!-- Drawer Tabs -->
          <div class="drawer-tabs">
            <button
              v-for="tab in drawerTabs"
              :key="tab.key"
              :class="['drawer-tab', { active: activeDrawerTab === tab.key }]"
              @click="activeDrawerTab = tab.key"
            >
              <span v-html="tab.icon"></span>
              {{ tab.label }}
              <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
            </button>
          </div>

          <!-- ── Tab: Overview ── -->
          <div v-if="activeDrawerTab === 'overview'" class="drawer-body">
            <div class="detail-grid">
              <div class="detail-card">
                <span class="detail-card-label">Status</span>
                <span :class="['status-pill', `status-${detailProject?.status}`]">{{ detailProject?.status }}</span>
              </div>
              <div class="detail-card">
                <span class="detail-card-label">Priority</span>
                <span :class="['priority-badge', `priority-${detailProject?.priority}`]">{{ detailProject?.priority }}</span>
              </div>
              <div class="detail-card">
                <span class="detail-card-label">Budget</span>
                <span class="detail-card-value">${{ Number(detailProject?.budget ?? 0).toLocaleString() }}</span>
              </div>
              <div class="detail-card">
                <span class="detail-card-label">Progress</span>
                <div class="progress-wrapper">
                  <div class="progress-bar"><div class="progress-fill" :style="{ width: (detailProject?.progress ?? 0) + '%' }"></div></div>
                  <span class="progress-label">{{ detailProject?.progress ?? 0 }}%</span>
                </div>
              </div>
              <div class="detail-card">
                <span class="detail-card-label">Start Date</span>
                <span class="detail-card-value">{{ detailProject?.start_date || '—' }}</span>
              </div>
              <div class="detail-card">
                <span class="detail-card-label">End Date</span>
                <span class="detail-card-value">{{ detailProject?.end_date || '—' }}</span>
              </div>
            </div>
            <div v-if="detailProject?.description" class="detail-description">
              <span class="detail-card-label">Description</span>
              <p>{{ detailProject.description }}</p>
            </div>
          </div>

          <!-- ── Tab: Contributors ── -->
          <div v-if="activeDrawerTab === 'contributors'" class="drawer-body">
            <div class="tab-toolbar">
              <h3 class="tab-section-title">Team Contributors</h3>
              <button class="btn-add-inline" @click="openContributorModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Add Contributor
              </button>
            </div>

            <div v-if="contributorsLoading" class="tab-loading">Loading contributors…</div>
            <div v-else-if="!contributors.length" class="tab-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              <p>No contributors yet. Add team members to get started.</p>
            </div>
            <div v-else class="contributors-list">
              <div v-for="contrib in contributors" :key="contrib.id" class="contributor-card">
                <div class="contributor-avatar">{{ getInitials(contrib.employee?.name || contrib.employee_id) }}</div>
                <div class="contributor-info">
                  <span class="contributor-name">{{ contrib.employee?.name || `Employee #${contrib.employee_id}` }}</span>
                  <span class="contributor-role">{{ contrib.role }}</span>
                </div>
                <div class="contributor-meta">
                  <span :class="['status-pill', `status-${contrib.status}`]">{{ contrib.status }}</span>
                  <div class="progress-wrapper small">
                    <div class="progress-bar"><div class="progress-fill" :style="{ width: (contrib.progress ?? 0) + '%' }"></div></div>
                    <span class="progress-label">{{ contrib.progress ?? 0 }}%</span>
                  </div>
                </div>
                <div class="contributor-actions">
                  <button class="icon-btn edit" @click="openContributorModal(contrib)" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button class="icon-btn tasks" @click="openContributorTasks(contrib)" title="Tasks">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                  </button>
                  <button class="icon-btn delete" @click="deleteContributor(contrib)" title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Tab: Tasks ── -->
          <div v-if="activeDrawerTab === 'tasks'" class="drawer-body">
            <div class="tab-toolbar">
              <h3 class="tab-section-title">Project Tasks</h3>
              <button class="btn-add-inline" @click="openTaskModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Add Task
              </button>
            </div>

            <div v-if="tasksLoading" class="tab-loading">Loading tasks…</div>
            <div v-else-if="!tasks.length" class="tab-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              <p>No tasks yet. Create the first task for this project.</p>
            </div>
            <div v-else class="tasks-list">
              <div v-for="task in tasks" :key="task.id" class="task-card">
                <div class="task-status-dot" :class="`dot-${task.status}`"></div>
                <div class="task-info">
                  <span class="task-name">{{ task.task }}</span>
                  <span :class="['status-pill small', `status-${task.status}`]">{{ task.status }}</span>
                </div>
                <div class="task-actions">
                  <button class="icon-btn edit" @click="openTaskModal(task)" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button class="icon-btn delete" @click="deleteTask(task)" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══════════════════════════════════════════════
       CONTRIBUTOR MODAL
  ══════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="modal-pop">
      <div v-if="showContributorModal" class="modal-overlay" @click.self="showContributorModal = false">
        <div class="mini-modal">
          <div class="mini-modal-header">
            <h3>{{ editingContributor ? 'Edit Contributor' : 'Add Contributor' }}</h3>
            <button class="drawer-close" @click="showContributorModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div class="mini-modal-body">
            <div class="form-group">
              <label>Employee</label>
              <select v-model="contributorForm.employee_id" class="form-control">
                <option value="">Select employee…</option>
                <option v-for="e in allEmployees" :key="e.value" :value="e.value">{{ e.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Role</label>
              <input v-model="contributorForm.role" class="form-control" placeholder="e.g. Lead Developer" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="contributorForm.status" class="form-control">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div class="form-group">
                <label>Progress (%)</label>
                <input v-model="contributorForm.progress" type="number" min="0" max="100" class="form-control" placeholder="0" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Started At</label>
                <input v-model="contributorForm.started_at" type="date" class="form-control" />
              </div>
              <div class="form-group">
                <label>Completed At</label>
                <input v-model="contributorForm.completed_at" type="date" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>Note</label>
              <textarea v-model="contributorForm.note" class="form-control" rows="2" placeholder="Optional notes…"></textarea>
            </div>
          </div>
          <div class="mini-modal-footer">
            <button class="btn-cancel" @click="showContributorModal = false">Cancel</button>
            <button class="btn-save" @click="saveContributor" :disabled="contributorSaving">
              {{ contributorSaving ? 'Saving…' : (editingContributor ? 'Update' : 'Add') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══════════════════════════════════════════════
       TASK MODAL
  ══════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="modal-pop">
      <div v-if="showTaskModal" class="modal-overlay" @click.self="showTaskModal = false">
        <div class="mini-modal">
          <div class="mini-modal-header">
            <h3>{{ editingTask ? 'Edit Task' : 'Add Task' }}</h3>
            <button class="drawer-close" @click="showTaskModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div class="mini-modal-body">
            <div class="form-group">
              <label>Task Description <span class="required">*</span></label>
              <input v-model="taskForm.task" class="form-control" placeholder="Describe the task…" />
            </div>
            <div class="form-group">
              <label>Status <span class="required">*</span></label>
              <select v-model="taskForm.status" class="form-control">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div class="form-group">
              <label>Assign to Contributor</label>
              <select v-model="taskForm.employee_id" class="form-control">
                <option value="">Unassigned</option>
                <option v-for="c in contributors" :key="c.id" :value="c.employee_id">
                  {{ c.employee?.name || `Employee #${c.employee_id}` }} — {{ c.role }}
                </option>
              </select>
            </div>
          </div>
          <div class="mini-modal-footer">
            <button class="btn-cancel" @click="showTaskModal = false">Cancel</button>
            <button class="btn-save" @click="saveTask" :disabled="taskSaving">
              {{ taskSaving ? 'Saving…' : (editingTask ? 'Update' : 'Add') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══════════════════════════════════════════════
       CONTRIBUTOR TASKS MODAL
  ══════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="modal-pop">
      <div v-if="showContribTasksModal" class="modal-overlay" @click.self="showContribTasksModal = false">
        <div class="mini-modal wide">
          <div class="mini-modal-header">
            <div>
              <h3>Assigned Tasks</h3>
              <p class="mini-modal-sub">{{ activeContributor?.employee?.name || `Employee #${activeContributor?.employee_id}` }} · {{ activeContributor?.role }}</p>
            </div>
            <button class="drawer-close" @click="showContribTasksModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div class="mini-modal-body">
            <div class="tab-toolbar" style="margin-bottom:12px">
              <span class="tab-section-title" style="font-size:12px">Contributor Tasks</span>
              <button class="btn-add-inline" @click="openContribTaskForm()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Assign Task
              </button>
            </div>
            <div v-if="contribTasksLoading" class="tab-loading">Loading…</div>
            <div v-else-if="!contribTasks.length" class="tab-empty small">No tasks assigned yet.</div>
            <div v-else class="tasks-list">
              <div v-for="ct in contribTasks" :key="ct.id" class="task-card">
                <div class="task-status-dot dot-pending"></div>
                <div class="task-info">
                  <span class="task-name">{{ ct.assigned_task }}</span>
                  <span class="task-deadline">Due: {{ ct.deadline || '—' }}</span>
                </div>
                <div class="task-actions">
                  <button class="icon-btn edit" @click="openContribTaskForm(ct)" title="Edit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button class="icon-btn delete" @click="deleteContribTask(ct)" title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Inline assign-task form -->
            <div v-if="showContribTaskForm" class="inline-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Task</label>
                  <input v-model="contribTaskForm.assigned_task" class="form-control" placeholder="Task description…" />
                </div>
                <div class="form-group">
                  <label>Deadline</label>
                  <input v-model="contribTaskForm.deadline" type="date" class="form-control" />
                </div>
              </div>
              <div class="inline-form-actions">
                <button class="btn-cancel small" @click="showContribTaskForm = false">Cancel</button>
                <button class="btn-save small" @click="saveContribTask" :disabled="contribTaskSaving">
                  {{ contribTaskSaving ? 'Saving…' : (editingContribTask ? 'Update' : 'Assign') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCrudStore } from '@/store/crud'
import CrudLayout from '../components/CrudLayout.vue'
import FilterPanel from '../components/FilterComponent.vue'
import DataTable from '../components/TableComponent.vue'
import Pagination from '../components/PaginationComponent.vue'
import BaseModal from '../components/ActionModalComponent.vue'

const crudStore = useCrudStore()
const baseUrl = process.env.VUE_APP_BASE_URL
const baseApi = process.env.VUE_APP_BASE_API
const layoutRef = ref(null)

// ── Auth token helper ─────────────────────────────────────────────────────────
// Reads whichever key your auth store uses; falls back through common names
const getAuthToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('token') ||
  sessionStorage.getItem('auth_token') ||
  sessionStorage.getItem('token') ||
  ''

// ── Central fetch wrapper ─────────────────────────────────────────────────────
const apiFetch = async (url, options = {}) => {
  const token = getAuthToken()

  const defaultHeaders = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }

  // Merge headers; if caller passes Content-Type (JSON body) keep it,
  // but never set Content-Type when sending FormData (browser sets boundary)
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  }

  const res = await fetch(`${baseApi}${url}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const msg = errBody?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }

  return res.json()
}

// ── Company state ─────────────────────────────────────────────────────────────
const allCompanies = ref([])
const selectedCompanyId = ref('')
const selectedCompanyLabel = computed(() => {
  const c = allCompanies.value.find(c => c.value == selectedCompanyId.value)
  return c ? c.label : ''
})

// ── Employee state ────────────────────────────────────────────────────────────
const allEmployees = ref([])

// ── Modal state ───────────────────────────────────────────────────────────────
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref('create')
const selectedItem = ref({})

// ── Detail Drawer ─────────────────────────────────────────────────────────────
const showDetailDrawer = ref(false)
const detailProject = ref(null)
const activeDrawerTab = ref('overview')

// ── Contributors ──────────────────────────────────────────────────────────────
const contributors = ref([])
const contributorsLoading = ref(false)
const showContributorModal = ref(false)
const editingContributor = ref(null)
const contributorSaving = ref(false)
const contributorForm = ref({
  employee_id: '', role: '', status: 'active', progress: 0,
  note: '', started_at: '', completed_at: ''
})

// ── Tasks ─────────────────────────────────────────────────────────────────────
const tasks = ref([])
const tasksLoading = ref(false)
const showTaskModal = ref(false)
const editingTask = ref(null)
const taskSaving = ref(false)
const taskForm = ref({ task: '', status: 'pending', employee_id: '' })

// ── Contributor Tasks ─────────────────────────────────────────────────────────
const activeContributor = ref(null)
const contribTasks = ref([])
const contribTasksLoading = ref(false)
const showContribTasksModal = ref(false)
const showContribTaskForm = ref(false)
const editingContribTask = ref(null)
const contribTaskSaving = ref(false)
const contribTaskForm = ref({ assigned_task: '', deadline: '' })

// ── Notification ──────────────────────────────────────────────────────────────
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })
const notify = (type, message, { title = '', autoClose = 3000 } = {}) => {
  if (layoutRef.value?.showBanner) {
    layoutRef.value.showBanner(type, message, { title, autoClose })
    return
  }
  notification.value = { show: false, type, title, message, autoClose }
  setTimeout(() => { notification.value = { show: true, type, title, message, autoClose } }, 0)
}

// ── Store computed ────────────────────────────────────────────────────────────
// Guard against non-array (e.g. raw API response object)
const items = computed(() => {
  const raw = crudStore.getAllItems
  return Array.isArray(raw) ? raw : (raw?.projects ?? raw?.data ?? [])
})

const isLoading = computed(() => crudStore.isLoading)
const hasError = computed(() => crudStore.hasError)
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred')

const pagination = ref({ current_page: 1, total_pages: 1, total: 0, per_page: 10 })

const pageStats = computed(() => [
  { label: 'Total',     value: pagination.value.total },
  { label: 'Active',    value: items.value.filter(i => i.status === 'active').length },
  { label: 'Completed', value: items.value.filter(i => i.status === 'completed').length },
  { label: 'On Hold',   value: items.value.filter(i => i.status === 'on_hold').length },
])

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Project Management' },
]

const drawerTabs = computed(() => [
  {
    key: 'overview', label: 'Overview',
    icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>'
  },
  {
    key: 'contributors', label: 'Contributors', count: contributors.value.length,
    icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>'
  },
  {
    key: 'tasks', label: 'Tasks', count: tasks.value.length,
    icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>'
  },
])

// ── Search / sort / pagination ────────────────────────────────────────────────
const searchFilters = ref({ search: '', status: '', priority: '', date: '' })
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortConfig = ref({ by: 'created_at', order: 'desc' })

// ── Form fields (category removed) ───────────────────────────────────────────
const formFields = computed(() => [
  {
    name: 'company_id', label: 'Company', type: 'select', required: true,
    placeholder: 'Select company…', options: allCompanies.value,
    default: selectedCompanyId.value,
  },
  {
    name: 'name', label: 'Project Name', type: 'text', required: true,
    placeholder: 'Enter project name…',
  },
  {
    name: 'description', label: 'Description', type: 'textarea', required: false,
    placeholder: 'Describe the project goals and scope…',
  },
  {
    name: 'priority', label: 'Priority', type: 'select', required: true,
    placeholder: 'Select priority…',
    options: [
      { value: 'low',      label: 'Low' },
      { value: 'medium',   label: 'Medium' },
      { value: 'high',     label: 'High' },
      { value: 'critical', label: 'Critical' },
    ],
  },
  { name: 'start_date', label: 'Start Date', type: 'date', required: true },
  { name: 'end_date',   label: 'End Date',   type: 'date', required: true },
  {
    name: 'budget', label: 'Budget', type: 'number', required: false,
    placeholder: 'Enter budget amount…',
  },
  {
    name: 'manager_id', label: 'Project Manager', type: 'select', required: true,
    placeholder: 'Assign a project manager…', options: allEmployees.value,
  },
  { name: 'thumbnail', label: 'Thumbnail', type: 'file', required: false, accept: 'image/*' },
  {
    name: 'status', label: 'Status', type: 'radio', required: true, default: 'active',
    options: [
      { value: 'active',    label: 'Active' },
      { value: 'on_hold',   label: 'On Hold' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
])

const filterFields = [
  {
    name: 'search', label: 'Name or Description', type: 'text',
    placeholder: 'Search by name or description…',
  },
  {
    name: 'status', label: 'Status', type: 'select', placeholder: 'All Statuses',
    options: [
      { value: 'active',    label: 'Active' },
      { value: 'on_hold',   label: 'On Hold' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  {
    name: 'priority', label: 'Priority', type: 'select', placeholder: 'All Priorities',
    options: [
      { value: 'low',      label: 'Low' },
      { value: 'medium',   label: 'Medium' },
      { value: 'high',     label: 'High' },
      { value: 'critical', label: 'Critical' },
    ],
  },
  { name: 'date', label: 'Start Date', type: 'date' },
]

// Category column removed
const tableColumns = [
  { key: 'id',         label: 'ID',         sortable: true,  width: '60px',  minWidth: '60px' },
  { key: 'thumbnail',  label: 'Thumb',      type: 'custom',  sortable: false, width: '70px',  minWidth: '70px',  align: 'center' },
  { key: 'name',       label: 'Name',       sortable: true,  width: '200px', minWidth: '130px' },
  { key: 'priority',   label: 'Priority',   type: 'custom',  sortable: true,  width: '110px', minWidth: '90px',  align: 'center' },
  { key: 'progress',   label: 'Progress',   type: 'custom',  sortable: false, width: '140px', minWidth: '120px' },
  { key: 'start_date', label: 'Start Date', sortable: true,  width: '120px', minWidth: '100px' },
  { key: 'end_date',   label: 'End Date',   sortable: true,  width: '120px', minWidth: '100px' },
  { key: 'status',     label: 'Status',     type: 'status',  sortable: true,  width: '110px', minWidth: '90px',  align: 'center' },
  { key: 'actions',    label: 'Actions',    type: 'actions', sortable: false, width: '160px', minWidth: '160px', align: 'center' },
]

const tableActions = [
  { name: 'view',   label: 'View',   class: 'btn-view' },
  { name: 'edit',   label: 'Edit',   class: 'btn-edit' },
  { name: 'delete', label: 'Delete', class: 'btn-delete' },
]

const paginatedData = computed(() => items.value)

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?'
  const str = String(name)
  return str.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ── API loaders ───────────────────────────────────────────────────────────────
const loadCompanies = async () => {
  try {
    const data = await apiFetch('/system/companies')
    allCompanies.value = data.companies ?? []
  } catch {
    notify('warning', 'Could not load company list.', { autoClose: 3000 })
  }
}

const loadEmployees = async (companyId) => {
  if (!companyId) { allEmployees.value = []; return }
  try {
    const data = await apiFetch(`/system/employee-list/${companyId}`)
    allEmployees.value = data.employee ?? []
  } catch {
    notify('warning', 'Could not load employee list.', { autoClose: 3000 })
  }
}

const loadData = async () => {
  if (!selectedCompanyId.value) return
  crudStore.clearError()
  const params = {
    page:  currentPage.value,
    limit: itemsPerPage.value,
    ...(searchFilters.value.search   && { search:     searchFilters.value.search }),
    ...(searchFilters.value.status   && { status:     searchFilters.value.status }),
    ...(searchFilters.value.priority && { priority:   searchFilters.value.priority }),
    ...(searchFilters.value.date     && { date:       searchFilters.value.date }),
    ...(sortConfig.value.by          && { sort_by:    sortConfig.value.by, sort_order: sortConfig.value.order }),
  }
  const result = await crudStore.fetchAll(`/projects/${selectedCompanyId.value}`, params)
  if (!result.success) {
    notify('error', result.error?.message || 'Failed to load projects.')
    return
  }
  pagination.value = result.data?.pagination ?? {
    current_page: 1, total_pages: 1,
    total: items.value.length, per_page: itemsPerPage.value,
  }
}

const onCompanyChange = async () => {
  currentPage.value = 1
  await loadEmployees(selectedCompanyId.value)
  await loadData()
}

// ── Contributors API ──────────────────────────────────────────────────────────
const loadContributors = async (projectId) => {
  contributorsLoading.value = true
  try {
    const data = await apiFetch(`/projects/contributors/${projectId}`)
    contributors.value = data.contributors ?? []
  } catch {
    contributors.value = []
  } finally {
    contributorsLoading.value = false
  }
}

const openContributorModal = (contrib = null) => {
  editingContributor.value = contrib
  if (contrib) {
    contributorForm.value = {
      employee_id:  contrib.employee_id,
      role:         contrib.role,
      status:       contrib.status,
      progress:     contrib.progress,
      note:         contrib.note,
      started_at:   contrib.started_at,
      completed_at: contrib.completed_at,
    }
  } else {
    contributorForm.value = {
      employee_id: '', role: '', status: 'active',
      progress: 0, note: '', started_at: '', completed_at: '',
    }
  }
  showContributorModal.value = true
}

const saveContributor = async () => {
  if (!contributorForm.value.employee_id) {
    notify('error', 'Please select an employee.')
    return
  }
  contributorSaving.value = true
  try {
    const payload = {
      ...contributorForm.value,
      company_id: selectedCompanyId.value,
      project_id: detailProject.value.id,
    }
    if (editingContributor.value) {
      await apiFetch(`/projects/contributors/${editingContributor.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      notify('success', 'Contributor updated.')
    } else {
      await apiFetch('/projects/contributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      notify('success', 'Contributor added.')
    }
    showContributorModal.value = false
    await loadContributors(detailProject.value.id)
  } catch (e) {
    notify('error', e.message || 'Failed to save contributor.')
  } finally {
    contributorSaving.value = false
  }
}

const deleteContributor = async (contrib) => {
  if (!confirm(`Remove ${contrib.employee?.name || 'this contributor'} from the project?`)) return
  try {
    await apiFetch(`/projects/contributors/${contrib.id}`, { method: 'DELETE' })
    notify('success', 'Contributor removed.')
    await loadContributors(detailProject.value.id)
  } catch (e) {
    notify('error', e.message || 'Failed to remove contributor.')
  }
}

// ── Tasks API ─────────────────────────────────────────────────────────────────
const loadTasks = async (projectId) => {
  tasksLoading.value = true
  try {
    const data = await apiFetch(`/projects/tasks/${projectId}`)
    tasks.value = data.tasks ?? []
  } catch {
    tasks.value = []
  } finally {
    tasksLoading.value = false
  }
}

const openTaskModal = (task = null) => {
  editingTask.value = task
  taskForm.value = task
    ? { task: task.task, status: task.status, employee_id: task.employee_id ?? '' }
    : { task: '', status: 'pending', employee_id: '' }
  showTaskModal.value = true
}

const saveTask = async () => {
  if (!taskForm.value.task) { notify('error', 'Task description is required.'); return }
  taskSaving.value = true
  try {
    const payload = {
      ...taskForm.value,
      company_id: selectedCompanyId.value,
      project_id: detailProject.value.id,
    }
    if (editingTask.value) {
      await apiFetch(`/projects/tasks/${editingTask.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      notify('success', 'Task updated.')
    } else {
      await apiFetch('/projects/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      notify('success', 'Task created.')
    }
    showTaskModal.value = false
    await loadTasks(detailProject.value.id)
  } catch (e) {
    notify('error', e.message || 'Failed to save task.')
  } finally {
    taskSaving.value = false
  }
}

const deleteTask = async (task) => {
  if (!confirm('Delete this task?')) return
  try {
    await apiFetch(`/projects/tasks/${task.id}`, { method: 'DELETE' })
    notify('success', 'Task deleted.')
    await loadTasks(detailProject.value.id)
  } catch (e) {
    notify('error', e.message || 'Failed to delete task.')
  }
}

// ── Contributor Tasks API ─────────────────────────────────────────────────────
const openContributorTasks = async (contrib) => {
  activeContributor.value = contrib
  contribTasks.value = []
  showContribTaskForm.value = false
  editingContribTask.value = null
  showContribTasksModal.value = true
  contribTasksLoading.value = true
  try {
    const data = await apiFetch(`/projects/contributor-tasks/${detailProject.value.id}/${contrib.id}`)
    contribTasks.value = data.tasks ?? []
  } catch {
    contribTasks.value = []
  } finally {
    contribTasksLoading.value = false
  }
}

const openContribTaskForm = (ct = null) => {
  editingContribTask.value = ct
  contribTaskForm.value = ct
    ? { assigned_task: ct.assigned_task, deadline: ct.deadline }
    : { assigned_task: '', deadline: '' }
  showContribTaskForm.value = true
}

const saveContribTask = async () => {
  if (!contribTaskForm.value.assigned_task) { notify('error', 'Task is required.'); return }
  contribTaskSaving.value = true
  try {
    const payload = {
      ...contribTaskForm.value,
      company_id:     selectedCompanyId.value,
      project_id:     detailProject.value.id,
      employee_id:    activeContributor.value.employee_id,
      contributor_id: activeContributor.value.id,
    }
    if (editingContribTask.value) {
      await apiFetch(`/projects/contributor-tasks/${editingContribTask.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/projects/contributor-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    showContribTaskForm.value = false
    notify('success', 'Task saved.')
    await openContributorTasks(activeContributor.value)
  } catch (e) {
    notify('error', e.message || 'Failed to save task.')
  } finally {
    contribTaskSaving.value = false
  }
}

const deleteContribTask = async (ct) => {
  if (!confirm('Delete this assigned task?')) return
  try {
    await apiFetch(`/projects/contributor-tasks/${ct.id}`, { method: 'DELETE' })
    await openContributorTasks(activeContributor.value)
    notify('success', 'Task removed.')
  } catch (e) {
    notify('error', e.message || 'Failed to delete task.')
  }
}

// ── Drawer ────────────────────────────────────────────────────────────────────
const openDetailDrawer = async (item) => {
  activeDrawerTab.value = 'overview'
  detailProject.value = item
  showDetailDrawer.value = true
  await Promise.all([loadContributors(item.id), loadTasks(item.id)])
}

const closeDetailDrawer = () => {
  showDetailDrawer.value = false
  detailProject.value = null
}

// ── Modal openers ─────────────────────────────────────────────────────────────
const openCreateModal = () => {
  if (!selectedCompanyId.value) {
    notify('warning', 'Please select a company first.')
    return
  }
  modalMode.value = 'create'
  selectedItem.value = { company_id: selectedCompanyId.value }
  showFormModal.value = true
}

const openEditModal = async (item) => {
  const result = await crudStore.fetchById('/projects/', item.id)
  if (result.success) {
    modalMode.value = 'edit'
    selectedItem.value = { ...result.data }
    showFormModal.value = true
  } else {
    notify('error', result.error?.message || 'Could not load project.')
  }
}

const openDeleteModal = (item) => {
  selectedItem.value = { ...item }
  showDeleteModal.value = true
}

// ── Submit handlers ───────────────────────────────────────────────────────────
const handleFormSubmit = async (data, mode, initialData) => {
  const fd = new FormData()
  const plain = data instanceof FormData ? Object.fromEntries(data.entries()) : data
  Object.entries(plain).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') fd.append(k, v instanceof File ? v : String(v))
  })
  let result
  if (mode === 'create') {
    result = await crudStore.create('/projects', fd)
  } else {
    fd.append('_method', 'PUT')
    result = await crudStore.post(`/projects/${initialData.id}`, fd)
  }
  if (!result.success) throw new Error(result.error?.message ?? 'Request failed')
  return result.data
}

const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/projects/', data.id)
  if (!result.success) throw new Error(result.error?.message ?? 'Delete failed')
  return result.data
}

const handleModalSuccess = ({ data, mode }) => {
  showFormModal.value = false
  notify('success', `Project ${mode === 'create' ? 'created' : 'updated'} successfully!`, {
    title: data?.name, autoClose: 3000,
  })
  loadData()
}

const handleDeleteSuccess = () => {
  showDeleteModal.value = false
  notify('success', 'Project deleted successfully.', { autoClose: 3000 })
  loadData()
}

const handleModalError = ({ error }) => {
  let msg = error?.message || 'An unexpected error occurred.'
  if (error?.response?.data?.errors) {
    msg = Object.entries(error.response.data.errors)
      .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`)
      .join(' · ')
  }
  notify('error', msg)
}

// ── Sort / search / pagination ────────────────────────────────────────────────
const handleSearch     = () => { currentPage.value = 1; loadData() }
const handleReset      = () => { searchFilters.value = { search: '', status: '', priority: '', date: '' }; currentPage.value = 1; loadData() }
const handleSort       = (s) => { sortConfig.value = s; currentPage.value = 1; loadData() }
const handlePageChange = (page) => { currentPage.value = page; loadData() }
const handlePageSizeChange = (pageSize) => { itemsPerPage.value = pageSize; currentPage.value = 1; loadData() }
const handleAction     = ({ action, row }) => ({ view: openDetailDrawer, edit: openEditModal, delete: openDeleteModal }[action]?.(row))

onMounted(async () => {
  await loadCompanies()
  // Auto-select if only one company
  if (allCompanies.value.length === 1) {
    selectedCompanyId.value = allCompanies.value[0].value
    await onCompanyChange()
  }
})

onBeforeUnmount(() => crudStore.clearCurrentItem())
</script>

<style scoped>
/* ══════════════════════════════════════════
   COMPANY SELECTOR BAR
══════════════════════════════════════════ */
.company-selector-bar {
  padding: 10px 16px;
  background: rgba(201, 169, 110, 0.04);
  border-bottom: 1px solid rgba(201, 169, 110, 0.12);
}
.company-selector-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.company-selector-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(240, 234, 224, 0.45);
}
.company-select {
  background: rgba(240, 234, 224, 0.05);
  border: 1px solid rgba(201, 169, 110, 0.25);
  border-radius: 5px;
  color: rgba(240, 234, 224, 0.85);
  font-size: 13px;
  padding: 6px 28px 6px 10px;
  outline: none;
  min-width: 200px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.company-select:focus { border-color: rgba(201, 169, 110, 0.6); }
.company-active-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: rgba(201, 169, 110, 0.1);
  border: 1px solid rgba(201, 169, 110, 0.3);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: #c9a96e;
}

/* ══════════════════════════════════════════
   THUMBNAIL
══════════════════════════════════════════ */
.project-thumbnail {
  width: 38px; height: 38px;
  border-radius: 6px; object-fit: cover;
  border: 1px solid rgba(201, 169, 110, 0.25);
}
.project-thumbnail-placeholder {
  width: 38px; height: 38px;
  border-radius: 6px; display: flex;
  align-items: center; justify-content: center;
  background: rgba(201, 169, 110, 0.08);
  border: 1px solid rgba(201, 169, 110, 0.2);
  color: rgba(240, 234, 224, 0.35);
}

/* ══════════════════════════════════════════
   PRIORITY BADGE
══════════════════════════════════════════ */
.priority-badge {
  display: inline-block; padding: 3px 10px;
  font-size: 10.5px; font-weight: 500; letter-spacing: 0.06em;
  text-transform: uppercase; white-space: nowrap; border-radius: 3px;
}
.priority-low     { background: rgba(34,197,94,.1);  border: 1px solid rgba(34,197,94,.3);  color: #86efac; }
.priority-medium  { background: rgba(234,179,8,.1);  border: 1px solid rgba(234,179,8,.3);  color: #fde047; }
.priority-high    { background: rgba(249,115,22,.1); border: 1px solid rgba(249,115,22,.3); color: #fdba74; }
.priority-critical{ background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.3);  color: #fca5a5; }

/* ══════════════════════════════════════════
   STATUS PILL
══════════════════════════════════════════ */
.status-pill {
  display: inline-flex; align-items: center;
  padding: 3px 9px; border-radius: 20px;
  font-size: 10.5px; font-weight: 500;
  letter-spacing: 0.05em; text-transform: capitalize;
}
.status-pill.small { font-size: 10px; padding: 2px 7px; }
.status-active     { background: rgba(34,197,94,.1);   border: 1px solid rgba(34,197,94,.3);   color: #86efac; }
.status-inactive   { background: rgba(156,163,175,.1); border: 1px solid rgba(156,163,175,.3); color: #d1d5db; }
.status-on_hold    { background: rgba(234,179,8,.1);   border: 1px solid rgba(234,179,8,.3);   color: #fde047; }
.status-completed  { background: rgba(99,102,241,.1);  border: 1px solid rgba(99,102,241,.3);  color: #a5b4fc; }
.status-cancelled  { background: rgba(239,68,68,.1);   border: 1px solid rgba(239,68,68,.3);   color: #fca5a5; }
.status-pending    { background: rgba(234,179,8,.08);  border: 1px solid rgba(234,179,8,.25);  color: #fde047; }
.status-in_progress{ background: rgba(59,130,246,.1);  border: 1px solid rgba(59,130,246,.3);  color: #93c5fd; }
.status-blocked    { background: rgba(239,68,68,.1);   border: 1px solid rgba(239,68,68,.3);   color: #fca5a5; }

/* ══════════════════════════════════════════
   PROGRESS
══════════════════════════════════════════ */
.progress-wrapper { display: flex; align-items: center; gap: 8px; }
.progress-wrapper.small { gap: 5px; }
.progress-bar {
  flex: 1; height: 6px;
  background: rgba(240,234,224,.1); border-radius: 99px; overflow: hidden; min-width: 50px;
}
.progress-wrapper.small .progress-bar { height: 4px; min-width: 36px; }
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(201,169,110,.7), rgba(201,169,110,1));
  border-radius: 99px; transition: width .3s ease;
}
.progress-label { font-size: 11px; color: rgba(240,234,224,.55); min-width: 28px; text-align: right; }
.cell-dash { color: rgba(240,234,224,.25); font-size: 14px; }

/* ══════════════════════════════════════════
   DETAIL DRAWER
══════════════════════════════════════════ */
.drawer-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.5); backdrop-filter: blur(3px);
  display: flex; justify-content: flex-end;
}
.detail-drawer {
  width: 520px; max-width: 100vw; height: 100%;
  background: #1a1610;
  border-left: 1px solid rgba(201,169,110,.18);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(201,169,110,.12);
  background: rgba(201,169,110,.03);
  flex-shrink: 0;
}
.drawer-header-left { display: flex; align-items: center; gap: 14px; }
.drawer-thumb {
  width: 48px; height: 48px; border-radius: 8px;
  object-fit: cover; border: 1px solid rgba(201,169,110,.3);
}
.drawer-thumb-placeholder {
  width: 48px; height: 48px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(201,169,110,.08); border: 1px solid rgba(201,169,110,.2);
  color: rgba(240,234,224,.3);
}
.drawer-title   { font-size: 16px; font-weight: 600; color: rgba(240,234,224,.92); margin: 0 0 2px; }
.drawer-subtitle{ font-size: 12px; color: rgba(240,234,224,.4); margin: 0; text-transform: capitalize; }
.drawer-close {
  background: none; border: none; cursor: pointer; padding: 6px;
  color: rgba(240,234,224,.4); border-radius: 4px; transition: color .2s, background .2s;
}
.drawer-close:hover { color: rgba(240,234,224,.8); background: rgba(240,234,224,.08); }

/* ── Drawer Tabs ── */
.drawer-tabs {
  display: flex; border-bottom: 1px solid rgba(201,169,110,.1);
  flex-shrink: 0; background: rgba(0,0,0,.15);
}
.drawer-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 18px; background: none; border: none;
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
.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
}
.detail-card {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px 14px;
  background: rgba(240,234,224,.03);
  border: 1px solid rgba(201,169,110,.1);
  border-radius: 6px;
}
.detail-card-label {
  font-size: 10.5px; font-weight: 600;
  letter-spacing: 0.07em; text-transform: uppercase;
  color: rgba(240,234,224,.35);
}
.detail-card-value { font-size: 13.5px; color: rgba(240,234,224,.8); font-weight: 500; }
.detail-description {
  padding: 14px; background: rgba(240,234,224,.02);
  border: 1px solid rgba(201,169,110,.1); border-radius: 6px;
  display: flex; flex-direction: column; gap: 8px;
}
.detail-description p { margin: 0; font-size: 13px; color: rgba(240,234,224,.65); line-height: 1.6; }

/* ══════════════════════════════════════════
   TAB TOOLBAR
══════════════════════════════════════════ */
.tab-toolbar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
}
.tab-section-title { font-size: 13px; font-weight: 600; color: rgba(240,234,224,.7); }
.tab-loading { padding: 24px; text-align: center; color: rgba(240,234,224,.4); font-size: 13px; }
.tab-empty {
  padding: 32px 16px; text-align: center;
  color: rgba(240,234,224,.35); font-size: 13px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.tab-empty.small { padding: 16px; }
.tab-empty svg { color: rgba(240,234,224,.2); }
.btn-add-inline {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: 4px;
  background: rgba(201,169,110,.1); border: 1px solid rgba(201,169,110,.3);
  color: #c9a96e; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: background .2s;
}
.btn-add-inline:hover { background: rgba(201,169,110,.18); }

/* ══════════════════════════════════════════
   CONTRIBUTORS LIST
══════════════════════════════════════════ */
.contributors-list { display: flex; flex-direction: column; gap: 8px; }
.contributor-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: rgba(240,234,224,.03);
  border: 1px solid rgba(201,169,110,.1);
  border-radius: 7px; transition: border-color .2s;
}
.contributor-card:hover { border-color: rgba(201,169,110,.2); }
.contributor-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(201,169,110,.15); border: 1px solid rgba(201,169,110,.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #c9a96e; flex-shrink: 0;
}
.contributor-info { flex: 1; min-width: 0; }
.contributor-name { display: block; font-size: 13px; font-weight: 500; color: rgba(240,234,224,.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.contributor-role { display: block; font-size: 11px; color: rgba(240,234,224,.4); margin-top: 1px; }
.contributor-meta { display: flex; flex-direction: column; gap: 5px; align-items: flex-end; }
.contributor-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* ══════════════════════════════════════════
   TASKS LIST
══════════════════════════════════════════ */
.tasks-list { display: flex; flex-direction: column; gap: 6px; }
.task-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: rgba(240,234,224,.03);
  border: 1px solid rgba(201,169,110,.1); border-radius: 6px;
}
.task-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-pending     { background: #fde047; }
.dot-in_progress { background: #93c5fd; }
.dot-completed   { background: #86efac; }
.dot-blocked     { background: #fca5a5; }
.task-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.task-name { font-size: 13px; color: rgba(240,234,224,.8); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-deadline { font-size: 11px; color: rgba(240,234,224,.35); white-space: nowrap; }
.task-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* ══════════════════════════════════════════
   ICON BUTTONS
══════════════════════════════════════════ */
.icon-btn {
  width: 28px; height: 28px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid transparent;
  cursor: pointer; transition: all .2s;
}
.icon-btn.edit   { color: rgba(201,169,110,.6); }
.icon-btn.edit:hover   { background: rgba(201,169,110,.1); border-color: rgba(201,169,110,.25); color: #c9a96e; }
.icon-btn.delete { color: rgba(239,68,68,.5); }
.icon-btn.delete:hover { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.25); color: #fca5a5; }
.icon-btn.tasks  { color: rgba(99,102,241,.6); }
.icon-btn.tasks:hover  { background: rgba(99,102,241,.1); border-color: rgba(99,102,241,.25); color: #a5b4fc; }

/* ══════════════════════════════════════════
   MINI MODALS
══════════════════════════════════════════ */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.mini-modal {
  background: #1a1610; border: 1px solid rgba(201,169,110,.2);
  border-radius: 10px; width: 420px; max-width: 100%;
  max-height: 90vh; display: flex; flex-direction: column;
  overflow: hidden;
}
.mini-modal.wide { width: 560px; }
.mini-modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(201,169,110,.12);
  flex-shrink: 0;
}
.mini-modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: rgba(240,234,224,.9); }
.mini-modal-sub { margin: 3px 0 0; font-size: 11.5px; color: rgba(240,234,224,.4); }
.mini-modal-body { flex: 1; overflow-y: auto; padding: 18px 20px; }
.mini-modal-footer {
  padding: 14px 20px;
  border-top: 1px solid rgba(201,169,110,.1);
  display: flex; justify-content: flex-end; gap: 8px;
  flex-shrink: 0;
}

/* ── Form controls ── */
.form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.form-group:last-child { margin-bottom: 0; }
.form-group label { font-size: 11.5px; font-weight: 600; color: rgba(240,234,224,.45); letter-spacing: 0.06em; text-transform: uppercase; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-control {
  background: rgba(240,234,224,.05);
  border: 1px solid rgba(201,169,110,.2);
  border-radius: 5px; color: rgba(240,234,224,.85);
  font-size: 13px; padding: 8px 10px; outline: none;
  transition: border-color .2s; width: 100%; box-sizing: border-box;
}
.form-control:focus { border-color: rgba(201,169,110,.5); }
.form-control::placeholder { color: rgba(240,234,224,.25); }
textarea.form-control { resize: vertical; min-height: 60px; }
.required { color: #fca5a5; }

.btn-save {
  padding: 8px 18px; border-radius: 5px;
  background: rgba(201,169,110,.15); border: 1px solid rgba(201,169,110,.4);
  color: #c9a96e; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background .2s;
}
.btn-save:hover:not(:disabled) { background: rgba(201,169,110,.25); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save.small { padding: 6px 14px; font-size: 12px; }
.btn-cancel {
  padding: 8px 16px; border-radius: 5px;
  background: transparent; border: 1px solid rgba(240,234,224,.15);
  color: rgba(240,234,224,.5); font-size: 13px;
  cursor: pointer; transition: all .2s;
}
.btn-cancel:hover { border-color: rgba(240,234,224,.3); color: rgba(240,234,224,.75); }
.btn-cancel.small { padding: 6px 12px; font-size: 12px; }

/* ── Inline form ── */
.inline-form {
  margin-top: 14px; padding: 14px;
  background: rgba(201,169,110,.04);
  border: 1px solid rgba(201,169,110,.15);
  border-radius: 6px;
}
.inline-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }

/* ══════════════════════════════════════════
   TRANSITIONS
══════════════════════════════════════════ */
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity .25s ease; }
.drawer-fade-enter-active .detail-drawer, .drawer-fade-leave-active .detail-drawer { transition: transform .3s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-fade-enter-from .detail-drawer, .drawer-fade-leave-to .detail-drawer { transform: translateX(100%); }

.modal-pop-enter-active, .modal-pop-leave-active { transition: opacity .2s ease; }
.modal-pop-enter-active .mini-modal, .modal-pop-leave-active .mini-modal { transition: transform .2s ease, opacity .2s ease; }
.modal-pop-enter-from, .modal-pop-leave-to { opacity: 0; }
.modal-pop-enter-from .mini-modal, .modal-pop-leave-to .mini-modal { transform: scale(.95); opacity: 0; }

/* ══════════════════════════════════════════
   TABLE LAYOUT
══════════════════════════════════════════ */
:deep(table) { table-layout: auto; width: 100%; }
:deep(td .cell-text) { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
:deep(td .cell-actions) { white-space: nowrap; overflow: visible; }
</style>