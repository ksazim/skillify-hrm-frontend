<template>
  <div class="rp-page">

    <!-- ── Page header ── -->
    <div class="rp-header">
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
                <path fill-rule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 class="text-page-title">Roles & Permissions</h1>
              <p class="text-subtitle">Define roles and control module-level access across the system</p>
            </div>
          </div>
        </div>
        <div class="rp-header__right">
          <div class="stat-pill">
            <span class="stat-pill__val">{{ roles.length }}</span>
            <span class="stat-pill__label">Roles</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill__val">{{MODULE_GROUPS.flatMap(g => g.modules).length}}</span>
            <span class="stat-pill__label">Modules</span>
          </div>
          <button class="btn-add" @click="openCreateModal">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clip-rule="evenodd" />
            </svg>
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
              <path fill-rule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clip-rule="evenodd" />
            </svg>
            <input v-model="roleSearch" class="search-input" placeholder="Search roles…" />
          </div>
        </div>

        <!-- API error -->
        <div v-if="apiError" class="api-error">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd" />
          </svg>
          {{ apiError }}
        </div>

        <div class="role-list">
          <!-- Loading skeleton -->
          <template v-if="loading">
            <div class="role-skeleton" v-for="n in 4" :key="n">
              <div class="skeleton-circle" />
              <div class="skeleton-lines">
                <div class="skeleton-line skeleton-line--wide" />
                <div class="skeleton-line skeleton-line--narrow" />
              </div>
            </div>
          </template>

          <template v-else>
            <div v-for="role in filteredRoles" :key="role.id" class="role-card"
              :class="{ 'role-card--active': selectedRole?.id === role.id }" @click="selectRole(role)">
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
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button class="icon-btn icon-btn--del" @click.stop="openDeleteConfirm(role)" title="Delete role"
                    :disabled="role.protected">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!filteredRoles.length" class="role-empty">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
              <p>No roles found</p>
            </div>
          </template>
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
              <svg v-if="!saving" viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              <svg v-else class="btn-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                  stroke-opacity=".25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" />
              </svg>
              {{ saving ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>

        <!-- Save success banner -->
        <Transition name="banner">
          <div v-if="savedBanner" class="saved-banner">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
            Permissions saved successfully
          </div>
        </Transition>

        <!-- Save error banner -->
        <Transition name="banner">
          <div v-if="saveError" class="error-banner">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd" />
            </svg>
            {{ saveError }}
          </div>
        </Transition>

        <!-- Module groups -->
        <div class="module-groups">
          <div v-for="group in MODULE_GROUPS" :key="group.name" class="module-group">

            <div class="module-group__header">
              <span class="module-group__name">{{ group.name }}</span>
              <div class="module-group__toggles">
                <button class="micro-btn" @click="toggleGroup(group, false)">None</button>
                <button class="micro-btn micro-btn--gold" @click="toggleGroup(group, true)">All</button>
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
              <div v-for="mod in group.modules" :key="mod.key" class="module-row"
                :class="{ 'module-row--all': isRowFull(mod.key) }">
                <div class="mt-col mt-col--module">
                  <div class="mod-icon" v-html="mod.icon" />
                  <span class="mod-label">{{ mod.label }}</span>
                </div>

                <div v-for="action in ACTIONS" :key="action.key" class="mt-col mt-col--action">
                  <button class="perm-toggle" :class="{ 'perm-toggle--on': hasPermission(mod.key, action.key) }"
                    @click="togglePermission(mod.key, action.key)" :title="`${action.label}: ${mod.label}`">
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
            <path fill-rule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
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
            <!-- Top accent bar -->
            <div class="modal-box__accent"
              :class="isEditing ? 'modal-box__accent--edit' : 'modal-box__accent--create'" />

            <div class="modal-box__head">
              <div class="modal-box__title-wrap">
                <div class="modal-mark" :class="isEditing ? 'modal-mark--edit' : 'modal-mark--create'">
                  <svg v-if="isEditing" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <svg v-else viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clip-rule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p class="modal-mode-label">{{ isEditing ? 'Editing role' : 'New role' }}</p>
                  <h3 class="modal-title">{{ isEditing ? 'Edit Role' : 'Create New Role' }}</h3>
                </div>
              </div>
              <button class="modal-close" @click="closeModal">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <!-- Modal-level error -->
              <div v-if="modalError" class="modal-error">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
                </svg>
                {{ modalError }}
              </div>

              <div class="form-group" :class="{ 'form-group--error': formErrors.name }">
                <label class="text-label">Role name <span class="req">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="e.g. HR Manager" @blur="validateForm" />
                <span v-if="formErrors.name" class="form-error">{{ formErrors.name }}</span>
              </div>

              <div class="form-group">
                <label class="text-label">Description</label>
                <textarea v-model="form.description" class="form-textarea"
                  placeholder="Brief description of this role's responsibilities…" rows="3" />
              </div>

              <div class="form-row">
                <div class="form-group" :class="{ 'form-group--error': formErrors.initials }">
                  <label class="text-label">Initials <span class="req">*</span></label>
                  <input v-model="form.initials" class="form-input" placeholder="SA" maxlength="2"
                    style="text-transform:uppercase" @input="form.initials = form.initials.toUpperCase()"
                    @blur="validateForm" />
                  <span v-if="formErrors.initials" class="form-error">{{ formErrors.initials }}</span>
                </div>
                <div class="form-group">
                  <label class="text-label">Accent colour</label>
                  <div class="color-swatches">
                    <button v-for="c in ROLE_COLORS" :key="c" class="swatch"
                      :class="{ 'swatch--active': form.color === c }" :style="{ background: c }"
                      @click="form.color = c" />
                  </div>
                </div>
              </div>

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
              <button class="btn-primary" @click="submitModal" :disabled="modalSaving">
                <svg v-if="!modalSaving" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
                <svg v-else class="btn-spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                    stroke-opacity=".25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" />
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
            <!-- Top accent bar - danger -->
            <div class="modal-box__accent modal-box__accent--danger" />

            <div class="modal-box__head">
              <div class="modal-box__title-wrap">
                <div class="modal-mark modal-mark--delete">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p class="text-subtitle">Confirm removal</p>
                  <h3 class="text-card-title">Delete Role</h3>
                </div>
              </div>
              <button class="modal-close" @click="showDeleteModal = false">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="text-body">Are you sure you want to delete the role <strong>{{ roleToDelete?.name }}</strong>?
                This
                cannot be undone.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showDeleteModal = false">Cancel</button>
              <button class="btn-danger" @click="confirmDelete" :disabled="deleting">
                <svg v-if="!deleting" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z"
                    clip-rule="evenodd" />
                </svg>
                <svg v-else class="btn-spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                    stroke-opacity=".25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" />
                </svg>
                {{ deleting ? 'Deleting…' : 'Delete role' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'

// ── API base ───────────────────────────────────────────────────────────────────
const API = `${process.env.VUE_APP_BASE_API}/admin/roles`

// ── Actions ───────────────────────────────────────────────────────────────────
const ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
]

// ── All module keys ──────────────────────────────────────────────────────────
const ALL_MODULE_KEYS = [
  'company', 'employee', 'department',
  'attendance', 'leave', 'holiday',
  'payroll', 'salary',
  'users', 'roles',
  'recruitment', 'training', 'performance',
  'announcements',
  'reports', 'setup',
]

function emptyModulePerms() {
  return ACTIONS.reduce((acc, a) => { acc[a.key] = false; return acc }, {})
}

const MOD_ICON = (path) => `<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">${path}</svg>`

const MODULE_GROUPS = [
  {
    name: 'Organization',
    modules: [
      { key: 'company', label: 'Company', icon: MOD_ICON('<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12H4V4zm2 1h2v2H6V5zm0 4h2v2H6V9zm0 4h2v2H6v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clip-rule="evenodd"/>') },
      { key: 'employee', label: 'Employee', icon: MOD_ICON('<path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/>') },
      { key: 'department', label: 'Department', icon: MOD_ICON('<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>') },
    ]
  },
  {
    name: 'Time & Leave',
    modules: [
      { key: 'attendance', label: 'Attendance', icon: MOD_ICON('<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z" clip-rule="evenodd"/>') },
      { key: 'leave', label: 'Leave', icon: MOD_ICON('<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>') },
      { key: 'holiday', label: 'Holidays', icon: MOD_ICON('<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>') },
    ]
  },
  {
    name: 'Finance',
    modules: [
      { key: 'payroll', label: 'Payroll', icon: MOD_ICON('<path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/>') },
      { key: 'salary', label: 'Salary', icon: MOD_ICON('<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>') },
    ]
  },
  {
    name: 'Access Control',
    modules: [
      { key: 'users', label: 'Users', icon: MOD_ICON('<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>') },
      { key: 'roles', label: 'Roles', icon: MOD_ICON('<path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>') },
    ]
  },
  {
    name: 'Talent',
    modules: [
      { key: 'recruitment', label: 'Recruitment', icon: MOD_ICON('<path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>') },
      { key: 'training', label: 'Training', icon: MOD_ICON('<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>') },
      { key: 'performance', label: 'Performance', icon: MOD_ICON('<path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/>') },
    ]
  },
  {
    name: 'Communication',
    modules: [
      { key: 'announcements', label: 'Announcements', icon: MOD_ICON('<path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"/>') },
    ]
  },
  {
    name: 'Insights & System',
    modules: [
      { key: 'reports', label: 'Reports', icon: MOD_ICON('<path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>') },
      { key: 'setup', label: 'Setup', icon: MOD_ICON('<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>') },
    ]
  },
]

const ROLE_COLORS = ['#4F46E5', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6']

// ── Roles state ──────────────────────────────────────────────────────────────
const roles = ref([])
const loading = ref(false)
const apiError = ref('')

async function fetchRoles() {
  loading.value = true
  apiError.value = ''
  try {
    const { data } = await axios.get(API)
    roles.value = data.data
  } catch (e) {
    apiError.value = e?.response?.data?.message ?? 'Failed to load roles.'
  } finally {
    loading.value = false
  }
}

// ── State ─────────────────────────────────────────────────────────────────────
const roleSearch = ref('')
const selectedRole = ref(null)
const draftPerms = ref({})
const saving = ref(false)
const savedBanner = ref(false)
const saveError = ref('')
let savedBannerTimer = null

// Modal
const showModal = ref(false)
const isEditing = ref(false)
const modalSaving = ref(false)
const modalError = ref('')
const form = reactive({ name: '', description: '', initials: '', color: ROLE_COLORS[0], protected: false })
const formErrors = reactive({ name: '', initials: '' })
let editingId = null

// Delete
const showDeleteModal = ref(false)
const roleToDelete = ref(null)
const deleting = ref(false)

// ── Bootstrap ─────────────────────────────────────────────────────────────────
onMounted(fetchRoles)

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredRoles = computed(() =>
  roles.value.filter(r => r.name.toLowerCase().includes(roleSearch.value.toLowerCase()))
)

// ── Permission helpers ────────────────────────────────────────────────────────

function selectRole(role) {
  selectedRole.value = role
  saveError.value = ''

  const full = {}
  ALL_MODULE_KEYS.forEach(moduleKey => {
    full[moduleKey] = {}
    ACTIONS.forEach(a => {
      full[moduleKey][a.key] = !!(role.permissions?.[moduleKey]?.[a.key])
    })
  })

  draftPerms.value = full
}

function hasPermission(mod, action) {
  return draftPerms.value[mod]?.[action] || false
}

function togglePermission(mod, action) {
  const current = draftPerms.value[mod] ?? emptyModulePerms()
  draftPerms.value = {
    ...draftPerms.value,
    [mod]: {
      ...current,
      [action]: !current[action],
    },
  }
}

function isRowFull(mod) {
  return ACTIONS.every(a => draftPerms.value[mod]?.[a.key])
}

function countPermissions(role) {
  const source = (selectedRole.value?.id === role.id)
    ? draftPerms.value
    : role.permissions
  if (!source) return 0
  return Object.values(source).reduce((sum, p) =>
    sum + Object.values(p).filter(Boolean).length, 0)
}

function toggleGroup(group, value) {
  const updated = { ...draftPerms.value }
  group.modules.forEach(m => {
    updated[m.key] = ACTIONS.reduce((acc, a) => ({ ...acc, [a.key]: value }), {})
  })
  draftPerms.value = updated
}

function toggleAllPermissions(value) {
  const updated = {}
  ALL_MODULE_KEYS.forEach(key => {
    updated[key] = ACTIONS.reduce((acc, a) => ({ ...acc, [a.key]: value }), {})
  })
  draftPerms.value = updated
}

// ── Save permissions ──────────────────────────────────────────────────────────
async function savePermissions() {
  if (!selectedRole.value) return
  saving.value = true
  saveError.value = ''

  if (savedBannerTimer) clearTimeout(savedBannerTimer)

  try {
    const { data } = await axios.post(
      `${API}/${selectedRole.value.id}/permissions`,
      { permissions: draftPerms.value }
    )

    const idx = roles.value.findIndex(r => r.id === selectedRole.value.id)
    if (idx > -1) {
      roles.value[idx] = { ...roles.value[idx], permissions: data.data.permissions }
    }
    selectedRole.value = { ...selectedRole.value, permissions: data.data.permissions }

    savedBanner.value = true
    savedBannerTimer = setTimeout(() => { savedBanner.value = false }, 3000)

  } catch (e) {
    saveError.value = e?.response?.data?.message ?? 'Failed to save permissions.'
  } finally {
    saving.value = false
  }
}

// ── Role CRUD ─────────────────────────────────────────────────────────────────
function openCreateModal() {
  isEditing.value = false
  editingId = null
  modalError.value = ''
  Object.assign(form, { name: '', description: '', initials: '', color: ROLE_COLORS[0], protected: false })
  formErrors.name = ''; formErrors.initials = ''
  showModal.value = true
}

function openEditModal(role) {
  isEditing.value = true
  editingId = role.id
  modalError.value = ''
  Object.assign(form, {
    name: role.name,
    description: role.description,
    initials: role.initials,
    color: role.color,
    protected: !!role.protected,
  })
  formErrors.name = ''; formErrors.initials = ''
  showModal.value = true
}

function validateForm() {
  formErrors.name = form.name.trim() ? '' : 'Role name is required'
  formErrors.initials = form.initials.trim() ? '' : 'Initials are required'
  return !formErrors.name && !formErrors.initials
}

async function submitModal() {
  if (!validateForm()) return
  modalSaving.value = true
  modalError.value = ''
  try {
    if (isEditing.value) {
      const { data } = await axios.put(`${API}/${editingId}`, {
        name: form.name,
        description: form.description,
        initials: form.initials,
        color: form.color,
        protected: form.protected,
      })
      const updated = data.data
      const idx = roles.value.findIndex(r => r.id === editingId)
      if (idx > -1) roles.value[idx] = { ...roles.value[idx], ...updated }
      if (selectedRole.value?.id === editingId) {
        selectedRole.value = { ...selectedRole.value, ...updated }
      }
    } else {
      const { data } = await axios.post(API, {
        name: form.name,
        description: form.description,
        initials: form.initials,
        color: form.color,
        protected: form.protected,
      })
      roles.value.push(data.data)
    }
    showModal.value = false
  } catch (e) {
    const errors = e?.response?.data?.errors
    if (errors?.name) formErrors.name = errors.name[0]
    if (errors?.initials) formErrors.initials = errors.initials[0]
    modalError.value = e?.response?.data?.message ?? 'Something went wrong.'
  } finally {
    modalSaving.value = false
  }
}

function closeModal() { showModal.value = false }

function openDeleteConfirm(role) {
  if (role.protected) return
  roleToDelete.value = role
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!roleToDelete.value) return
  deleting.value = true
  try {
    await axios.delete(`${API}/${roleToDelete.value.id}`)
    roles.value = roles.value.filter(r => r.id !== roleToDelete.value.id)
    if (selectedRole.value?.id === roleToDelete.value.id) {
      selectedRole.value = null
      draftPerms.value = {}
    }
  } catch (e) {
    apiError.value = e?.response?.data?.message ?? 'Failed to delete role.'
  } finally {
    deleting.value = false
    showDeleteModal.value = false
    roleToDelete.value = null
  }
}
</script>

<style scoped>
/* ── Light Theme Variables ── */
.rp-page {
  --primary: #4F46E5;
  --primary-light: #EEF2FF;
  --primary-hover: #4338CA;

  --bg: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-hover: #F1F5F9;
  --bg-active: #EEF2FF;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-light: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --border-focus: #818CF8;

  --success: #10B981;
  --success-light: #ECFDF5;
  --success-border: #A7F3D0;

  --error: #EF4444;
  --error-light: #FEF2F2;
  --error-border: #FECACA;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-secondary);
  min-height: 100%;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* ══ PAGE HEADER ══ */
.rp-header {
  position: relative;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.rp-header__inner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 28px 22px;
  position: relative;
  z-index: 1;
}

.rp-header__left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rp-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.breadcrumb__link {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.breadcrumb__link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.breadcrumb__sep {
  color: var(--border-strong);
  font-size: 14px;
}

.breadcrumb__current {
  color: var(--text-secondary);
  font-weight: 600;
}

.rp-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rp-icon-mark {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--primary-light);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.rp-icon-mark:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.rp-icon-mark svg {
  width: 20px;
  height: 20px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  gap: 2px;
  transition: all 0.2s ease;
}

.stat-pill:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.stat-pill__val {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.stat-pill__label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--primary);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.btn-add::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-add:hover::before {
  width: 300px;
  height: 300px;
}

.btn-add:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
}

.btn-add:active {
  transform: translateY(0px) scale(0.98);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-add svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ══ BODY ══ */
.rp-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  flex: 1;
  min-height: 0;
  gap: 0;
}

/* ══ ROLE LIST PANEL ══ */
.role-list-panel {
  background: var(--bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  background: var(--bg-secondary);
}

.panel-head__title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.search-wrap {
  position: relative;
}

.search-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px 8px 36px;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: all 0.15s ease;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.api-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--error-light);
  border-bottom: 1px solid var(--error-border);
  font-size: 13px;
  font-weight: 500;
  color: var(--error);
}

.api-error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.role-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.role-list::-webkit-scrollbar {
  width: 4px;
}

.role-list::-webkit-scrollbar-track {
  background: transparent;
}

.role-list::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 2px;
}

/* Skeleton loader */
.role-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
}

.skeleton-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--border);
  flex-shrink: 0;
  animation: shimmer 1.4s infinite;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.skeleton-line {
  height: 10px;
  background: var(--border);
  border-radius: 2px;
  animation: shimmer 1.4s infinite;
}

