<template>
  <CrudLayout ref="layoutRef" title="Employee Management" subtitle="Manage employees, job details, salary and documents"
    add-label="New Employee" :breadcrumbs="breadcrumbs" :stats="pageStats" :loading="isLoading"
    loading-message="Loading employees" :error="hasError ? errorMessage : ''" error-title="Failed to Load Employees"
    :has-data="!!items.length" :notification="notification" @add="openCreateModal" @retry="loadData">
    <!-- Icon -->
    <template #icon>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.54 15.46 0 12 0 9.28 0 7 1.64 6.04 4.06L4.5 7.5A4.503 4.503 0 0 0 0 12c0 2.49 2.01 4.5 4.5 4.5H20c2.21 0 4-1.79 4-4s-1.79-4-4-4zM10 1c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm2 13H4.5C2.57 14 1 12.43 1 10.5S2.57 7 4.5 7c.28 0 .56.03.82.09C6.12 4.65 8.84 3 12 3c3.86 0 7 3.14 7 7h1c1.65 0 3 1.35 3 3s-1.35 3-3 3h-8z" />
      </svg>
    </template>

    <!-- Filters -->
    <template #filters>
      <FilterPanel title="Search & Filter" :fields="filterFields" v-model="searchFilters" @submit="handleSearch"
        @reset="handleReset" />
    </template>

    <!-- Table -->
    <DataTable :data="paginatedData" :columns="tableColumns" :actions="tableActions" result-label="employees"
      @action="handleAction" @sort="handleSort">
      <!-- Photo cell -->
      <template #cell-photo="{ row }">
        <img v-if="row.user?.photo" :src="baseUrl + '/' + row.user.photo" alt="photo" class="emp-avatar" />
        <div v-else class="emp-avatar-placeholder">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </template>

      <!-- Name cell -->
      <template #cell-name="{ row }">
        <div class="emp-name-cell">
          <span class="emp-name">{{ row.user?.name ?? '—' }}</span>
          <span class="emp-code">{{ row.employee_id }}</span>
        </div>
      </template>

      <!-- Department cell -->
      <template #cell-department="{ row }">
        <span v-if="row.job_detail?.department?.name" class="dept-badge">
          {{ row.job_detail.department.name }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Designation cell -->
      <template #cell-designation="{ row }">
        <span class="cell-text">{{ row.job_detail?.designation?.name ?? '—' }}</span>
      </template>

      <!-- Step / Status cell -->
      <template #cell-form_step="{ row }">
        <div class="step-indicator">
          <div v-for="s in 5" :key="s" class="step-dot" :class="{
            'step-done': s <= (row.form_step ?? 0),
            'step-complete': row.form_status === 'completed'
          }"></div>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <template #pagination>
      <Pagination v-model="currentPage" :total-items="pagination.total" :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]" item-label="employees" :show-first-last="true" :show-labels="false"
        :show-jump-to="false" @update:page-size="handlePageSizeChange" @page-change="handlePageChange" />
    </template>
  </CrudLayout>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- MULTI-STEP EMPLOYEE MODAL                               -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showFormModal" class="emp-modal-backdrop" @click.self="closeModal">
      <div class="emp-modal-shell">

        <!-- Modal Header -->
        <div class="emp-modal-head">
          <div class="emp-modal-head-left">
            <div class="emp-modal-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div>
              <h2 class="text-card-title">
                {{ isEditMode ? 'Edit Employee' : 'New Employee' }}
              </h2>
              <p class="text-subtitle">
                {{ isEditMode ? 'Update employee information' :
                  'Fill in the steps below. You can save and resume anytime.' }}
              </p>
            </div>
          </div>
          <button class="emp-modal-close" @click="closeModal">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Step Progress Bar -->
        <div class="emp-steps-bar">
          <div v-for="(step, idx) in steps" :key="step.key" class="emp-step-item" :class="{
            'step-active': currentStep === idx + 1,
            'step-completed': savedUpTo >= idx + 1,
            'step-accessible': idx + 1 <= savedUpTo + 1
          }" @click="goToStep(idx + 1)">
            <div class="emp-step-circle">
              <svg v-if="savedUpTo >= idx + 1" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd" />
              </svg>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <div class="emp-step-label">
              <span class="step-name">{{ step.label }}</span>
              <span class="text-small">{{ step.desc }}</span>
            </div>
            <div v-if="idx < steps.length - 1" class="emp-step-connector"></div>
          </div>
        </div>

        <!-- Modal Notification -->
        <div v-if="modalNotif.show" class="modal-notif" :class="'notif-' + modalNotif.type">
          {{ modalNotif.message }}
        </div>

        <!-- Step Content -->
        <div class="emp-modal-body">

          <!-- ── STEP 1: Basic Info ── -->
          <div v-if="currentStep === 1" class="step-pane">
            <div class="step-section-title">Personal & Account Information</div>
            <div class="form-grid">
              <div class="form-field">
                <label class="text-label">Full Name <span class="req">*</span></label>
                <input v-model="form.name" class="form-input" type="text" placeholder="John Doe" />
              </div>
              <div class="form-field">
                <label class="text-label">Email Address <span class="req">*</span></label>
                <input v-model="form.email" class="form-input" type="email" placeholder="john@company.com" />
              </div>
              <div class="form-field">
                <label class="text-label">Phone Number <span class="req">*</span></label>
                <input v-model="form.phone" class="form-input" type="text" placeholder="+880 1700 000000" />
              </div>
              <div class="form-field">
                <label class="text-label">Password {{ isEditMode ? '' : '*' }}</label>
                <input v-model="form.password" class="form-input" type="password"
                  :placeholder="isEditMode ? 'Leave blank to keep current…' : 'Enter password…'" />
              </div>
              <div class="form-field">
                <label class="text-label">Employee Code</label>
                <input v-model="form.employee_code" class="form-input" type="text" placeholder="EMP-0001" />
              </div>
              <div class="form-field">
                <label class="text-label">Joining Date</label>
                <input v-model="form.joining_date" class="form-input" type="date" />
              </div>
              <div class="form-field">
                <label class="text-label">Role</label>
                <select v-model="form.role" class="form-select">
                  <option value="">Select role…</option>
                  <option v-for="r in systemData.roles" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="text-label">Status <span class="req">*</span></label>
                <div class="radio-group">
                  <label class="radio-opt">
                    <input type="radio" v-model="form.status" value="active" />
                    <span class="text-checkbox-label">Active</span>
                  </label>
                  <label class="radio-opt">
                    <input type="radio" v-model="form.status" value="inactive" />
                    <span class="text-checkbox-label">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- ── STEP 2: Job Details ── -->
          <div v-if="currentStep === 2" class="step-pane">
            <div class="step-section-title">Job & Assignment Details</div>
            <div class="form-grid">
              <div class="form-field">
                <label class="text-label">Company <span class="req">*</span></label>
                <select v-model="form.company_id" class="form-select" @change="onCompanyChange">
                  <option value="">Select company…</option>
                  <option v-for="c in systemData.companies" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="text-label">Branch</label>
                <select v-model="form.branch_id" class="form-select" @change="onBranchChange"
                  :disabled="!form.company_id">
                  <option value="">Select branch…</option>
                  <option v-for="b in systemData.branches" :key="b.value" :value="b.value">{{ b.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="text-label">Department</label>
                <select v-model="form.department_id" class="form-select" :disabled="!form.branch_id">
                  <option value="">Select department…</option>
                  <option v-for="d in systemData.departments" :key="d.value" :value="d.value">{{ d.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="text-label">Designation / Position</label>
                <select v-model="form.designation_id" class="form-select" :disabled="!form.company_id">
                  <option value="">Select designation…</option>
                  <option v-for="p in systemData.positions" :key="p.value" :value="p.value">{{ p.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="text-label">Reporting Manager</label>
                <select v-model="form.reporting_manager_id" class="form-select">
                  <option value="">None</option>
                  <option v-for="m in systemData.managers" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="text-label">Work Type</label>
                <select v-model="form.work_type" class="form-select">
                  <option value="">Select type…</option>
                  <option value="on-site">On-Site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ── STEP 3: Salary ── -->
          <div v-if="currentStep === 3" class="step-pane">
            <div class="step-section-title">Salary & Allowances</div>
            <div class="form-grid">
              <div class="form-field">
                <label class="text-label">Basic Salary <span class="req">*</span></label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix">৳</span>
                  <input v-model="form.basic_salary" class="form-input with-prefix" type="number" placeholder="0.00"
                    min="0" />
                </div>
              </div>
              <div class="form-field">
                <label class="text-label">House Rent Allowance</label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix">৳</span>
                  <input v-model="form.house_rent" class="form-input with-prefix" type="number" placeholder="0.00"
                    min="0" />
                </div>
              </div>
              <div class="form-field">
                <label class="text-label">Medical Allowance</label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix">৳</span>
                  <input v-model="form.medical_allowance" class="form-input with-prefix" type="number"
                    placeholder="0.00" min="0" />
                </div>
              </div>
              <div class="form-field form-field--full">
                <div class="salary-summary">
                  <span class="salary-summary-label">Gross Monthly Salary</span>
                  <span class="salary-summary-value">৳ {{ grossSalary }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── STEP 4: Address ── -->
          <div v-if="currentStep === 4" class="step-pane">
            <div class="step-section-title">Address Information</div>
            <div class="form-grid">
              <div class="form-field form-field--full">
                <label class="text-label">Present Address</label>
                <textarea v-model="form.present_address" class="form-textarea" rows="3"
                  placeholder="Current residential address…"></textarea>
              </div>
              <div class="form-field form-field--full">
                <label class="text-label">Permanent Address</label>
                <textarea v-model="form.permanent_address" class="form-textarea" rows="3"
                  placeholder="Permanent / hometown address…"></textarea>
              </div>
              <div class="form-field form-field--full">
                <label class="same-address-toggle">
                  <input type="checkbox" v-model="sameAddress" @change="applySameAddress" />
                  <span>Same as present address</span>
                </label>
              </div>
            </div>

            <!-- Emergency Contacts -->
            <div class="step-section-title" style="margin-top:24px">Emergency Contacts</div>
            <div v-for="(contact, idx) in form.emergency_contacts" :key="idx" class="emergency-contact-row">
              <div class="form-grid contact-grid">
                <div class="form-field">
                  <label class="text-label">Name</label>
                  <input v-model="contact.name" class="form-input" type="text" placeholder="Contact name" />
                </div>
                <div class="form-field">
                  <label class="text-label">Relationship</label>
                  <input v-model="contact.relationship" class="form-input" type="text"
                    placeholder="e.g. Spouse, Parent" />
                </div>
                <div class="form-field">
                  <label class="text-label">Phone</label>
                  <input v-model="contact.phone" class="form-input" type="text" placeholder="+880…" />
                </div>
                <div class="form-field form-field--action">
                  <button class="btn-remove-contact" @click="removeContact(idx)" title="Remove">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <button class="btn-add-contact" @click="addContact">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clip-rule="evenodd" />
              </svg>
              Add Emergency Contact
            </button>
          </div>

          <!-- ── STEP 5: Documents ── -->
          <div v-if="currentStep === 5" class="step-pane">
            <div class="step-section-title">Documents & Photo</div>
            <div class="form-grid">
              <div class="form-field">
                <label class="text-label">Profile Photo</label>
                <input type="file" class="form-file" accept="image/*" @change="e => form.photo = e.target.files[0]" />
              </div>
              <div class="form-field form-field--full">
                <label class="text-label">Upload Documents</label>
                <div class="doc-upload-area" @dragover.prevent @drop.prevent="handleDocDrop">
                  <input type="file" class="doc-file-input" multiple @change="handleDocSelect" ref="docInput" />
                  <div class="doc-upload-placeholder" @click="$refs.docInput.click()">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="opacity:.35">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                    </svg>
                    <span>Click to browse or drag files here</span>
                  </div>
                </div>
                <div v-if="form.documents.length" class="doc-list">
                  <div v-for="(doc, idx) in form.documents" :key="idx" class="doc-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
                    </svg>
                    <span class="doc-name">{{ doc.name }}</span>
                    <button class="doc-remove" @click="form.documents.splice(idx, 1)">×</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Final Submit notice -->
            <div v-if="!isEditMode" class="final-notice">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd" />
              </svg>
              <span>After saving Step 5, click <strong>Submit Employee</strong> to activate the record.</span>
            </div>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="emp-modal-foot">
          <div class="foot-left">
            <button v-if="currentStep > 1" class="btn-prev" @click="currentStep--" :disabled="stepSaving">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clip-rule="evenodd" />
              </svg>
              Previous
            </button>
          </div>

          <div class="foot-center">
            <span class="text-small">Step {{ currentStep }} of {{ steps.length }}</span>
          </div>

          <div class="foot-right">
            <!-- Save current step -->
            <button class="btn-save-step" @click="saveCurrentStep" :disabled="stepSaving">
              <span v-if="stepSaving" class="spinner-sm"></span>
              {{ stepSaving ? 'Saving…' : 'Save Step' }}
            </button>

            <!-- Next (if not last step) -->
            <button v-if="currentStep < steps.length" class="btn-next" @click="saveAndNext" :disabled="stepSaving">
              Save & Next
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Submit final (step 5, new employee) -->
            <button v-if="currentStep === steps.length && !isEditMode" class="btn-submit-final"
              :disabled="stepSaving || savedUpTo < steps.length" @click="submitFinal">
              <span v-if="stepSaving" class="spinner-sm"></span>
              Submit Employee
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- View Modal -->
  <Teleport to="body">
    <div v-if="showViewModal" class="emp-modal-backdrop" @click.self="showViewModal = false">
      <div class="emp-modal-shell emp-modal-view">
        <div class="emp-modal-head">
          <div class="emp-modal-head-left">
            <div class="emp-modal-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div>
              <h2 class="text-card-title">Employee Profile</h2>
              <p class="text-subtitle">{{ viewItem?.user?.name }}</p>
            </div>
          </div>
          <button class="emp-modal-close" @click="showViewModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- View Tabs -->
        <div class="emp-view-tabs">
          <button class="emp-view-tab" :class="{ 'emp-view-tab--active': viewTab === 'profile' }"
            @click="viewTab = 'profile'">Profile</button>
          <button class="emp-view-tab" :class="{ 'emp-view-tab--active': viewTab === 'leave-policies' }"
            @click="switchViewTab('leave-policies')">Leave Policies</button>
        </div>

        <div class="emp-modal-body view-body" v-if="viewItem">

          <!-- ── Profile Tab ── -->
          <div v-if="viewTab === 'profile'">
            <div class="view-hero">
              <img v-if="viewItem.user?.photo" :src="baseUrl + '/' + viewItem.user.photo" alt="photo"
                class="view-avatar" />
              <div v-else class="view-avatar-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div class="view-hero-info">
                <h3 class="view-hero-name">{{ viewItem.user?.name }}</h3>
                <span class="view-hero-emp-id">{{ viewItem.employee_id }}</span>
                <span class="card-status" :class="viewItem.status === 'active' ? 'status-active' : 'status-inactive'">
                  {{ viewItem.status }}
                </span>
              </div>
            </div>
            <div class="view-sections">
              <div class="view-section">
                <div class="view-section-title">Contact</div>
                <div class="view-grid">
                  <div class="view-field"><span class="text-label">Email</span><span class="text-small">{{
                    viewItem.user?.email ?? '—' }}</span></div>
                  <div class="view-field"><span class="text-label">Phone</span><span class="text-small">{{
                    viewItem.user?.phone ?? '—' }}</span></div>
                  <div class="view-field"><span class="text-label">Joining Date</span><span class="text-small">{{
                    viewItem.joining_date ?? '—' }}</span></div>
                </div>
              </div>
              <div class="view-section">
                <div class="view-section-title">Job Details</div>
                <div class="view-grid">
                  <div class="view-field"><span class="text-label">Department</span><span class="text-small">{{
                    viewItem.job_detail?.department?.name ?? '—' }}</span></div>
                  <div class="view-field"><span class="text-label">Designation</span><span class="text-small">{{
                    viewItem.job_detail?.designation?.name ?? '—' }}</span></div>
                  <div class="view-field"><span class="text-label">Work Type</span><span class="text-small">{{
                    viewItem.job_detail?.work_type ?? '—' }}</span></div>
                </div>
              </div>
              <div class="view-section">
                <div class="view-section-title">Salary</div>
                <div class="view-grid">
                  <div class="view-field"><span class="text-label">Basic</span><span class="text-small">৳ {{
                    viewItem.salary?.basic_salary ?? '—' }}</span></div>
                  <div class="view-field"><span class="text-label">House Rent</span><span class="text-small">৳ {{
                    viewItem.salary?.house_rent ?? '—' }}</span></div>
                  <div class="view-field"><span class="text-label">Medical</span><span class="text-small">৳ {{
                    viewItem.salary?.medical_allowance ?? '—' }}</span></div>
                </div>
              </div>
              <div class="view-section" v-if="viewItem.address">
                <div class="view-section-title">Address</div>
                <div class="view-grid">
                  <div class="view-field form-field--full"><span class="text-label">Present</span><span
                      class="text-small">{{ viewItem.address?.present_address ?? '—' }}</span></div>
                  <div class="view-field form-field--full"><span class="text-label">Permanent</span><span
                      class="text-small">{{ viewItem.address?.permanent_address ?? '—' }}</span></div>
                </div>
              </div>
              <div class="view-section" v-if="viewItem.emergency_contacts?.length">
                <div class="view-section-title">Emergency Contacts</div>
                <div v-for="ec in viewItem.emergency_contacts" :key="ec.id" class="view-contact-row">
                  <span class="text-small">{{ ec.name }}</span>
                  <span class="text-label">{{ ec.relationship }}</span>
                  <span class="text-small">{{ ec.phone }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Leave Policies Tab ── -->
          <div v-if="viewTab === 'leave-policies'" class="lpa-panel">

            <!-- Panel header -->
            <div class="lpa-head">
              <span class="lpa-count">{{ lpaItems.length }} Assigned Polic{{ lpaItems.length === 1 ? 'y' : 'ies'
                }}</span>
              <button class="lpa-btn-add" @click="openLpaForm(null)">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clip-rule="evenodd" />
                </svg>
                Assign Policy
              </button>
            </div>

            <!-- Inline notification -->
            <div v-if="lpaNot.show" class="lpa-notif" :class="'lpa-notif--' + lpaNot.type">
              {{ lpaNot.message }}
            </div>

            <!-- Assignment form -->
            <div v-if="lpaFormOpen" class="lpa-form">
              <div class="lpa-form-grid">
                <div class="form-field" style="grid-column: 1 / -1">
                  <label class="text-label">Leave Policy <span class="req">*</span></label>
                  <select v-model="lpaForm.leave_policy_id" class="form-select">
                    <option value="">Select policy…</option>
                    <option v-for="p in systemData.leavePolicies" :key="p.value" :value="p.value">
                      {{ p.label }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="lpa-form-actions">
                <button class="lpa-btn-cancel" @click="lpaFormOpen = false">Cancel</button>
                <button class="lpa-btn-save" :disabled="lpaSaving" @click="saveLpa">
                  <span v-if="lpaSaving" class="spinner-sm"></span>
                  {{ lpaSaving ? 'Saving…' : (lpaEditId ? 'Update' : 'Assign') }}
                </button>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="lpaLoading" class="lpa-loading">
              <div class="spinner-sm"
                style="width:22px;height:22px;border-width:2px;border-top-color:#4F46E5;border-color:rgba(79,70,229,0.20)">
              </div>
            </div>

            <!-- Empty -->
            <div v-else-if="!lpaItems.length && !lpaFormOpen" class="lpa-empty">
              No leave policies assigned yet
            </div>

            <!-- Table -->
            <div v-else-if="lpaItems.length" class="lpa-table-wrap">
              <table class="lpa-table">
                <thead>
                  <tr>
                    <th>Policy Name</th>
                    <th>Type</th>
                    <th>Days / Year</th>
                    <th>Paid</th>
                    <th>Requires Approval</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in lpaItems" :key="item.id">
                    <td>
                      <span class="lpa-policy-badge">{{ item.policy?.name ?? getPolicyLabel(item.leave_policy_id)
                        }}</span>
                    </td>
                    <td>
                      <span class="lpa-type-badge">{{ item.policy?.type ?? '—' }}</span>
                    </td>
                    <td>{{ item.policy?.days_per_year != null ? item.policy.days_per_year + ' days' : '—' }}</td>
                    <td>
                      <span :class="item.policy?.is_paid ? 'lpa-badge-yes' : 'lpa-badge-no'">
                        {{ item.policy?.is_paid ? 'Paid' : 'Unpaid' }}
                      </span>
                    </td>
                    <td>
                      <span :class="item.policy?.requires_approval ? 'lpa-badge-yes' : 'lpa-badge-no'">
                        {{ item.policy?.requires_approval ? 'Yes' : 'No' }}
                      </span>
                    </td>
                    <td class="lpa-actions">
                      <button class="lpa-btn-edit" @click="openLpaForm(item)">Edit</button>
                      <button class="lpa-btn-delete" @click="deleteLpa(item)">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Confirm Modal -->
  <BaseModal v-model="showDeleteModal" mode="delete" entity-name="employee" :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This employee record will be permanently removed. The associated user account will be deactivated."
    @success="handleDeleteSuccess" @error="handleModalError" />
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
const baseUrl = process.env.VUE_APP_BASE_URL ?? ''
const baseApi = process.env.VUE_APP_BASE_API ?? ''
const layoutRef = ref(null)
const docInput = ref(null)

// ── Steps definition ──────────────────────────────────────────────────────────
const steps = [
  { key: 'basic', label: 'Basic Info', desc: 'Name, email, role' },
  { key: 'job', label: 'Job Details', desc: 'Company, dept, position' },
  { key: 'salary', label: 'Salary', desc: 'Basic & allowances' },
  { key: 'address', label: 'Address', desc: 'Home & emergency' },
  { key: 'docs', label: 'Documents', desc: 'Files & photo' },
]

// ── Modal state ───────────────────────────────────────────────────────────────
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const showViewModal = ref(false)
const isEditMode = ref(false)
const selectedItem = ref({})
const viewItem = ref(null)
const viewTab = ref('profile')
const lpaItems = ref([])
const lpaLoading = ref(false)
const lpaFormOpen = ref(false)
const lpaSaving = ref(false)
const lpaEditId = ref(null)
const lpaForm = ref({ leave_policy_id: '', effective_from: '', effective_to: '' })
const lpaNot = ref({ show: false, type: 'success', message: '' })

const currentStep = ref(1)
const savedUpTo = ref(0)
const stepSaving = ref(false)
const sameAddress = ref(false)

// The persistent IDs returned from step 1 — needed for subsequent steps
const persistedEmployeeId = ref(null)
const persistedUserId = ref(null)

const showLpaNot = (type, message) => {
  lpaNot.value = { show: true, type, message }
  setTimeout(() => { lpaNot.value.show = false }, 3500)
}

const getPolicyLabel = (id) => {
  const p = (systemData.value.leavePolicies || []).find(p => p.value == id)
  return p ? p.label : `Policy #${id}`
}

const loadLeavePolicies = async (companyId) => {
  if (!companyId) return
  try {
    const d = await apiFetch(`/system/leave-policies/${companyId}`)
    systemData.value.leavePolicies = d.policies ?? []
  } catch { systemData.value.leavePolicies = [] }
}

const loadLpa = async () => {
  if (!viewItem.value) return
  lpaLoading.value = true
  lpaItems.value = []
  try {
    const companyId = viewItem.value.job_detail?.company_id
    const employeeId = viewItem.value.id
    if (!companyId || !employeeId) return
    const d = await apiFetch(`/leave/policy-assignments/employee/${companyId}/${employeeId}`)
    lpaItems.value = Array.isArray(d) ? d : (d.list ?? d.data ?? [])
  } catch { /* silently degrade */ }
  finally { lpaLoading.value = false }
}

const switchViewTab = async (tab) => {
  viewTab.value = tab
  if (tab === 'leave-policies') {
    const companyId = viewItem.value?.job_detail?.company_id
    await Promise.all([
      loadLpa(),
      loadLeavePolicies(companyId),
    ])
  }
}

const openLpaForm = (item) => {
  lpaEditId.value = item?.id ?? null
  lpaForm.value = { leave_policy_id: item?.leave_policy_id ?? '' }
  lpaFormOpen.value = true
}

const saveLpa = async () => {
  if (!lpaForm.value.leave_policy_id) {
    showLpaNot('error', 'Please select a leave policy.')
    return
  }
  lpaSaving.value = true
  try {
    const companyId = viewItem.value.job_detail?.company_id
    const employeeId = viewItem.value.id
    const payload = {
      company_id: companyId,
      employee_id: employeeId,
      leave_policy_id: lpaForm.value.leave_policy_id,
    }
    const url = lpaEditId.value
      ? `${baseApi}/leave/policy-assignments/${lpaEditId.value}`
      : `${baseApi}/leave/policy-assignments`
    const method = lpaEditId.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      const msg = data.message || (data.errors
        ? Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
        : 'Save failed.')
      showLpaNot('error', msg)
      return
    }
    lpaFormOpen.value = false
    showLpaNot('success', lpaEditId.value ? 'Assignment updated.' : 'Policy assigned successfully.')
    await loadLpa()
  } catch (e) {
    showLpaNot('error', e.message || 'Network error.')
  } finally { lpaSaving.value = false }
}

const deleteLpa = async (item) => {
  if (!confirm(`Remove this leave policy assignment?`)) return
  try {
    const res = await fetch(`${baseApi}/leave/policy-assignments/${item.id}`, {
      method: 'DELETE', headers: authHeader(),
    })
    if (!res.ok) { showLpaNot('error', 'Delete failed.'); return }
    showLpaNot('success', 'Assignment removed.')
    await loadLpa()
  } catch { showLpaNot('error', 'Network error.') }
}

// ── Form data ─────────────────────────────────────────────────────────────────
const defaultForm = () => ({
  // Step 1
  name: '', email: '', phone: '', password: '', status: 'active',
  employee_code: '', joining_date: '', role: '',
  // Step 2
  company_id: '', branch_id: '', department_id: '', designation_id: '',
  reporting_manager_id: '', work_type: '',
  // Step 3
  basic_salary: '', house_rent: '', medical_allowance: '',
  // Step 4
  present_address: '', permanent_address: '',
  emergency_contacts: [],
  // Step 5
  photo: null, documents: [],
})
const form = ref(defaultForm())

// ── System dropdown data ──────────────────────────────────────────────────────
const systemData = ref({
  roles: [], companies: [], branches: [], departments: [], positions: [], managers: [], leavePolicies: []
})

// ── Notification ──────────────────────────────────────────────────────────────
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })
const modalNotif = ref({ show: false, type: 'success', message: '' })

const notify = (type, message, { title = '', autoClose = 3000 } = {}) => {
  if (layoutRef.value?.showBanner) {
    layoutRef.value.showBanner(type, message, { title, autoClose })
    return
  }
  notification.value = { show: false, type, title, message, autoClose }
  setTimeout(() => { notification.value = { show: true, type, title, message, autoClose } }, 0)
}

const showModalNotif = (type, message) => {
  modalNotif.value = { show: true, type, message }
  setTimeout(() => { modalNotif.value.show = false }, 4000)
}

// ── Store computed ────────────────────────────────────────────────────────────
const items = computed(() => crudStore.getAllItems)
const isLoading = computed(() => crudStore.isLoading)
const hasError = computed(() => crudStore.hasError)
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred')
const pagination = ref({ current_page: 1, total_pages: 1, total: 0, per_page: 10 })

// ── Page stats ────────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: 'Total', value: pagination.value.total },
  { label: 'Active', value: items.value.filter(i => i.status === 'active').length },
  { label: 'Inactive', value: items.value.filter(i => i.status === 'inactive').length },
])

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Employee Management' },
]

// ── Search / sort / pagination ────────────────────────────────────────────────
const searchFilters = ref({ search: '', status: '', date: '' })
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortConfig = ref({ by: 'created_at', order: 'desc' })

// ── Salary gross computed ─────────────────────────────────────────────────────
const grossSalary = computed(() => {
  const n = (v) => parseFloat(v) || 0
  return (n(form.value.basic_salary) + n(form.value.house_rent) + n(form.value.medical_allowance)).toLocaleString('en-BD')
})

// ── Filter / table definitions ────────────────────────────────────────────────
const filterFields = [
  { name: 'search', label: 'Name', type: 'text', placeholder: 'Search by name…' },
  {
    name: 'status', label: 'Status', type: 'select', placeholder: 'All Status',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
  },
  { name: 'date', label: 'Date', type: 'date' },
]

const tableColumns = [
  { key: 'id', label: 'ID', sortable: true, width: '60px', minWidth: '60px' },
  { key: 'photo', label: 'Photo', type: 'custom', sortable: false, width: '70px', minWidth: '70px', align: 'center' },
  { key: 'name', label: 'Name', type: 'custom', sortable: true, width: '180px', minWidth: '130px' },
  { key: 'department', label: 'Department', type: 'custom', sortable: false, width: '150px', minWidth: '110px' },
  { key: 'designation', label: 'Designation', type: 'custom', sortable: false, width: '150px', minWidth: '110px' },
  { key: 'form_step', label: 'Progress', type: 'custom', sortable: false, width: '110px', minWidth: '100px', align: 'center' },
  { key: 'status', label: 'Status', type: 'status', sortable: true, width: '100px', minWidth: '90px', align: 'center' },
  { key: 'actions', label: 'Actions', type: 'actions', sortable: false, width: '160px', minWidth: '160px', align: 'center' },
]

const tableActions = [
  { name: 'view', label: 'View', class: 'btn-view' },
  { name: 'edit', label: 'Edit', class: 'btn-edit' },
  { name: 'delete', label: 'Delete', class: 'btn-delete' },
]

const paginatedData = computed(() => items.value)

// ── System data loaders ───────────────────────────────────────────────────────
const authHeader = () => {
  const t = localStorage.getItem('token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

const apiFetch = async (path) => {
  const res = await fetch(`${baseApi}${path}`, { headers: authHeader() })
  if (!res.ok) throw new Error(`${path} failed`)
  return res.json()
}

const loadSystemRoles = async () => {
  try {
    const d = await apiFetch('/system/roles')
    systemData.value.roles = (d.countries ?? []).map(r => ({ value: r.label, label: r.label }))
  } catch { /* silently degrade */ }
}

const loadCompanies = async () => {
  try {
    const d = await apiFetch('/system/companies')
    systemData.value.companies = (d.companies ?? []).map(c => ({ value: c.value, label: c.label }))
  } catch { /* silently degrade */ }
}

const loadBranches = async (companyId) => {
  if (!companyId) { systemData.value.branches = []; return }
  try {
    const d = await apiFetch(`/system/branches/${companyId}`)
    systemData.value.branches = (d.branches ?? []).map(b => ({ value: b.value, label: b.label }))
  } catch { systemData.value.branches = [] }
}

const loadDepartments = async (companyId, branchId) => {
  if (!companyId || !branchId) { systemData.value.departments = []; return }
  try {
    const d = await apiFetch(`/system/departments/${companyId}/${branchId}`)
    systemData.value.departments = (d.departments ?? []).map(dep => ({ value: dep.value, label: dep.label }))
  } catch { systemData.value.departments = [] }
}

const loadPositions = async (companyId) => {
  if (!companyId) { systemData.value.positions = []; return }
  try {
    const d = await apiFetch(`/system/positions/${companyId}`)
    systemData.value.positions = (d.positions ?? []).map(p => ({ value: p.value, label: p.label }))
  } catch { systemData.value.positions = [] }
}

// Managers = existing employees list for reporting manager dropdown
const loadManagers = async () => {
  try {
    const result = await crudStore.fetchAll('/employees', { limit: 500 })
    if (result.success) {
      // FIX: handle multiple possible response shapes for the managers list
      const list = result.data?.list ?? result.data?.data ?? result.data ?? []
      systemData.value.managers = (Array.isArray(list) ? list : [])
        .map(e => ({ value: e.id, label: e.user?.name ?? `Employee #${e.id}` }))
    }
  } catch { /* silently degrade */ }
}

// Cascade handlers
const onCompanyChange = () => {
  form.value.branch_id = ''
  form.value.department_id = ''
  form.value.designation_id = ''
  systemData.value.branches = []
  systemData.value.departments = []
  systemData.value.positions = []
  loadBranches(form.value.company_id)
  loadPositions(form.value.company_id)
}

const onBranchChange = () => {
  form.value.department_id = ''
  systemData.value.departments = []
  loadDepartments(form.value.company_id, form.value.branch_id)
}

// ── Main data ─────────────────────────────────────────────────────────────────
const loadData = async () => {
  crudStore.clearError()
  const params = {
    page: currentPage.value,
    limit: itemsPerPage.value,
    ...(searchFilters.value.search && { search: searchFilters.value.search }),
    ...(searchFilters.value.status && { status: searchFilters.value.status }),
    ...(searchFilters.value.date && { date: searchFilters.value.date }),
    ...(sortConfig.value.by && { sort_by: sortConfig.value.by, sort_order: sortConfig.value.order }),
  }
  const result = await crudStore.fetchAll('/employees', params)
  if (!result.success) { notify('error', result.error?.message || 'Failed to load employees.'); return }

  // FIX: handle multiple possible API response shapes so the table always gets data
  const raw = result.data
  if (raw?.pagination) {
    pagination.value = raw.pagination
  } else {
    // Build pagination from whatever total info is available
    const total = raw?.total ?? raw?.meta?.total ?? items.value.length
    pagination.value = {
      current_page: currentPage.value,
      total_pages: Math.ceil(total / itemsPerPage.value) || 1,
      total,
      per_page: itemsPerPage.value,
    }
  }
}

// ── Modal openers ─────────────────────────────────────────────────────────────
const openCreateModal = () => {
  isEditMode.value = false
  form.value = defaultForm()
  currentStep.value = 1
  savedUpTo.value = 0        // FIX: always reset to 0 for new employee
  persistedEmployeeId.value = null
  persistedUserId.value = null
  modalNotif.value.show = false
  showFormModal.value = true
  loadSystemRoles()
  loadCompanies()
  loadManagers()
}

const openEditModal = async (item) => {
  const result = await crudStore.fetchById('/employees/', item.id)
  if (!result.success) { notify('error', 'Could not load employee.'); return }

  const emp = result.data
  isEditMode.value = true
  persistedEmployeeId.value = emp.id
  persistedUserId.value = emp.user_id

  form.value = {
    name: emp.user?.name ?? '',
    email: emp.user?.email ?? '',
    phone: emp.user?.phone ?? '',
    password: '',
    status: emp.user?.status ?? 'active',
    employee_code: emp.employee_id ?? '',
    joining_date: emp.joining_date ?? '',
    role: emp.user?.roles?.[0]?.name ?? '',
    company_id: emp.job_detail?.company_id ?? '',
    branch_id: emp.job_detail?.branch_id ?? '',
    department_id: emp.job_detail?.department_id ?? '',
    designation_id: emp.job_detail?.designation?.id ?? '',
    reporting_manager_id: emp.job_detail?.reporting_manager_id ?? '',
    work_type: emp.job_detail?.work_type ?? '',
    basic_salary: emp.salary?.basic_salary ?? '',
    house_rent: emp.salary?.house_rent ?? '',
    medical_allowance: emp.salary?.medical_allowance ?? '',
    present_address: emp.address?.present_address ?? '',
    permanent_address: emp.address?.permanent_address ?? '',
    emergency_contacts: emp.emergency_contacts?.map(ec => ({
      name: ec.name, relationship: ec.relationship, phone: ec.phone,
    })) ?? [],
    photo: null,
    documents: [],
  }

  // FIX: use the actual saved form_step from the DB; only cap at steps.length, never default to 5
  savedUpTo.value = Math.min(emp.form_step ?? 0, steps.length)
  currentStep.value = 1
  modalNotif.value.show = false
  showFormModal.value = true

  // Pre-load cascading dropdowns
  await loadSystemRoles()
  await loadCompanies()
  await loadManagers()
  if (form.value.company_id) {
    await loadBranches(form.value.company_id)
    await loadPositions(form.value.company_id)
    if (form.value.branch_id) {
      await loadDepartments(form.value.company_id, form.value.branch_id)
    }
  }
}

const openViewModal = async (item) => {
  const result = await crudStore.fetchById('/employees/', item.id)
  if (!result.success) { notify('error', 'Could not load employee.'); return }
  viewItem.value = result.data
  viewTab.value = 'profile'      // ← add this line
  lpaItems.value = []             // ← add this line
  lpaFormOpen.value = false          // ← add this line
  showViewModal.value = true
}

const openDeleteModal = (item) => {
  selectedItem.value = { ...item }
  showDeleteModal.value = true
}

const closeModal = () => {
  showFormModal.value = false
}

// ── Step navigation & save ────────────────────────────────────────────────────
const goToStep = (n) => {
  if (n <= savedUpTo.value + 1) currentStep.value = n
}

const buildStepPayload = (step) => {
  const f = form.value
  const fd = new FormData()

  fd.append('step', step)
  // Always send employee_id and user_id when available so the backend
  // can route to the right record on every step (including step 1 re-saves)
  if (persistedEmployeeId.value) fd.append('employee_id', persistedEmployeeId.value)
  if (persistedUserId.value) fd.append('user_id', persistedUserId.value)

  if (step === 1) {
    fd.append('name', f.name)
    fd.append('email', f.email)
    fd.append('phone', f.phone)
    fd.append('status', f.status)
    if (f.password) fd.append('password', f.password)
    if (f.employee_code) fd.append('employee_code', f.employee_code)
    if (f.joining_date) fd.append('joining_date', f.joining_date)
    if (f.role) fd.append('role', f.role)
  }

  // FIX: always append company_id for step 2 even when empty string,
  // so the backend receives the field. Use null coalescing to send '' not undefined.
  if (step === 2) {
    fd.append('company_id', f.company_id ?? '')
    fd.append('branch_id', f.branch_id ?? '')
    fd.append('department_id', f.department_id ?? '')
    fd.append('designation_id', f.designation_id ?? '')
    fd.append('work_type', f.work_type ?? '')
    fd.append('reporting_manager_id', f.reporting_manager_id ?? '')
  }

  if (step === 3) {
    fd.append('basic_salary', f.basic_salary || 0)
    fd.append('house_rent', f.house_rent || 0)
    fd.append('medical_allowance', f.medical_allowance || 0)
  }

  if (step === 4) {
    fd.append('present_address', f.present_address || '')
    fd.append('permanent_address', f.permanent_address || '')
    if (f.emergency_contacts?.length) {
      fd.append('emergency_contacts', JSON.stringify(f.emergency_contacts))
    }
  }

  if (step === 5) {
    if (f.photo) fd.append('photo', f.photo)
    f.documents.forEach(doc => fd.append('documents[]', doc))
  }

  return fd
}

const saveStep = async (step) => {
  stepSaving.value = true
  modalNotif.value.show = false

  try {
    const fd = buildStepPayload(step)

    // FIX: in edit mode use PUT/PATCH to a step-specific endpoint so the
    // backend never tries to re-insert mandatory step-1 fields (name, email)
    // when we're only updating, say, step 2.
    // For create mode: POST to save-step (backend creates or updates by employee_id).
    // For edit mode:   POST to employees/{id}/step so server knows it's a partial update.
    let url, method
    if (isEditMode.value && persistedEmployeeId.value) {
      url = `${baseApi}/employees/${persistedEmployeeId.value}/step`
      method = 'POST'
    } else {
      url = `${baseApi}/employees/save-step`
      method = 'POST'
    }

    const res = await fetch(url, { method, headers: authHeader(), body: fd })
    const data = await res.json()

    if (!res.ok) {
      const msg = data.message || (data.errors
        ? Object.entries(data.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' · ')
        : 'Step save failed.')
      showModalNotif('error', msg)
      return false
    }

    // Persist IDs returned from a fresh step-1 create
    if (step === 1) {
      if (data.employee_id) persistedEmployeeId.value = data.employee_id
      if (data.user_id) persistedUserId.value = data.user_id
    }

    if (step > savedUpTo.value) savedUpTo.value = step
    showModalNotif('success', `Step ${step} saved successfully.`)
    return true
  } catch (e) {
    showModalNotif('error', e.message || 'Network error.')
    return false
  } finally {
    stepSaving.value = false
  }
}

const saveCurrentStep = async () => {
  await saveStep(currentStep.value)
}

const saveAndNext = async () => {
  const ok = await saveStep(currentStep.value)
  if (ok && currentStep.value < steps.length) currentStep.value++
}

const submitFinal = async () => {
  stepSaving.value = true
  try {
    const res = await fetch(`${baseApi}/employees/submit`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: persistedEmployeeId.value }),
    })
    const data = await res.json()
    if (!res.ok) { showModalNotif('error', data.message || 'Submit failed.'); return }
    showFormModal.value = false
    notify('success', 'Employee created and activated successfully!', { autoClose: 3500 })
    loadData()
  } catch (e) {
    showModalNotif('error', e.message || 'Network error.')
  } finally {
    stepSaving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/employees/', data.id)
  if (!result.success) throw new Error(result.error?.message ?? 'Delete failed')
  return result.data
}

const handleDeleteSuccess = () => {
  showDeleteModal.value = false
  notify('success', 'Employee deleted successfully.', { autoClose: 3000 })
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

// ── Search / sort / pagination ─────────────────────────────────────────────────
const handleSearch = () => { currentPage.value = 1; loadData() }
const handleReset = () => { searchFilters.value = { search: '', status: '', date: '' }; currentPage.value = 1; loadData() }
const handleSort = (s) => { sortConfig.value = s; currentPage.value = 1; loadData() }
const handlePageChange = (page) => { currentPage.value = page; loadData() }
const handlePageSizeChange = (pageSize) => { itemsPerPage.value = pageSize; currentPage.value = 1; loadData() }
const handleAction = ({ action, row }) =>
  ({ view: openViewModal, edit: openEditModal, delete: openDeleteModal })[action]?.(row)

// ── Address helpers ───────────────────────────────────────────────────────────
const applySameAddress = () => {
  if (sameAddress.value) form.value.permanent_address = form.value.present_address
}

const addContact = () => form.value.emergency_contacts.push({ name: '', relationship: '', phone: '' })
const removeContact = (idx) => form.value.emergency_contacts.splice(idx, 1)

// ── Document upload ───────────────────────────────────────────────────────────
const handleDocSelect = (e) => {
  form.value.documents.push(...Array.from(e.target.files))
  e.target.value = ''
}
const handleDocDrop = (e) => {
  form.value.documents.push(...Array.from(e.dataTransfer.files))
}

onMounted(() => { loadData() })
onBeforeUnmount(() => crudStore.clearCurrentItem())
</script>

<style scoped>
/* ── Light Theme Variables ── */
.emp-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #E2E8F0;
  transition: all 0.2s ease;
}

.emp-avatar:hover {
  border-color: #4F46E5;
  transform: scale(1.05);
}

.emp-avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F1F5F9;
  border: 2px solid #E2E8F0;
  color: #94A3B8;
}

/* ── Name cell ── */
.emp-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.emp-name {
  font-size: 14px;
  color: #0F172A;
  font-weight: 600;
}

.emp-code {
  font-size: 11px;
  color: #94A3B8;
  letter-spacing: .05em;
}

/* ── Dept badge ── */
.dept-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .04em;
  text-transform: uppercase;
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
  color: #4F46E5;
  border-radius: 4px;
}

.cell-dash {
  color: #94A3B8;
  font-size: 14px;
}

.cell-text {
  font-size: 13px;
  color: #475569;
}

/* ── Step progress dots in table ── */
.step-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: center;
}

