<template>
  <CrudLayout ref="layoutRef" title="Project Management" subtitle="Manage projects, timelines and team assignments"
    add-label="New Project" :breadcrumbs="breadcrumbs" :stats="pageStats" :loading="isLoading"
    loading-message="Loading projects" :error="hasError ? errorMessage : ''" error-title="Failed to Load Projects"
    :has-data="!!items.length" :notification="notification" @add="openCreateModal" @retry="loadData">
    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 0 0-6 0c0 .14.11.56.18 1H10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v18h20V8a2 2 0 0 0-2-2zm-7-1a1 1 0 0 1 2 0c0 .63-.45 1.41-1 2.17C13.45 6.41 13 5.63 13 5zM4 4h4v2H4V4zm0 4h4v2H4V8zm4 10H4v-2h4v2zm0-4H4v-2h4v2zm10 4h-8v-2h8v2zm0-4h-8v-2h8v2zm0-4h-8v-2h8v2z" />
      </svg>
    </template>

    <!-- ── Company Selector Bar ── -->
    <template #before-filters>
      <div class="company-selector-bar">
        <div class="company-selector-inner">
          <span class="company-selector-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
            </svg>
            Company
          </span>
          <select class="company-select" v-model="selectedCompanyId" @change="onCompanyChange">
            <option value="">— Select a company —</option>
            <option v-for="c in allCompanies" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
          <span v-if="selectedCompanyLabel" class="company-active-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            {{ selectedCompanyLabel }}
          </span>
        </div>
      </div>
    </template>

    <!-- ── Filters ── -->
    <template #filters>
      <FilterPanel title="Search & Filter" :fields="filterFields" v-model="searchFilters" @submit="handleSearch"
        @reset="handleReset" />
    </template>

    <!-- ── Table ── -->
    <DataTable :data="paginatedData" :columns="tableColumns" :actions="tableActions" result-label="projects"
      @action="handleAction" @sort="handleSort">
      <template #cell-thumbnail="{ value }">
        <img v-if="value" :src="baseUrl + '/' + value" alt="thumbnail" class="project-thumbnail" />
        <div v-else class="project-thumbnail-placeholder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
          </svg>
        </div>
      </template>

      <template #cell-priority="{ value }">
        <span v-if="value" :class="['priority-badge', `priority-${value}`]">{{ value }}</span>
        <span v-else class="cell-dash">—</span>
      </template>

      <template #cell-progress="{ value }">
        <div class="progress-wrapper">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (value ?? 0) + '%' }"></div>
          </div>
          <span class="progress-label">{{ value ?? 0 }}%</span>
        </div>
      </template>
    </DataTable>

    <!-- ── Pagination ── -->
    <template #pagination>
      <Pagination v-model="currentPage" :total-items="pagination.total" :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]" item-label="projects" :show-first-last="true" :show-labels="false"
        :show-jump-to="false" @update:page-size="handlePageSizeChange" @page-change="handlePageChange" />
    </template>
  </CrudLayout>

  <!-- ══════════════════════════════════════════════
       PROJECT FORM MODAL (Create / Edit)
  ══════════════════════════════════════════════ -->
  <BaseModal v-model="showFormModal" :mode="modalMode" entity-name="project" :fields="formFields"
    :initial-data="selectedItem" :on-submit="handleFormSubmit" size="large" @success="handleModalSuccess"
    @error="handleModalError" />

  <!-- ══════════════════════════════════════════════
       DELETE PROJECT MODAL
  ══════════════════════════════════════════════ -->
  <BaseModal v-model="showDeleteModal" mode="delete" entity-name="project" :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This project and all its data will be permanently removed from the system."
    @success="handleDeleteSuccess" @error="handleModalError" />

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
              <img v-if="detailProject?.thumbnail" :src="baseUrl + '/' + detailProject.thumbnail"
                class="drawer-thumb" />
              <div v-else class="drawer-thumb-placeholder">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div>
                <h2 class="drawer-title">{{ detailProject?.name }}</h2>
                <p class="drawer-subtitle">{{ detailProject?.status }}</p>
              </div>
            </div>
            <button class="drawer-close" @click="closeDetailDrawer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <!-- Drawer Tabs -->
          <div class="drawer-tabs">
            <button v-for="tab in drawerTabs" :key="tab.key"
              :class="['drawer-tab', { active: activeDrawerTab === tab.key }]" @click="activeDrawerTab = tab.key">
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
                <span :class="['priority-badge', `priority-${detailProject?.priority}`]">{{ detailProject?.priority
                }}</span>
              </div>
              <div class="detail-card">
                <span class="detail-card-label">Budget</span>
                <span class="detail-card-value">${{ Number(detailProject?.budget ?? 0).toLocaleString() }}</span>
              </div>
              <div class="detail-card">
                <span class="detail-card-label">Progress</span>
                <div class="progress-wrapper">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: (detailProject?.progress ?? 0) + '%' }"></div>
                  </div>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add Contributor
              </button>
            </div>

            <div v-if="contributorsLoading" class="tab-loading">Loading contributors…</div>
            <div v-else-if="!contributors.length" class="tab-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <p>No contributors yet. Add team members to get started.</p>
            </div>
            <div v-else class="contributors-list">
              <div v-for="contrib in contributors" :key="contrib.id" class="contributor-card">
                <div class="contributor-avatar">{{ getInitials(contrib.employee?.name || contrib.employee_id) }}</div>
                <div class="contributor-info">
                  <span class="contributor-name">{{ contrib.employee?.name || `Employee #${contrib.employee_id}`
                  }}</span>
                  <span class="contributor-role">{{ contrib.role }}</span>
                </div>
                <div class="contributor-meta">
                  <span :class="['status-pill', `status-${contrib.status}`]">{{ contrib.status }}</span>
                  <div class="progress-wrapper small">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: (contrib.progress ?? 0) + '%' }"></div>
                    </div>
                    <span class="progress-label">{{ contrib.progress ?? 0 }}%</span>
                  </div>
                </div>
                <div class="contributor-actions">
                  <button class="icon-btn edit" @click="openContributorModal(contrib)" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button class="icon-btn tasks" @click="openContributorTasks(contrib)" title="Tasks">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                  </button>
                  <button class="icon-btn delete" @click="deleteContributor(contrib)" title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add Task
              </button>
            </div>

            <div v-if="tasksLoading" class="tab-loading">Loading tasks…</div>
            <div v-else-if="!tasks.length" class="tab-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button class="icon-btn delete" @click="deleteTask(task)" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
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
                <input v-model="contributorForm.progress" type="number" min="0" max="100" class="form-control"
                  placeholder="0" />
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
              <textarea v-model="contributorForm.note" class="form-control" rows="2"
                placeholder="Optional notes…"></textarea>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
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
              <p class="mini-modal-sub">{{ activeContributor?.employee?.name || `Employee
                #${activeContributor?.employee_id}` }} · {{ activeContributor?.role }}</p>
            </div>
            <button class="drawer-close" @click="showContribTasksModal = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          <div class="mini-modal-body">
            <div class="tab-toolbar" style="margin-bottom:12px">
              <span class="tab-section-title" style="font-size:12px">Contributor Tasks</span>
              <button class="btn-add-inline" @click="openContribTaskForm()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button class="icon-btn delete" @click="deleteContribTask(ct)" title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
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
import { useCrudStore } from '@/store/crud'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseModal from '../components/ActionModalComponent.vue'
import CrudLayout from '../components/CrudLayout.vue'
import FilterPanel from '../components/FilterComponent.vue'
import Pagination from '../components/PaginationComponent.vue'
import DataTable from '../components/TableComponent.vue'

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
  { label: 'Total', value: pagination.value.total },
  { label: 'Active', value: items.value.filter(i => i.status === 'active').length },
  { label: 'Completed', value: items.value.filter(i => i.status === 'completed').length },
  { label: 'On Hold', value: items.value.filter(i => i.status === 'on_hold').length },
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
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' },
    ],
  },
  { name: 'start_date', label: 'Start Date', type: 'date', required: true },
  { name: 'end_date', label: 'End Date', type: 'date', required: true },
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
      { value: 'active', label: 'Active' },
      { value: 'on_hold', label: 'On Hold' },
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
      { value: 'active', label: 'Active' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  {
    name: 'priority', label: 'Priority', type: 'select', placeholder: 'All Priorities',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' },
    ],
  },
  { name: 'date', label: 'Start Date', type: 'date' },
]