.skeleton-line--wide {
  width: 70%;
}

.skeleton-line--narrow {
  width: 45%;
}

@keyframes shimmer {

  0%,
  100% {
    opacity: 0.5;
  }

  50% {
    opacity: 1;
  }
}

.role-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid var(--border);
  position: relative;
}

.role-card:hover {
  background: var(--bg-hover);
}

.role-card--active {
  background: var(--primary-light);
  border-left: 3px solid var(--primary);
}

.role-card__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.role-card__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.role-card__mark {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--rc, var(--primary));
  background: color-mix(in srgb, var(--rc, var(--primary)) 12%, transparent);
  color: var(--rc, var(--primary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.role-card__info {
  min-width: 0;
}

.role-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-card__desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-card__badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border: 1.5px solid var(--border-strong);
  border-radius: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.role-card__actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.icon-btn svg {
  width: 14px;
  height: 14px;
}

.icon-btn--edit {
  color: var(--text-muted);
}

.icon-btn--edit:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-light);
}

.icon-btn--del {
  color: var(--text-muted);
}

.icon-btn--del:hover:not(:disabled) {
  background: var(--error-light);
  color: var(--error);
  border-color: var(--error-light);
}

.icon-btn--del:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.role-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 20px;
  color: var(--text-muted);
}