.step-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #E2E8F0;
  border: 1px solid #CBD5E1;
  transition: all 0.2s ease;
}

.step-dot.step-done {
  background: #818CF8;
  border-color: #6366F1;
}

.step-dot.step-complete {
  background: #10B981;
  border-color: #059669;
}

/* ══════════════════════════════════════════════════
   EMPLOYEE MODAL — Light Theme
══════════════════════════════════════════════════ */
.emp-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
  z-index: 9999;
  overflow-y: auto;
}

.emp-modal-shell {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  min-height: 600px;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.emp-modal-view {
  max-width: 720px;
  min-height: unset;
}

/* Modal Head */
.emp-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 16px;
  border-bottom: 1px solid #E2E8F0;
  flex-shrink: 0;
}

.emp-modal-head-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.emp-modal-icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4F46E5;
  flex-shrink: 0;
}

.emp-modal-subtitle {
  font-size: 13px;
  color: #64748B;
  margin: 3px 0 0;
}

.emp-modal-close {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.emp-modal-close:hover {
  border-color: #94A3B8;
  color: #0F172A;
  background: #F1F5F9;
  transform: rotate(90deg);
}

.emp-modal-close svg {
  width: 16px;
  height: 16px;
}

/* Step bar */
.emp-steps-bar {
  display: flex;
  align-items: flex-start;
  padding: 16px 28px 0;
  border-bottom: 1px solid #E2E8F0;
  flex-shrink: 0;
  overflow-x: auto;
  gap: 0;
}

.emp-step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  flex: 1;
  padding-bottom: 14px;
  cursor: default;
  min-width: 0;
}