// Category column removed
const tableColumns = [
  { key: 'id', label: 'ID', sortable: true, width: '60px', minWidth: '60px' },
  { key: 'thumbnail', label: 'Thumb', type: 'custom', sortable: false, width: '70px', minWidth: '70px', align: 'center' },
  { key: 'name', label: 'Name', sortable: true, width: '200px', minWidth: '130px' },
  { key: 'priority', label: 'Priority', type: 'custom', sortable: true, width: '110px', minWidth: '90px', align: 'center' },
  { key: 'progress', label: 'Progress', type: 'custom', sortable: false, width: '140px', minWidth: '120px' },
  { key: 'start_date', label: 'Start Date', sortable: true, width: '120px', minWidth: '100px' },
  { key: 'end_date', label: 'End Date', sortable: true, width: '120px', minWidth: '100px' },
  { key: 'status', label: 'Status', type: 'status', sortable: true, width: '110px', minWidth: '90px', align: 'center' },
  { key: 'actions', label: 'Actions', type: 'actions', sortable: false, width: '160px', minWidth: '160px', align: 'center' },
]

const tableActions = [
  { name: 'view', label: 'View', class: 'btn-view' },
  { name: 'edit', label: 'Edit', class: 'btn-edit' },
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
    page: currentPage.value,
    limit: itemsPerPage.value,
    ...(searchFilters.value.search && { search: searchFilters.value.search }),
    ...(searchFilters.value.status && { status: searchFilters.value.status }),
    ...(searchFilters.value.priority && { priority: searchFilters.value.priority }),
    ...(searchFilters.value.date && { date: searchFilters.value.date }),
    ...(sortConfig.value.by && { sort_by: sortConfig.value.by, sort_order: sortConfig.value.order }),
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
      employee_id: contrib.employee_id,
      role: contrib.role,
      status: contrib.status,
      progress: contrib.progress,
      note: contrib.note,
      started_at: contrib.started_at,
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
      company_id: selectedCompanyId.value,
      project_id: detailProject.value.id,
      employee_id: activeContributor.value.employee_id,
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
const handleSearch = () => { currentPage.value = 1; loadData() }
const handleReset = () => { searchFilters.value = { search: '', status: '', priority: '', date: '' }; currentPage.value = 1; loadData() }
const handleSort = (s) => { sortConfig.value = s; currentPage.value = 1; loadData() }
const handlePageChange = (page) => { currentPage.value = page; loadData() }
const handlePageSizeChange = (pageSize) => { itemsPerPage.value = pageSize; currentPage.value = 1; loadData() }
const handleAction = ({ action, row }) => ({ view: openDetailDrawer, edit: openEditModal, delete: openDeleteModal }[action]?.(row))

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
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
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
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #6b7280;
}

