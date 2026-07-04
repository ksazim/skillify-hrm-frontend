<template>
  <div class="company-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12H4V4zm2 1h2v2H6V5zm0 4h2v2H6V9zm0 4h2v2H6v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <h1 class="page-title">Company Management</h1>
          <p class="page-subtitle">Manage companies, branches, departments and roles</p>
        </div>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="hstat">
            <span class="hstat-value">{{ companies.length }}</span>
            <span class="hstat-label">Total</span>
          </div>
          <div class="hstat-divider"></div>
          <div class="hstat">
            <span class="hstat-value active-color">{{companies.filter(c => c.status === 'active').length}}</span>
            <span class="hstat-label">Active</span>
          </div>
          <div class="hstat-divider"></div>
          <div class="hstat">
            <span class="hstat-value inactive-color">{{companies.filter(c => c.status !== 'active').length}}</span>
            <span class="hstat-label">Inactive</span>
          </div>
        </div>
        <button class="btn-add" @click="openCreateCompanyModal">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd" />
          </svg>
          New Company
        </button>
      </div>
    </div>

    <!-- Search / Filter bar -->
    <div class="filter-bar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clip-rule="evenodd" />
        </svg>
        <input v-model="searchQuery" class="search-input" placeholder="Search companies…" @input="filterCompanies" />
      </div>
      <select v-model="filterStatus" class="filter-select" @change="filterCompanies">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select v-model="filterIndustry" class="filter-select" @change="filterCompanies">
        <option value="">All Industries</option>
        <option v-for="ind in INDUSTRIES" :key="ind" :value="ind">{{ ind }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !companies.length" class="state-loading">
      <div class="spinner"></div>
      <span>Loading companies…</span>
    </div>

    <!-- Error -->
    <div v-else-if="hasError && !companies.length" class="state-error">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd" />
      </svg>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="loadData">Retry</button>
    </div>

    <!-- Company Cards Grid -->
    <div v-else class="cards-grid">
      <div v-for="company in filteredCompanies" :key="company.id" class="company-card"
        :class="{ 'card-inactive': company.status !== 'active' }">
        <div class="card-header">
          <div class="card-logo-wrap">
            <img v-if="company.logo" :src="getFileUrl(company.logo)" alt="logo" class="card-logo" />
            <div v-else class="card-logo-placeholder">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12H4V4zm2 1h2v2H6V5zm0 4h2v2H6V9zm4-4h2v2h-2V5z"
                  clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <div class="card-title-block">
            <h3 class="card-name">{{ company.name }}</h3>
            <span v-if="company.industry" class="card-industry">{{ company.industry }}</span>
          </div>
          <div class="card-status-wrap">
            <span class="card-status" :class="company.status === 'active' ? 'status-active' : 'status-inactive'">
              {{ company.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="card-meta">
          <div v-if="company.email" class="meta-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span>{{ company.email }}</span>
          </div>
          <div v-if="company.phone" class="meta-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span>{{ company.phone }}</span>
          </div>
          <div v-if="company.country" class="meta-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clip-rule="evenodd" />
            </svg>
            <span>{{ company.city ? company.city + ', ' : '' }}{{ company.country }}</span>
          </div>
        </div>

        <div class="card-stats">
          <button class="stat-chip" @click="openModal(company, 'branches')">
            <span class="stat-num">{{ company.branches?.length ?? 0 }}</span>
            <span class="stat-lbl">Branches</span>
          </button>
          <button class="stat-chip" @click="openModal(company, 'departments')">
            <span class="stat-num">{{ company.departments?.length ?? 0 }}</span>
            <span class="stat-lbl">Departments</span>
          </button>
          <button class="stat-chip" @click="openModal(company, 'roles')">
            <span class="stat-num">{{ company.roles?.length ?? 0 }}</span>
            <span class="stat-lbl">Roles</span>
          </button>
        </div>

        <div class="card-footer">
          <button class="card-btn btn-view-c" @click="openModal(company, 'company-view')">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fill-rule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clip-rule="evenodd" />
            </svg>
            View
          </button>
          <button class="card-btn btn-edit-c" @click="openModal(company, 'company-edit')">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </button>
          <button class="card-btn btn-delete-c" @click="confirmDelete(company)">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <div v-if="!isLoading && filteredCompanies.length === 0 && companies.length === 0" class="state-empty">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12H4V4zm2 1h2v2H6V5zm0 4h2v2H6V9zm4-4h2v2h-2V5z"
            clip-rule="evenodd" />
        </svg>
        <p>No companies found</p>
        <button class="btn-add" @click="openCreateCompanyModal">Add First Company</button>
      </div>
      <div v-else-if="!isLoading && filteredCompanies.length === 0 && companies.length > 0" class="state-empty">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clip-rule="evenodd" />
        </svg>
        <p>No companies match your filters</p>
        <button class="btn-retry" @click="clearFilters">Clear Filters</button>
      </div>
    </div>

    <!-- MASTER MODAL -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-shell" :class="modalSize">
          <div class="modal-head">
            <div class="modal-head-left">
              <div class="modal-company-logo" v-if="selectedCompany">
                <img v-if="selectedCompany.logo" :src="getFileUrl(selectedCompany.logo)" alt="logo" />
                <svg v-else viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12H4V4zm2 1h2v2H6V5zm0 4h2v2H6V9zm4-4h2v2h-2V5z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 class="modal-title">{{ modalTitle }}</h2>
                <p v-if="selectedCompany" class="modal-company-name">{{ selectedCompany.name }}</p>
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

          <div class="modal-tabs" v-if="selectedCompany && modalMode !== 'create-company'">
            <button v-for="tab in modalTabs" :key="tab.key" class="tab-btn"
              :class="{ 'tab-active': activeTab === tab.key }" @click="switchTab(tab.key)">{{ tab.label }}</button>
          </div>

          <div v-if="modalNotif.show" class="modal-notif" :class="'notif-' + modalNotif.type">
            {{ modalNotif.message }}
          </div>

          <div class="modal-body">
            <!-- COMPANY VIEW -->
            <div v-if="activeTab === 'company-view'" class="tab-pane">
              <CompanyViewPanel :company="selectedCompany" :get-file-url="getFileUrl" />
            </div>

            <!-- COMPANY EDIT / CREATE -->
            <div v-if="activeTab === 'company-edit' || activeTab === 'company-create'" class="tab-pane">
              <CompanyForm :company="activeTab === 'company-edit' ? selectedCompany : null" :loading="subLoading"
                :industries="INDUSTRIES" :countries="COUNTRIES" @submit="handleCompanyFormSubmit" />
            </div>

            <!-- BRANCHES TAB -->
            <div v-if="activeTab === 'branches'" class="tab-pane">
              <SubEntityPanel title="Branches" add-label="Add Branch" :items="subData.branches" :loading="subLoading"
                :columns="branchColumns" :form-fields="branchFormFields" :company-id="selectedCompany?.id"
                :countries="COUNTRIES" endpoint="branches" @refresh="loadSubData" @notify="showNotif" />
            </div>

            <!-- DEPARTMENTS TAB -->
            <div v-if="activeTab === 'departments'" class="tab-pane">
              <div class="dept-filter-bar">
                <label class="dept-filter-label">Filter by Branch:</label>
                <select v-model="deptBranchFilter" class="filter-select dept-branch-select"
                  @change="onDeptBranchFilterChange">
                  <option value="">All Branches</option>
                  <option v-for="b in subData.branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
              </div>
              <SubEntityPanel title="Departments" add-label="Add Department" :items="subData.departments"
                :loading="subLoading" :columns="departmentColumns" :form-fields="departmentFormFields"
                :company-id="selectedCompany?.id" :branches="subData.branches" endpoint="departments"
                @refresh="loadSubData" @notify="showNotif" />
            </div>

            <!-- ROLES TAB -->
            <div v-if="activeTab === 'roles'" class="tab-pane">
              <SubEntityPanel title="Company Roles" add-label="Add Role" :items="subData.roles" :loading="subLoading"
                :columns="roleColumns" :form-fields="roleFormFields" :company-id="selectedCompany?.id"
                :departments="subData.departments" endpoint="roles" @refresh="loadSubData" @notify="showNotif" />
            </div>

            <!-- SHIFTS TAB -->
            <div v-if="activeTab === 'shifts'" class="tab-pane">
              <ShiftPanel :items="subData.shifts" :loading="subLoading" :company-id="selectedCompany?.id"
                @refresh="loadSubData" @notify="showNotif" />
            </div>

            <!-- WEEKENDS TAB -->
            <div v-if="activeTab === 'weekends'" class="tab-pane">
              <WeekendPanel :items="subData.weekends" :loading="subLoading" :company-id="selectedCompany?.id"
                @refresh="loadSubData" @notify="showNotif" />
            </div>

            <!-- HOLIDAYS TAB -->
            <div v-if="activeTab === 'holidays'" class="tab-pane">
              <HolidayPanel :items="subData.holidays" :loading="subLoading" :company-id="selectedCompany?.id"
                @refresh="loadSubData" @notify="showNotif" />
            </div>

            <!-- LEAVE POLICIES TAB -->
            <div v-if="activeTab === 'leave-policies'" class="tab-pane">
              <LeavePolicyPanel :items="subData.leavePolicies" :loading="subLoading" :company-id="selectedCompany?.id"
                :roles="subData.roles" @refresh="loadSubData" @notify="showNotif" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- DELETE CONFIRM MODAL -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-backdrop" @click.self="showDeleteConfirm = false">
        <div class="modal-shell modal-sm">
          <div class="modal-head">
            <h2 class="modal-title danger-title">Delete Company</h2>
            <button class="modal-close" @click="showDeleteConfirm = false">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="delete-confirm-body">
              <div class="delete-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <p class="delete-msg">Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>? This
                action cannot be undone and all associated data will be permanently removed.</p>
              <div class="delete-actions">
                <button class="btn-cancel" @click="showDeleteConfirm = false">Cancel</button>
                <button class="btn-danger" :disabled="subLoading" @click="executeDelete">
                  <span v-if="subLoading" class="spinner-sm"></span>
                  {{ subLoading ? 'Deleting…' : 'Delete Company' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="globalNotif.show" class="global-notif" :class="'gnotif-' + globalNotif.type">
      {{ globalNotif.message }}
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, defineComponent, h, onMounted, ref, watch, watchEffect } from 'vue'

// ─────────────────────────────────────────────────────────────────────────────
// INLINE SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const CompanyViewPanel = defineComponent({
  name: 'CompanyViewPanel',
  props: { company: Object, getFileUrl: Function },
  setup(props) {
    const fields = [
      ['Legal Name', 'legal_name'], ['Industry', 'industry'], ['Founded', 'founded_year'],
      ['Size', 'company_size'], ['Email', 'email'], ['Phone', 'phone'],
      ['Fax', 'fax'], ['Website', 'website'], ['Address', 'address'],
      ['City', 'city'], ['State', 'state'], ['Country', 'country'],
      ['Postal Code', 'postal_code'], ['Registration No.', 'registration_no'],
      ['Tax / TIN', 'tax_id'], ['BIN', 'bin'],
    ]
    return () => {
      const c = props.company
      if (!c) return null
      return h('div', { class: 'view-panel' }, [
        c.description && h('p', { class: 'view-description' }, c.description),
        h('div', { class: 'view-grid' },
          fields.filter(([, k]) => c[k]).map(([label, key]) =>
            h('div', { class: 'view-field' }, [
              h('span', { class: 'view-label' }, label),
              h('span', { class: 'view-value' }, String(c[key])),
            ])
          )
        ),
        c.brand_color && h('div', { class: 'view-field' }, [
          h('span', { class: 'view-label' }, 'Brand Colour'),
          h('div', { class: 'color-swatch-wrap' }, [
            h('div', { class: 'color-swatch', style: { background: c.brand_color } }),
            h('span', { class: 'view-value' }, c.brand_color),
          ])
        ]),
      ])
    }
  }
})

const CompanyForm = defineComponent({
  name: 'CompanyForm',
  props: { company: Object, loading: Boolean, industries: Array, countries: Array },
  emits: ['submit'],
  setup(props, { emit }) {
    const form = ref({})
    const SIZES = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+']

    const resetForm = () => {
      const c = props.company || {}
      form.value = {
        name: c.name || '', legal_name: c.legal_name || '', industry: c.industry || '',
        founded_year: c.founded_year || '', company_size: c.company_size || '',
        email: c.email || '', phone: c.phone || '', fax: c.fax || '', website: c.website || '',
        address: c.address || '', city: c.city || '', state: c.state || '',
        country: c.country || '', postal_code: c.postal_code || '',
        registration_no: c.registration_no || '', tax_id: c.tax_id || '', bin: c.bin || '',
        brand_color: c.brand_color || '#C9A96E', description: c.description || '',
        status: c.status || 'active', logo: null,
      }
    }
    watchEffect(() => resetForm())

    const handleSubmit = () => emit('submit', { data: { ...form.value }, mode: props.company ? 'edit' : 'create' })
    const handleFile = (e) => { form.value.logo = e.target.files[0] || null }

    function formInput(label, type, value, onUpdate, placeholder = '') {
      return h('div', { class: 'form-field' }, [
        h('label', { class: 'form-label' }, label),
        h('input', { type, class: 'form-input', value, placeholder, onInput: e => onUpdate(e.target.value) }),
      ])
    }
    function formSelect(label, value, onUpdate, options, placeholder = '') {
      return h('div', { class: 'form-field' }, [
        h('label', { class: 'form-label' }, label),
        h('select', { class: 'form-select', value, onChange: e => onUpdate(e.target.value) }, [
          h('option', { value: '' }, placeholder),
          ...options.map(o => h('option', { value: o.value, selected: value === o.value }, o.label))
        ]),
      ])
    }

    return () => h('div', { class: 'company-form' }, [
      h('div', { class: 'form-section-title' }, 'Basic Information'),
      h('div', { class: 'form-grid' }, [
        formInput('Company Name *', 'text', form.value.name, v => form.value.name = v, 'Nexara Technologies Ltd.'),
        formInput('Legal Name', 'text', form.value.legal_name, v => form.value.legal_name = v, 'Full registered name'),
        formSelect('Industry *', form.value.industry, v => form.value.industry = v, (props.industries || []).map(i => ({ value: i, label: i })), 'Select industry'),
        formInput('Founded Year', 'number', form.value.founded_year, v => form.value.founded_year = v, '2010'),
        formSelect('Company Size', form.value.company_size, v => form.value.company_size = v, SIZES.map(s => ({ value: s, label: s })), 'Select size'),
      ]),
      h('div', { class: 'form-section-title' }, 'Contact'),
      h('div', { class: 'form-grid' }, [
        formInput('Email *', 'email', form.value.email, v => form.value.email = v, 'info@company.com'),
        formInput('Phone', 'text', form.value.phone, v => form.value.phone = v, '+880 1700 000000'),
        formInput('Fax', 'text', form.value.fax, v => form.value.fax = v),
        formInput('Website', 'url', form.value.website, v => form.value.website = v, 'https://company.com'),
      ]),
      h('div', { class: 'form-section-title' }, 'Address'),
      h('div', { class: 'form-grid' }, [
        formInput('Street Address', 'text', form.value.address, v => form.value.address = v),
        formInput('City', 'text', form.value.city, v => form.value.city = v, 'Dhaka'),
        formInput('State', 'text', form.value.state, v => form.value.state = v),
        formSelect('Country', form.value.country, v => form.value.country = v, (props.countries || []).map(c => ({ value: c, label: c })), 'Select country'),
        formInput('Postal Code', 'text', form.value.postal_code, v => form.value.postal_code = v, '1229'),
      ]),
      h('div', { class: 'form-section-title' }, 'Legal & Tax'),
      h('div', { class: 'form-grid' }, [
        formInput('Registration No.', 'text', form.value.registration_no, v => form.value.registration_no = v, 'C-1234/2010'),
        formInput('Tax / TIN', 'text', form.value.tax_id, v => form.value.tax_id = v),
        formInput('BIN No.', 'text', form.value.bin, v => form.value.bin = v),
      ]),
      h('div', { class: 'form-section-title' }, 'Branding & Status'),
      h('div', { class: 'form-grid' }, [
        h('div', { class: 'form-field' }, [
          h('label', { class: 'form-label' }, 'Logo'),
          h('input', { type: 'file', accept: 'image/*', class: 'form-file', onChange: handleFile }),
        ]),
        h('div', { class: 'form-field' }, [
          h('label', { class: 'form-label' }, 'Brand Colour'),
          h('input', {
            type: 'color', value: form.value.brand_color, class: 'form-color-input',
            onInput: e => form.value.brand_color = e.target.value
          }),
        ]),
        h('div', { class: 'form-field form-field--full' }, [
          h('label', { class: 'form-label' }, 'About Company'),
          h('textarea', {
            class: 'form-textarea', rows: 3, value: form.value.description,
            placeholder: 'Brief company overview…', onInput: e => form.value.description = e.target.value
          }),
        ]),
        h('div', { class: 'form-field' }, [
          h('label', { class: 'form-label' }, 'Status *'),
          h('div', { class: 'radio-group' }, [
            h('label', { class: 'radio-opt' }, [
              h('input', {
                type: 'radio', name: 'company_status', value: 'active',
                checked: form.value.status === 'active', onChange: () => form.value.status = 'active'
              }),
              h('span', {}, 'Active'),
            ]),
            h('label', { class: 'radio-opt' }, [
              h('input', {
                type: 'radio', name: 'company_status', value: 'inactive',
                checked: form.value.status === 'inactive', onChange: () => form.value.status = 'inactive'
              }),
              h('span', {}, 'Inactive'),
            ]),
          ]),
        ]),
      ]),
      h('div', { class: 'form-actions' }, [
        h('button', { class: 'btn-submit', disabled: props.loading, onClick: handleSubmit },
          props.loading ? 'Saving…' : (props.company ? 'Update Company' : 'Create Company')),
      ]),
    ])
  }
})

const SubEntityPanel = defineComponent({
  name: 'SubEntityPanel',
  props: {
    title: String, addLabel: String, items: Array, loading: Boolean,
    columns: Array, formFields: Array, companyId: [String, Number],
    endpoint: String, branches: Array, departments: Array, countries: Array,
  },
  emits: ['refresh', 'notify'],
  setup(props, { emit }) {
    const showForm = ref(false)
    const editTarget = ref(null)
    const formData = ref({})
    const saving = ref(false)
    const deleting = ref(false)

    const apiBase2 = process.env.VUE_APP_BASE_API || '/api'
    const panelApi = axios.create({ baseURL: apiBase2 })
    panelApi.interceptors.request.use(cfg => {
      const t = localStorage.getItem('token')
      if (t) cfg.headers.Authorization = `Bearer ${t}`
      return cfg
    })

    const buildDefault = () => {
      const d = { company_id: props.companyId, status: 'active' }
        ; (props.formFields || []).forEach(f => {
          if (f.default !== undefined) d[f.name] = f.default
        })
      return d
    }

    const openCreate = () => { editTarget.value = null; formData.value = buildDefault(); showForm.value = true }
    const openEdit = (item) => { editTarget.value = item; formData.value = { company_id: props.companyId, ...item }; showForm.value = true }

    const handleSave = async () => {
      saving.value = true
      try {
        const payload = { company_id: props.companyId, ...formData.value }
        if (editTarget.value) {
          await panelApi.put(`/${props.endpoint}/${editTarget.value.id}`, payload)
          emit('notify', { type: 'success', message: 'Updated successfully.' })
        } else {
          await panelApi.post(`/${props.endpoint}`, payload)
          emit('notify', { type: 'success', message: 'Created successfully.' })
        }
        showForm.value = false
        emit('refresh', props.companyId)
      } catch (err) {
        const errMsg = err.response?.data?.message ||
          (err.response?.data?.errors
            ? Object.entries(err.response.data.errors).map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`).join(' · ')
            : 'Save failed.')
        emit('notify', { type: 'error', message: errMsg })
      } finally { saving.value = false }
    }

    const handleDelete = async (item) => {
      if (!confirm(`Delete "${item.name}"?`)) return
      deleting.value = true
      try {
        await panelApi.delete(`/${props.endpoint}/${item.id}`)
        emit('notify', { type: 'success', message: 'Deleted successfully.' })
        emit('refresh', props.companyId)
      } catch (err) {
        emit('notify', { type: 'error', message: err.response?.data?.message || 'Delete failed.' })
      } finally { deleting.value = false }
    }

    const renderField = (field) => {
      if (field.type === 'radio') {
        return h('div', { class: 'form-field' }, [
          h('label', { class: 'form-label' }, field.label),
          h('div', { class: 'radio-group' },
            field.options.map(opt =>
              h('label', { class: 'radio-opt' }, [
                h('input', {
                  type: 'radio', name: `sub_${field.name}_${props.endpoint}`, value: opt.value,
                  checked: formData.value[field.name] === opt.value, onChange: () => formData.value[field.name] = opt.value
                }),
                h('span', {}, opt.label),
              ])
            )
          ),
        ])
      }
      if (field.type === 'select') {
        return h('div', { class: 'form-field' }, [
          h('label', { class: 'form-label' }, field.label + (field.required ? ' *' : '')),
          h('select', {
            class: 'form-select', value: formData.value[field.name] || '',
            onChange: e => formData.value[field.name] = e.target.value
          }, [
            h('option', { value: '' }, field.placeholder || 'Select…'),
            ...(field.options || []).map(o => h('option', { value: o.value, selected: formData.value[field.name] == o.value }, o.label))
          ]),
        ])
      }
      if (field.type === 'textarea') {
        return h('div', { class: 'form-field form-field--full' }, [
          h('label', { class: 'form-label' }, field.label),
          h('textarea', {
            class: 'form-textarea', rows: field.rows || 2,
            value: formData.value[field.name] || '', placeholder: field.placeholder || '',
            onInput: e => formData.value[field.name] = e.target.value
          }),
        ])
      }
      return h('div', { class: 'form-field' }, [
        h('label', { class: 'form-label' }, field.label + (field.required ? ' *' : '')),
        h('input', {
          type: field.type || 'text', class: 'form-input',
          value: formData.value[field.name] || '', placeholder: field.placeholder || '',
          onInput: e => formData.value[field.name] = e.target.value
        }),
      ])
    }

    return () => {
      const items = props.items || []
      return h('div', { class: 'sub-panel' }, [
        h('div', { class: 'sub-panel-head' }, [
          h('span', { class: 'sub-panel-count' }, `${items.length} ${props.title}`),
          h('button', { class: 'btn-add-sub', onClick: openCreate }, [
            h('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 14, height: 14 },
              [h('path', { 'fill-rule': 'evenodd', d: 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z', 'clip-rule': 'evenodd' })]),
            props.addLabel,
          ]),
        ]),
        showForm.value && h('div', { class: 'sub-form' }, [
          h('div', { class: 'sub-form-grid' }, (props.formFields || []).map(renderField)),
          h('div', { class: 'sub-form-actions' }, [
            h('button', { class: 'btn-cancel-sm', onClick: () => showForm.value = false }, 'Cancel'),
            h('button', { class: 'btn-save', disabled: saving.value, onClick: handleSave },
              saving.value ? 'Saving…' : (editTarget.value ? 'Update' : 'Create')),
          ]),
        ]),
        props.loading && h('div', { class: 'sub-loading' }, [h('div', { class: 'spinner' })]),
        !props.loading && h('div', { class: 'sub-table-wrap' }, [
          items.length === 0
            ? h('div', { class: 'sub-empty' }, `No ${props.title.toLowerCase()} found`)
            : h('table', { class: 'sub-table' }, [
              h('thead', {}, [h('tr', {}, [
                ...(props.columns || []).map(col => h('th', {}, col.label)),
                h('th', {}, 'Actions'),
              ])]),
              h('tbody', {}, items.map(item =>
                h('tr', { key: item.id }, [
                  ...(props.columns || []).map(col =>
                    col.type === 'status'
                      ? h('td', {}, [h('span', { class: `sub-status ${item[col.key] === 'active' ? 'status-active' : 'status-inactive'}` }, item[col.key] || '—')])
                      : h('td', {}, item[col.key] || '—')
                  ),
                  h('td', { class: 'sub-actions-cell' }, [
                    h('button', { class: 'sub-btn sub-btn-edit', onClick: () => openEdit(item) }, 'Edit'),
                    h('button', { class: 'sub-btn sub-btn-delete', onClick: () => handleDelete(item) }, 'Delete'),
                  ]),
                ])
              )),
            ])
        ]),
      ])
    }
  }
})

// ── ShiftPanel ────────────────────────────────────────────────────────────────
const ShiftPanel = defineComponent({
  name: 'ShiftPanel',
  props: { items: Array, loading: Boolean, companyId: [String, Number] },
  emits: ['refresh', 'notify'],
  setup(props, { emit }) {
    const showForm = ref(false)
    const editTarget = ref(null)
    const saving = ref(false)
    const formData = ref({})

    const apiBase2 = process.env.VUE_APP_BASE_API || '/api'
    const panelApi = axios.create({ baseURL: apiBase2 })
    panelApi.interceptors.request.use(cfg => {
      const t = localStorage.getItem('token')
      if (t) cfg.headers.Authorization = `Bearer ${t}`
      return cfg
    })

    const openCreate = () => {
      editTarget.value = null
      formData.value = { company_id: props.companyId, name: '', start_time: '', end_time: '', details: '', status: 'active' }
      showForm.value = true
    }
    const openEdit = (item) => {
      editTarget.value = item
      formData.value = { company_id: props.companyId, ...item }
      showForm.value = true
    }
    const handleSave = async () => {
      saving.value = true
      try {
        const payload = { company_id: props.companyId, ...formData.value }
        if (editTarget.value) {
          await panelApi.post(`/shifts/update/${editTarget.value.id}`, payload)
          emit('notify', { type: 'success', message: 'Shift updated successfully.' })
        } else {
          await panelApi.post('/shifts/store', payload)
          emit('notify', { type: 'success', message: 'Shift created successfully.' })
        }
        showForm.value = false
        emit('refresh', props.companyId)
      } catch (err) {
        const errMsg = err.response?.data?.message ||
          (err.response?.data?.errors
            ? Object.entries(err.response.data.errors).map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`).join(' · ')
            : 'Save failed.')
        emit('notify', { type: 'error', message: errMsg })
      } finally { saving.value = false }
    }
    const handleDelete = async (item) => {
      if (!confirm(`Delete shift "${item.name}"?`)) return
      try {
        await panelApi.delete(`/shifts/delete/${item.id}`)
        emit('notify', { type: 'success', message: 'Shift deleted.' })
        emit('refresh', props.companyId)
      } catch (err) {
        emit('notify', { type: 'error', message: err.response?.data?.message || 'Delete failed.' })
      }
    }

    const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]

    return () => {
      const items = props.items || []
      return h('div', { class: 'sub-panel' }, [
        h('div', { class: 'sub-panel-head' }, [
          h('span', { class: 'sub-panel-count' }, `${items.length} Shifts`),
          h('button', { class: 'btn-add-sub', onClick: openCreate }, [
            h('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 14, height: 14 },
              [h('path', { 'fill-rule': 'evenodd', d: 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z', 'clip-rule': 'evenodd' })]),
            'Add Shift',
          ]),
        ]),
        showForm.value && h('div', { class: 'sub-form' }, [
          h('div', { class: 'sub-form-grid' }, [
            // Name
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Shift Name *'),
              h('input', {
                type: 'text', class: 'form-input', value: formData.value.name || '',
                placeholder: 'Morning Shift', onInput: e => formData.value.name = e.target.value
              }),
            ]),
            // Start time
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Start Time *'),
              h('input', {
                type: 'time', class: 'form-input', value: formData.value.start_time || '',
                onInput: e => formData.value.start_time = e.target.value
              }),
            ]),
            // End time
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'End Time *'),
              h('input', {
                type: 'time', class: 'form-input', value: formData.value.end_time || '',
                onInput: e => formData.value.end_time = e.target.value
              }),
            ]),
            // Status
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Status'),
              h('div', { class: 'radio-group' },
                statusOptions.map(opt =>
                  h('label', { class: 'radio-opt' }, [
                    h('input', {
                      type: 'radio', name: 'shift_status', value: opt.value,
                      checked: formData.value.status === opt.value,
                      onChange: () => formData.value.status = opt.value
                    }),
                    h('span', {}, opt.label),
                  ])
                )
              ),
            ]),
            // Details (full width)
            h('div', { class: 'form-field form-field--full' }, [
              h('label', { class: 'form-label' }, 'Details'),
              h('textarea', {
                class: 'form-textarea', rows: 2,
                value: formData.value.details || '', placeholder: 'Optional description…',
                onInput: e => formData.value.details = e.target.value
              }),
            ]),
          ]),
          h('div', { class: 'sub-form-actions' }, [
            h('button', { class: 'btn-cancel-sm', onClick: () => showForm.value = false }, 'Cancel'),
            h('button', { class: 'btn-save', disabled: saving.value, onClick: handleSave },
              saving.value ? 'Saving…' : (editTarget.value ? 'Update' : 'Create')),
          ]),
        ]),
        props.loading && h('div', { class: 'sub-loading' }, [h('div', { class: 'spinner' })]),
        !props.loading && h('div', { class: 'sub-table-wrap' }, [
          items.length === 0
            ? h('div', { class: 'sub-empty' }, 'No shifts found')
            : h('table', { class: 'sub-table' }, [
              h('thead', {}, [h('tr', {}, [
                h('th', {}, 'Shift Name'), h('th', {}, 'Start Time'),
                h('th', {}, 'End Time'), h('th', {}, 'Status'), h('th', {}, 'Actions'),
              ])]),
              h('tbody', {}, items.map(item =>
                h('tr', { key: item.id }, [
                  h('td', {}, item.name || '—'),
                  h('td', {}, item.start_time || '—'),
                  h('td', {}, item.end_time || '—'),
                  h('td', {}, [h('span', { class: `sub-status ${item.status === 'active' ? 'status-active' : 'status-inactive'}` }, item.status || '—')]),
                  h('td', { class: 'sub-actions-cell' }, [
                    h('button', { class: 'sub-btn sub-btn-edit', onClick: () => openEdit(item) }, 'Edit'),
                    h('button', { class: 'sub-btn sub-btn-delete', onClick: () => handleDelete(item) }, 'Delete'),
                  ]),
                ])
              )),
            ])
        ]),
      ])
    }
  }
})