.step-accessible {
  cursor: pointer;
}

.emp-step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: #F1F5F9;
  border: 2px solid #E2E8F0;
  color: #94A3B8;
  transition: all 0.2s ease;
}

.step-active .emp-step-circle {
  background: #4F46E5;
  border-color: #4F46E5;
  color: #FFFFFF;
}

.step-completed .emp-step-circle {
  background: #10B981;
  border-color: #10B981;
  color: #FFFFFF;
}

.emp-step-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.step-name {
  font-size: 14px;
  font-weight: 600;
  color: #94A3B8;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.step-active .step-name {
  color: #4F46E5;
}

.step-completed .step-name {
  color: #10B981;
}

.step-desc {
  font-size: 12px;
  color: #94A3B8;
  white-space: nowrap;
}

.emp-step-connector {
  position: absolute;
  top: 14px;
  right: 0;
  left: calc(28px + 10px);
  height: 2px;
  background: #E2E8F0;
  margin-right: 10px;
  pointer-events: none;
}

.step-completed .emp-step-connector {
  background: #10B981;
}

/* Notification inside modal */
.modal-notif {
  padding: 10px 28px;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.notif-success {
  background: #ECFDF5;
  color: #059669;
  border-bottom: 1px solid #A7F3D0;
}

.notif-error {
  background: #FEF2F2;
  color: #DC2626;
  border-bottom: 1px solid #FECACA;
}

/* Modal Body / Step pane */
.emp-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  min-height: 360px;
}