.company-select {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  font-size: 13px;
  padding: 7px 28px 7px 12px;
  outline: none;
  min-width: 200px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.company-select:focus {
  border-color: #4338ca;
  box-shadow: 0 0 0 3px #eef2ff;
}

.company-active-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  color: #4338ca;
}

/* ══════════════════════════════════════════
   THUMBNAIL
══════════════════════════════════════════ */
.project-thumbnail {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.project-thumbnail-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #9ca3af;
}

/* ══════════════════════════════════════════
   PRIORITY BADGE
══════════════════════════════════════════ */
.priority-badge {
  display: inline-block;
  padding: 4px 11px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: capitalize;
  white-space: nowrap;
  border-radius: 999px;
}

.priority-low {
  background: #ecfdf5;
  color: #059669;
}

.priority-medium {
  background: #fffbeb;
  color: #b45309;
}

.priority-high {
  background: #fff7ed;
  color: #c2410c;
}

.priority-critical {
  background: #fef2f2;
  color: #dc2626;
}

/* ══════════════════════════════════════════
   STATUS PILL
══════════════════════════════════════════ */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: capitalize;
}

.status-pill.small {
  font-size: 10.5px;
  padding: 3px 8px;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
}

.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.status-on_hold {
  background: #fffbeb;
  color: #b45309;
}