// ── WeekendPanel ──────────────────────────────────────────────────────────────
const WeekendPanel = defineComponent({
  name: 'WeekendPanel',
  props: { items: Array, loading: Boolean, companyId: [String, Number] },
  emits: ['refresh', 'notify'],
  setup(props, { emit }) {
    const saving = ref(false)
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    const apiBase2 = process.env.VUE_APP_BASE_API || '/api'
    const panelApi = axios.create({ baseURL: apiBase2 })
    panelApi.interceptors.request.use(cfg => {
      const t = localStorage.getItem('token')
      if (t) cfg.headers.Authorization = `Bearer ${t}`
      return cfg
    })

    const activeDays = computed(() => {
      const days = new Set((props.items || []).map(i => Number(i.day_of_week)))
      return days
    })

    const toggleDay = async (dayIndex) => {
      saving.value = true
      try {
        const existingItem = (props.items || []).find(i => Number(i.day_of_week) === dayIndex)
        if (existingItem) {
          await panelApi.delete(`/weekends/delete/${existingItem.id}`)
          emit('notify', { type: 'success', message: `${DAY_NAMES[dayIndex]} removed from weekends.` })
        } else {
          await panelApi.post('/weekends/store', { company_id: props.companyId, day_of_week: dayIndex })
          emit('notify', { type: 'success', message: `${DAY_NAMES[dayIndex]} added as weekend.` })
        }
        emit('refresh', props.companyId)
      } catch (err) {
        emit('notify', { type: 'error', message: err.response?.data?.message || 'Operation failed.' })
      } finally { saving.value = false }
    }

    return () => {
      return h('div', { class: 'sub-panel' }, [
        h('div', { class: 'sub-panel-head' }, [
          h('span', { class: 'sub-panel-count' }, `${(props.items || []).length} Weekend Days`),
          saving.value && h('span', { class: 'saving-indicator' }, 'Saving…'),
        ]),
        h('div', { class: 'weekend-info' }, 'Click a day to toggle it as a weekend day for this company.'),
        props.loading
          ? h('div', { class: 'sub-loading' }, [h('div', { class: 'spinner' })])
          : h('div', { class: 'weekend-grid' },
            DAY_NAMES.map((name, idx) => {
              const isWeekend = activeDays.value.has(idx)
              return h('button', {
                key: idx,
                class: `weekend-day-btn ${isWeekend ? 'weekend-active' : ''}`,
                disabled: saving.value,
                onClick: () => toggleDay(idx),
              }, [
                h('span', { class: 'weekend-day-abbr' }, name.slice(0, 3).toUpperCase()),
                h('span', { class: 'weekend-day-full' }, name),
                isWeekend && h('span', { class: 'weekend-check' }, '✓'),
              ])
            })
          ),
        h('div', { class: 'weekend-summary' }, [
          h('span', { class: 'weekend-summary-label' }, 'Current Weekends:'),
          h('span', { class: 'weekend-summary-days' },
            (props.items || []).length === 0
              ? 'None configured'
              : (props.items || [])
                .sort((a, b) => a.day_of_week - b.day_of_week)
                .map(i => DAY_NAMES[i.day_of_week])
                .join(', ')
          ),
        ]),
      ])
    }
  }
})