.role-empty svg {
  width: 32px;
  height: 32px;
  opacity: 0.4;
}

.role-empty p {
  font-size: 14px;
  font-weight: 500;
}

/* ══ PERMISSION PANEL ══ */
.perm-panel {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--bg);
}

.perm-panel::-webkit-scrollbar {
  width: 4px;
}

.perm-panel::-webkit-scrollbar-track {
  background: transparent;
}

.perm-panel::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 2px;
}

.perm-panel__head {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.perm-panel__title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.perm-panel__mark {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--rc, var(--primary));
  background: color-mix(in srgb, var(--rc, var(--primary)) 12%, transparent);
  color: var(--rc, var(--primary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.perm-panel__name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.perm-panel__meta {
  font-size: 13px;
  color: var(--text-muted);
  margin: 2px 0 0;
}

.perm-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-ghost:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
  background: var(--bg-hover);
}

.btn-ghost--gold {
  color: var(--primary);
  border-color: var(--primary-light);
}

.btn-ghost--gold:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: var(--primary);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.btn-save:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-save svg {
  width: 16px;
  height: 16px;
}

.btn-spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Banners */
.saved-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  background: var(--success-light);
  border-bottom: 1px solid var(--success-border);
  font-size: 13px;
  font-weight: 500;
  color: var(--success);
}

.saved-banner svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  background: var(--error-light);
  border-bottom: 1px solid var(--error-border);
  font-size: 13px;
  font-weight: 500;
  color: var(--error);
}