.step-pane {
  animation: fadeIn 0.18s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.step-section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #4F46E5;
  padding-bottom: 10px;
  border-bottom: 2px solid #EEF2FF;
  margin-bottom: 20px;
}

/* Form grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field--action {
  display: flex;
  align-items: flex-end;
  padding-bottom: 2px;
}

/* .text-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #475569;
} */

.req {
  color: #DC2626;
  margin-left: 2px;
}

.form-input,
.form-select,
.form-textarea {
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  color: #0F172A;
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
  width: 100%;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 4px #EEF2FF;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #94A3B8;
}

.form-input:disabled,
.form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  padding-right: 36px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.form-select option {
  background: #FFFFFF;
  color: #0F172A;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-file {
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  padding: 8px 0;
}

/* Radio */
.radio-group {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 8px 0;
}

.radio-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
}

.radio-opt input {
  accent-color: #4F46E5;
  width: 16px;
  height: 16px;
}

/* Currency prefix */
.input-prefix-wrap {
  position: relative;
}

.input-prefix {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #4F46E5;
  border-right: 1.5px solid #E2E8F0;
  pointer-events: none;
}

.form-input.with-prefix {
  padding-left: 50px;
}

/* Salary summary */
.salary-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #EEF2FF;
  border: 2px solid #C7D2FE;
  border-radius: 8px;
}