// ── HolidayPanel ──────────────────────────────────────────────────────────────
const HolidayPanel = defineComponent({
  name: 'HolidayPanel',
  props: { items: Array, loading: Boolean, companyId: [String, Number], roles: Array },
  emits: ['refresh', 'notify'],
  setup(props, { emit }) {
    const showForm = ref(false)
    const editTarget = ref(null)
    const saving = ref(false)
    const formData = ref({})

    const apiBase2 = process.env.VUE_APP_BASE_API || '/api'
    const panelApi = axios.create({ baseURL: apiBase2 })
    panelApi.interceptors.request.use(cfg => {
      const t = localStorage.getItem('token')
      if (t) cfg.headers.Authorization = `Bearer ${t}`
      return cfg
    })

    const openCreate = () => {
      editTarget.value = null
      formData.value = { company_id: props.companyId, name: '', date: '', description: '' }
      showForm.value = true
    }
    const openEdit = (item) => {
      editTarget.value = item
      formData.value = { company_id: props.companyId, ...item }
      showForm.value = true
    }
    const handleSave = async () => {
      saving.value = true
      try {
        const payload = { company_id: props.companyId, ...formData.value }
        if (editTarget.value) {
          await panelApi.post(`/holidays/update/${editTarget.value.id}`, payload)
          emit('notify', { type: 'success', message: 'Holiday updated successfully.' })
        } else {
          await panelApi.post('/holidays/store', payload)
          emit('notify', { type: 'success', message: 'Holiday created successfully.' })
        }
        showForm.value = false
        emit('refresh', props.companyId)
      } catch (err) {
        const errMsg = err.response?.data?.message ||
          (err.response?.data?.errors
            ? Object.entries(err.response.data.errors).map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`).join(' · ')
            : 'Save failed.')
        emit('notify', { type: 'error', message: errMsg })
      } finally { saving.value = false }
    }
    const handleDelete = async (item) => {
      if (!confirm(`Delete holiday "${item.name}"?`)) return
      try {
        await panelApi.delete(`/holidays/delete/${item.id}`)
        emit('notify', { type: 'success', message: 'Holiday deleted.' })
        emit('refresh', props.companyId)
      } catch (err) {
        emit('notify', { type: 'error', message: err.response?.data?.message || 'Delete failed.' })
      }
    }

    const formatDate = (d) => {
      if (!d) return '—'
      try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
      catch { return d }
    }

    return () => {
      const items = props.items || []
      return h('div', { class: 'sub-panel' }, [
        h('div', { class: 'sub-panel-head' }, [
          h('span', { class: 'sub-panel-count' }, `${items.length} Holidays`),
          h('button', { class: 'btn-add-sub', onClick: openCreate }, [
            h('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 14, height: 14 },
              [h('path', { 'fill-rule': 'evenodd', d: 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z', 'clip-rule': 'evenodd' })]),
            'Add Holiday',
          ]),
        ]),
        showForm.value && h('div', { class: 'sub-form' }, [
          h('div', { class: 'sub-form-grid' }, [
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Holiday Name *'),
              h('input', {
                type: 'text', class: 'form-input', value: formData.value.name || '',
                placeholder: 'Eid ul-Fitr', onInput: e => formData.value.name = e.target.value
              }),
            ]),
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Date *'),
              h('input', {
                type: 'date', class: 'form-input', value: formData.value.date || '',
                onInput: e => formData.value.date = e.target.value
              }),
            ]),
            h('div', { class: 'form-field form-field--full' }, [
              h('label', { class: 'form-label' }, 'Description'),
              h('textarea', {
                class: 'form-textarea', rows: 2,
                value: formData.value.description || '', placeholder: 'Optional notes…',
                onInput: e => formData.value.description = e.target.value
              }),
            ]),
          ]),
          h('div', { class: 'sub-form-actions' }, [
            h('button', { class: 'btn-cancel-sm', onClick: () => showForm.value = false }, 'Cancel'),
            h('button', { class: 'btn-save', disabled: saving.value, onClick: handleSave },
              saving.value ? 'Saving…' : (editTarget.value ? 'Update' : 'Create')),
          ]),
        ]),
        props.loading && h('div', { class: 'sub-loading' }, [h('div', { class: 'spinner' })]),
        !props.loading && h('div', { class: 'sub-table-wrap' }, [
          items.length === 0
            ? h('div', { class: 'sub-empty' }, 'No holidays found')
            : h('table', { class: 'sub-table' }, [
              h('thead', {}, [h('tr', {}, [
                h('th', {}, 'Holiday'), h('th', {}, 'Date'), h('th', {}, 'Description'), h('th', {}, 'Actions'),
              ])]),
              h('tbody', {}, items.map(item =>
                h('tr', { key: item.id }, [
                  h('td', {}, item.name || '—'),
                  h('td', {}, [h('span', { class: 'holiday-date-badge' }, formatDate(item.date))]),
                  h('td', {}, item.description || '—'),
                  h('td', { class: 'sub-actions-cell' }, [
                    h('button', { class: 'sub-btn sub-btn-edit', onClick: () => openEdit(item) }, 'Edit'),
                    h('button', { class: 'sub-btn sub-btn-delete', onClick: () => handleDelete(item) }, 'Delete'),
                  ]),
                ])
              )),
            ])
        ]),
      ])
    }
  }
})

// ── LeavePolicyPanel ─────────────────────────────────────────────────────────
const LeavePolicyPanel = defineComponent({
  name: 'LeavePolicyPanel',
  props: { items: Array, loading: Boolean, companyId: [String, Number], roles: Array },
  emits: ['refresh', 'notify'],
  setup(props, { emit }) {
    const showForm = ref(false)
    const editTarget = ref(null)
    const saving = ref(false)
    const formData = ref({})
    const expandedPolicy = ref(null)   // policy whose hierarchy panel is open
    const hierarchyItems = ref([])
    const hierarchyLoading = ref(false)
    const showHierarchyForm = ref(false)
    const hierarchyEdit = ref(null)
    const hierarchyForm = ref({})
    const hierarchySaving = ref(false)

    const LEAVE_TYPES = [
      'Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave',
      'Paternity Leave', 'Unpaid Leave', 'Compensatory Leave', 'Emergency Leave', 'Other',
    ]

    const apiBase2 = process.env.VUE_APP_BASE_API || '/api'
    const panelApi = axios.create({ baseURL: apiBase2 })
    panelApi.interceptors.request.use(cfg => {
      const t = localStorage.getItem('auth_token')
      if (t) cfg.headers.Authorization = `Bearer ${t}`
      return cfg
    })

    // ── Policy CRUD ──────────────────────────────────────────────────────────
    const openCreate = () => {
      editTarget.value = null
      formData.value = {
        company_id: props.companyId, name: '', type: '',
        days_per_year: '', description: '', max_carry_forward_days: '', status: 'active',
      }
      showForm.value = true
    }

    const openEdit = (item) => {
      editTarget.value = item
      formData.value = { company_id: props.companyId, ...item }
      showForm.value = true
    }

    const handleSave = async () => {
      saving.value = true
      try {
        const payload = { company_id: props.companyId, ...formData.value }
        if (editTarget.value) {
          await panelApi.put(`/leave/policies/${editTarget.value.id}`, payload)
          emit('notify', { type: 'success', message: 'Leave policy updated successfully.' })
        } else {
          await panelApi.post('/leave/policies', payload)
          emit('notify', { type: 'success', message: 'Leave policy created successfully.' })
        }
        showForm.value = false
        emit('refresh', props.companyId)
      } catch (err) {
        const errMsg = err.response?.data?.message ||
          (err.response?.data?.errors
            ? Object.entries(err.response.data.errors)
              .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`).join(' · ')
            : 'Save failed.')
        emit('notify', { type: 'error', message: errMsg })
      } finally { saving.value = false }
    }

    const handleDelete = async (item) => {
      if (!confirm(`Delete leave policy "${item.name}"?`)) return
      try {
        await panelApi.delete(`/leave/policies/${item.id}`)
        emit('notify', { type: 'success', message: 'Leave policy deleted.' })
        if (expandedPolicy.value?.id === item.id) expandedPolicy.value = null
        emit('refresh', props.companyId)
      } catch (err) {
        emit('notify', { type: 'error', message: err.response?.data?.message || 'Delete failed.' })
      }
    }

    // ── Hierarchy ────────────────────────────────────────────────────────────
    const loadHierarchy = async (policy) => {
      hierarchyLoading.value = true
      hierarchyItems.value = []
      try {
        const { data } = await panelApi.get(
          `/leave/approval-hierarchies/policy/${props.companyId}/${policy.id}`,
          { params: { limit: 1000 } }
        )
        const d = data
        hierarchyItems.value = Array.isArray(d) ? d : (d.list ?? d.data ?? [])
      } catch (err) {
        emit('notify', { type: 'error', message: err.response?.data?.message || 'Failed to load hierarchy.' })
      } finally { hierarchyLoading.value = false }
    }

    const toggleHierarchy = async (policy) => {
      // close if same policy clicked again
      if (expandedPolicy.value?.id === policy.id) {
        expandedPolicy.value = null
        showHierarchyForm.value = false
        return
      }
      expandedPolicy.value = policy
      showHierarchyForm.value = false
      hierarchyEdit.value = null
      await loadHierarchy(policy)
    }

    const openHierarchyCreate = () => {
      hierarchyEdit.value = null
      hierarchyForm.value = {
        company_id: props.companyId,
        leave_policy_id: expandedPolicy.value?.id,
        level: '',
        role_id: '',
        mandatory: true,
      }
      showHierarchyForm.value = true
    }

    const openHierarchyEdit = (item) => {
      hierarchyEdit.value = item
      hierarchyForm.value = {
        company_id: props.companyId,
        leave_policy_id: expandedPolicy.value?.id,
        ...item,
      }
      showHierarchyForm.value = true
    }

    const handleHierarchySave = async () => {
      hierarchySaving.value = true
      try {
        const payload = { ...hierarchyForm.value }
        // clean up empty optional fields
        if (!payload.role_id) delete payload.role_id
        if (!payload.employee_id) delete payload.employee_id

        if (hierarchyEdit.value) {
          await panelApi.put(`/leave/approval-hierarchies/${hierarchyEdit.value.id}`, payload)
          emit('notify', { type: 'success', message: 'Hierarchy level updated.' })
        } else {
          await panelApi.post('/leave/approval-hierarchies', payload)
          emit('notify', { type: 'success', message: 'Hierarchy level added.' })
        }
        showHierarchyForm.value = false
        await loadHierarchy(expandedPolicy.value)
      } catch (err) {
        const errMsg = err.response?.data?.message ||
          (err.response?.data?.errors
            ? Object.entries(err.response.data.errors)
              .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`).join(' · ')
            : 'Save failed.')
        emit('notify', { type: 'error', message: errMsg })
      } finally { hierarchySaving.value = false }
    }

    const handleHierarchyDelete = async (item) => {
      if (!confirm(`Delete approval level ${item.level}?`)) return
      try {
        await panelApi.delete(`/leave/approval-hierarchies/${item.id}`)
        emit('notify', { type: 'success', message: 'Hierarchy level deleted.' })
        await loadHierarchy(expandedPolicy.value)
      } catch (err) {
        emit('notify', { type: 'error', message: err.response?.data?.message || 'Delete failed.' })
      }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getDaysLabel = (days) => {
      if (!days && days !== 0) return '—'
      return `${days} day${Number(days) !== 1 ? 's' : ''}`
    }

    const statusOptions = [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ]

    // ── Render ───────────────────────────────────────────────────────────────
    return () => {
      const items = props.items || []

      // ── hierarchy sub-panel rendered inside the policy table ──
      const renderHierarchyPanel = () => h('div', { class: 'hierarchy-panel' }, [

        // header
        h('div', { class: 'hierarchy-panel-head' }, [
          h('div', { class: 'hierarchy-panel-title' }, [
            h('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 14, height: 14, style: 'flex-shrink:0' },
              [h('path', { d: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' })]),
            `Approval Hierarchy — ${expandedPolicy.value?.name}`,
          ]),
          h('button', { class: 'btn-add-sub', onClick: openHierarchyCreate }, [
            h('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 13, height: 13 },
              [h('path', { 'fill-rule': 'evenodd', d: 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z', 'clip-rule': 'evenodd' })]),
            'Add Level',
          ]),
        ]),

        // inline form
        showHierarchyForm.value && h('div', { class: 'sub-form' }, [
          h('div', { class: 'sub-form-grid' }, [
            // Level
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Approval Level *'),
              h('input', {
                type: 'number', class: 'form-input', min: '1',
                value: hierarchyForm.value.level ?? '',
                placeholder: '1',
                onInput: e => hierarchyForm.value.level = e.target.value
              }),
            ]),
            // Role — dropdown from subData.roles passed via prop
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Approver Role *'),
              h('select', {
                class: 'form-select',
                value: hierarchyForm.value.role_id ?? '',
                onChange: e => hierarchyForm.value.role_id = e.target.value
              }, [
                h('option', { value: '' }, 'Select role…'),
                ...(props.roles || []).map(r =>
                  h('option', { value: r.id, selected: hierarchyForm.value.role_id == r.id }, r.name)
                ),
              ]),
            ]),
            // Mandatory
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Mandatory'),
              h('div', { class: 'radio-group' }, [
                h('label', { class: 'radio-opt' }, [
                  h('input', {
                    type: 'radio', name: 'hier_mandatory', value: 'true',
                    checked: hierarchyForm.value.mandatory === true || hierarchyForm.value.mandatory === 'true',
                    onChange: () => hierarchyForm.value.mandatory = true
                  }),
                  h('span', {}, 'Yes'),
                ]),
                h('label', { class: 'radio-opt' }, [
                  h('input', {
                    type: 'radio', name: 'hier_mandatory', value: 'false',
                    checked: hierarchyForm.value.mandatory === false || hierarchyForm.value.mandatory === 'false',
                    onChange: () => hierarchyForm.value.mandatory = false
                  }),
                  h('span', {}, 'No'),
                ]),
              ]),
            ]),
          ]),
          h('div', { class: 'sub-form-actions' }, [
            h('button', { class: 'btn-cancel-sm', onClick: () => showHierarchyForm.value = false }, 'Cancel'),
            h('button', { class: 'btn-save', disabled: hierarchySaving.value, onClick: handleHierarchySave },
              hierarchySaving.value ? 'Saving…' : (hierarchyEdit.value ? 'Update' : 'Add Level')),
          ]),
        ]),

        // loading
        hierarchyLoading.value && h('div', { class: 'sub-loading' }, [h('div', { class: 'spinner' })]),

        // table
        !hierarchyLoading.value && h('div', { class: 'sub-table-wrap' }, [
          hierarchyItems.value.length === 0
            ? h('div', { class: 'sub-empty' }, 'No approval levels configured yet')
            : h('table', { class: 'sub-table' }, [
              h('thead', {}, [h('tr', {}, [
                h('th', {}, 'Level'),
                h('th', {}, 'Approver Role'),
                h('th', {}, 'Mandatory'),
                h('th', {}, 'Actions'),
              ])]),
              h('tbody', {}, hierarchyItems.value.map(item =>
                h('tr', { key: item.id }, [
                  h('td', {}, [h('span', { class: 'hierarchy-level-badge' }, `Level ${item.level}`)]),
                  h('td', {}, (() => {
                    const role = (props.roles || []).find(r => r.id == item.role_id)
                    return role ? role.name : (item.role_id ? `#${item.role_id}` : '—')
                  })()),
                  h('td', {}, [
                    h('span', {
                      class: item.mandatory
                        ? 'hierarchy-mandatory-yes'
                        : 'hierarchy-mandatory-no',
                    }, item.mandatory ? 'Yes' : 'No'),
                  ]),
                  h('td', { class: 'sub-actions-cell' }, [
                    h('button', { class: 'sub-btn sub-btn-edit', onClick: () => openHierarchyEdit(item) }, 'Edit'),
                    h('button', { class: 'sub-btn sub-btn-delete', onClick: () => handleHierarchyDelete(item) }, 'Delete'),
                  ]),
                ])
              )),
            ]),
        ]),
      ])

      // ── main panel ──
      return h('div', { class: 'sub-panel' }, [

        // header row
        h('div', { class: 'sub-panel-head' }, [
          h('span', { class: 'sub-panel-count' }, `${items.length} Leave Polic${items.length === 1 ? 'y' : 'ies'}`),
          h('button', { class: 'btn-add-sub', onClick: openCreate }, [
            h('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 14, height: 14 },
              [h('path', { 'fill-rule': 'evenodd', d: 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z', 'clip-rule': 'evenodd' })]),
            'Add Policy',
          ]),
        ]),

        // policy form
        showForm.value && h('div', { class: 'sub-form' }, [
          h('div', { class: 'sub-form-grid' }, [
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Policy Name *'),
              h('input', {
                type: 'text', class: 'form-input', value: formData.value.name || '',
                placeholder: 'Annual Leave Policy', onInput: e => formData.value.name = e.target.value
              }),
            ]),
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Leave Type *'),
              h('select', {
                class: 'form-select', value: formData.value.type || '',
                onChange: e => formData.value.type = e.target.value
              }, [
                h('option', { value: '' }, 'Select type…'),
                ...LEAVE_TYPES.map(t => h('option', { value: t, selected: formData.value.type === t }, t)),
              ]),
            ]),
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Days Per Year *'),
              h('input', {
                type: 'number', class: 'form-input', min: '0',
                value: formData.value.days_per_year ?? '', placeholder: '14',
                onInput: e => formData.value.days_per_year = e.target.value
              }),
            ]),
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Max Carry‑Forward Days'),
              h('input', {
                type: 'number', class: 'form-input', min: '0',
                value: formData.value.max_carry_forward_days ?? '', placeholder: '0  (0 = disabled)',
                onInput: e => formData.value.max_carry_forward_days = e.target.value
              }),
            ]),
            h('div', { class: 'form-field' }, [
              h('label', { class: 'form-label' }, 'Status *'),
              h('div', { class: 'radio-group' },
                statusOptions.map(opt =>
                  h('label', { class: 'radio-opt' }, [
                    h('input', {
                      type: 'radio', name: 'lp_status', value: opt.value,
                      checked: formData.value.status === opt.value,
                      onChange: () => formData.value.status = opt.value
                    }),
                    h('span', {}, opt.label),
                  ])
                )
              ),
            ]),
            h('div', { class: 'form-field form-field--full' }, [
              h('label', { class: 'form-label' }, 'Description'),
              h('textarea', {
                class: 'form-textarea', rows: 2,
                value: formData.value.description || '', placeholder: 'Optional notes about this policy…',
                onInput: e => formData.value.description = e.target.value
              }),
            ]),
          ]),
          h('div', { class: 'sub-form-actions' }, [
            h('button', { class: 'btn-cancel-sm', onClick: () => showForm.value = false }, 'Cancel'),
            h('button', { class: 'btn-save', disabled: saving.value, onClick: handleSave },
              saving.value ? 'Saving…' : (editTarget.value ? 'Update' : 'Create')),
          ]),
        ]),

        // loading
        props.loading && h('div', { class: 'sub-loading' }, [h('div', { class: 'spinner' })]),

        // table + inline hierarchy panels
        !props.loading && h('div', { class: 'sub-table-wrap' }, [
          items.length === 0
            ? h('div', { class: 'sub-empty' }, 'No leave policies found')
            : h('table', { class: 'sub-table lp-table' }, [
              h('thead', {}, [h('tr', {}, [
                h('th', {}, 'Policy Name'),
                h('th', {}, 'Type'),
                h('th', {}, 'Days / Year'),
                h('th', {}, 'Carry‑Forward'),
                h('th', {}, 'Status'),
                h('th', {}, 'Actions'),
              ])]),
              h('tbody', {}, items.flatMap(item => {
                const isExpanded = expandedPolicy.value?.id === item.id
                return [
                  // policy row
                  h('tr', { key: item.id, class: isExpanded ? 'lp-row-expanded' : '' }, [
                    h('td', {}, item.name || '—'),
                    h('td', {}, [h('span', { class: 'lp-type-badge' }, item.type || '—')]),
                    h('td', {}, [h('span', { class: 'lp-days-badge' }, getDaysLabel(item.days_per_year))]),
                    h('td', {}, (() => {
                      const d = Number(item.max_carry_forward_days)
                      if (item.max_carry_forward_days == null || item.max_carry_forward_days === '') return '—'
                      return d > 0 ? `Up to ${d} day${d !== 1 ? 's' : ''}` : 'None'
                    })()),
                    h('td', {}, [h('span', { class: `sub-status ${item.status === 'active' ? 'status-active' : 'status-inactive'}` }, item.status || '—')]),
                    h('td', { class: 'sub-actions-cell' }, [
                      // Hierarchy toggle button
                      h('button', {
                        class: `sub-btn sub-btn-hierarchy ${isExpanded ? 'sub-btn-hierarchy--active' : ''}`,
                        title: 'Manage Approval Hierarchy',
                        onClick: () => toggleHierarchy(item),
                      }, [
                        h('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 11, height: 11, style: 'margin-right:4px' },
                          [h('path', { d: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' })]),
                        isExpanded ? 'Close' : 'Hierarchy',
                      ]),
                      h('button', { class: 'sub-btn sub-btn-edit', onClick: () => openEdit(item) }, 'Edit'),
                      h('button', { class: 'sub-btn sub-btn-delete', onClick: () => handleDelete(item) }, 'Delete'),
                    ]),
                  ]),
                  // hierarchy expansion row (spans all columns)
                  isExpanded && h('tr', { key: `hier-${item.id}`, class: 'hierarchy-expansion-row' }, [
                    h('td', { colspan: 6, style: 'padding: 0;' }, [
                      renderHierarchyPanel(),
                    ]),
                  ]),
                ]
              })),
            ]),
        ]),
      ])
    }
  },
})