.error-banner svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.banner-enter-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 80px;
  overflow: hidden;
}

.banner-leave-active {
  transition: max-height 0.2s ease, opacity 0.15s ease;
}

.banner-enter-from,
.banner-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Module groups */
.module-groups {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.module-group {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.module-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.module-group__name {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}

.module-group__toggles {
  display: flex;
  gap: 6px;
}

.micro-btn {
  padding: 3px 12px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.micro-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.micro-btn--gold:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

/* Module table */
.module-table {
  width: 100%;
}

.module-table__head {
  display: grid;
  grid-template-columns: 1fr repeat(4, 70px);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.mt-col {
  padding: 8px 14px;
  display: flex;
  align-items: center;
}

.mt-col--module {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  gap: 10px;
}

.mt-col--action {
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.module-row {
  display: grid;
  grid-template-columns: 1fr repeat(4, 70px);
  border-bottom: 1px solid var(--border);
  transition: background 0.12s ease;
}

.module-row:last-child {
  border-bottom: none;
}

.module-row:hover {
  background: var(--bg-hover);
}

.module-row--all {
  background: var(--primary-light);
}

.module-row--all:hover {
  background: var(--bg-hover);
}

.mod-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--primary);
  flex-shrink: 0;
}

.mod-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.01em;
}

/* Permission toggle */
.perm-toggle {
  width: 32px;
  height: 22px;
  border-radius: 11px;
  border: 1.5px solid var(--border-strong);
  background: var(--bg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 3px;
  transition: all 0.2s ease;
  position: relative;
}

.perm-toggle--on {
  background: var(--primary);
  border-color: var(--primary);
}

.perm-toggle__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #FFFFFF;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.perm-toggle--on .perm-toggle__dot {
  transform: translateX(10px);
}

/* ── Empty state ── */
.perm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 32px;
  text-align: center;
  background: var(--bg);
}

.perm-empty__mark {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.perm-empty__mark svg {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
}

.perm-empty__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.perm-empty__sub {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

/* ══ MODALS - Professional Design with Solid Backgrounds ══ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
  animation: overlayIn 0.25s ease;
}

@keyframes overlayIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-box {
  background: #FFFFFF;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.12);
  animation: modalSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  border: 1px solid var(--border);
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(20px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-box--sm {
  max-width: 420px;
}

/* Top accent bar */
.modal-box__accent {
  height: 4px;
  background: var(--primary);
  flex-shrink: 0;
}

.modal-box__accent--create {
  background: linear-gradient(90deg, var(--primary), #818CF8);
}

.modal-box__accent--edit {
  background: linear-gradient(90deg, #3B82F6, #93C5FD);
}

.modal-box__accent--danger {
  background: linear-gradient(90deg, var(--error), #F87171);
}

.modal-box__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
}

.modal-box__title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.modal-mark {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-mark--create {
  background: #EEF2FF;
  border-color: var(--primary);
  color: var(--primary);
}

.modal-mark--edit {
  background: #EFF6FF;
  border-color: #3B82F6;
  color: #3B82F6;
}

.modal-mark--delete {
  background: #FEF2F2;
  border-color: var(--error);
  color: var(--error);
}

.modal-mark svg {
  width: 18px;
  height: 18px;
}

.modal-mode-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  margin: 0 0 2px;
}

.modal-mode-label--danger {
  color: var(--error);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0F172A;
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1.5px solid transparent;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
}

.modal-close:hover {
  border-color: #E2E8F0;
  color: #0F172A;
  background: #F1F5F9;
  transform: rotate(90deg);
}

.modal-close svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #FFFFFF;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #E2E8F0;
  background: #F8FAFC;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Modal-level error */
.modal-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #FEF2F2;
  border: 1.5px solid #FECACA;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: #DC2626;
}

.modal-error svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Form fields in modal */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group--error .form-input,
.form-group--error .form-textarea {
  border-color: #DC2626;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.req {
  color: #DC2626;
}

.form-input,
.form-textarea {
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: var(--radius-sm);
  color: #0F172A;
  font-family: inherit;
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  transition: all 0.15s ease;
  width: 100%;
  box-sizing: border-box;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #94A3B8;
}

.form-input:hover,
.form-textarea:hover {
  border-color: #CBD5E1;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 4px #EEF2FF;
  background: #FFFFFF;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-error {
  font-size: 12px;
  font-weight: 500;
  color: #DC2626;
}

/* Color swatches */
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}

.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.swatch:hover {
  transform: scale(1.15);
}

.swatch--active {
  border-color: #0F172A;
  transform: scale(1.15);
  box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #4F46E5;
}

/* Checkbox */
.form-checkbox-input {
  display: none;
}

.form-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.form-checkbox-box {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid #CBD5E1;
  border-radius: var(--radius-sm);
  background: #FFFFFF;
  position: relative;
  transition: all 0.15s ease;
}

.form-checkbox-label:hover .form-checkbox-box {
  border-color: #4F46E5;
}

.form-checkbox-input:checked+.form-checkbox-box {
  background: #4F46E5;
  border-color: #4F46E5;
}

.form-checkbox-input:checked+.form-checkbox-box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border-right: 2px solid #FFFFFF;
  border-bottom: 2px solid #FFFFFF;
  transform: rotate(45deg);
}

.form-checkbox-text {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

/* Button styles */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #4F46E5;
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.btn-primary:hover:not(:disabled) {
  background: #4338CA;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-primary svg {
  width: 16px;
  height: 16px;
}

/* Delete modal */
.delete-msg {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
  margin: 0;
}

.delete-msg strong {
  color: #0F172A;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #EF4444;
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.btn-danger:hover:not(:disabled) {
  background: #DC2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-danger svg {
  width: 16px;
  height: 16px;
}

/* ── Modal transition ── */
.modal-enter-active {
  transition: opacity 0.25s ease;
}

.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-box {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-leave-active .modal-box {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-box {
  transform: scale(0.94) translateY(16px);
}

.modal-leave-to .modal-box {
  transform: scale(0.96) translateY(8px);
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .rp-body {
    grid-template-columns: 280px 1fr;
  }
}

@media (max-width: 768px) {
  .rp-body {
    grid-template-columns: 1fr;
  }

  .role-list-panel {
    max-height: 300px;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .rp-header__inner {
    padding: 16px 20px 18px;
  }

  .rp-icon-mark {
    width: 38px;
    height: 38px;
  }

  .rp-icon-mark svg {
    width: 18px;
    height: 18px;
  }

  .module-groups {
    padding: 16px;
  }

  .perm-panel__head {
    padding: 14px 16px;
  }

  .perm-panel__name {
    font-size: 18px;
  }

  .module-table__head,
  .module-row {
    grid-template-columns: 1fr repeat(4, 56px);
  }

  .mt-col {
    padding: 6px 10px;
    font-size: 9px;
  }

  .perm-toggle {
    width: 28px;
    height: 20px;
  }

  .perm-toggle__dot {
    width: 12px;
    height: 12px;
  }

  .perm-toggle--on .perm-toggle__dot {
    transform: translateX(8px);
  }

  .rp-header__right .stat-pill {
    display: none;
  }

  .modal-box {
    max-width: 95%;
    margin: 12px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-box__head {
    padding: 16px 18px 12px;
  }

  .modal-body {
    padding: 18px;
  }

  .modal-footer {
    padding: 14px 18px;
  }
}

@media (max-width: 480px) {
  .rp-header__inner {
    padding: 12px 16px 14px;
  }

  .rp-icon-mark {
    width: 32px;
    height: 32px;
  }

  .rp-icon-mark svg {
    width: 16px;
    height: 16px;
  }

  .module-table__head,
  .module-row {
    grid-template-columns: 1fr repeat(4, 44px);
  }

  .mt-col--module {
    font-size: 8px;
    gap: 6px;
  }

  .mt-col--action {
    font-size: 8px;
  }

  .mod-icon {
    width: 20px;
    height: 20px;
  }

  .mod-icon svg {
    width: 12px;
    height: 12px;
  }

  .mod-label {
    font-size: 12px;
  }

  .perm-toggle {
    width: 24px;
    height: 18px;
  }

  .perm-toggle__dot {
    width: 10px;
    height: 10px;
  }

  .perm-toggle--on .perm-toggle__dot {
    transform: translateX(6px);
  }

  .modal-box {
    max-width: 100%;
    margin: 12px;
    border-radius: var(--radius-md);
  }

  .modal-box__head {
    padding: 14px 16px 10px;
  }

  .modal-mark {
    width: 34px;
    height: 34px;
  }

  .modal-mark svg {
    width: 16px;
    height: 16px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-body {
    padding: 16px;
    gap: 14px;
  }

  .modal-footer {
    padding: 12px 16px;
    flex-direction: column-reverse;
  }

  .modal-footer .btn-ghost,
  .modal-footer .btn-primary,
  .modal-footer .btn-danger {
    width: 100%;
    justify-content: center;
  }

  .btn-add {
    padding: 8px 16px;
    font-size: 12px;
  }

  .btn-save {
    padding: 6px 16px;
    font-size: 11px;
  }

  .btn-ghost {
    padding: 6px 12px;
    font-size: 11px;
  }

  .perm-panel__head {
    padding: 10px 14px;
  }

  .perm-panel__mark {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .perm-panel__name {
    font-size: 16px;
  }
}
</style>