.status-completed {
  background: #eef2ff;
  color: #4338ca;
}

.status-cancelled {
  background: #fef2f2;
  color: #dc2626;
}

.status-pending {
  background: #fffbeb;
  color: #b45309;
}

.status-in_progress {
  background: #eff6ff;
  color: #2563eb;
}

.status-blocked {
  background: #fef2f2;
  color: #dc2626;
}

/* ══════════════════════════════════════════
   PROGRESS
══════════════════════════════════════════ */
.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-wrapper.small {
  gap: 6px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 99px;
  overflow: hidden;
  min-width: 50px;
}

.progress-wrapper.small .progress-bar {
  height: 5px;
  min-width: 36px;
}

.progress-fill {
  height: 100%;
  background: #4338ca;
  border-radius: 99px;
  transition: width .3s ease;
}

.progress-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #6b7280;
  min-width: 30px;
  text-align: right;
}

.cell-dash {
  color: #d1d5db;
  font-size: 14px;
}

/* ══════════════════════════════════════════
   DETAIL DRAWER
══════════════════════════════════════════ */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(17, 24, 39, .45);
  display: flex;
  justify-content: flex-end;
}

.detail-drawer {
  width: 520px;
  max-width: 100vw;
  height: 100%;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -12px 0 32px -8px rgba(15, 23, 42, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.drawer-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.drawer-thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.drawer-thumb-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  color: #4338ca;
}

.drawer-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px;
  letter-spacing: -0.01em;
}

.drawer-subtitle {
  font-size: 12.5px;
  color: #9ca3af;
  margin: 0;
  text-transform: capitalize;
}

.drawer-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 7px;
  color: #9ca3af;
  border-radius: 8px;
  transition: color .15s, background .15s;
}

.drawer-close:hover {
  color: #111827;
  background: #f3f4f6;
}

/* ── Drawer Tabs ── */
.drawer-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: #ffffff;
  padding: 0 12px;
}

.drawer-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 13px 14px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: #9ca3af;
  border-bottom: 2px solid transparent;
  transition: color .15s, border-color .15s;
  white-space: nowrap;
}

.drawer-tab.active {
  color: #4338ca;
  border-bottom-color: #4338ca;
}

.drawer-tab:hover:not(.active) {
  color: #4b5563;
}

.tab-count {
  background: #eef2ff;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10.5px;
  font-weight: 700;
  color: #4338ca;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 24px;
}

/* ── Detail Grid ── */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px 15px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.detail-card-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9ca3af;
}

.detail-card-value {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
}

.detail-description {
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-description p {
  margin: 0;
  font-size: 13.5px;
  color: #4b5563;
  line-height: 1.65;
}

/* ══════════════════════════════════════════
   TAB TOOLBAR
══════════════════════════════════════════ */
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.tab-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.tab-loading {
  padding: 28px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.tab-empty {
  padding: 36px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.tab-empty.small {
  padding: 16px;
}

.tab-empty svg {
  color: #d1d5db;
}

.btn-add-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 8px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  color: #4338ca;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}

.btn-add-inline:hover {
  background: #e0e7ff;
  border-color: #a5b4fc;
}

/* ══════════════════════════════════════════
   CONTRIBUTORS LIST
══════════════════════════════════════════ */
.contributors-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.contributor-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 15px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: border-color .15s, box-shadow .15s;
}

.contributor-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.06);
}

.contributor-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12.5px;
  font-weight: 700;
  color: #4338ca;
  flex-shrink: 0;
}

.contributor-info {
  flex: 1;
  min-width: 0;
}

.contributor-name {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contributor-role {
  display: block;
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 1px;
}

.contributor-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.contributor-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ══════════════════════════════════════════
   TASKS LIST
══════════════════════════════════════════ */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.task-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 15px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
}

.task-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-pending {
  background: #d97706;
}