// ── API setup ─────────────────────────────────────────────────────────────────
const apiBase = process.env.VUE_APP_BASE_API || '/api'
const baseUrl = process.env.VUE_APP_BASE_URL || ''

const api = axios.create({ baseURL: apiBase })
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── State ─────────────────────────────────────────────────────────────────────
const companies = ref([])
const filteredCompanies = ref([])
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const subLoading = ref(false)

const searchQuery = ref('')
const filterStatus = ref('')
const filterIndustry = ref('')

const deptBranchFilter = ref('')

// Modal state
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const selectedCompany = ref(null)
const deleteTarget = ref(null)
const activeTab = ref('company-view')
const modalMode = ref('view')

const subData = ref({ branches: [], departments: [], roles: [], shifts: [], weekends: [], holidays: [], leavePolicies: [] })

const systemBranches = ref([])

const modalNotif = ref({ show: false, type: 'success', message: '' })
const globalNotif = ref({ show: false, type: 'success', message: '' })

// ── Constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail',
  'Education', 'Construction', 'Transportation', 'Hospitality',
  'Media & Entertainment', 'Agriculture', 'Real Estate', 'Legal',
  'Consulting', 'Non-Profit', 'Government', 'Other',
]
const COUNTRIES = [
  'Bangladesh', 'India', 'United States', 'United Kingdom', 'Canada',
  'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Saudi Arabia',
  'Malaysia', 'Pakistan', 'Indonesia', 'Philippines', 'Other',
]