.salary-summary-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #4F46E5;
}

.salary-summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #4F46E5;
}

/* Same address checkbox */
.same-address-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
}

.same-address-toggle input {
  accent-color: #4F46E5;
  width: 16px;
  height: 16px;
}

/* Emergency contacts */
.emergency-contact-row {
  margin-bottom: 14px;
}

.contact-grid {
  grid-template-columns: 1fr 1fr 1fr auto;
}

.btn-remove-contact {
  width: 36px;
  height: 42px;
  background: #FEF2F2;
  border: 1.5px solid #FECACA;
  border-radius: 6px;
  color: #DC2626;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-remove-contact:hover {
  background: #FEE2E2;
  border-color: #F87171;
}

.btn-add-contact {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-top: 4px;
  background: #EEF2FF;
  border: 1.5px solid #C7D2FE;
  border-radius: 6px;
  color: #4F46E5;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-contact:hover {
  background: #E0E7FF;
  border-color: #818CF8;
}

/* Doc upload */
.doc-upload-area {
  border: 2px dashed #E2E8F0;
  border-radius: 8px;
  padding: 0;
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
}

.doc-upload-area:hover {
  border-color: #4F46E5;
  background: #F8FAFC;
}

.doc-file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.doc-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 36px;
  color: #94A3B8;
  font-size: 13px;
}

