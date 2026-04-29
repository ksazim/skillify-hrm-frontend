<template>
  <CrudLayout
    ref="layoutRef"
    title="Employee Management"
    subtitle="Manage employees, job details, salary and documents"
    add-label="New Employee"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading employees"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Employees"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >
    <!-- Icon -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.54 15.46 0 12 0 9.28 0 7 1.64 6.04 4.06L4.5 7.5A4.503 4.503 0 0 0 0 12c0 2.49 2.01 4.5 4.5 4.5H20c2.21 0 4-1.79 4-4s-1.79-4-4-4zM10 1c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm2 13H4.5C2.57 14 1 12.43 1 10.5S2.57 7 4.5 7c.28 0 .56.03.82.09C6.12 4.65 8.84 3 12 3c3.86 0 7 3.14 7 7h1c1.65 0 3 1.35 3 3s-1.35 3-3 3h-8z"/>
      </svg>
    </template>

    <!-- Filters -->
    <template #filters>
      <FilterPanel
        title="Search & Filter"
        :fields="filterFields"
        v-model="searchFilters"
        @submit="handleSearch"
        @reset="handleReset"
      />
    </template>

    <!-- Table -->
    <DataTable
      :data="paginatedData"
      :columns="tableColumns"
      :actions="tableActions"
      result-label="employees"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Photo cell -->
      <template #cell-photo="{ row }">
        <img
          v-if="row.user?.photo"
          :src="baseUrl + '/' + row.user.photo"
          alt="photo"
          class="emp-avatar"
        />
        <div v-else class="emp-avatar-placeholder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
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
          <div
            v-for="s in 5"
            :key="s"
            class="step-dot"
            :class="{
              'step-done': s <= (row.form_step ?? 0),
              'step-complete': row.form_status === 'completed'
            }"
          ></div>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="pagination.total"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]"
        item-label="employees"
        :show-first-last="true"
        :show-labels="false"
        :show-jump-to="false"
        @update:page-size="handlePageSizeChange"
        @page-change="handlePageChange"
      />
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <h2 class="emp-modal-title">
                {{ isEditMode ? 'Edit Employee' : 'New Employee' }}
              </h2>
              <p class="emp-modal-subtitle">
                {{ isEditMode ? 'Update employee information' : 'Fill in the steps below. You can save and resume anytime.' }}
              </p>
            </div>
          </div>
          <button class="emp-modal-close" @click="closeModal">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <!-- Step Progress Bar -->
        <div class="emp-steps-bar">
          <div
            v-for="(step, idx) in steps"
            :key="step.key"
            class="emp-step-item"
            :class="{
              'step-active':     currentStep === idx + 1,
              'step-completed':  savedUpTo >= idx + 1,
              'step-accessible': idx + 1 <= savedUpTo + 1
            }"
            @click="goToStep(idx + 1)"
          >
            <div class="emp-step-circle">
              <svg v-if="savedUpTo >= idx + 1" width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <div class="emp-step-label">
              <span class="step-name">{{ step.label }}</span>
              <span class="step-desc">{{ step.desc }}</span>
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
                <label class="form-label">Full Name <span class="req">*</span></label>
                <input v-model="form.name" class="form-input" type="text" placeholder="John Doe" />
              </div>
              <div class="form-field">
                <label class="form-label">Email Address <span class="req">*</span></label>
                <input v-model="form.email" class="form-input" type="email" placeholder="john@company.com" />
              </div>
              <div class="form-field">
                <label class="form-label">Phone Number <span class="req">*</span></label>
                <input v-model="form.phone" class="form-input" type="text" placeholder="+880 1700 000000" />
              </div>
              <div class="form-field">
                <label class="form-label">Password {{ isEditMode ? '' : '*' }}</label>
                <input v-model="form.password" class="form-input" type="password"
                  :placeholder="isEditMode ? 'Leave blank to keep current…' : 'Enter password…'" />
              </div>
              <div class="form-field">
                <label class="form-label">Employee Code</label>
                <input v-model="form.employee_code" class="form-input" type="text" placeholder="EMP-0001" />
              </div>
              <div class="form-field">
                <label class="form-label">Joining Date</label>
                <input v-model="form.joining_date" class="form-input" type="date" />
              </div>
              <div class="form-field">
                <label class="form-label">Role</label>
                <select v-model="form.role" class="form-select">
                  <option value="">Select role…</option>
                  <option v-for="r in systemData.roles" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Status <span class="req">*</span></label>
                <div class="radio-group">
                  <label class="radio-opt">
                    <input type="radio" v-model="form.status" value="active" />
                    <span>Active</span>
                  </label>
                  <label class="radio-opt">
                    <input type="radio" v-model="form.status" value="inactive" />
                    <span>Inactive</span>
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
                <label class="form-label">Company <span class="req">*</span></label>
                <select v-model="form.company_id" class="form-select" @change="onCompanyChange">
                  <option value="">Select company…</option>
                  <option v-for="c in systemData.companies" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Branch</label>
                <select v-model="form.branch_id" class="form-select" @change="onBranchChange" :disabled="!form.company_id">
                  <option value="">Select branch…</option>
                  <option v-for="b in systemData.branches" :key="b.value" :value="b.value">{{ b.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Department</label>
                <select v-model="form.department_id" class="form-select" :disabled="!form.branch_id">
                  <option value="">Select department…</option>
                  <option v-for="d in systemData.departments" :key="d.value" :value="d.value">{{ d.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Designation / Position</label>
                <select v-model="form.designation_id" class="form-select" :disabled="!form.company_id">
                  <option value="">Select designation…</option>
                  <option v-for="p in systemData.positions" :key="p.value" :value="p.value">{{ p.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Reporting Manager</label>
                <select v-model="form.reporting_manager_id" class="form-select">
                  <option value="">None</option>
                  <option v-for="m in systemData.managers" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Work Type</label>
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
                <label class="form-label">Basic Salary <span class="req">*</span></label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix">৳</span>
                  <input v-model="form.basic_salary" class="form-input with-prefix" type="number" placeholder="0.00" min="0" />
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">House Rent Allowance</label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix">৳</span>
                  <input v-model="form.house_rent" class="form-input with-prefix" type="number" placeholder="0.00" min="0" />
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Medical Allowance</label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix">৳</span>
                  <input v-model="form.medical_allowance" class="form-input with-prefix" type="number" placeholder="0.00" min="0" />
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
                <label class="form-label">Present Address</label>
                <textarea v-model="form.present_address" class="form-textarea" rows="3" placeholder="Current residential address…"></textarea>
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Permanent Address</label>
                <textarea v-model="form.permanent_address" class="form-textarea" rows="3" placeholder="Permanent / hometown address…"></textarea>
              </div>
              <div class="form-field form-field--full">
                <label class="form-label same-address-toggle">
                  <input type="checkbox" v-model="sameAddress" @change="applySameAddress" />
                  <span>Same as present address</span>
                </label>
              </div>
            </div>

            <!-- Emergency Contacts -->
            <div class="step-section-title" style="margin-top:24px">Emergency Contacts</div>
            <div
              v-for="(contact, idx) in form.emergency_contacts"
              :key="idx"
              class="emergency-contact-row"
            >
              <div class="form-grid contact-grid">
                <div class="form-field">
                  <label class="form-label">Name</label>
                  <input v-model="contact.name" class="form-input" type="text" placeholder="Contact name" />
                </div>
                <div class="form-field">
                  <label class="form-label">Relationship</label>
                  <input v-model="contact.relationship" class="form-input" type="text" placeholder="e.g. Spouse, Parent" />
                </div>
                <div class="form-field">
                  <label class="form-label">Phone</label>
                  <input v-model="contact.phone" class="form-input" type="text" placeholder="+880…" />
                </div>
                <div class="form-field form-field--action">
                  <button class="btn-remove-contact" @click="removeContact(idx)" title="Remove">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <button class="btn-add-contact" @click="addContact">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
              </svg>
              Add Emergency Contact
            </button>
          </div>

          <!-- ── STEP 5: Documents ── -->
          <div v-if="currentStep === 5" class="step-pane">
            <div class="step-section-title">Documents & Photo</div>
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">Profile Photo</label>
                <input type="file" class="form-file" accept="image/*" @change="e => form.photo = e.target.files[0]" />
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Upload Documents</label>
                <div class="doc-upload-area" @dragover.prevent @drop.prevent="handleDocDrop">
                  <input type="file" class="doc-file-input" multiple @change="handleDocSelect" ref="docInput" />
                  <div class="doc-upload-placeholder" @click="$refs.docInput.click()">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style="opacity:.35">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                    </svg>
                    <span>Click to browse or drag files here</span>
                  </div>
                </div>
                <div v-if="form.documents.length" class="doc-list">
                  <div v-for="(doc, idx) in form.documents" :key="idx" class="doc-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                    </svg>
                    <span class="doc-name">{{ doc.name }}</span>
                    <button class="doc-remove" @click="form.documents.splice(idx, 1)">×</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Final Submit notice -->
            <div v-if="!isEditMode" class="final-notice">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <span>After saving Step 5, click <strong>Submit Employee</strong> to activate the record.</span>
            </div>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="emp-modal-foot">
          <div class="foot-left">
            <button
              v-if="currentStep > 1"
              class="btn-prev"
              @click="currentStep--"
              :disabled="stepSaving"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Previous
            </button>
          </div>

          <div class="foot-center">
            <span class="step-counter">Step {{ currentStep }} of {{ steps.length }}</span>
          </div>

          <div class="foot-right">
            <!-- Save current step -->
            <button
              class="btn-save-step"
              @click="saveCurrentStep"
              :disabled="stepSaving"
            >
              <span v-if="stepSaving" class="spinner-sm"></span>
              {{ stepSaving ? 'Saving…' : 'Save Step' }}
            </button>

            <!-- Next (if not last step) -->
            <button
              v-if="currentStep < steps.length"
              class="btn-next"
              @click="saveAndNext"
              :disabled="stepSaving"
            >
              Save & Next
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
            </button>

            <!-- Submit final (step 5, new employee) -->
            <button
              v-if="currentStep === steps.length && !isEditMode"
              class="btn-submit-final"
              :disabled="stepSaving || savedUpTo < steps.length"
              @click="submitFinal"
            >
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <h2 class="emp-modal-title">Employee Profile</h2>
              <p class="emp-modal-subtitle">{{ viewItem?.user?.name }}</p>
            </div>
          </div>
          <button class="emp-modal-close" @click="showViewModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <!-- View Tabs -->
        <div class="emp-view-tabs">
          <button
            class="emp-view-tab"
            :class="{ 'emp-view-tab--active': viewTab === 'profile' }"
            @click="viewTab = 'profile'"
          >Profile</button>
          <button
            class="emp-view-tab"
            :class="{ 'emp-view-tab--active': viewTab === 'leave-policies' }"
            @click="switchViewTab('leave-policies')"
          >Leave Policies</button>
        </div>

        <div class="emp-modal-body view-body" v-if="viewItem">

          <!-- ── Profile Tab ── -->
          <div v-if="viewTab === 'profile'">
            <div class="view-hero">
              <img v-if="viewItem.user?.photo" :src="baseUrl + '/' + viewItem.user.photo" alt="photo" class="view-avatar" />
              <div v-else class="view-avatar-placeholder">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
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
                  <div class="view-field"><span class="view-label">Email</span><span class="view-value">{{ viewItem.user?.email ?? '—' }}</span></div>
                  <div class="view-field"><span class="view-label">Phone</span><span class="view-value">{{ viewItem.user?.phone ?? '—' }}</span></div>
                  <div class="view-field"><span class="view-label">Joining Date</span><span class="view-value">{{ viewItem.joining_date ?? '—' }}</span></div>
                </div>
              </div>
              <div class="view-section">
                <div class="view-section-title">Job Details</div>
                <div class="view-grid">
                  <div class="view-field"><span class="view-label">Department</span><span class="view-value">{{ viewItem.job_detail?.department?.name ?? '—' }}</span></div>
                  <div class="view-field"><span class="view-label">Designation</span><span class="view-value">{{ viewItem.job_detail?.designation?.name ?? '—' }}</span></div>
                  <div class="view-field"><span class="view-label">Work Type</span><span class="view-value">{{ viewItem.job_detail?.work_type ?? '—' }}</span></div>
                </div>
              </div>
              <div class="view-section">
                <div class="view-section-title">Salary</div>
                <div class="view-grid">
                  <div class="view-field"><span class="view-label">Basic</span><span class="view-value">৳ {{ viewItem.salary?.basic_salary ?? '—' }}</span></div>
                  <div class="view-field"><span class="view-label">House Rent</span><span class="view-value">৳ {{ viewItem.salary?.house_rent ?? '—' }}</span></div>
                  <div class="view-field"><span class="view-label">Medical</span><span class="view-value">৳ {{ viewItem.salary?.medical_allowance ?? '—' }}</span></div>
                </div>
              </div>
              <div class="view-section" v-if="viewItem.address">
                <div class="view-section-title">Address</div>
                <div class="view-grid">
                  <div class="view-field form-field--full"><span class="view-label">Present</span><span class="view-value">{{ viewItem.address?.present_address ?? '—' }}</span></div>
                  <div class="view-field form-field--full"><span class="view-label">Permanent</span><span class="view-value">{{ viewItem.address?.permanent_address ?? '—' }}</span></div>
                </div>
              </div>
              <div class="view-section" v-if="viewItem.emergency_contacts?.length">
                <div class="view-section-title">Emergency Contacts</div>
                <div v-for="ec in viewItem.emergency_contacts" :key="ec.id" class="view-contact-row">
                  <span class="view-value">{{ ec.name }}</span>
                  <span class="view-label">{{ ec.relationship }}</span>
                  <span class="view-value">{{ ec.phone }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Leave Policies Tab ── -->
          <div v-if="viewTab === 'leave-policies'" class="lpa-panel">

            <!-- Panel header -->
            <div class="lpa-head">
              <span class="lpa-count">{{ lpaItems.length }} Assigned Polic{{ lpaItems.length === 1 ? 'y' : 'ies' }}</span>
              <button class="lpa-btn-add" @click="openLpaForm(null)">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
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
                  <label class="form-label">Leave Policy <span class="req">*</span></label>
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
              <div class="spinner-sm" style="width:22px;height:22px;border-width:2px;border-top-color:#C9A96E;border-color:rgba(201,169,110,0.20)"></div>
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
                    <span class="lpa-policy-badge">{{ item.policy?.name ?? getPolicyLabel(item.leave_policy_id) }}</span>
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
  <BaseModal
    v-model="showDeleteModal"
    mode="delete"
    entity-name="employee"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This employee record will be permanently removed. The associated user account will be deactivated."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCrudStore } from '@/store/crud'
import CrudLayout  from '../components/CrudLayout.vue'
import FilterPanel from '../components/FilterComponent.vue'
import DataTable   from '../components/TableComponent.vue'
import Pagination  from '../components/PaginationComponent.vue'
import BaseModal   from '../components/ActionModalComponent.vue'

const crudStore = useCrudStore()
const baseUrl   = process.env.VUE_APP_BASE_URL ?? ''
const baseApi   = process.env.VUE_APP_BASE_API ?? ''
const layoutRef = ref(null)
const docInput  = ref(null)

// ── Steps definition ──────────────────────────────────────────────────────────
const steps = [
  { key: 'basic',   label: 'Basic Info',   desc: 'Name, email, role' },
  { key: 'job',     label: 'Job Details',  desc: 'Company, dept, position' },
  { key: 'salary',  label: 'Salary',       desc: 'Basic & allowances' },
  { key: 'address', label: 'Address',      desc: 'Home & emergency' },
  { key: 'docs',    label: 'Documents',    desc: 'Files & photo' },
]

// ── Modal state ───────────────────────────────────────────────────────────────
const showFormModal   = ref(false)
const showDeleteModal = ref(false)
const showViewModal   = ref(false)
const isEditMode      = ref(false)
const selectedItem    = ref({})
const viewItem        = ref(null)
const viewTab    = ref('profile')
const lpaItems   = ref([])
const lpaLoading = ref(false)
const lpaFormOpen = ref(false)
const lpaSaving  = ref(false)
const lpaEditId  = ref(null)
const lpaForm    = ref({ leave_policy_id: '', effective_from: '', effective_to: '' })
const lpaNot     = ref({ show: false, type: 'success', message: '' })

const currentStep     = ref(1)
const savedUpTo       = ref(0)
const stepSaving      = ref(false)
const sameAddress     = ref(false)

// The persistent IDs returned from step 1 — needed for subsequent steps
const persistedEmployeeId = ref(null)
const persistedUserId     = ref(null)

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
  lpaItems.value   = []
  try {
    const companyId  = viewItem.value.job_detail?.company_id
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
  lpaEditId.value   = item?.id ?? null
  lpaForm.value     = { leave_policy_id: item?.leave_policy_id ?? '' }
  lpaFormOpen.value = true
}

const saveLpa = async () => {
  if (!lpaForm.value.leave_policy_id) {
    showLpaNot('error', 'Please select a leave policy.')
    return
  }
  lpaSaving.value = true
  try {
    const companyId  = viewItem.value.job_detail?.company_id
    const employeeId = viewItem.value.id
    const payload = {
      company_id:      companyId,
      employee_id:     employeeId,
      leave_policy_id: lpaForm.value.leave_policy_id,
    }
    const url    = lpaEditId.value
      ? `${baseApi}/leave/policy-assignments/${lpaEditId.value}`
      : `${baseApi}/leave/policy-assignments`
    const method = lpaEditId.value ? 'PUT' : 'POST'
    const res    = await fetch(url, {
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
const modalNotif   = ref({ show: false, type: 'success', message: '' })

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
const items        = computed(() => crudStore.getAllItems)
const isLoading    = computed(() => crudStore.isLoading)
const hasError     = computed(() => crudStore.hasError)
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred')
const pagination   = ref({ current_page: 1, total_pages: 1, total: 0, per_page: 10 })

// ── Page stats ────────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: 'Total',     value: pagination.value.total },
  { label: 'Active',    value: items.value.filter(i => i.status === 'active').length },
  { label: 'Inactive',  value: items.value.filter(i => i.status === 'inactive').length },
])

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Employee Management' },
]

// ── Search / sort / pagination ────────────────────────────────────────────────
const searchFilters = ref({ search: '', status: '', date: '' })
const currentPage   = ref(1)
const itemsPerPage  = ref(10)
const sortConfig    = ref({ by: 'created_at', order: 'desc' })

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
  { key: 'id',          label: 'ID',          sortable: true,  width: '60px',  minWidth: '60px'  },
  { key: 'photo',       label: 'Photo',       type: 'custom',  sortable: false, width: '70px',  minWidth: '70px',  align: 'center' },
  { key: 'name',        label: 'Name',        type: 'custom',  sortable: true,  width: '180px', minWidth: '130px' },
  { key: 'department',  label: 'Department',  type: 'custom',  sortable: false, width: '150px', minWidth: '110px' },
  { key: 'designation', label: 'Designation', type: 'custom',  sortable: false, width: '150px', minWidth: '110px' },
  { key: 'form_step',   label: 'Progress',    type: 'custom',  sortable: false, width: '110px', minWidth: '100px', align: 'center' },
  { key: 'status',      label: 'Status',      type: 'status',  sortable: true,  width: '100px', minWidth: '90px',  align: 'center' },
  { key: 'actions',     label: 'Actions',     type: 'actions', sortable: false, width: '160px', minWidth: '160px', align: 'center' },
]

const tableActions = [
  { name: 'view',   label: 'View',   class: 'btn-view'   },
  { name: 'edit',   label: 'Edit',   class: 'btn-edit'   },
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
  form.value.branch_id      = ''
  form.value.department_id  = ''
  form.value.designation_id = ''
  systemData.value.branches    = []
  systemData.value.departments = []
  systemData.value.positions   = []
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
    page:  currentPage.value,
    limit: itemsPerPage.value,
    ...(searchFilters.value.search && { search:     searchFilters.value.search }),
    ...(searchFilters.value.status && { status:     searchFilters.value.status }),
    ...(searchFilters.value.date   && { date:       searchFilters.value.date   }),
    ...(sortConfig.value.by        && { sort_by:    sortConfig.value.by, sort_order: sortConfig.value.order }),
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
      total_pages:  Math.ceil(total / itemsPerPage.value) || 1,
      total,
      per_page:     itemsPerPage.value,
    }
  }
}

// ── Modal openers ─────────────────────────────────────────────────────────────
const openCreateModal = () => {
  isEditMode.value          = false
  form.value                = defaultForm()
  currentStep.value         = 1
  savedUpTo.value           = 0        // FIX: always reset to 0 for new employee
  persistedEmployeeId.value = null
  persistedUserId.value     = null
  modalNotif.value.show     = false
  showFormModal.value       = true
  loadSystemRoles()
  loadCompanies()
  loadManagers()
}

const openEditModal = async (item) => {
  const result = await crudStore.fetchById('/employees/', item.id)
  if (!result.success) { notify('error', 'Could not load employee.'); return }

  const emp = result.data
  isEditMode.value          = true
  persistedEmployeeId.value = emp.id
  persistedUserId.value     = emp.user_id

  form.value = {
    name:                  emp.user?.name                    ?? '',
    email:                 emp.user?.email                   ?? '',
    phone:                 emp.user?.phone                   ?? '',
    password:              '',
    status:                emp.user?.status                  ?? 'active',
    employee_code:         emp.employee_id                   ?? '',
    joining_date:          emp.joining_date                  ?? '',
    role:                  emp.user?.roles?.[0]?.name        ?? '',
    company_id:            emp.job_detail?.company_id        ?? '',
    branch_id:             emp.job_detail?.branch_id         ?? '',
    department_id:         emp.job_detail?.department_id     ?? '',
    designation_id:        emp.job_detail?.designation?.id    ?? '',
    reporting_manager_id:  emp.job_detail?.reporting_manager_id ?? '',
    work_type:             emp.job_detail?.work_type         ?? '',
    basic_salary:          emp.salary?.basic_salary          ?? '',
    house_rent:            emp.salary?.house_rent            ?? '',
    medical_allowance:     emp.salary?.medical_allowance     ?? '',
    present_address:       emp.address?.present_address      ?? '',
    permanent_address:     emp.address?.permanent_address    ?? '',
    emergency_contacts:    emp.emergency_contacts?.map(ec => ({
      name: ec.name, relationship: ec.relationship, phone: ec.phone,
    })) ?? [],
    photo:     null,
    documents: [],
  }

  // FIX: use the actual saved form_step from the DB; only cap at steps.length, never default to 5
  savedUpTo.value       = Math.min(emp.form_step ?? 0, steps.length)
  currentStep.value     = 1
  modalNotif.value.show = false
  showFormModal.value   = true

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
  viewItem.value      = result.data
  viewTab.value       = 'profile'      // ← add this line
  lpaItems.value      = []             // ← add this line
  lpaFormOpen.value   = false          // ← add this line
  showViewModal.value = true
}

const openDeleteModal = (item) => {
  selectedItem.value    = { ...item }
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
  const f  = form.value
  const fd = new FormData()

  fd.append('step', step)
  // Always send employee_id and user_id when available so the backend
  // can route to the right record on every step (including step 1 re-saves)
  if (persistedEmployeeId.value) fd.append('employee_id', persistedEmployeeId.value)
  if (persistedUserId.value)     fd.append('user_id',     persistedUserId.value)

  if (step === 1) {
    fd.append('name',   f.name)
    fd.append('email',  f.email)
    fd.append('phone',  f.phone)
    fd.append('status', f.status)
    if (f.password)      fd.append('password',      f.password)
    if (f.employee_code) fd.append('employee_code', f.employee_code)
    if (f.joining_date)  fd.append('joining_date',  f.joining_date)
    if (f.role)          fd.append('role',           f.role)
  }

  // FIX: always append company_id for step 2 even when empty string,
  // so the backend receives the field. Use null coalescing to send '' not undefined.
  if (step === 2) {
    fd.append('company_id',     f.company_id           ?? '')
    fd.append('branch_id',      f.branch_id            ?? '')
    fd.append('department_id',  f.department_id        ?? '')
    fd.append('designation_id', f.designation_id       ?? '')
    fd.append('work_type',      f.work_type            ?? '')
    fd.append('reporting_manager_id', f.reporting_manager_id ?? '')
  }

  if (step === 3) {
    fd.append('basic_salary',      f.basic_salary      || 0)
    fd.append('house_rent',        f.house_rent        || 0)
    fd.append('medical_allowance', f.medical_allowance || 0)
  }

  if (step === 4) {
    fd.append('present_address',   f.present_address   || '')
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
  stepSaving.value      = true
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
      url    = `${baseApi}/employees/${persistedEmployeeId.value}/step`
      method = 'POST'
    } else {
      url    = `${baseApi}/employees/save-step`
      method = 'POST'
    }

    const res  = await fetch(url, { method, headers: authHeader(), body: fd })
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
      if (data.user_id)     persistedUserId.value     = data.user_id
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
      method:  'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body:    JSON.stringify({ employee_id: persistedEmployeeId.value }),
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
const handleSearch         = () => { currentPage.value = 1; loadData() }
const handleReset          = () => { searchFilters.value = { search: '', status: '', date: '' }; currentPage.value = 1; loadData() }
const handleSort           = (s) => { sortConfig.value = s; currentPage.value = 1; loadData() }
const handlePageChange     = (page) => { currentPage.value = page; loadData() }
const handlePageSizeChange = (pageSize) => { itemsPerPage.value = pageSize; currentPage.value = 1; loadData() }
const handleAction         = ({ action, row }) =>
  ({ view: openViewModal, edit: openEditModal, delete: openDeleteModal })[action]?.(row)

// ── Address helpers ───────────────────────────────────────────────────────────
const applySameAddress = () => {
  if (sameAddress.value) form.value.permanent_address = form.value.present_address
}

const addContact    = () => form.value.emergency_contacts.push({ name: '', relationship: '', phone: '' })
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
/* ── Avatars ── */
.emp-avatar {
  width: 36px; height: 36px; border-radius: 50%; object-fit: cover;
  border: 1px solid rgba(201,169,110,0.25);
}
.emp-avatar-placeholder {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(201,169,110,0.08); border: 1px solid rgba(201,169,110,0.20);
  color: rgba(240,234,224,0.35);
}

/* ── Name cell ── */
.emp-name-cell { display: flex; flex-direction: column; gap: 2px; }
.emp-name      { font-size: 13px; color: #F0EAE0; font-weight: 500; }
.emp-code      { font-size: 10px; color: rgba(201,169,110,0.70); letter-spacing: .05em; }

/* ── Dept badge ── */
.dept-badge {
  display: inline-block; padding: 2px 9px; font-size: 10.5px; font-weight: 500;
  letter-spacing: .05em; text-transform: uppercase;
  background: rgba(133,183,235,0.08); border: 1px solid rgba(133,183,235,0.25); color: #85B7EB;
}
.cell-dash  { color: rgba(240,234,224,0.25); font-size: 14px; }
.cell-text  { font-size: 12px; color: rgba(240,234,224,0.70); }

/* ── Step progress dots in table ── */
.step-indicator { display: flex; align-items: center; gap: 4px; justify-content: center; }
.step-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(240,234,224,0.12); border: 1px solid rgba(240,234,224,0.18);
  transition: background .15s;
}
.step-dot.step-done     { background: rgba(201,169,110,0.55); border-color: rgba(201,169,110,0.70); }
.step-dot.step-complete { background: #6ECFA9;               border-color: rgba(110,207,169,0.80); }

/* ══════════════════════════════════════════════════
   EMPLOYEE MODAL — larger to fit content comfortably
══════════════════════════════════════════════════ */
.emp-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 24px 16px; z-index: 9999; overflow-y: auto;
}
.emp-modal-shell {
  background: #17171D; border: 1px solid rgba(201,169,110,0.25);
  width: 100%;
  /* FIX: wider modal and taller body to avoid cramped layout */
  max-width: 900px;
  min-height: 600px;
  max-height: calc(100vh - 48px);
  display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 28px 80px rgba(0,0,0,0.65);
}
.emp-modal-view { max-width: 720px; min-height: unset; }

/* Modal Head */
.emp-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 28px 16px; border-bottom: 1px solid rgba(201,169,110,0.15);
  flex-shrink: 0;
}
.emp-modal-head-left { display: flex; align-items: center; gap: 12px; }
.emp-modal-icon {
  width: 38px; height: 38px;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.28);
  display: flex; align-items: center; justify-content: center; color: #C9A96E; flex-shrink: 0;
}
.emp-modal-title    { font-size: 16px; font-weight: 600; color: #F0EAE0; margin: 0; }
.emp-modal-subtitle { font-size: 11px; color: rgba(240,234,224,0.40); margin: 3px 0 0; }
.emp-modal-close {
  width: 32px; height: 32px; background: transparent; border: 1px solid rgba(240,234,224,0.12);
  color: rgba(240,234,224,0.45); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .13s; flex-shrink: 0;
}
.emp-modal-close:hover { border-color: rgba(240,234,224,0.30); color: #F0EAE0; }
.emp-modal-close svg   { width: 14px; height: 14px; }

/* Step bar */
.emp-steps-bar {
  display: flex; align-items: flex-start; padding: 16px 28px 0;
  border-bottom: 1px solid rgba(201,169,110,0.12); flex-shrink: 0;
  overflow-x: auto; gap: 0;
}
.emp-step-item {
  display: flex; align-items: flex-start; gap: 10px; position: relative;
  flex: 1; padding-bottom: 14px; cursor: default; min-width: 0;
}
.step-accessible { cursor: pointer; }
.emp-step-circle {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(240,234,224,0.15);
  color: rgba(240,234,224,0.35); transition: all .18s;
}
.step-active .emp-step-circle {
  background: rgba(201,169,110,0.18); border-color: #C9A96E; color: #C9A96E;
}
.step-completed .emp-step-circle {
  background: rgba(110,207,169,0.15); border-color: rgba(110,207,169,0.60); color: #6ECFA9;
}
.emp-step-label  { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.step-name       { font-size: 12px; font-weight: 500; color: rgba(240,234,224,0.45); white-space: nowrap; transition: color .15s; }
.step-active .step-name    { color: #C9A96E; }
.step-completed .step-name { color: rgba(110,207,169,0.80); }
.step-desc { font-size: 10px; color: rgba(240,234,224,0.25); white-space: nowrap; }
.emp-step-connector {
  position: absolute; top: 13px; right: 0; left: calc(26px + 10px);
  height: 1px; background: rgba(201,169,110,0.15); margin-right: 10px;
  pointer-events: none;
}
.step-completed .emp-step-connector { background: rgba(110,207,169,0.30); }

/* Notification inside modal */
.modal-notif {
  padding: 10px 28px; font-size: 12px; letter-spacing: .03em; flex-shrink: 0;
}
.notif-success { background: rgba(110,207,169,0.12); color: #6ECFA9; border-bottom: 1px solid rgba(110,207,169,0.20); }
.notif-error   { background: rgba(239,107,107,0.12); color: #EF6B6B; border-bottom: 1px solid rgba(239,107,107,0.20); }

/* Modal Body / Step pane — FIX: flex:1 + overflow-y lets body scroll without squishing */
.emp-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  /* FIX: ensure there's always enough room for the form fields */
  min-height: 360px;
}
.step-pane { animation: fadeIn .18s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }

.step-section-title {
  font-size: 10px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
  color: rgba(201,169,110,0.70); padding-bottom: 10px; border-bottom: 1px solid rgba(201,169,110,0.15);
  margin-bottom: 20px;
}

/* Form grid — FIX: larger min column width so fields aren't too narrow */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field--full   { grid-column: 1 / -1; }
.form-field--action { display: flex; align-items: flex-end; padding-bottom: 2px; }
.form-label {
  font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
  color: rgba(240,234,224,0.45);
}
.req { color: rgba(239,107,107,0.80); margin-left: 2px; }
.form-input, .form-select, .form-textarea {
  background: rgba(18,18,24,0.98); border: 1px solid rgba(201,169,110,0.22);
  color: #F0EAE0; font-size: 13px; padding: 10px 13px; outline: none;
  font-family: inherit; transition: border-color .14s; box-sizing: border-box; width: 100%;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: rgba(201,169,110,0.55); background: rgba(22,22,28,0.99);
}
.form-input::placeholder, .form-textarea::placeholder { color: rgba(240,234,224,0.22); }
.form-input:disabled, .form-select:disabled { opacity: .45; cursor: not-allowed; }
.form-select {
  cursor: pointer; appearance: none; -webkit-appearance: none; padding-right: 30px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(201,169,110,0.55)'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; background-color: rgba(18,18,24,0.98);
}
.form-select option { background: #17171D; color: #F0EAE0; }
.form-textarea { resize: vertical; min-height: 80px; }
.form-file { font-size: 12px; color: rgba(240,234,224,0.50); cursor: pointer; padding: 8px 0; }

/* Radio */
.radio-group { display: flex; gap: 16px; align-items: center; padding: 10px 0; }
.radio-opt { display: flex; align-items: center; gap: 7px; cursor: pointer; font-size: 13px; color: rgba(240,234,224,0.65); }
.radio-opt input { accent-color: #C9A96E; }

/* Currency prefix */
.input-prefix-wrap { position: relative; }
.input-prefix {
  position: absolute; left: 0; top: 0; bottom: 0; width: 34px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: rgba(201,169,110,0.60);
  border-right: 1px solid rgba(201,169,110,0.18); pointer-events: none;
}
.form-input.with-prefix { padding-left: 44px; }

/* Salary summary */
.salary-summary {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; background: rgba(201,169,110,0.06); border: 1px solid rgba(201,169,110,0.18);
}
.salary-summary-label { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: rgba(240,234,224,0.45); }
.salary-summary-value { font-size: 18px; font-weight: 600; color: #C9A96E; font-family: 'Cormorant Garamond','Georgia',serif; }

/* Same address checkbox */
.same-address-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: rgba(240,234,224,0.55); }
.same-address-toggle input { accent-color: #C9A96E; }

/* Emergency contacts */
.emergency-contact-row { margin-bottom: 12px; }
.contact-grid { grid-template-columns: 1fr 1fr 1fr auto; }
.btn-remove-contact {
  width: 32px; height: 38px; background: rgba(239,107,107,0.10); border: 1px solid rgba(239,107,107,0.30);
  color: rgba(239,107,107,0.70); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .13s;
}
.btn-remove-contact:hover { background: rgba(239,107,107,0.18); color: #EF6B6B; }
.btn-add-contact {
  display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; margin-top: 4px;
  background: rgba(201,169,110,0.08); border: 1px solid rgba(201,169,110,0.30);
  color: #C9A96E; font-size: 11px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  cursor: pointer; transition: all .14s;
}
.btn-add-contact:hover { background: rgba(201,169,110,0.16); }

/* Doc upload */
.doc-upload-area {
  border: 1px dashed rgba(201,169,110,0.30); padding: 0; position: relative;
  transition: border-color .15s; cursor: pointer;
}
.doc-upload-area:hover { border-color: rgba(201,169,110,0.55); }
.doc-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.doc-upload-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 32px; color: rgba(240,234,224,0.30); font-size: 12px; letter-spacing: .04em;
}
.doc-list { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.doc-item {
  display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(201,169,110,0.15); font-size: 12px;
}
.doc-item svg { color: rgba(201,169,110,0.50); flex-shrink: 0; }
.doc-name    { flex: 1; color: rgba(240,234,224,0.65); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.doc-remove  {
  background: transparent; border: none; color: rgba(239,107,107,0.60); cursor: pointer;
  font-size: 16px; line-height: 1; padding: 0 2px; transition: color .13s;
}
.doc-remove:hover { color: #EF6B6B; }

/* Final notice */
.final-notice {
  display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px;
  background: rgba(133,183,235,0.07); border: 1px solid rgba(133,183,235,0.22);
  color: rgba(133,183,235,0.85); font-size: 12px; line-height: 1.6; margin-top: 20px;
}
.final-notice svg { flex-shrink: 0; margin-top: 1px; }
.final-notice strong { color: #85B7EB; }

/* Modal footer */
.emp-modal-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 28px; border-top: 1px solid rgba(201,169,110,0.15);
  flex-shrink: 0; gap: 12px;
}
.foot-left, .foot-right { display: flex; align-items: center; gap: 10px; }
.foot-center { flex: 1; text-align: center; }
.step-counter { font-size: 11px; color: rgba(240,234,224,0.30); letter-spacing: .06em; }

.btn-prev, .btn-next, .btn-save-step, .btn-submit-final {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px; font-size: 11px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  cursor: pointer; border: 1px solid; transition: all .14s;
}
.btn-prev {
  background: transparent; border-color: rgba(240,234,224,0.15); color: rgba(240,234,224,0.45);
}
.btn-prev:hover:not(:disabled) { border-color: rgba(240,234,224,0.35); color: rgba(240,234,224,0.75); }
.btn-save-step {
  background: transparent; border-color: rgba(201,169,110,0.35); color: rgba(201,169,110,0.75);
}
.btn-save-step:hover:not(:disabled) { background: rgba(201,169,110,0.08); border-color: rgba(201,169,110,0.60); color: #C9A96E; }
.btn-next {
  background: rgba(201,169,110,0.14); border-color: rgba(201,169,110,0.50); color: #C9A96E;
}
.btn-next:hover:not(:disabled) { background: rgba(201,169,110,0.22); }
.btn-submit-final {
  background: rgba(110,207,169,0.14); border-color: rgba(110,207,169,0.45); color: #6ECFA9;
}
.btn-submit-final:hover:not(:disabled) { background: rgba(110,207,169,0.22); }
.btn-prev:disabled, .btn-next:disabled, .btn-save-step:disabled, .btn-submit-final:disabled {
  opacity: .45; cursor: not-allowed;
}

/* Spinner */
.spinner-sm {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.15);
  border-top-color: currentColor; border-radius: 50%; animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── View modal ── */
.view-body { display: flex; flex-direction: column; gap: 0; }
.view-hero {
  display: flex; align-items: center; gap: 16px;
  padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid rgba(201,169,110,0.12);
}
.view-avatar {
  width: 64px; height: 64px; border-radius: 50%; object-fit: cover;
  border: 1px solid rgba(201,169,110,0.30); flex-shrink: 0;
}
.view-avatar-placeholder {
  width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(201,169,110,0.08); border: 1px solid rgba(201,169,110,0.20);
  color: rgba(201,169,110,0.35);
}
.view-hero-info { display: flex; flex-direction: column; gap: 6px; }
.view-hero-name { font-size: 18px; font-weight: 600; color: #F0EAE0; margin: 0; }
.view-hero-emp-id { font-size: 11px; color: rgba(201,169,110,0.70); letter-spacing: .06em; }
.card-status {
  font-size: 10px; font-weight: 500; letter-spacing: .07em; text-transform: uppercase;
  padding: 3px 9px; border: 1px solid; display: inline-block;
}
.status-active   { color: #6ECFA9; border-color: rgba(110,207,169,0.35); background: rgba(110,207,169,0.08); }
.status-inactive { color: rgba(240,234,224,0.35); border-color: rgba(240,234,224,0.15); }

.view-sections { display: flex; flex-direction: column; gap: 20px; }
.view-section  { display: flex; flex-direction: column; gap: 10px; }
.view-section-title {
  font-size: 10px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
  color: rgba(201,169,110,0.65); padding-bottom: 8px; border-bottom: 1px solid rgba(201,169,110,0.12);
}
.view-grid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.view-field { display: flex; flex-direction: column; gap: 4px; }
.view-label { font-size: 10px; letter-spacing: .07em; text-transform: uppercase; color: rgba(240,234,224,0.30); }
.view-value { font-size: 13px; color: rgba(240,234,224,0.80); }
.view-contact-row {
  display: flex; align-items: center; gap: 20px;
  padding: 8px 12px; background: rgba(255,255,255,0.025); border: 1px solid rgba(201,169,110,0.12);
}

/* Table layout */
:deep(table) { table-layout: auto; width: 100%; }
:deep(td .cell-text) { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
:deep(td .cell-actions) { white-space: nowrap; overflow: visible; }

/* ── View modal tabs ── */
.emp-view-tabs {
  display: flex; border-bottom: 1px solid rgba(201,169,110,0.15);
  flex-shrink: 0; padding: 0 28px;
}
.emp-view-tab {
  padding: 11px 20px; font-size: 11px; font-weight: 500; letter-spacing: .06em;
  text-transform: uppercase; background: transparent; border: none;
  color: rgba(240,234,224,0.38); cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color .13s, border-color .13s; white-space: nowrap;
}
.emp-view-tab:hover { color: rgba(240,234,224,0.70); }
.emp-view-tab--active { color: #C9A96E !important; border-bottom-color: #C9A96E !important; }

/* ── Leave Policy Assignment panel ── */
.lpa-panel { display: flex; flex-direction: column; gap: 14px; }
.lpa-head  { display: flex; align-items: center; justify-content: space-between; }
.lpa-count { font-size: 12px; color: rgba(240,234,224,0.40); letter-spacing: .04em; }
.lpa-btn-add {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.35);
  color: #C9A96E; font-size: 11px; font-weight: 500; letter-spacing: .06em;
  text-transform: uppercase; cursor: pointer; transition: all .14s;
}
.lpa-btn-add:hover { background: rgba(201,169,110,0.18); }

.lpa-notif {
  padding: 9px 14px; font-size: 12px; letter-spacing: .03em;
}
.lpa-notif--success { background: rgba(110,207,169,0.12); color: #6ECFA9; border: 1px solid rgba(110,207,169,0.22); }
.lpa-notif--error   { background: rgba(239,107,107,0.12); color: #EF6B6B; border: 1px solid rgba(239,107,107,0.22); }

.lpa-form {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(201,169,110,0.18);
  padding: 16px; animation: fadeIn .18s ease;
}
.lpa-form-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 12px;
}
.lpa-form-actions { display: flex; justify-content: flex-end; gap: 10px; }
.lpa-btn-cancel {
  padding: 7px 16px; background: transparent; border: 1px solid rgba(240,234,224,0.15);
  color: rgba(240,234,224,0.45); font-size: 11px; cursor: pointer; letter-spacing: .05em; transition: all .13s;
}
.lpa-btn-cancel:hover { border-color: rgba(240,234,224,0.35); color: rgba(240,234,224,0.70); }
.lpa-btn-save {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 20px; background: rgba(201,169,110,0.14); border: 1px solid rgba(201,169,110,0.45);
  color: #C9A96E; font-size: 11px; font-weight: 500; letter-spacing: .06em;
  text-transform: uppercase; cursor: pointer; transition: all .14s;
}
.lpa-btn-save:hover:not(:disabled) { background: rgba(201,169,110,0.22); }
.lpa-btn-save:disabled { opacity: .5; cursor: not-allowed; }

.lpa-loading { display: flex; justify-content: center; padding: 30px 0; }
.lpa-empty   { text-align: center; padding: 40px 0; color: rgba(240,234,224,0.25); font-size: 13px; }

.lpa-table-wrap { overflow-x: auto; }
.lpa-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.lpa-table th {
  padding: 9px 12px; text-align: left; font-size: 10px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase; color: rgba(240,234,224,0.35);
  border-bottom: 1px solid rgba(201,169,110,0.15);
}
.lpa-table td {
  padding: 10px 12px; color: rgba(240,234,224,0.65); font-size: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.lpa-table tr:last-child td { border-bottom: none; }
.lpa-table tr:hover td { background: rgba(255,255,255,0.025); }
.lpa-policy-badge {
  display: inline-block; padding: 2px 9px; font-size: 10px; font-weight: 500;
  letter-spacing: .05em; text-transform: uppercase;
  background: rgba(201,169,110,0.08); border: 1px solid rgba(201,169,110,0.25); color: #C9A96E;
}
.lpa-actions { white-space: nowrap; }
.lpa-btn-edit, .lpa-btn-delete {
  padding: 4px 10px; font-size: 10px; font-weight: 500; letter-spacing: .05em;
  text-transform: uppercase; background: transparent; border: 1px solid;
  cursor: pointer; margin-right: 5px; transition: all .13s;
}
.lpa-btn-edit   { color: rgba(201,169,110,0.70); border-color: rgba(201,169,110,0.30); }
.lpa-btn-edit:hover   { background: rgba(201,169,110,0.10); color: #C9A96E; }
.lpa-btn-delete { color: rgba(239,107,107,0.60); border-color: rgba(239,107,107,0.25); }
.lpa-btn-delete:hover { background: rgba(239,107,107,0.10); color: #EF6B6B; }

.lpa-type-badge {
  display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: 500;
  letter-spacing: .05em; text-transform: uppercase;
  background: rgba(133,183,235,0.08); border: 1px solid rgba(133,183,235,0.25);
  color: rgba(133,183,235,0.80); white-space: nowrap;
}
.lpa-badge-yes {
  font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
  color: #6ECFA9; padding: 2px 7px; border: 1px solid rgba(110,207,169,0.35);
  background: rgba(110,207,169,0.08);
}
.lpa-badge-no {
  font-size: 10px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  color: rgba(240,234,224,0.35); padding: 2px 7px; border: 1px solid rgba(240,234,224,0.12);
}
</style>