// ── Computed ──────────────────────────────────────────────────────────────────
const modalTitle = computed(() => {
  const map = {
    'company-create': 'New Company', 'company-edit': 'Edit Company',
    'company-view': 'Company Details', 'branches': 'Branches',
    'departments': 'Departments', 'roles': 'Company Roles',
    'shifts': 'Work Shifts', 'weekends': 'Weekend Days', 'holidays': 'Holidays', 'leave-policies': 'Leave Policies'
  }
  return map[activeTab.value] ?? 'Company'
})

const modalSize = computed(() =>
  (activeTab.value === 'company-create' || activeTab.value === 'company-edit') ? 'modal-lg' : 'modal-xl'
)

const modalTabs = computed(() => [
  { key: 'company-view', label: 'Overview' },
  { key: 'company-edit', label: 'Edit' },
  { key: 'branches', label: 'Branches' },
  { key: 'departments', label: 'Departments' },
  { key: 'roles', label: 'Roles' },
  { key: 'shifts', label: 'Shifts' },
  { key: 'weekends', label: 'Weekends' },
  { key: 'holidays', label: 'Holidays' },
  { key: 'leave-policies', label: 'Leave Policies' }
])

const branchColumns = [
  { key: 'name', label: 'Branch Name' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'status', label: 'Status', type: 'status' },
]
const departmentColumns = [
  { key: 'name', label: 'Department' },
  { key: 'branch_name', label: 'Branch' },
  { key: 'hierarchy', label: 'Hierarchy' },
  { key: 'status', label: 'Status', type: 'status' },
]
const roleColumns = [
  { key: 'name', label: 'Role Name' },
  { key: 'abbreviation', label: 'Short Name' },
  { key: 'department_name', label: 'Department' },
  { key: 'type', label: 'Type' },
  { key: 'hierarchy', label: 'Hierarchy' },
  { key: 'status', label: 'Status', type: 'status' },
]