.doc-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 13px;
}

.doc-item svg {
  color: #4F46E5;
  flex-shrink: 0;
}

.doc-name {
  flex: 1;
  color: #0F172A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-remove {
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
  transition: all 0.2s ease;
}

.doc-remove:hover {
  color: #DC2626;
}

/* Final notice */
.final-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  border-radius: 8px;
  color: #1E40AF;
  font-size: 13px;
  line-height: 1.6;
  margin-top: 20px;
}

.final-notice svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.final-notice strong {
  color: #1E40AF;
}

/* Modal footer */
.emp-modal-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-top: 1px solid #E2E8F0;
  flex-shrink: 0;
  gap: 12px;
}

.foot-left,
.foot-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.foot-center {
  flex: 1;
  text-align: center;
}

.btn-prev,
.btn-next,
.btn-save-step,
.btn-submit-final {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  border: 1.5px solid;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-prev {
  background: transparent;
  border-color: #E2E8F0;
  color: #64748B;
}

.btn-prev:hover:not(:disabled) {
  border-color: #94A3B8;
  color: #0F172A;
  background: #F8FAFC;
}

.btn-save-step {
  background: transparent;
  border-color: #C7D2FE;
  color: #4F46E5;
}

.btn-save-step:hover:not(:disabled) {
  background: #EEF2FF;
  border-color: #818CF8;
}

.btn-next {
  background: #4F46E5;
  border-color: #4F46E5;
  color: #FFFFFF;
}

.btn-next:hover:not(:disabled) {
  background: #4338CA;
  border-color: #4338CA;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.btn-submit-final {
  background: #10B981;
  border-color: #10B981;
  color: #FFFFFF;
}

.btn-submit-final:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-prev:disabled,
.btn-next:disabled,
.btn-save-step:disabled,
.btn-submit-final:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner */
.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── View modal ── */
.view-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.view-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 22px;
  margin-bottom: 22px;
  border-bottom: 1px solid #E2E8F0;
}

