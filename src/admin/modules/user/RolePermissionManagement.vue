<template>
  <div class="rp-page">

    <!-- ── Page header ── -->
    <div class="rp-header">
      <div class="rp-header__glow" />
      <div class="rp-header__rule" />
      <div class="rp-header__inner">
        <div class="rp-header__left">
          <nav class="breadcrumb">
            <span class="breadcrumb__link">Access</span>
            <span class="breadcrumb__sep">›</span>
            <span class="breadcrumb__current">Roles & Permissions</span>
          </nav>
          <div class="rp-title-row">
            <div class="rp-icon-mark">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 class="rp-title">Roles & Permissions</h1>
              <p class="rp-subtitle">Define roles and control module-level access across the system</p>
            </div>
          </div>
        </div>
        <div class="rp-header__right">
          <div class="stat-pill">
            <span class="stat-pill__val">{{ roles.length }}</span>
            <span class="stat-pill__label">Roles</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill__val">{{ MODULE_GROUPS.flatMap(g => g.modules).length }}</span>
            <span class="stat-pill__label">Modules</span>
          </div>
          <button class="btn-add" @click="openCreateModal">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
            New Role
          </button>
        </div>
      </div>
    </div>

    <!-- ── Main two-col layout ── -->
    <div class="rp-body">

      <!-- ── LEFT: role list ── -->
      <div class="role-list-panel">
        <div class="panel-head">
          <span class="panel-head__title">Roles</span>
          <div class="search-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor" class="search-ico">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <input v-model="roleSearch" class="search-input" placeholder="Search roles…" />
          </div>
        </div>

        <div class="role-list">
          <div
            v-for="role in filteredRoles"
            :key="role.id"
            class="role-card"
            :class="{ 'role-card--active': selectedRole?.id === role.id }"
            @click="selectRole(role)"
          >
            <div class="role-card__left">
              <div class="role-card__mark" :style="{ '--rc': role.color }">
                {{ role.initials }}
              </div>
              <div class="role-card__info">
                <p class="role-card__name">{{ role.name }}</p>
                <p class="role-card__desc">{{ role.description || 'No description' }}</p>
              </div>
            </div>
            <div class="role-card__right">
              <span class="role-card__badge">{{ countPermissions(role) }} perms</span>
              <div class="role-card__actions">
                <button class="icon-btn icon-btn--edit" @click.stop="openEditModal(role)" title="Edit role">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                </button>
                <button
                  class="icon-btn icon-btn--del"
                  @click.stop="openDeleteConfirm(role)"
                  title="Delete role"
                  :disabled="role.protected"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div v-if="!filteredRoles.length" class="role-empty">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <p>No roles found</p>
          </div>
        </div>
      </div>

      <!-- ── RIGHT: permission matrix ── -->
      <div class="perm-panel" v-if="selectedRole">
        <div class="perm-panel__head">
          <div class="perm-panel__title-row">
            <div class="perm-panel__mark" :style="{ '--rc': selectedRole.color }">
              {{ selectedRole.initials }}
            </div>
            <div>
              <h2 class="perm-panel__name">{{ selectedRole.name }}</h2>
              <p class="perm-panel__meta">{{ selectedRole.description }}</p>
            </div>
          </div>
          <div class="perm-panel__actions">
            <button class="btn-ghost" @click="toggleAllPermissions(false)">Revoke all</button>
            <button class="btn-ghost btn-ghost--gold" @click="toggleAllPermissions(true)">Grant all</button>
            <button class="btn-save" @click="savePermissions" :disabled="saving">
              <svg v-if="!saving" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/></svg>
              <svg v-else class="btn-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-opacity=".25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none"/>
              </svg>
              {{ saving ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>

        <!-- Save success banner -->
        <Transition name="banner">
          <div v-if="savedBanner" class="saved-banner">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            Permissions saved successfully
          </div>
        </Transition>

        <!-- Module groups -->
        <div class="module-groups">
          <div v-for="group in MODULE_GROUPS" :key="group.name" class="module-group">

            <div class="module-group__header">
              <span class="module-group__name">{{ group.name }}</span>
              <div class="module-group__toggles">
                <button class="micro-btn" @click="toggleGroup(group, 'view', false)">None</button>
                <button class="micro-btn micro-btn--gold" @click="toggleGroup(group, 'full', true)">All</button>
              </div>
            </div>

            <div class="module-table">
              <!-- Column headers -->
              <div class="module-table__head">
                <span class="mt-col mt-col--module">Module</span>
                <span class="mt-col mt-col--action" v-for="action in ACTIONS" :key="action.key">
                  {{ action.label }}
                </span>
              </div>

              <!-- Module rows -->
              <div
                v-for="mod in group.modules"
                :key="mod.key"
                class="module-row"
                :class="{ 'module-row--all': isRowFull(mod.key) }"
              >
                <div class="mt-col mt-col--module">
                  <div class="mod-icon" v-html="mod.icon" />
                  <span class="mod-label">{{ mod.label }}</span>
                </div>

                <div
                  v-for="action in ACTIONS"
                  :key="action.key"
                  class="mt-col mt-col--action"
                >
                  <button
                    class="perm-toggle"
                    :class="{ 'perm-toggle--on': hasPermission(mod.key, action.key) }"
                    @click="togglePermission(mod.key, action.key)"
                    :title="`${action.label}: ${mod.label}`"
                  >
                    <span class="perm-toggle__dot" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state when no role selected -->
      <div v-else class="perm-empty">
        <div class="perm-empty__mark">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
        </div>
        <p class="perm-empty__title">Select a role</p>
        <p class="perm-empty__sub">Choose a role from the left to configure its permissions</p>
      </div>

    </div>

    <!-- ══ CREATE / EDIT ROLE MODAL ══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-box__rule" />
            <div class="modal-box__head">
              <div class="modal-box__title-wrap">
                <div class="modal-mark" :class="isEditing ? 'modal-mark--edit' : 'modal-mark--create'">
                  <svg v-if="isEditing" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                  <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
                </div>
                <div>
                  <p class="modal-mode-label">{{ isEditing ? 'Editing role' : 'New role' }}</p>
                  <h3 class="modal-title">{{ isEditing ? 'Edit Role' : 'Create New Role' }}</h3>
                </div>
              </div>
              <button class="modal-close" @click="closeModal">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </button>
            </div>

            <div class="modal-body">
              <!-- Role name -->
              <div class="form-group" :class="{ 'form-group--error': formErrors.name }">
                <label class="form-label">Role name <span class="req">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="e.g. HR Manager" @blur="validateForm" />
                <span v-if="formErrors.name" class="form-error">{{ formErrors.name }}</span>
              </div>

              <!-- Description -->
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea v-model="form.description" class="form-textarea" placeholder="Brief description of this role's responsibilities…" rows="3" />
              </div>

              <!-- Initials + colour -->
              <div class="form-row">
                <div class="form-group" :class="{ 'form-group--error': formErrors.initials }">
                  <label class="form-label">Initials <span class="req">*</span></label>
                  <input v-model="form.initials" class="form-input" placeholder="SA" maxlength="2" style="text-transform:uppercase" @input="form.initials = form.initials.toUpperCase()" @blur="validateForm" />
                  <span v-if="formErrors.initials" class="form-error">{{ formErrors.initials }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Accent colour</label>
                  <div class="color-swatches">
                    <button
                      v-for="c in ROLE_COLORS"
                      :key="c"
                      class="swatch"
                      :class="{ 'swatch--active': form.color === c }"
                      :style="{ background: c }"
                      @click="form.color = c"
                    />
                  </div>
                </div>
              </div>

              <!-- Protected toggle -->
              <div class="form-group">
                <label class="form-checkbox-label">
                  <input type="checkbox" class="form-checkbox-input" v-model="form.protected" />
                  <span class="form-checkbox-box" />
                  <span class="form-checkbox-text">Protected role (cannot be deleted)</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-ghost" @click="closeModal">Cancel</button>
              <button class="btn-add" @click="submitModal" :disabled="modalSaving">
                <svg v-if="!modalSaving" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                <svg v-else class="btn-spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-opacity=".25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none"/>
                </svg>
                {{ isEditing ? 'Save changes' : 'Create role' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ DELETE CONFIRM MODAL ══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
          <div class="modal-box modal-box--sm">
            <div class="modal-box__rule modal-box__rule--danger" />
            <div class="modal-box__head">
              <div class="modal-box__title-wrap">
                <div class="modal-mark modal-mark--delete">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                </div>
                <div>
                  <p class="modal-mode-label">Confirm removal</p>
                  <h3 class="modal-title">Delete Role</h3>
                </div>
              </div>
              <button class="modal-close" @click="showDeleteModal = false">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-msg">Are you sure you want to delete the role <strong>{{ roleToDelete?.name }}</strong>? This cannot be undone.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showDeleteModal = false">Cancel</button>
              <button class="btn-danger" @click="confirmDelete">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clip-rule="evenodd"/></svg>
                Delete role
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

// ── Module groups + actions ────────────────────────────────────────────────────
const ACTIONS = [
  { key: 'view',   label: 'View'   },
  { key: 'create', label: 'Create' },
  { key: 'edit',   label: 'Edit'   },
  { key: 'delete', label: 'Delete' },
]

const MOD_ICON = (path) => `<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">${path}</svg>`

const MODULE_GROUPS = [
  {
    name: 'Organization',
    modules: [
      { key:'company',     label:'Company',     icon: MOD_ICON('<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12H4V4zm2 1h2v2H6V5zm0 4h2v2H6V9zm0 4h2v2H6v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clip-rule="evenodd"/>') },
      { key:'employee',    label:'Employee',    icon: MOD_ICON('<path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/>') },
      { key:'department',  label:'Department',  icon: MOD_ICON('<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>') },
    ]
  },
  {
    name: 'Time & Leave',
    modules: [
      { key:'attendance',  label:'Attendance',  icon: MOD_ICON('<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z" clip-rule="evenodd"/>') },
      { key:'leave',       label:'Leave',       icon: MOD_ICON('<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>') },
      { key:'holiday',     label:'Holidays',    icon: MOD_ICON('<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>') },
    ]
  },
  {
    name: 'Finance',
    modules: [
      { key:'payroll',     label:'Payroll',     icon: MOD_ICON('<path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/>') },
      { key:'salary',      label:'Salary',      icon: MOD_ICON('<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>') },
    ]
  },
  {
    name: 'Access Control',
    modules: [
      { key:'users',       label:'Users',       icon: MOD_ICON('<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>') },
      { key:'roles',       label:'Roles',       icon: MOD_ICON('<path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>') },
    ]
  },
  {
    name: 'Talent',
    modules: [
      { key:'recruitment', label:'Recruitment', icon: MOD_ICON('<path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>') },
      { key:'training',    label:'Training',    icon: MOD_ICON('<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>') },
      { key:'performance', label:'Performance', icon: MOD_ICON('<path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/>') },
    ]
  },
  {
    name: 'Communication',
    modules: [
      { key:'announcements', label:'Announcements', icon: MOD_ICON('<path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"/>') },
    ]
  },
  {
    name: 'Insights & System',
    modules: [
      { key:'reports',     label:'Reports',     icon: MOD_ICON('<path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>') },
      { key:'setup',       label:'Setup',       icon: MOD_ICON('<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>') },
    ]
  },
]

const ROLE_COLORS = ['#C9A96E','#5DCAA5','#85B7EB','#F09595','#AFA9EC','#EF9F27','#ED93B1','#97C459']

// ── Default roles ─────────────────────────────────────────────────────────────
const roles = ref([
  {
    id: 1, name: 'Super Administrator', description: 'Full system access — all modules, all actions',
    initials: 'SA', color: '#C9A96E', protected: true,
    permissions: buildFullPermissions(),
  },
  {
    id: 2, name: 'Administrator', description: 'Full operational access across all modules',
    initials: 'AD', color: '#85B7EB', protected: false,
    permissions: buildFullPermissions(),
  },
  {
    id: 3, name: 'HR Manager', description: 'Manages employees, attendance, leave and payroll',
    initials: 'HM', color: '#5DCAA5', protected: false,
    permissions: buildPartialPermissions(['employee','attendance','leave','payroll','reports']),
  },
  {
    id: 4, name: 'Employee', description: 'Self-service — attendance punch, leave application, work updates',
    initials: 'EM', color: '#AFA9EC', protected: false,
    permissions: buildViewPermissions(['attendance','leave','announcements']),
  },
])

function buildFullPermissions() {
  const p = {}
  MODULE_GROUPS.flatMap(g => g.modules).forEach(m => {
    p[m.key] = { view:true, create:true, edit:true, delete:true }
  })
  return p
}

function buildPartialPermissions(allowed) {
  const p = {}
  MODULE_GROUPS.flatMap(g => g.modules).forEach(m => {
    p[m.key] = allowed.includes(m.key)
      ? { view:true, create:true, edit:true, delete:false }
      : { view:false, create:false, edit:false, delete:false }
  })
  return p
}

function buildViewPermissions(allowed) {
  const p = {}
  MODULE_GROUPS.flatMap(g => g.modules).forEach(m => {
    p[m.key] = allowed.includes(m.key)
      ? { view:true, create:true, edit:false, delete:false }
      : { view:false, create:false, edit:false, delete:false }
  })
  return p
}

// ── State ──────────────────────────────────────────────────────────────────────
let nextId          = 5
const roleSearch    = ref('')
const selectedRole  = ref(null)
// Deep-copy of permissions being edited (avoid mutating original until Save)
const draftPerms    = ref({})
const saving        = ref(false)
const savedBanner   = ref(false)

// Modal
const showModal     = ref(false)
const isEditing     = ref(false)
const modalSaving   = ref(false)
const form          = reactive({ name:'', description:'', initials:'', color: ROLE_COLORS[0], protected: false })
const formErrors    = reactive({ name:'', initials:'' })
let   editingId     = null

// Delete
const showDeleteModal = ref(false)
const roleToDelete    = ref(null)

// ── Computed ───────────────────────────────────────────────────────────────────
const filteredRoles = computed(() =>
  roles.value.filter(r => r.name.toLowerCase().includes(roleSearch.value.toLowerCase()))
)

// ── Permission helpers ─────────────────────────────────────────────────────────
function selectRole(role) {
  selectedRole.value = role
  // Deep-copy permissions into draft
  draftPerms.value = JSON.parse(JSON.stringify(role.permissions))
}

function hasPermission(mod, action) {
  return !!draftPerms.value[mod]?.[action]
}

function togglePermission(mod, action) {
  if (!draftPerms.value[mod]) draftPerms.value[mod] = {}
  draftPerms.value[mod][action] = !draftPerms.value[mod][action]
}

function isRowFull(mod) {
  return ACTIONS.every(a => draftPerms.value[mod]?.[a.key])
}

function countPermissions(role) {
  return Object.values(role.permissions).reduce((sum, p) => {
    return sum + Object.values(p).filter(Boolean).length
  }, 0)
}

function toggleGroup(group, _type, value) {
  group.modules.forEach(m => {
    if (!draftPerms.value[m.key]) draftPerms.value[m.key] = {}
    ACTIONS.forEach(a => { draftPerms.value[m.key][a.key] = value })
  })
}

function toggleAllPermissions(value) {
  MODULE_GROUPS.flatMap(g => g.modules).forEach(m => {
    if (!draftPerms.value[m.key]) draftPerms.value[m.key] = {}
    ACTIONS.forEach(a => { draftPerms.value[m.key][a.key] = value })
  })
}

async function savePermissions() {
  if (!selectedRole.value) return
  saving.value = true
  await new Promise(r => setTimeout(r, 600)) // simulate API
  selectedRole.value.permissions = JSON.parse(JSON.stringify(draftPerms.value))
  saving.value = false
  savedBanner.value = true
  setTimeout(() => { savedBanner.value = false }, 3000)
}

// ── Role CRUD ──────────────────────────────────────────────────────────────────
function openCreateModal() {
  isEditing.value = false; editingId = null
  Object.assign(form, { name:'', description:'', initials:'', color: ROLE_COLORS[0], protected: false })
  formErrors.name = ''; formErrors.initials = ''
  showModal.value = true
}

function openEditModal(role) {
  isEditing.value = true; editingId = role.id
  Object.assign(form, { name: role.name, description: role.description, initials: role.initials, color: role.color, protected: role.protected })
  formErrors.name = ''; formErrors.initials = ''
  showModal.value = true
}

function validateForm() {
  let ok = true
  if (!form.name.trim()) { formErrors.name = 'Role name is required'; ok = false } else formErrors.name = ''
  if (!form.initials.trim()) { formErrors.initials = 'Initials are required'; ok = false } else formErrors.initials = ''
  return ok
}

async function submitModal() {
  if (!validateForm()) return
  modalSaving.value = true
  await new Promise(r => setTimeout(r, 500))

  if (isEditing.value) {
    const idx = roles.value.findIndex(r => r.id === editingId)
    if (idx > -1) Object.assign(roles.value[idx], { name: form.name, description: form.description, initials: form.initials, color: form.color, protected: form.protected })
    if (selectedRole.value?.id === editingId) Object.assign(selectedRole.value, { name: form.name, description: form.description, initials: form.initials, color: form.color })
  } else {
    const newRole = {
      id: nextId++, name: form.name, description: form.description,
      initials: form.initials, color: form.color, protected: form.protected,
      permissions: buildViewPermissions([]),
    }
    roles.value.push(newRole)
  }

  modalSaving.value = false
  showModal.value = false
}

function closeModal() { showModal.value = false }

function openDeleteConfirm(role) {
  if (role.protected) return
  roleToDelete.value = role
  showDeleteModal.value = true
}

function confirmDelete() {
  if (!roleToDelete.value) return
  roles.value = roles.value.filter(r => r.id !== roleToDelete.value.id)
  if (selectedRole.value?.id === roleToDelete.value.id) { selectedRole.value = null; draftPerms.value = {} }
  showDeleteModal.value = false
  roleToDelete.value = null
}
</script>

<style scoped>
/* ── Tokens ── */
.rp-page {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.09);
  --onyx:           #0D0D0F;
  --onyx-2:         #131316;
  --onyx-3:         #1A1A1F;
  --onyx-4:         #222228;
  --onyx-5:         #2C2C33;
  --smoke:          rgba(255,255,255,0.04);
  --smoke-hov:      rgba(255,255,255,0.07);
  --text-primary:   #F0EAE0;
  --text-secondary: rgba(240,234,224,0.55);
  --text-muted:     rgba(240,234,224,0.28);
  --border:         rgba(201,169,110,0.12);
  --border-strong:  rgba(201,169,110,0.28);

  font-family: 'Jost','Inter',sans-serif;
  background: var(--onyx-3);
  min-height: 100%;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* ══ PAGE HEADER ══ */
.rp-header { position:relative; background:var(--onyx-2); border-bottom:1px solid var(--border); overflow:hidden; flex-shrink:0; }
.rp-header__glow { position:absolute; top:-80px; left:-60px; width:260px; height:260px; border-radius:50%; background:radial-gradient(circle,rgba(201,169,110,0.07) 0%,transparent 70%); pointer-events:none; }
.rp-header__rule { height:2px; background:linear-gradient(90deg,transparent,var(--gold-dim),var(--gold),var(--gold-dim),transparent); }
.rp-header__inner { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:16px; padding:20px 28px 22px; position:relative; z-index:1; }
.rp-header__left { display:flex; flex-direction:column; gap:8px; }
.rp-header__right { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }

.breadcrumb { display:flex; align-items:center; gap:6px; font-size:10px; letter-spacing:.14em; text-transform:uppercase; }
.breadcrumb__link    { color:var(--gold-dim); }
.breadcrumb__sep     { color:var(--border-strong); }
.breadcrumb__current { color:var(--text-muted); }

.rp-title-row { display:flex; align-items:center; gap:14px; }
.rp-icon-mark { width:38px; height:38px; border:1px solid var(--gold-dim); display:flex; align-items:center; justify-content:center; position:relative; color:var(--gold); flex-shrink:0; }
.rp-icon-mark::before { content:''; position:absolute; inset:3px; border:1px solid var(--gold); opacity:.25; }
.rp-icon-mark svg { width:17px; height:17px; }
.rp-title { font-family:'Cormorant Garamond','Georgia',serif; font-size:24px; font-weight:400; letter-spacing:.05em; color:var(--text-primary); margin:0; line-height:1.1; }
.rp-subtitle { font-size:11px; color:var(--text-muted); letter-spacing:.06em; margin:3px 0 0; }

.stat-pill { display:flex; flex-direction:column; align-items:center; padding:6px 14px; border:1px solid var(--border); background:var(--smoke); gap:1px; }
.stat-pill__val   { font-family:'Cormorant Garamond','Georgia',serif; font-size:18px; font-weight:500; color:var(--gold-light); letter-spacing:.04em; line-height:1; }
.stat-pill__label { font-size:8.5px; text-transform:uppercase; letter-spacing:.16em; color:var(--text-muted); }

.btn-add { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; background:linear-gradient(135deg,var(--gold-dim),var(--gold)); border:none; color:var(--onyx); font-family:inherit; font-size:10.5px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:box-shadow .18s,transform .14s; position:relative; overflow:hidden; }
.btn-add::before { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.08); opacity:0; transition:opacity .14s; }
.btn-add:hover::before { opacity:1; }
.btn-add:hover { box-shadow:0 4px 18px rgba(201,169,110,0.28); transform:translateY(-1px); }
.btn-add:disabled { opacity:.5; cursor:not-allowed; transform:none; }
.btn-add svg { width:13px; height:13px; flex-shrink:0; }

/* ══ BODY ══ */
.rp-body { display:grid; grid-template-columns:300px 1fr; flex:1; min-height:0; }

/* ══ ROLE LIST PANEL ══ */
.role-list-panel { background:var(--onyx-2); border-right:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }

.panel-head { padding:14px 18px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:10px; flex-shrink:0; background:var(--onyx-3); }
.panel-head__title { font-size:9px; text-transform:uppercase; letter-spacing:.2em; color:var(--text-muted); }

.search-wrap { position:relative; }
.search-ico  { position:absolute; left:10px; top:50%; transform:translateY(-50%); width:12px; height:12px; color:var(--gold-dim); pointer-events:none; }
.search-input { width:100%; box-sizing:border-box; padding:8px 10px 8px 30px; background:var(--onyx-4); border:1px solid var(--border); color:var(--text-primary); font-family:inherit; font-size:12px; letter-spacing:.02em; outline:none; transition:border-color .16s; }
.search-input::placeholder { color:var(--text-muted); }
.search-input:focus { border-color:var(--gold-dim); }

.role-list { flex:1; overflow-y:auto; padding:6px 0; }
.role-list::-webkit-scrollbar { width:3px; }
.role-list::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:2px; }

.role-card { display:flex; align-items:center; justify-content:space-between; padding:11px 16px; cursor:pointer; transition:background .14s; border-bottom:1px solid var(--border); position:relative; }
.role-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:var(--gold); transform:scaleY(0); transition:transform .16s; }
.role-card:hover { background:var(--smoke); }
.role-card:hover::before { transform:scaleY(1); }
.role-card--active { background:var(--smoke-hov); }
.role-card--active::before { transform:scaleY(1); }

.role-card__left  { display:flex; align-items:center; gap:10px; min-width:0; }
.role-card__right { display:flex; align-items:center; gap:6px; flex-shrink:0; }

.role-card__mark {
  width:32px; height:32px; border-radius:50%;
  border:1px solid color-mix(in srgb, var(--rc, #C9A96E) 60%, transparent);
  background: color-mix(in srgb, var(--rc, #C9A96E) 14%, transparent);
  color: var(--rc, #C9A96E);
  display:flex; align-items:center; justify-content:center;
  font-family:'Cormorant Garamond','Georgia',serif; font-size:12px; font-weight:500;
  flex-shrink:0; letter-spacing:.04em;
}

.role-card__info { min-width:0; }
.role-card__name { font-size:12.5px; font-weight:500; color:var(--text-primary); margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.role-card__desc { font-size:10.5px; color:var(--text-muted); margin:1px 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px; }

.role-card__badge { font-size:9.5px; letter-spacing:.06em; padding:2px 7px; border:1px solid var(--border); color:var(--text-muted); white-space:nowrap; }

.role-card__actions { display:flex; gap:4px; }
.icon-btn { width:24px; height:24px; display:flex; align-items:center; justify-content:center; background:none; border:1px solid transparent; cursor:pointer; transition:border-color .14s,color .14s,background .14s; padding:0; }
.icon-btn svg { width:11px; height:11px; }
.icon-btn--edit { color:var(--gold-dim); }
.icon-btn--edit:hover { border-color:var(--border-strong); color:var(--gold); background:var(--gold-glow); }
.icon-btn--del  { color:rgba(240,149,149,0.5); }
.icon-btn--del:hover:not(:disabled) { border-color:rgba(240,149,149,0.35); color:#F09595; background:rgba(240,149,149,0.07); }
.icon-btn--del:disabled { opacity:.25; cursor:not-allowed; }

.role-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:40px 20px; color:var(--text-muted); }
.role-empty svg { width:28px; height:28px; opacity:.4; }
.role-empty p   { font-size:12px; letter-spacing:.06em; }

/* ══ PERMISSION PANEL ══ */
.perm-panel { display:flex; flex-direction:column; overflow-y:auto; }
.perm-panel::-webkit-scrollbar { width:3px; }
.perm-panel::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:2px; }

.perm-panel__head { position:sticky; top:0; z-index:10; background:var(--onyx-2); border-bottom:1px solid var(--border); padding:16px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.perm-panel__title-row { display:flex; align-items:center; gap:12px; }
.perm-panel__mark {
  width:40px; height:40px; border-radius:50%;
  border:1px solid color-mix(in srgb, var(--rc,#C9A96E) 60%, transparent);
  background: color-mix(in srgb, var(--rc,#C9A96E) 14%, transparent);
  color: var(--rc,#C9A96E);
  display:flex; align-items:center; justify-content:center;
  font-family:'Cormorant Garamond','Georgia',serif; font-size:15px; font-weight:500; flex-shrink:0;
}
.perm-panel__name { font-family:'Cormorant Garamond','Georgia',serif; font-size:20px; font-weight:400; letter-spacing:.04em; color:var(--text-primary); margin:0; line-height:1.1; }
.perm-panel__meta { font-size:11px; color:var(--text-muted); margin:2px 0 0; letter-spacing:.04em; }

.perm-panel__actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

.btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; background:transparent; border:1px solid var(--border-strong); color:var(--text-muted); font-family:inherit; font-size:10.5px; font-weight:400; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; transition:border-color .14s,color .14s,background .14s; }
.btn-ghost:hover { border-color:var(--gold-dim); color:var(--text-secondary); background:var(--smoke); }
.btn-ghost--gold { color:var(--gold-dim); border-color:var(--border-strong); }
.btn-ghost--gold:hover { color:var(--gold); border-color:var(--gold); background:var(--gold-glow); }

.btn-save { display:inline-flex; align-items:center; gap:7px; padding:8px 18px; background:linear-gradient(135deg,var(--gold-dim),var(--gold)); border:none; color:var(--onyx); font-family:inherit; font-size:10.5px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:box-shadow .18s,transform .14s; }
.btn-save:hover:not(:disabled) { box-shadow:0 4px 18px rgba(201,169,110,0.28); transform:translateY(-1px); }
.btn-save:disabled { opacity:.5; cursor:not-allowed; transform:none; }
.btn-save svg { width:13px; height:13px; }

.btn-spinner { animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Save banner */
.saved-banner { display:flex; align-items:center; gap:9px; padding:10px 24px; background:rgba(29,158,117,0.08); border-bottom:1px solid rgba(29,158,117,0.3); font-size:12.5px; color:#5DCAA5; letter-spacing:.04em; }
.saved-banner svg { width:14px; height:14px; flex-shrink:0; }
.banner-enter-active { transition:max-height .2s ease,opacity .18s ease; max-height:60px; overflow:hidden; }
.banner-leave-active { transition:max-height .16s ease,opacity .14s ease; }
.banner-enter-from,.banner-leave-to { max-height:0; opacity:0; }

/* Module groups */
.module-groups { padding:20px 24px; display:flex; flex-direction:column; gap:20px; }

.module-group { border:1px solid var(--border); }
.module-group__header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--onyx-3); border-bottom:1px solid var(--border); }
.module-group__name { font-size:9px; text-transform:uppercase; letter-spacing:.2em; color:var(--text-muted); }
.module-group__toggles { display:flex; gap:5px; }
.micro-btn { padding:3px 10px; font-family:inherit; font-size:9px; letter-spacing:.1em; text-transform:uppercase; background:transparent; border:1px solid var(--border); color:var(--text-muted); cursor:pointer; transition:border-color .13s,color .13s,background .13s; }
.micro-btn:hover { border-color:var(--border-strong); color:var(--text-secondary); background:var(--smoke); }
.micro-btn--gold:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-glow); }

/* Module table */
.module-table { width:100%; }
.module-table__head { display:grid; grid-template-columns:1fr repeat(4,64px); background:var(--onyx-4); border-bottom:1px solid var(--border); }
.mt-col { padding:8px 12px; display:flex; align-items:center; }
.mt-col--module { font-size:9px; text-transform:uppercase; letter-spacing:.16em; color:var(--text-muted); }
.mt-col--action { justify-content:center; font-size:9px; text-transform:uppercase; letter-spacing:.14em; color:var(--text-muted); }

.module-row { display:grid; grid-template-columns:1fr repeat(4,64px); border-bottom:1px solid var(--border); transition:background .12s; }
.module-row:last-child { border-bottom:none; }
.module-row:hover { background:var(--smoke); }
.module-row--all { background:rgba(201,169,110,0.04); }

.mod-icon { display:flex; align-items:center; justify-content:center; width:22px; height:22px; border:1px solid var(--border); background:var(--smoke); color:var(--gold-dim); flex-shrink:0; }
.mod-label { font-size:12.5px; color:var(--text-secondary); letter-spacing:.02em; }

/* Permission toggle */
.perm-toggle {
  width:28px; height:20px;
  border-radius:10px;
  border:1px solid var(--border-strong);
  background:var(--onyx-4);
  cursor:pointer;
  display:flex; align-items:center;
  padding:0 3px;
  transition:background .18s,border-color .18s;
  position:relative;
}
.perm-toggle--on { background:rgba(201,169,110,0.22); border-color:var(--gold); }
.perm-toggle__dot {
  width:12px; height:12px; border-radius:50%;
  background:var(--border-strong);
  transition:transform .18s,background .18s;
  flex-shrink:0;
}
.perm-toggle--on .perm-toggle__dot { transform:translateX(8px); background:var(--gold); }

/* ── Empty state ── */
.perm-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:80px 32px; text-align:center; }
.perm-empty__mark { width:60px; height:60px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; position:relative; }
.perm-empty__mark::before { content:''; position:absolute; inset:5px; border:1px solid var(--border); opacity:.4; }
.perm-empty__mark svg { width:24px; height:24px; color:var(--gold-dim); }
.perm-empty__title { font-family:'Cormorant Garamond','Georgia',serif; font-size:20px; font-weight:400; color:var(--text-secondary); margin:0; }
.perm-empty__sub   { font-size:12px; color:var(--text-muted); letter-spacing:.05em; margin:0; }

/* ══ MODAL SHARED ══ */
.modal-overlay { position:fixed; inset:0; background:rgba(7,7,9,0.88); display:flex; align-items:center; justify-content:center; z-index:9999; padding:24px; backdrop-filter:blur(3px); }

.modal-box { background:var(--onyx-2); border:1px solid var(--border-strong); width:100%; max-width:480px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.6); }
.modal-box--sm { max-width:380px; }

.modal-box__rule        { height:2px; background:linear-gradient(90deg,transparent,var(--gold-dim),var(--gold),var(--gold-dim),transparent); }
.modal-box__rule--danger { background:linear-gradient(90deg,transparent,rgba(240,149,149,0.5),rgba(240,149,149,0.9),rgba(240,149,149,0.5),transparent); }

.modal-box__head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:var(--onyx-3); border-bottom:1px solid var(--border); }
.modal-box__title-wrap { display:flex; align-items:center; gap:12px; }

.modal-mark { width:32px; height:32px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; position:relative; flex-shrink:0; }
.modal-mark::before { content:''; position:absolute; inset:3px; border:1px solid; opacity:.25; }
.modal-mark--create { color:var(--gold); border-color:var(--border-strong); }
.modal-mark--create::before { border-color:var(--gold); }
.modal-mark--edit   { color:#85B7EB; border-color:rgba(133,183,235,0.35); }
.modal-mark--edit::before   { border-color:#85B7EB; }
.modal-mark--delete { color:#F09595; border-color:rgba(240,149,149,0.35); }
.modal-mark--delete::before { border-color:#F09595; }
.modal-mark svg { width:13px; height:13px; }

.modal-mode-label { font-size:8.5px; text-transform:uppercase; letter-spacing:.18em; color:var(--text-muted); margin:0 0 2px; }
.modal-title { font-family:'Cormorant Garamond','Georgia',serif; font-size:18px; font-weight:400; letter-spacing:.04em; color:var(--text-primary); margin:0; }

.modal-close { width:28px; height:28px; background:none; border:1px solid transparent; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; transition:border-color .14s,color .14s,background .14s; }
.modal-close:hover { border-color:var(--border-strong); color:var(--text-primary); background:var(--smoke); }
.modal-close svg { width:12px; height:12px; }

.modal-body   { padding:20px; display:flex; flex-direction:column; gap:16px; }
.modal-footer { padding:14px 20px; border-top:1px solid var(--border); background:var(--onyx-3); display:flex; justify-content:flex-end; gap:8px; }

/* Form fields in modal */
.form-group { display:flex; flex-direction:column; gap:6px; }
.form-group--error .form-input,
.form-group--error .form-textarea { border-color:rgba(240,149,149,0.5); }
.form-row { display:grid; grid-template-columns:100px 1fr; gap:12px; }

.form-label { font-size:9px; text-transform:uppercase; letter-spacing:.16em; color:var(--text-muted); }
.req { color:#F09595; }
.form-input, .form-textarea {
  background:var(--onyx-4); border:1px solid var(--border); color:var(--text-primary);
  font-family:inherit; font-size:13px; letter-spacing:.02em; outline:none;
  padding:9px 12px; transition:border-color .16s,background .16s; border-radius:0;
}
.form-input::placeholder, .form-textarea::placeholder { color:var(--text-muted); }
.form-input:focus, .form-textarea:focus { border-color:var(--gold-dim); background:var(--onyx-5); box-shadow:0 0 0 2px rgba(201,169,110,0.07); }
.form-textarea { resize:vertical; min-height:72px; }
.form-error { font-size:11px; color:#F09595; }

/* Color swatches */
.color-swatches { display:flex; flex-wrap:wrap; gap:6px; padding-top:2px; }
.swatch { width:22px; height:22px; border-radius:50%; border:2px solid transparent; cursor:pointer; transition:transform .14s,border-color .14s; padding:0; }
.swatch:hover { transform:scale(1.15); }
.swatch--active { border-color:var(--text-primary); transform:scale(1.15); }

/* Checkbox */
.form-checkbox-input { display:none; }
.form-checkbox-label { display:inline-flex; align-items:center; gap:9px; cursor:pointer; user-select:none; }
.form-checkbox-box   { width:15px; height:15px; flex-shrink:0; border:1px solid var(--border-strong); background:var(--onyx-4); position:relative; transition:background .14s,border-color .14s; }
.form-checkbox-input:checked + .form-checkbox-box { background:var(--gold-glow); border-color:var(--gold); }
.form-checkbox-input:checked + .form-checkbox-box::after { content:''; position:absolute; left:3px; top:1px; width:5px; height:8px; border-right:1.5px solid var(--gold); border-bottom:1.5px solid var(--gold); transform:rotate(45deg); }
.form-checkbox-text  { font-size:12.5px; color:var(--text-secondary); letter-spacing:.02em; }

/* Delete modal */
.delete-msg { font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin:0; }
.delete-msg strong { color:var(--text-primary); }
.btn-danger { display:inline-flex; align-items:center; gap:7px; padding:8px 18px; background:rgba(240,149,149,0.10); border:1px solid rgba(240,149,149,0.4); color:#F09595; font-family:inherit; font-size:10.5px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:background .14s,border-color .14s; }
.btn-danger:hover { background:rgba(240,149,149,0.18); border-color:#F09595; }
.btn-danger svg { width:12px; height:12px; }

/* ── Modal transition ── */
.modal-enter-active { transition:opacity .2s ease; }
.modal-leave-active { transition:opacity .14s ease; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-active .modal-box { transition:transform .2s cubic-bezier(.22,.68,0,1.2); }
.modal-leave-active .modal-box  { transition:transform .14s ease; }
.modal-enter-from .modal-box { transform:scale(.96) translateY(8px); }
.modal-leave-to   .modal-box { transform:scale(.97); }

/* ── Responsive ── */
@media (max-width:900px) {
  .rp-body { grid-template-columns:1fr; }
  .role-list-panel { max-height:260px; border-right:none; border-bottom:1px solid var(--border); }
}
@media (max-width:600px) {
  .rp-header__inner { padding:16px 18px 18px; }
  .module-groups { padding:14px 16px; }
  .perm-panel__head { padding:12px 16px; }
  .module-table__head, .module-row { grid-template-columns:1fr repeat(4,48px); }
  .mt-col { padding:8px 6px; }
  .mt-col--action { font-size:8px; }
  .rp-header__right .stat-pill { display:none; }
}
</style>