const branchFormFields = computed(() => [
  { name: 'name', label: 'Branch Name', type: 'text', required: true, placeholder: 'Head Office' },
  { name: 'address', label: 'Address', type: 'text', placeholder: 'Street address' },
  { name: 'city', label: 'City', type: 'text', placeholder: 'Dhaka' },
  { name: 'state', label: 'State', type: 'text', placeholder: 'Dhaka Division' },
  {
    name: 'country', label: 'Country', type: 'select',
    options: COUNTRIES.map(c => ({ value: c, label: c }))
  },
  { name: 'postal_code', label: 'Postal Code', type: 'text', placeholder: '1229' },
  {
    name: 'status', label: 'Status', type: 'radio', required: true, default: 'active',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]
  },
])

const departmentFormFields = computed(() => [
  { name: 'name', label: 'Department Name', type: 'text', required: true, placeholder: 'Human Resources' },
  {
    name: 'branch_id', label: 'Branch', type: 'select', placeholder: 'Select branch…',
    options: (subData.value.branches || []).map(b => ({ value: b.id, label: b.name }))
  },
  { name: 'details', label: 'Details', type: 'textarea', rows: 2, placeholder: 'Department description…' },
  { name: 'hierarchy', label: 'Hierarchy', type: 'number', placeholder: '1' },
  {
    name: 'status', label: 'Status', type: 'radio', required: true, default: 'active',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]
  },
])

const roleFormFields = computed(() => [
  { name: 'name', label: 'Role Name', type: 'text', required: true, placeholder: 'Senior Manager' },
  { name: 'abbreviation', label: 'Short Name', type: 'text', required: false, placeholder: 'Sr. Mgr.' },
  {
    name: 'department_id', label: 'Department', type: 'select', required: true,
    options: (subData.value.departments || []).map(d => ({ value: d.id, label: d.name }))
  },
  {
    name: 'type', label: 'Role Type', type: 'select', required: true, placeholder: 'Select type…',
    options: [{ value: 'admin', label: 'Admin' }, { value: 'general', label: 'General' }]
  },
  { name: 'details', label: 'Details', type: 'textarea', rows: 2, placeholder: 'Role description…' },
  { name: 'hierarchy', label: 'Hierarchy', type: 'number', placeholder: '1' },
  {
    name: 'status', label: 'Status', type: 'radio', required: true, default: 'active',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]
  },
])

// ── Helpers ───────────────────────────────────────────────────────────────────
const getFileUrl = (path) => path ? `${baseUrl}/${path}` : ''

const showNotif = ({ type, message }) => {
  modalNotif.value = { show: true, type, message }
  setTimeout(() => { modalNotif.value.show = false }, 3500)
}
const showGlobalNotif = (type, message) => {
  globalNotif.value = { show: true, type, message }
  setTimeout(() => { globalNotif.value.show = false }, 3500)
}

const clearFilters = () => {
  searchQuery.value = ''
  filterStatus.value = ''
  filterIndustry.value = ''
  filterCompanies()
}