.view-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #E2E8F0;
  flex-shrink: 0;
}

.view-avatar-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F1F5F9;
  border: 2px solid #E2E8F0;
  color: #94A3B8;
}

.view-hero-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.view-hero-name {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.02em;
}

.view-hero-emp-id {
  font-size: 12px;
  color: #94A3B8;
  letter-spacing: 0.04em;
}

.card-status {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 12px;
  border: 1.5px solid;
  border-radius: 4px;
  display: inline-block;
}

.status-active {
  color: #059669;
  border-color: #A7F3D0;
  background: #ECFDF5;
}

.status-inactive {
  color: #94A3B8;
  border-color: #E2E8F0;
  background: #F8FAFC;
}

.view-sections {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.view-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.view-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4F46E5;
  padding-bottom: 8px;
  border-bottom: 2px solid #EEF2FF;
}

.view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.view-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-value {
  font-size: 14px;
  color: #0F172A;
  font-weight: 500;
}

.view-contact-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
}

/* ── View modal tabs ── */
.emp-view-tabs {
  display: flex;
  border-bottom: 1px solid #E2E8F0;
  flex-shrink: 0;
  padding: 0 28px;
}

.emp-view-tab {
  padding: 12px 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.emp-view-tab:hover {
  color: #475569;
}

.emp-view-tab--active {
  color: #4F46E5 !important;
  border-bottom-color: #4F46E5 !important;
}

/* ── Leave Policy Assignment panel ── */
.lpa-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lpa-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lpa-count {
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
}

.lpa-btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #EEF2FF;
  border: 1.5px solid #C7D2FE;
  border-radius: 6px;
  color: #4F46E5;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lpa-btn-add:hover {
  background: #E0E7FF;
  border-color: #818CF8;
}