.dot-in_progress {
  background: #2563eb;
}

.dot-completed {
  background: #059669;
}

.dot-blocked {
  background: #dc2626;
}

.task-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-name {
  font-size: 13.5px;
  color: #111827;
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-deadline {
  font-size: 11.5px;
  color: #9ca3af;
  white-space: nowrap;
}

.task-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ══════════════════════════════════════════
   ICON BUTTONS
══════════════════════════════════════════ */
.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all .15s;
}

.icon-btn.edit {
  color: #6366f1;
}

.icon-btn.edit:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #4338ca;
}

.icon-btn.delete {
  color: #f87171;
}

.icon-btn.delete:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.icon-btn.tasks {
  color: #38bdf8;
}

.icon-btn.tasks:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

/* ══════════════════════════════════════════
   MINI MODALS
══════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(17, 24, 39, .55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.mini-modal {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 24px 48px -14px rgba(15, 23, 42, 0.22);
  width: 420px;
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mini-modal.wide {
  width: 560px;
}

.mini-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.mini-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.mini-modal-sub {
  margin: 3px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.mini-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px;
}

.mini-modal-footer {
  padding: 15px 22px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
  background: #f9fafb;
}

/* ── Form controls ── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  font-size: 12.5px;
  font-weight: 600;
  color: #4b5563;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-control {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #111827;
  font-size: 13.5px;
  padding: 9px 11px;
  outline: none;
  transition: border-color .15s, background .15s, box-shadow .15s;
  width: 100%;
  box-sizing: border-box;
}

.form-control:focus {
  border-color: #4338ca;
  background: #ffffff;
  box-shadow: 0 0 0 3px #eef2ff;
}

.form-control::placeholder {
  color: #9ca3af;
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
}

.required {
  color: #dc2626;
}

.btn-save {
  padding: 9px 20px;
  border-radius: 8px;
  background: #4338ca;
  border: 1px solid #4338ca;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, box-shadow .15s, transform .12s;
}

.btn-save:hover:not(:disabled) {
  background: #3730a3;
  box-shadow: 0 6px 16px -4px rgba(67, 56, 202, 0.4);
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.btn-save.small {
  padding: 7px 15px;
  font-size: 12px;
}

.btn-cancel {
  padding: 9px 18px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}

.btn-cancel:hover {
  border-color: #9ca3af;
  color: #111827;
  background: #f3f4f6;
}

.btn-cancel.small {
  padding: 7px 13px;
  font-size: 12px;
}

/* ── Inline form ── */
.inline-form {
  margin-top: 16px;
  padding: 15px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.inline-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

/* ══════════════════════════════════════════
   TRANSITIONS
══════════════════════════════════════════ */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity .25s ease;
}

.drawer-fade-enter-active .detail-drawer,
.drawer-fade-leave-active .detail-drawer {
  transition: transform .3s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-from .detail-drawer,
.drawer-fade-leave-to .detail-drawer {
  transform: translateX(100%);
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition: opacity .2s ease;
}

.modal-pop-enter-active .mini-modal,
.modal-pop-leave-active .mini-modal {
  transition: transform .2s ease, opacity .2s ease;
}

.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
}

.modal-pop-enter-from .mini-modal,
.modal-pop-leave-to .mini-modal {
  transform: scale(.95);
  opacity: 0;
}

/* ══════════════════════════════════════════
   TABLE LAYOUT
══════════════════════════════════════════ */
:deep(table) {
  table-layout: auto;
  width: 100%;
}

:deep(td .cell-text) {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

:deep(td .cell-actions) {
  white-space: nowrap;
  overflow: visible;
}

/* ══════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════ */
@media (max-width: 640px) {
  .detail-drawer {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .mini-modal {
    width: 100%;
  }

  .mini-modal.wide {
    width: 100%;
  }

  .contributor-card {
    flex-wrap: wrap;
  }

  .contributor-meta {
    align-items: flex-start;
    width: 100%;
    order: 3;
  }

  .company-selector-inner {
    flex-direction: column;
    align-items: stretch;
  }

  .company-select {
    min-width: 0;
    width: 100%;
  }
}
</style>