// ── System branches ───────────────────────────────────────────────────────────
const loadSystemBranches = async (companyId) => {
  if (!companyId) return
  try {
    const { data } = await api.get(`/system/branches/${companyId}`)
    systemBranches.value = Array.isArray(data) ? data : (data.branches ?? [])
  } catch {
    // silently degrade
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────
const loadData = async () => {
  isLoading.value = true
  hasError.value = false
  try {
    const { data } = await api.get('/companies', { params: { limit: 1000 } })
    const list = Array.isArray(data) ? data : (data.list ?? data.data ?? data.companies ?? [])
    companies.value = list
    // Always re-run filter after loading fresh data
    filterCompanies()
  } catch (err) {
    hasError.value = true
    errorMessage.value = err.response?.data?.message || 'Failed to load companies.'
  } finally {
    isLoading.value = false
  }
}

const filterCompanies = () => {
  const q = (searchQuery.value || '').toLowerCase()
  filteredCompanies.value = companies.value.filter(c =>
    (!q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)) &&
    (!filterStatus.value || c.status === filterStatus.value) &&
    (!filterIndustry.value || c.industry === filterIndustry.value)
  )
}

// Keep filteredCompanies in sync if companies changes (watcher as safety net)
watch(companies, () => filterCompanies(), { deep: false })

/**
 * Load all sub-entity data for a company including shifts, weekends, holidays.
 */
const loadSubData = async (companyId, branchId = null) => {
  if (!companyId) return
  subLoading.value = true
  try {
    const deptParams = { company_id: companyId, limit: 1000 }
    if (branchId) deptParams.branch_id = branchId

    const [bRes, dRes, rRes, shRes, wkRes, hlRes, lpRes] = await Promise.all([
      api.get('/branches/company', { params: { company_id: companyId, limit: 1000 } }),
      api.get('/departments/specification', { params: deptParams }),
      api.get('/roles/company', { params: { company_id: companyId, limit: 1000 } }),
      api.get('/shifts', { params: { company_id: companyId, limit: 1000 } }),
      api.get('/weekends', { params: { company_id: companyId } }),
      api.get('/holidays', { params: { company_id: companyId, limit: 1000 } }),
      api.get(`/leave/policies/company/${companyId}`, { params: { limit: 1000 } }),  // ← add
    ])
    const extract = (d) => Array.isArray(d) ? d : (d.list ?? d.data ?? [])
    subData.value = {
      branches: extract(bRes.data),
      departments: extract(dRes.data),
      roles: extract(rRes.data),
      shifts: extract(shRes.data),
      weekends: extract(wkRes.data),
      holidays: extract(hlRes.data),
      leavePolicies: extract(lpRes.data),  // ← add
    }
  } catch {
    showNotif({ type: 'error', message: 'Failed to load sub-entity data.' })
  } finally {
    subLoading.value = false
  }
}

const onDeptBranchFilterChange = () => {
  if (!selectedCompany.value) return
  loadSubData(selectedCompany.value.id, deptBranchFilter.value || null)
}

// ── Modal openers ─────────────────────────────────────────────────────────────
const openModal = async (company, tab) => {
  const companyId = company.id
  selectedCompany.value = { ...company }
  activeTab.value = tab
  modalMode.value = 'view'
  deptBranchFilter.value = ''
  showModal.value = true

  await Promise.all([
    loadSubData(companyId),
    loadSystemBranches(),
    api.get(`/companies/${companyId}`)
      .then(({ data }) => { selectedCompany.value = { id: companyId, ...(data.data ?? data) } })
      .catch(() => { }),
  ])
}

const openCreateCompanyModal = () => {
  selectedCompany.value = null
  activeTab.value = 'company-create'
  modalMode.value = 'create-company'
  deptBranchFilter.value = ''
  // ✅ FIX: Do NOT reset subData or companies here — keep the existing list intact
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  deptBranchFilter.value = ''
  modalNotif.value.show = false
}

const switchTab = (tab) => {
  activeTab.value = tab
  modalNotif.value.show = false
  if (tab !== 'departments') deptBranchFilter.value = ''
}

const confirmDelete = (company) => { deleteTarget.value = company; showDeleteConfirm.value = true }

const executeDelete = async () => {
  subLoading.value = true
  try {
    await api.delete(`/companies/${deleteTarget.value.id}`)
    showDeleteConfirm.value = false
    showGlobalNotif('success', `"${deleteTarget.value.name}" deleted successfully.`)
    await loadData()
  } catch (err) {
    showGlobalNotif('error', err.response?.data?.message || 'Delete failed.')
  } finally {
    subLoading.value = false
  }
}

// ── Company form submit ───────────────────────────────────────────────────────
const handleCompanyFormSubmit = async ({ data, mode }) => {
  const companyId = selectedCompany.value?.id
  if (mode === 'edit' && !companyId) {
    showNotif({ type: 'error', message: 'Company ID is missing — please close and reopen.' })
    return
  }
  subLoading.value = true
  try {
    const fd = buildFormData(data)
    if (mode === 'edit') {
      fd.append('_method', 'PUT')
      await api.post(`/companies/${companyId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      showNotif({ type: 'success', message: 'Company updated successfully.' })
      // Refresh the company detail and list
      await loadData()
      const { data: refreshed } = await api.get(`/companies/${companyId}`)
      selectedCompany.value = { id: companyId, ...(refreshed.data ?? refreshed) }
    } else {
      await api.post('/companies', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      showGlobalNotif('success', 'Company created successfully.')
      closeModal()
      // ✅ FIX: reload data AFTER closing modal so filteredCompanies reflects new list
      await loadData()
    }
  } catch (err) {
    showNotif({ type: 'error', message: err.response?.data?.message || 'Operation failed.' })
  } finally {
    subLoading.value = false
  }
}

function buildFormData(data) {
  if (data instanceof FormData) return data
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '') return
    if (v instanceof File) { fd.append(k, v); return }
    fd.append(k, String(v))
  })
  return fd
}

onMounted(() => loadData())
</script>


<style scoped>
/* ══════════════════════════════════════════════════
   DESIGN TOKENS
   Same approach as before — CSS custom properties on
   the root element, inherited by every descendant
   (including the :deep()-targeted elements rendered by
   the inline sub-components below).
══════════════════════════════════════════════════ */
.company-page {
  --primary: #4F46E5;
  --primary-hover: #4338CA;
  --primary-light: #EEF2FF;
  --primary-border: #C7D2FE;

  --bg: #F7F8FA;
  --surface: #FFFFFF;
  --surface-2: #F3F4F6;
  --border: #E5E7EB;
  --border-strong: #D1D5DB;

  --text-1: #111827;
  --text-2: #4B5563;
  --text-3: #9CA3AF;

  --green-text: #059669;
  --green-bg: #ECFDF5;
  --green-border: #A7F3D0;

  --red-text: #DC2626;
  --red-bg: #FEF2F2;
  --red-border: #FECACA;

  --amber-text: #B45309;
  --amber-bg: #FFFBEB;
  --amber-border: #FDE68A;

  --blue-text: #2563EB;
  --blue-bg: #EFF6FF;
  --blue-border: #BFDBFE;

  --purple-text: #7C3AED;
  --purple-bg: #F5F3FF;
  --purple-border: #DDD6FE;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 4px 14px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.14);
}

/* ══════════════════════════════════════════════════
   PAGE LAYOUT
══════════════════════════════════════════════════ */
.company-page {
  padding: 28px 32px;
  min-height: 100vh;
  color: var(--text-1);
  background: var(--bg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}

.page-title {
  font-size: 21px;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
  line-height: 1.25;
  letter-spacing: -.01em;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-3);
  margin: 3px 0 0;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

.hstat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hstat-value {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-1);
  line-height: 1;
}

.hstat-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-top: 4px;
}

.active-color {
  color: var(--green-text);
}

.inactive-color {
  color: var(--text-3);
}

.hstat-divider {
  width: 1px;
  height: 26px;
  background: var(--border);
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--primary);
  border: 1px solid var(--primary);
  color: #fff;
  cursor: pointer;
  transition: background .15s, box-shadow .15s;
  box-shadow: var(--shadow-xs);
}

.btn-add:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1 1 220px;
  min-width: 200px;
  max-width: 400px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: var(--text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px 10px 36px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-1);
  font-size: 13.5px;
  outline: none;
  font-family: inherit;
  transition: border-color .15s, box-shadow .15s;
}

.search-input:focus {
  border-color: var(--primary-border);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.search-input::placeholder {
  color: var(--text-3);
}

.filter-select {
  flex-shrink: 0;
  min-width: 150px;
  padding: 10px 32px 10px 12px;
  appearance: none;
  -webkit-appearance: none;
  background: var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E") no-repeat right 12px center;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition: border-color .15s;
  box-sizing: border-box;
}

.filter-select:focus {
  border-color: var(--primary-border);
}

.filter-select option {
  background: var(--surface);
  color: var(--text-1);
}

.state-loading,
.state-error,
.state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 80px 20px;
  color: var(--text-3);
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.state-loading svg,
.state-error svg,
.state-empty svg {
  width: 36px;
  height: 36px;
}

.state-error {
  color: var(--red-text);
  background: var(--red-bg);
  border-color: var(--red-border);
}

.state-empty svg {
  color: var(--text-3);
  opacity: .6;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--primary-border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-retry {
  padding: 8px 20px;
  background: var(--surface);
  border: 1px solid var(--red-border);
  border-radius: var(--radius-md);
  color: var(--red-text);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}

.btn-retry:hover {
  background: var(--red-bg);
}

/* ══════════════════════════════════════════════════
   CARDS GRID
══════════════════════════════════════════════════ */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.company-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  transition: border-color .15s, box-shadow .15s, transform .15s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.company-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.card-inactive {
  opacity: .68;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 18px 0;
}

.card-logo-wrap {
  flex-shrink: 0;
}

.card-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  padding: 4px;
}

.card-logo-placeholder {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
}

.card-logo-placeholder svg {
  width: 20px;
  height: 20px;
}

.card-title-block {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-1);
  margin: 0 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-industry {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .04em;
  border-radius: 999px;
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  color: var(--primary);
  padding: 2px 9px;
  white-space: nowrap;
}

.card-status-wrap {
  flex-shrink: 0;
  margin-left: auto;
}

.card-status {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .04em;
  border-radius: 999px;
  padding: 3px 10px;
  border: 1px solid;
}

.status-active {
  color: var(--green-text);
  border-color: var(--green-border);
  background: var(--green-bg);
}

.status-inactive {
  color: var(--text-3);
  border-color: var(--border);
  background: var(--surface-2);
}

.card-meta {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-2);
  overflow: hidden;
}

.meta-item svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--text-3);
}

.meta-item span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-stats {
  display: flex;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.stat-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background .13s;
  gap: 3px;
  border-right: 1px solid var(--border);
}

.stat-chip:last-child {
  border-right: none;
}

.stat-chip:hover {
  background: var(--surface);
}

.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}

.stat-lbl {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--text-3);
}

.card-footer {
  display: flex;
}

.card-btn {
  flex: 1;
  padding: 11px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  background: var(--surface);
  border: none;
  border-top: 1px solid var(--border);
  cursor: pointer;
  transition: background .13s, color .13s;
}

.card-btn svg {
  width: 13px;
  height: 13px;
}

.btn-view-c {
  color: var(--blue-text);
  border-right: 1px solid var(--border);
}

.btn-view-c:hover {
  background: var(--blue-bg);
}

.btn-edit-c {
  color: var(--text-2);
  border-right: 1px solid var(--border);
}

.btn-edit-c:hover {
  background: var(--surface-2);
  color: var(--primary);
}

.btn-delete-c {
  color: var(--red-text);
}

.btn-delete-c:hover {
  background: var(--red-bg);
}

/* ══════════════════════════════════════════════════
   DEPARTMENT BRANCH FILTER BAR
══════════════════════════════════════════════════ */
.dept-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.dept-filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  white-space: nowrap;
  flex-shrink: 0;
}

.dept-branch-select {
  min-width: 180px;
}

/* ══════════════════════════════════════════════════
   WEEKEND PANEL
══════════════════════════════════════════════════ */
:deep(.weekend-info) {
  font-size: 12.5px;
  color: var(--text-2);
  margin-bottom: 18px;
  padding: 11px 14px;
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-md);
}

:deep(.weekend-grid) {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

@media (max-width: 600px) {
  :deep(.weekend-grid) {
    grid-template-columns: repeat(4, 1fr);
  }
}

:deep(.weekend-day-btn) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 8px;
  min-height: 72px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all .15s;
  position: relative;
  color: var(--text-2);
}

:deep(.weekend-day-btn:hover:not(:disabled)) {
  border-color: var(--primary-border);
  background: var(--primary-light);
  color: var(--primary);
}

:deep(.weekend-day-btn.weekend-active) {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

:deep(.weekend-day-btn:disabled) {
  opacity: .5;
  cursor: not-allowed;
}

:deep(.weekend-day-abbr) {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .03em;
}

:deep(.weekend-day-full) {
  font-size: 10px;
  color: var(--text-3);
}

:deep(.weekend-check) {
  position: absolute;
  top: 5px;
  right: 7px;
  font-size: 11px;
  color: var(--green-text);
  font-weight: 700;
}

:deep(.weekend-summary) {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

:deep(.weekend-summary-label) {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--text-3);
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 1px;
}

:deep(.weekend-summary-days) {
  font-size: 13px;
  color: var(--text-2);
  font-weight: 500;
}

:deep(.saving-indicator) {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: .02em;
  animation: pulse 1s ease infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: .4;
  }
}

/* ══════════════════════════════════════════════════
   HOLIDAY DATE BADGE
══════════════════════════════════════════════════ */
:deep(.holiday-date-badge) {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--amber-bg);
  border: 1px solid var(--amber-border);
  color: var(--amber-text);
  white-space: nowrap;
}

/* ══════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════ */
.modal-backdrop {
  /* ── Re-declare design tokens here ──────────────────────
     Both modals use <Teleport to="body">, which moves this
     entire subtree out from under .company-page in the real
     DOM. CSS custom properties cascade through the live DOM
     tree, not the component tree, so once teleported this
     subtree can no longer see .company-page's variables —
     every var(--surface), var(--border), etc. below would
     silently resolve to nothing and the browser drops those
     declarations, leaving the modal transparent. Redeclaring
     the full token set here makes the teleported subtree
     self-sufficient regardless of where it lives in the DOM. */
  --primary: #4F46E5;
  --primary-hover: #4338CA;
  --primary-light: #EEF2FF;
  --primary-border: #C7D2FE;

  --bg: #F7F8FA;
  --surface: #FFFFFF;
  --surface-2: #F3F4F6;
  --border: #E5E7EB;
  --border-strong: #D1D5DB;

  --text-1: #111827;
  --text-2: #4B5563;
  --text-3: #9CA3AF;

  --green-text: #059669;
  --green-bg: #ECFDF5;
  --green-border: #A7F3D0;

  --red-text: #DC2626;
  --red-bg: #FEF2F2;
  --red-border: #FECACA;

  --amber-text: #B45309;
  --amber-bg: #FFFBEB;
  --amber-border: #FDE68A;

  --blue-text: #2563EB;
  --blue-bg: #EFF6FF;
  --blue-border: #BFDBFE;

  --purple-text: #7C3AED;
  --purple-bg: #F5F3FF;
  --purple-border: #DDD6FE;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 4px 14px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.14);

  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  z-index: 9999;
  overflow-y: auto;
}

.modal-shell {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.modal-sm {
  max-width: 440px;
}

.modal-lg {
  max-width: 720px;
}

.modal-xl {
  max-width: 960px;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-head-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-company-logo {
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--surface-2);
}

.modal-company-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.modal-company-logo svg {
  width: 18px;
  height: 18px;
  color: var(--text-3);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
}

.modal-company-name {
  font-size: 12px;
  color: var(--text-3);
  margin: 3px 0 0;
}

.danger-title {
  color: var(--red-text);
}

.modal-close {
  width: 32px;
  height: 32px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  flex-shrink: 0;
}

.modal-close:hover {
  border-color: var(--border-strong);
  color: var(--text-1);
}

.modal-close svg {
  width: 14px;
  height: 14px;
}

.modal-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
  padding: 0 8px;
}

.modal-tabs::-webkit-scrollbar {
  height: 3px;
}

.modal-tabs::-webkit-scrollbar-thumb {
  background: var(--border-strong);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  font-size: 12.5px;
  font-weight: 600;
  background: transparent;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color .13s, border-color .13s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-2);
}

.tab-active {
  color: var(--primary) !important;
  border-bottom-color: var(--primary) !important;
}

.modal-notif {
  padding: 10px 24px;
  font-size: 12.5px;
  font-weight: 500;
  flex-shrink: 0;
}

.notif-success {
  background: var(--green-bg);
  color: var(--green-text);
  border-bottom: 1px solid var(--green-border);
}

.notif-error {
  background: var(--red-bg);
  color: var(--red-text);
  border-bottom: 1px solid var(--red-border);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-pane {
  animation: fadeIn .18s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* ── Company View Panel ── */
:deep(.view-panel) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.view-description) {
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.7;
  padding: 14px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin: 0;
}

:deep(.view-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

:deep(.view-field) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.view-label) {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--text-3);
}

:deep(.view-value) {
  font-size: 13.5px;
  color: var(--text-1);
  font-weight: 500;
}

:deep(.color-swatch-wrap) {
  display: flex;
  align-items: center;
  gap: 10px;
}

:deep(.color-swatch) {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  flex-shrink: 0;
}

/* ── Company Form ── */
:deep(.company-form) {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

:deep(.form-section-title) {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: var(--primary);
  padding-bottom: 9px;
  border-bottom: 1px solid var(--border);
}

:deep(.form-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

:deep(.form-field) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.form-field--full) {
  grid-column: 1 / -1;
}

:deep(.form-label) {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

:deep(.form-input),
:deep(.form-select),
:deep(.form-textarea) {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-1);
  font-size: 13.5px;
  padding: 9px 12px;
  outline: none;
  font-family: inherit;
  transition: border-color .15s, box-shadow .15s;
  box-sizing: border-box;
  width: 100%;
}

:deep(.form-input:focus),
:deep(.form-select:focus),
:deep(.form-textarea:focus) {
  border-color: var(--primary-border);
  box-shadow: 0 0 0 3px var(--primary-light);
}

:deep(.form-input::placeholder),
:deep(.form-textarea::placeholder) {
  color: var(--text-3);
}

:deep(.form-select) {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  padding-right: 32px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-color: var(--surface);
}

:deep(.form-select option) {
  background: var(--surface);
  color: var(--text-1);
}

:deep(.form-textarea) {
  resize: vertical;
  min-height: 70px;
}

:deep(.form-file) {
  font-size: 12.5px;
  color: var(--text-2);
  cursor: pointer;
  padding: 8px 0;
}

:deep(.form-color-input) {
  width: 60px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px;
  cursor: pointer;
  background: var(--surface);
}

:deep(.radio-group) {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 9px 0;
}

:deep(.radio-opt) {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-2);
  font-weight: 500;
}

:deep(.radio-opt input) {
  accent-color: var(--primary);
  width: 15px;
  height: 15px;
}

:deep(.form-actions) {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

:deep(.btn-submit) {
  padding: 10px 26px;
  background: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}

:deep(.btn-submit:hover:not(:disabled)) {
  background: var(--primary-hover);
}

:deep(.btn-submit:disabled) {
  opacity: .5;
  cursor: not-allowed;
}

/* ── Sub-entity panel ── */
:deep(.sub-panel) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.sub-panel-head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.sub-panel-count) {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
}

:deep(.btn-add-sub) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-md);
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .14s;
}

:deep(.btn-add-sub:hover) {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

:deep(.sub-form) {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  animation: fadeIn .18s ease;
}

:deep(.sub-form-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

:deep(.sub-form-actions) {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.btn-cancel-sm) {
  padding: 8px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color .13s;
}

:deep(.btn-cancel-sm:hover) {
  border-color: var(--border-strong);
  color: var(--text-1);
}

:deep(.btn-save) {
  padding: 8px 20px;
  background: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .14s;
}

:deep(.btn-save:hover:not(:disabled)) {
  background: var(--primary-hover);
}

:deep(.btn-save:disabled) {
  opacity: .5;
  cursor: not-allowed;
}

:deep(.sub-loading) {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

:deep(.sub-empty) {
  text-align: center;
  padding: 40px 0;
  color: var(--text-3);
  font-size: 13px;
}

:deep(.sub-table-wrap) {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

:deep(.sub-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

:deep(.sub-table th) {
  padding: 10px 14px;
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--text-3);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

:deep(.sub-table td) {
  padding: 11px 14px;
  color: var(--text-2);
  font-size: 12.5px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

:deep(.sub-table tr:last-child td) {
  border-bottom: none;
}

:deep(.sub-table tr:hover td) {
  background: var(--surface-2);
}

:deep(.sub-status) {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .03em;
  border-radius: 999px;
  padding: 2px 9px;
  border: 1px solid;
}

:deep(.sub-actions-cell) {
  white-space: nowrap;
}

:deep(.sub-btn) {
  padding: 5px 11px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid;
  cursor: pointer;
  margin-right: 6px;
  transition: all .13s;
}

:deep(.sub-btn-edit) {
  color: var(--text-2);
  border-color: var(--border);
}

:deep(.sub-btn-edit:hover) {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
}

:deep(.sub-btn-delete) {
  color: var(--red-text);
  border-color: var(--red-border);
}

:deep(.sub-btn-delete:hover) {
  background: var(--red-bg);
}

:deep(.lp-type-badge) {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .03em;
  background: var(--blue-bg);
  border: 1px solid var(--blue-border);
  color: var(--blue-text);
  white-space: nowrap;
}

:deep(.lp-days-badge) {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  color: var(--primary);
  white-space: nowrap;
}

/* ── Approval Hierarchy panel ── */
:deep(.hierarchy-expansion-row td) {
  background: var(--surface-2);
  border-bottom: 2px solid var(--border-strong) !important;
}

:deep(.hierarchy-panel) {
  padding: 20px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

:deep(.hierarchy-panel-head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.hierarchy-panel-title) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .03em;
  color: var(--purple-text);
}

:deep(.lp-row-expanded td) {
  background: var(--primary-light);
  border-bottom: none !important;
}

:deep(.lp-table) {
  border-collapse: collapse;
}

:deep(.hierarchy-level-badge) {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  background: var(--blue-bg);
  border: 1px solid var(--blue-border);
  color: var(--blue-text);
  white-space: nowrap;
  letter-spacing: .02em;
}

:deep(.hierarchy-mandatory-yes) {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .03em;
  border-radius: 999px;
  color: var(--green-text);
  padding: 2px 8px;
  border: 1px solid var(--green-border);
  background: var(--green-bg);
}

:deep(.hierarchy-mandatory-no) {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .03em;
  border-radius: 999px;
  color: var(--text-3);
  padding: 2px 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

:deep(.sub-btn-hierarchy) {
  color: var(--purple-text);
  border-color: var(--purple-border);
}

:deep(.sub-btn-hierarchy:hover) {
  background: var(--purple-bg);
}

:deep(.sub-btn-hierarchy--active) {
  background: var(--purple-bg);
  color: var(--purple-text);
  border-color: var(--purple-text);
}

/* ── Delete confirm ── */
.delete-confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.delete-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--red-bg);
  border: 1px solid var(--red-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--red-text);
}

.delete-icon svg {
  width: 24px;
  height: 24px;
}

.delete-msg {
  color: var(--text-2);
  font-size: 13.5px;
  line-height: 1.6;
  max-width: 340px;
  margin: 0;
}

.delete-msg strong {
  color: var(--text-1);
}

.delete-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  width: 100%;
}

.btn-cancel {
  padding: 10px 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all .13s;
}

.btn-cancel:hover {
  border-color: var(--border-strong);
  color: var(--text-1);
}

.btn-danger {
  padding: 10px 22px;
  background: var(--red-text);
  border: 1px solid var(--red-text);
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all .13s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-danger:hover:not(:disabled) {
  background: #B91C1C;
  border-color: #B91C1C;
}

.btn-danger:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.global-notif {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  padding: 13px 20px;
  border-radius: var(--radius-md);
  font-size: 13.5px;
  font-weight: 500;
  min-width: 260px;
  animation: slideUp .2s ease;
  box-shadow: var(--shadow-lg);
  border: 1px solid;
}

@keyframes slideUp {
  from {
    transform: translateY(12px);
    opacity: 0;
  }

  to {
    transform: none;
    opacity: 1;
  }
}

.gnotif-success {
  background: var(--green-bg);
  border-color: var(--green-border);
  color: var(--green-text);
}

.gnotif-error {
  background: var(--red-bg);
  border-color: var(--red-border);
  color: var(--red-text);
}

/* ══════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════ */
@media (max-width: 900px) {
  .company-page {
    padding: 20px;
  }

  .header-stats {
    order: 2;
    width: 100%;
    justify-content: space-around;
  }

  .btn-add {
    order: 1;
  }

  .header-right {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .company-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrap {
    max-width: none;
  }

  .filter-select {
    width: 100%;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    padding: 0;
  }

  .modal-shell {
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }

  .delete-actions {
    flex-direction: column;
  }
}
</style>