.lpa-notif {
  padding: 10px 16px;
  font-size: 13px;
  border-radius: 6px;
}

.lpa-notif--success {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
}

.lpa-notif--error {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.lpa-form {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 20px;
  animation: fadeIn 0.18s ease;
}

.lpa-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.lpa-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.lpa-btn-cancel {
  padding: 8px 18px;
  background: transparent;
  border: 1.5px solid #E2E8F0;
  border-radius: 6px;
  color: #64748B;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lpa-btn-cancel:hover {
  border-color: #94A3B8;
  color: #0F172A;
}

.lpa-btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #4F46E5;
  border: 1.5px solid #4F46E5;
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lpa-btn-save:hover:not(:disabled) {
  background: #4338CA;
  border-color: #4338CA;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.lpa-btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lpa-loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.lpa-empty {
  text-align: center;
  padding: 44px 0;
  color: #94A3B8;
  font-size: 14px;
}

.lpa-table-wrap {
  overflow-x: auto;
}

.lpa-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.lpa-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748B;
  border-bottom: 2px solid #E2E8F0;
  background: #F8FAFC;
}

.lpa-table td {
  padding: 12px 14px;
  color: #475569;
  font-size: 13px;
  border-bottom: 1px solid #F1F5F9;
}

.lpa-table tr:last-child td {
  border-bottom: none;
}

.lpa-table tr:hover td {
  background: #F8FAFC;
}

.lpa-policy-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
  border-radius: 4px;
  color: #4F46E5;
}

.lpa-actions {
  white-space: nowrap;
}

.lpa-btn-edit,
.lpa-btn-delete {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: transparent;
  border: 1.5px solid;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 6px;
  transition: all 0.2s ease;
}

.lpa-btn-edit {
  color: #4F46E5;
  border-color: #C7D2FE;
}

.lpa-btn-edit:hover {
  background: #EEF2FF;
  border-color: #818CF8;
}

.lpa-btn-delete {
  color: #DC2626;
  border-color: #FECACA;
}

.lpa-btn-delete:hover {
  background: #FEF2F2;
  border-color: #F87171;
}

.lpa-type-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 4px;
  color: #2563EB;
}

.lpa-badge-yes {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #059669;
  padding: 2px 8px;
  border: 1px solid #A7F3D0;
  border-radius: 4px;
  background: #ECFDF5;
}

.lpa-badge-no {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #94A3B8;
  padding: 2px 8px;
  border: 1px solid #E2E8F0;
  border-radius: 4px;
  background: #F8FAFC;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .emp-modal-shell {
    max-width: 100%;
    margin: 10px;
    max-height: calc(100vh - 20px);
    border-radius: 8px;
  }

  .emp-modal-head {
    padding: 16px 20px;
  }

  .emp-modal-body {
    padding: 20px;
  }

  .emp-steps-bar {
    padding: 12px 20px 0;
  }

  .emp-modal-foot {
    padding: 12px 20px;
    flex-wrap: wrap;
  }

  .foot-left,
  .foot-right {
    flex: 1;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }

  .view-grid {
    grid-template-columns: 1fr;
  }

  .view-hero {
    flex-direction: column;
    text-align: center;
  }

  .emp-view-tabs {
    padding: 0 16px;
  }

  .emp-view-tab {
    padding: 10px 14px;
    font-size: 11px;
  }

  .lpa-table {
    font-size: 12px;
  }

  .lpa-table th,
  .lpa-table td {
    padding: 8px 10px;
  }
}

@media (max-width: 480px) {
  .emp-modal-head-left {
    flex-wrap: wrap;
  }

  .emp-modal-icon {
    width: 36px;
    height: 36px;
  }

  .emp-modal-subtitle {
    font-size: 12px;
  }

  .emp-step-item {
    flex: none;
    padding: 0 8px 12px;
  }

  .emp-step-label .step-desc {
    display: none;
  }

  .foot-left,
  .foot-right {
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-prev,
  .btn-next,
  .btn-save-step,
  .btn-submit-final {
    padding: 8px 14px;
    font-size: 11px;
  }

  .view-hero-name {
    font-size: 18px;
  }

  .view-avatar {
    width: 60px;
    height: 60px;
  }

  .view-avatar-placeholder {
    width: 60px;
    height: 60px;
  }

  .lpa-head {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .lpa-btn-add {
    justify-content: center;
  }
}
</style>