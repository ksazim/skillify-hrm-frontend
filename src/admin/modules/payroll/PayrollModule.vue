<template>
  <CrudLayout
    ref="layoutRef"
    title="Payroll"
    subtitle="Process payroll, manage deductions and download payslips"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading payroll data"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Payroll"
    :has-data="true"
    :notification="notification"
    @retry="loadData"
  >
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
      </svg>
    </template>

    <template #filters>
      <FilterPanel
        title="Search & Filter"
        :fields="filterFields"
        v-model="searchFilters"
        @submit="handleSearch"
        @reset="handleReset"
      />
    </template>

    <!-- ── Tab bar ── -->
    <div class="pr-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="pr-tab"
        :class="{ 'pr-tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="pr-tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge" class="pr-tab-badge">{{ tab.badge }}</span>
      </button>

      <!-- Run Payroll button (admin only) -->
      <div class="pr-tab-spacer"></div>
      <button v-if="isAdminUser" class="pr-run-btn" @click="openRunPayrollModal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        Run Payroll
      </button>
    </div>

    <!-- ════════════════════════════════
         TAB: EMPLOYEE SALARY LIST
    ════════════════════════════════ -->
    <div v-if="activeTab === 'employees'">
      <DataTable
        :data="paginatedEmployees"
        :columns="employeeColumns"
        :actions="employeeActions"
        result-label="employees"
        @action="handleEmployeeAction"
        @sort="handleSort"
      >
        <template #cell-name="{ row }">
          <div class="pr-name-cell">
            <div class="pr-avatar">{{ initials(row.name) }}</div>
            <div>
              <span class="pr-emp-name">{{ row.name }}</span>
              <span class="pr-emp-dept">{{ row.department ?? '—' }}</span>
            </div>
          </div>
        </template>

        <template #cell-basic_salary="{ row }">
          <span class="pr-amount">{{ formatCurrency(row.basic_salary) }}</span>
        </template>

        <template #cell-deductions="{ row }">
          <span class="pr-amount pr-amount--deduct">−{{ formatCurrency(totalDeductions(row)) }}</span>
        </template>

        <template #cell-bonuses="{ row }">
          <span class="pr-amount pr-amount--bonus">+{{ formatCurrency(totalBonuses(row)) }}</span>
        </template>

        <template #cell-net_salary="{ row }">
          <span class="pr-amount pr-amount--net">{{ formatCurrency(netSalary(row)) }}</span>
        </template>

        <template #cell-status="{ row }">
          <span class="pr-status-badge" :class="payStatusClass(row.pay_status)">
            {{ row.pay_status ?? 'Unpaid' }}
          </span>
        </template>
      </DataTable>
    </div>

    <!-- ════════════════════════════════
         TAB: DEDUCTIONS & BONUSES
    ════════════════════════════════ -->
    <div v-if="activeTab === 'adjustments'">
      <div class="pr-adj-toolbar">
        <button v-if="isAdminUser" class="pr-adj-add-btn" @click="openAdjModal('deduction')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Add Deduction
        </button>
        <button v-if="isAdminUser" class="pr-adj-add-btn pr-adj-add-btn--bonus" @click="openAdjModal('bonus')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Add Bonus
        </button>
      </div>

      <DataTable
        :data="paginatedAdjustments"
        :columns="adjustmentColumns"
        :actions="isAdminUser ? adjActions : []"
        result-label="adjustments"
        @action="handleAdjAction"
      >
        <template #cell-type="{ row }">
          <span class="pr-adj-type" :class="row.type === 'bonus' ? 'pr-adj-bonus' : 'pr-adj-deduct'">
            {{ row.type === 'bonus' ? '+ Bonus' : '− Deduction' }}
          </span>
        </template>
        <template #cell-amount="{ row }">
          <span class="pr-amount" :class="row.type === 'bonus' ? 'pr-amount--bonus' : 'pr-amount--deduct'">
            {{ row.type === 'bonus' ? '+' : '−' }}{{ formatCurrency(row.amount) }}
          </span>
        </template>
      </DataTable>
    </div>

    <!-- ════════════════════════════════
         TAB: PAYROLL HISTORY
    ════════════════════════════════ -->
    <div v-if="activeTab === 'history'">
      <DataTable
        :data="paginatedHistory"
        :columns="historyColumns"
        :actions="historyActions"
        result-label="payroll runs"
        @action="handleHistoryAction"
      >
        <template #cell-period="{ row }">
          <div class="pr-period-cell">
            <span class="pr-period-label">{{ row.period_label }}</span>
            <span class="pr-period-sub">{{ row.processed_at ? formatDate(row.processed_at) : '—' }}</span>
          </div>
        </template>
        <template #cell-total_gross="{ row }">
          <span class="pr-amount">{{ formatCurrency(row.total_gross) }}</span>
        </template>
        <template #cell-total_net="{ row }">
          <span class="pr-amount pr-amount--net">{{ formatCurrency(row.total_net) }}</span>
        </template>
        <template #cell-run_status="{ row }">
          <span class="pr-status-badge" :class="runStatusClass(row.run_status)">
            {{ row.run_status }}
          </span>
        </template>
      </DataTable>
    </div>

    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="activePaginationTotal"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50]"
        item-label="records"
        :show-first-last="true"
        :show-labels="false"
        :show-jump-to="false"
        @update:page-size="handlePageSizeChange"
        @page-change="handlePageChange"
      />
    </template>
  </CrudLayout>

  <!-- ══════════════════════════════════════════════════
       RUN PAYROLL MODAL
  ══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showRunModal" class="pr-modal-backdrop" @click.self="showRunModal = false">
      <div class="pr-modal-shell">
        <div class="pr-modal-head">
          <div class="pr-modal-head-left">
            <div class="pr-modal-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div>
              <h2 class="pr-modal-title">Run Payroll</h2>
              <p class="pr-modal-subtitle">Process salary disbursements for the selected period</p>
            </div>
          </div>
          <button class="pr-modal-close" @click="showRunModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>

        <div v-if="runNotif.show" class="pr-modal-notif" :class="'pr-notif-' + runNotif.type">{{ runNotif.message }}</div>

        <div class="pr-modal-body">
          <div class="pr-form-section-title">Payroll Period</div>
          <div class="pr-form-grid">
            <div class="pr-form-field">
              <label class="pr-form-label">Month <span class="pr-req">*</span></label>
              <select v-model="runForm.month" class="pr-form-select">
                <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div class="pr-form-field">
              <label class="pr-form-label">Year <span class="pr-req">*</span></label>
              <select v-model="runForm.year" class="pr-form-select">
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="pr-form-field pr-field-full">
              <label class="pr-form-label">Payment Date <span class="pr-req">*</span></label>
              <input v-model="runForm.payment_date" type="date" class="pr-form-input" />
            </div>
            <div class="pr-form-field pr-field-full">
              <label class="pr-form-label">Notes</label>
              <textarea v-model="runForm.notes" class="pr-form-textarea" rows="2" placeholder="Optional notes about this payroll run…"></textarea>
            </div>
          </div>

          <!-- Summary strip -->
          <div class="pr-run-summary">
            <div class="pr-run-sum-item">
              <span class="pr-run-sum-label">Employees</span>
              <span class="pr-run-sum-val">{{ employees.length }}</span>
            </div>
            <div class="pr-run-sum-divider"></div>
            <div class="pr-run-sum-item">
              <span class="pr-run-sum-label">Total Gross</span>
              <span class="pr-run-sum-val">{{ formatCurrency(totalGross) }}</span>
            </div>
            <div class="pr-run-sum-divider"></div>
            <div class="pr-run-sum-item">
              <span class="pr-run-sum-label">Total Deductions</span>
              <span class="pr-run-sum-val pr-run-sum-deduct">{{ formatCurrency(totalDeductionsAll) }}</span>
            </div>
            <div class="pr-run-sum-divider"></div>
            <div class="pr-run-sum-item">
              <span class="pr-run-sum-label">Total Net</span>
              <span class="pr-run-sum-val pr-run-sum-net">{{ formatCurrency(totalNetAll) }}</span>
            </div>
          </div>

          <div class="pr-run-warning">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            This action will mark all employee salaries as <strong>Paid</strong> for the selected period and generate payslips. This cannot be undone.
          </div>
        </div>

        <div class="pr-modal-foot">
          <button class="pr-btn-cancel" @click="showRunModal = false">Cancel</button>
          <button class="pr-btn-submit pr-btn-run" :disabled="runSaving" @click="submitRunPayroll">
            <span v-if="runSaving" class="pr-spinner-sm"></span>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {{ runSaving ? 'Processing…' : 'Confirm & Run' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ══════════════════════════════════════════════════
       DEDUCTION / BONUS MODAL
  ══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showAdjModal" class="pr-modal-backdrop" @click.self="showAdjModal = false">
      <div class="pr-modal-shell">
        <div class="pr-modal-head">
          <div class="pr-modal-head-left">
            <div class="pr-modal-icon" :class="adjForm.type === 'bonus' ? 'pr-icon-bonus' : 'pr-icon-deduct'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </div>
            <div>
              <h2 class="pr-modal-title">{{ adjEditId ? 'Edit' : 'Add' }} {{ adjForm.type === 'bonus' ? 'Bonus' : 'Deduction' }}</h2>
              <p class="pr-modal-subtitle">{{ adjForm.type === 'bonus' ? 'Add a one-time or recurring bonus' : 'Add a deduction to employee pay' }}</p>
            </div>
          </div>
          <button class="pr-modal-close" @click="showAdjModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>

        <div v-if="adjNotif.show" class="pr-modal-notif" :class="'pr-notif-' + adjNotif.type">{{ adjNotif.message }}</div>

        <div class="pr-modal-body">
          <div class="pr-form-grid">
            <div class="pr-form-field pr-field-full">
              <label class="pr-form-label">Employee <span class="pr-req">*</span></label>
              <select v-model="adjForm.employee_id" class="pr-form-select">
                <option value="">Select employee…</option>
                <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
              </select>
            </div>
            <div class="pr-form-field pr-field-full">
              <label class="pr-form-label">Type <span class="pr-req">*</span></label>
              <div class="pr-type-toggle">
                <button class="pr-type-btn" :class="adjForm.type === 'deduction' ? 'pr-type-btn--active-deduct' : ''" @click="adjForm.type = 'deduction'">Deduction</button>
                <button class="pr-type-btn" :class="adjForm.type === 'bonus' ? 'pr-type-btn--active-bonus' : ''" @click="adjForm.type = 'bonus'">Bonus</button>
              </div>
            </div>
            <div class="pr-form-field">
              <label class="pr-form-label">Label <span class="pr-req">*</span></label>
              <input v-model="adjForm.label" class="pr-form-input" type="text" :placeholder="adjForm.type === 'bonus' ? 'e.g. Performance Bonus' : 'e.g. Tax, Loan'" />
            </div>
            <div class="pr-form-field">
              <label class="pr-form-label">Amount <span class="pr-req">*</span></label>
              <input v-model="adjForm.amount" class="pr-form-input" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
            <div class="pr-form-field">
              <label class="pr-form-label">Effective Month</label>
              <select v-model="adjForm.month" class="pr-form-select">
                <option value="">All months (recurring)</option>
                <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div class="pr-form-field">
              <label class="pr-form-label">Year</label>
              <select v-model="adjForm.year" class="pr-form-select">
                <option value="">—</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="pr-form-field pr-field-full">
              <label class="pr-form-label">Note</label>
              <textarea v-model="adjForm.note" class="pr-form-textarea" rows="2" placeholder="Optional description…"></textarea>
            </div>
          </div>
        </div>

        <div class="pr-modal-foot">
          <button class="pr-btn-cancel" @click="showAdjModal = false">Cancel</button>
          <button class="pr-btn-submit" :class="adjForm.type === 'bonus' ? 'pr-btn-bonus' : 'pr-btn-deduct'" :disabled="adjSaving" @click="submitAdj">
            <span v-if="adjSaving" class="pr-spinner-sm"></span>
            {{ adjSaving ? 'Saving…' : adjEditId ? 'Update' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ══════════════════════════════════════════════════
       EMPLOYEE SALARY DETAIL / EDIT MODAL
  ══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showEmpModal" class="pr-modal-backdrop" @click.self="showEmpModal = false">
      <div class="pr-modal-shell pr-emp-shell">
        <div class="pr-modal-head">
          <div class="pr-modal-head-left">
            <div class="pr-avatar pr-avatar--lg">{{ initials(selectedEmployee?.name) }}</div>
            <div>
              <h2 class="pr-modal-title">{{ selectedEmployee?.name }}</h2>
              <p class="pr-modal-subtitle">{{ selectedEmployee?.department }} · {{ selectedEmployee?.designation ?? 'Employee' }}</p>
            </div>
          </div>
          <button class="pr-modal-close" @click="showEmpModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>

        <div v-if="empNotif.show" class="pr-modal-notif" :class="'pr-notif-' + empNotif.type">{{ empNotif.message }}</div>

        <div class="pr-modal-body">
          <!-- Salary summary -->
          <div class="pr-salary-summary">
            <div class="pr-sal-item">
              <span class="pr-sal-label">Basic Salary</span>
              <span class="pr-sal-val">{{ formatCurrency(selectedEmployee?.basic_salary) }}</span>
            </div>
            <div class="pr-sal-item pr-sal-item--deduct">
              <span class="pr-sal-label">Total Deductions</span>
              <span class="pr-sal-val">−{{ formatCurrency(totalDeductions(selectedEmployee)) }}</span>
            </div>
            <div class="pr-sal-item pr-sal-item--bonus">
              <span class="pr-sal-label">Total Bonuses</span>
              <span class="pr-sal-val">+{{ formatCurrency(totalBonuses(selectedEmployee)) }}</span>
            </div>
            <div class="pr-sal-item pr-sal-item--net">
              <span class="pr-sal-label">Net Salary</span>
              <span class="pr-sal-val">{{ formatCurrency(netSalary(selectedEmployee)) }}</span>
            </div>
          </div>

          <!-- Edit basic salary (admin only) -->
          <template v-if="isAdminUser">
            <div class="pr-form-section-title" style="margin-top:24px">Edit Basic Salary</div>
            <div class="pr-form-grid">
              <div class="pr-form-field pr-field-full">
                <label class="pr-form-label">Basic Salary <span class="pr-req">*</span></label>
                <input v-model="empForm.basic_salary" class="pr-form-input" type="number" min="0" step="0.01" />
              </div>
            </div>
          </template>

          <!-- Adjustments breakdown -->
          <div class="pr-form-section-title" style="margin-top:24px">Adjustments</div>
          <div v-if="employeeAdjustments.length" class="pr-adj-list">
            <div v-for="adj in employeeAdjustments" :key="adj.id" class="pr-adj-row">
              <span class="pr-adj-type" :class="adj.type === 'bonus' ? 'pr-adj-bonus' : 'pr-adj-deduct'">
                {{ adj.type === 'bonus' ? 'Bonus' : 'Deduction' }}
              </span>
              <span class="pr-adj-label">{{ adj.label }}</span>
              <span class="pr-amount" :class="adj.type === 'bonus' ? 'pr-amount--bonus' : 'pr-amount--deduct'">
                {{ adj.type === 'bonus' ? '+' : '−' }}{{ formatCurrency(adj.amount) }}
              </span>
            </div>
          </div>
          <div v-else class="pr-no-adj">No adjustments for this employee.</div>
        </div>

        <div class="pr-modal-foot">
          <button class="pr-btn-cancel" @click="showEmpModal = false">Close</button>
          <button v-if="isAdminUser" class="pr-btn-submit" :disabled="empSaving" @click="submitEmpSalary">
            <span v-if="empSaving" class="pr-spinner-sm"></span>
            {{ empSaving ? 'Saving…' : 'Update Salary' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ══════════════════════════════════════════════════
       PAYSLIP VIEW MODAL
  ══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showPayslipModal" class="pr-modal-backdrop" @click.self="showPayslipModal = false">
      <div class="pr-modal-shell pr-payslip-shell">
        <div class="pr-modal-head">
          <div class="pr-modal-head-left">
            <div class="pr-modal-icon pr-icon-payslip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>
            </div>
            <div>
              <h2 class="pr-modal-title">Payslip</h2>
              <p class="pr-modal-subtitle">{{ payslipData?.employee_name }} · {{ payslipData?.period_label }}</p>
            </div>
          </div>
          <button class="pr-modal-close" @click="showPayslipModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>

        <div class="pr-modal-body">
          <div class="pr-payslip">
            <!-- Header -->
            <div class="pr-payslip-header">
              <div class="pr-payslip-company">
                <span class="pr-payslip-company-name">{{ companyName }}</span>
                <span class="pr-payslip-period">Payslip for {{ payslipData?.period_label }}</span>
              </div>
              <div class="pr-payslip-meta">
                <div class="pr-payslip-meta-row"><span>Employee</span><strong>{{ payslipData?.employee_name }}</strong></div>
                <div class="pr-payslip-meta-row"><span>Department</span><strong>{{ payslipData?.department }}</strong></div>
                <div class="pr-payslip-meta-row"><span>Designation</span><strong>{{ payslipData?.designation ?? '—' }}</strong></div>
                <div class="pr-payslip-meta-row"><span>Payment Date</span><strong>{{ payslipData?.payment_date ? formatDate(payslipData.payment_date) : '—' }}</strong></div>
              </div>
            </div>

            <!-- Earnings -->
            <div class="pr-payslip-section-title">Earnings</div>
            <div class="pr-payslip-table">
              <div class="pr-payslip-row pr-payslip-row--head">
                <span>Description</span><span>Amount</span>
              </div>
              <div class="pr-payslip-row">
                <span>Basic Salary</span>
                <span>{{ formatCurrency(payslipData?.basic_salary) }}</span>
              </div>
              <div v-for="b in payslipData?.bonuses" :key="b.id" class="pr-payslip-row">
                <span>{{ b.label }}</span>
                <span class="pr-amount--bonus">+{{ formatCurrency(b.amount) }}</span>
              </div>
              <div class="pr-payslip-row pr-payslip-row--total">
                <span>Gross Earnings</span>
                <span>{{ formatCurrency(payslipData?.gross) }}</span>
              </div>
            </div>

            <!-- Deductions -->
            <div class="pr-payslip-section-title" style="margin-top:18px">Deductions</div>
            <div class="pr-payslip-table">
              <div class="pr-payslip-row pr-payslip-row--head">
                <span>Description</span><span>Amount</span>
              </div>
              <div v-if="!payslipData?.deductions?.length" class="pr-payslip-row">
                <span style="opacity:.4">No deductions</span><span>—</span>
              </div>
              <div v-for="d in payslipData?.deductions" :key="d.id" class="pr-payslip-row">
                <span>{{ d.label }}</span>
                <span class="pr-amount--deduct">−{{ formatCurrency(d.amount) }}</span>
              </div>
              <div class="pr-payslip-row pr-payslip-row--total">
                <span>Total Deductions</span>
                <span class="pr-amount--deduct">−{{ formatCurrency(payslipData?.total_deductions) }}</span>
              </div>
            </div>

            <!-- Net -->
            <div class="pr-payslip-net">
              <span>Net Pay</span>
              <span class="pr-payslip-net-amount">{{ formatCurrency(payslipData?.net) }}</span>
            </div>
          </div>
        </div>

        <div class="pr-modal-foot">
          <button class="pr-btn-cancel" @click="showPayslipModal = false">Close</button>
          <button class="pr-btn-submit" @click="downloadPayslip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/></svg>
            Download Payslip
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// import { useCrudStore } from '@/store/crud'
import CrudLayout  from '../components/CrudLayout.vue'
import FilterPanel from '../components/FilterComponent.vue'
import DataTable   from '../components/TableComponent.vue'
import Pagination  from '../components/PaginationComponent.vue'

// const crudStore  = useCrudStore()
const baseApi    = process.env.VUE_APP_BASE_API ?? ''
const layoutRef  = ref(null)
const companyName = process.env.VUE_APP_COMPANY_NAME ?? 'Your Company'

// ── Auth ──────────────────────────────────────────────────────────────────────
const authHeader = () => {
  const t = localStorage.getItem('token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

const apiFetch = async (path, options = {}) => {
  const res  = await fetch(`${baseApi}${path}`, {
    ...options,
    headers: { ...authHeader(), ...(options.headers ?? {}) },
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, data }
  return data
}

// ── Current user ──────────────────────────────────────────────────────────────
const currentUser = ref(null)

const loadCurrentUser = async () => {
  try {
    const data = await apiFetch('/user')
    currentUser.value = data.user ?? data
  } catch (e) { console.error(e) }
}

const userRoles = computed(() => {
  const roles = currentUser.value?.roles
  if (!Array.isArray(roles) || !roles.length) return []
  return roles.map(r => (typeof r === 'object' ? r?.name ?? '' : r).toLowerCase())
})

const isAdminUser = computed(() =>
  userRoles.value.some(r => ['admin', 'hr', 'superadmin', 'super_admin'].includes(r))
)

// ── Notification ──────────────────────────────────────────────────────────────
const notification = ref({ show: false, type: 'info', title: '', message: '', autoClose: 0 })
const notify = (type, message, { title = '', autoClose = 3000 } = {}) => {
  if (layoutRef.value?.showBanner) { layoutRef.value.showBanner(type, message, { title, autoClose }); return }
  notification.value = { show: false, type, title, message, autoClose }
  setTimeout(() => { notification.value = { show: true, type, title, message, autoClose } }, 0)
}

// ── State ─────────────────────────────────────────────────────────────────────
const isLoading    = ref(false)
const hasError     = ref(false)
const errorMessage = ref('')

const employees   = ref([])
const adjustments = ref([])
const history     = ref([])

const activeTab   = ref('employees')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortConfig  = ref({ by: 'name', order: 'asc' })
const searchFilters = ref({ search: '', department: '', status: '' })

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = computed(() => [
  { key: 'employees',   label: 'Employee Salaries', badge: employees.value.length || null },
  { key: 'adjustments', label: 'Deductions & Bonuses', badge: adjustments.value.length || null },
  { key: 'history',     label: 'Payroll History', badge: null },
])

// ── Stats ─────────────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: 'Employees',      value: employees.value.length },
  { label: 'Total Gross',    value: formatCurrency(totalGross.value) },
  { label: 'Total Net',      value: formatCurrency(totalNetAll.value) },
  { label: 'Payroll Runs',   value: history.value.length },
])

const totalGross = computed(() =>
  employees.value.reduce((s, e) => s + (Number(e.basic_salary) || 0) + totalBonuses(e), 0)
)
const totalDeductionsAll = computed(() =>
  employees.value.reduce((s, e) => s + totalDeductions(e), 0)
)
const totalNetAll = computed(() =>
  employees.value.reduce((s, e) => s + netSalary(e), 0)
)

const breadcrumbs = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Payroll' },
]

// ── Pagination ────────────────────────────────────────────────────────────────
const filteredEmployees = computed(() => {
  let list = employees.value
  if (searchFilters.value.search) {
    const q = searchFilters.value.search.toLowerCase()
    list = list.filter(e => e.name?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q))
  }
  if (searchFilters.value.department) list = list.filter(e => e.department === searchFilters.value.department)
  if (searchFilters.value.status)     list = list.filter(e => e.pay_status === searchFilters.value.status)
  return list
})

const filteredAdjustments = computed(() => {
  let list = adjustments.value
  if (searchFilters.value.search) {
    const q = searchFilters.value.search.toLowerCase()
    list = list.filter(a => a.label?.toLowerCase().includes(q) || a.employee_name?.toLowerCase().includes(q))
  }
  return list
})

const paginatedEmployees = computed(() => {
  const s = (currentPage.value - 1) * itemsPerPage.value
  return filteredEmployees.value.slice(s, s + itemsPerPage.value)
})

const paginatedAdjustments = computed(() => {
  const s = (currentPage.value - 1) * itemsPerPage.value
  return filteredAdjustments.value.slice(s, s + itemsPerPage.value)
})

const paginatedHistory = computed(() => {
  const s = (currentPage.value - 1) * itemsPerPage.value
  return history.value.slice(s, s + itemsPerPage.value)
})

const activePaginationTotal = computed(() => {
  if (activeTab.value === 'employees')   return filteredEmployees.value.length
  if (activeTab.value === 'adjustments') return filteredAdjustments.value.length
  return history.value.length
})

// ── Salary helpers ────────────────────────────────────────────────────────────
const totalDeductions = (emp) => {
  if (!emp) return 0
  return adjustments.value
    .filter(a => a.employee_id === emp.id && a.type === 'deduction')
    .reduce((s, a) => s + Number(a.amount), 0)
}

const totalBonuses = (emp) => {
  if (!emp) return 0
  return adjustments.value
    .filter(a => a.employee_id === emp.id && a.type === 'bonus')
    .reduce((s, a) => s + Number(a.amount), 0)
}

const netSalary = (emp) => {
  if (!emp) return 0
  return Number(emp.basic_salary || 0) + totalBonuses(emp) - totalDeductions(emp)
}

const employeeAdjustments = computed(() =>
  adjustments.value.filter(a => a.employee_id === selectedEmployee.value?.id)
)

// ── Table columns ─────────────────────────────────────────────────────────────
const employeeColumns = [
  { key: 'name',         label: 'Employee',    type: 'custom', sortable: true,  minWidth: '160px' },
  { key: 'basic_salary', label: 'Basic',       type: 'custom', sortable: true,  minWidth: '110px', align: 'right' },
  { key: 'deductions',   label: 'Deductions',  type: 'custom', sortable: false, minWidth: '110px', align: 'right' },
  { key: 'bonuses',      label: 'Bonuses',     type: 'custom', sortable: false, minWidth: '100px', align: 'right' },
  { key: 'net_salary',   label: 'Net Pay',     type: 'custom', sortable: false, minWidth: '120px', align: 'right' },
  { key: 'status',       label: 'Status',      type: 'custom', sortable: false, minWidth: '90px',  align: 'center' },
  { key: 'actions',      label: 'Actions',     type: 'actions',sortable: false, minWidth: '160px', align: 'center' },
]

const employeeActions = computed(() => [
  { name: 'view',     label: 'View',     class: 'btn-view' },
  ...(isAdminUser.value ? [{ name: 'edit', label: 'Edit Salary', class: 'btn-edit' }] : []),
  { name: 'payslip',  label: 'Payslip',  class: 'btn-payslip' },
])

const adjustmentColumns = [
  { key: 'employee_name', label: 'Employee',  sortable: true,  minWidth: '140px' },
  { key: 'type',          label: 'Type',      type: 'custom',  sortable: true,  minWidth: '110px' },
  { key: 'label',         label: 'Label',     sortable: false, minWidth: '140px' },
  { key: 'amount',        label: 'Amount',    type: 'custom',  sortable: true,  minWidth: '110px', align: 'right' },
  { key: 'month',         label: 'Month',     sortable: false, minWidth: '80px' },
  { key: 'note',          label: 'Note',      sortable: false, minWidth: '140px' },
  { key: 'actions',       label: 'Actions',   type: 'actions', sortable: false, minWidth: '120px', align: 'center' },
]

const adjActions = [
  { name: 'edit',   label: 'Edit',   class: 'btn-edit'   },
  { name: 'delete', label: 'Delete', class: 'btn-delete' },
]

const historyColumns = [
  { key: 'period',      label: 'Period',       type: 'custom', sortable: true,  minWidth: '140px' },
  { key: 'employees_count', label: 'Employees',sortable: false, minWidth: '90px', align: 'center' },
  { key: 'total_gross', label: 'Gross',        type: 'custom', sortable: false, minWidth: '120px', align: 'right' },
  { key: 'total_net',   label: 'Net',          type: 'custom', sortable: false, minWidth: '120px', align: 'right' },
  { key: 'run_status',  label: 'Status',       type: 'custom', sortable: false, minWidth: '100px', align: 'center' },
  { key: 'actions',     label: 'Actions',      type: 'actions',sortable: false, minWidth: '140px', align: 'center' },
]

const historyActions = [
  { name: 'view_run', label: 'View',     class: 'btn-view' },
  { name: 'download', label: 'Download', class: 'btn-payslip' },
]

// ── Filter fields ─────────────────────────────────────────────────────────────
const filterFields = computed(() => [
  { name: 'search', label: 'Search', type: 'text', placeholder: 'Name, department…' },
  {
    name: 'status', label: 'Pay Status', type: 'select', placeholder: 'All',
    options: [
      { value: 'Paid',   label: 'Paid'   },
      { value: 'Unpaid', label: 'Unpaid' },
    ],
  },
])

// ── Run Payroll modal ─────────────────────────────────────────────────────────
const showRunModal = ref(false)
const runSaving    = ref(false)
const runNotif     = ref({ show: false, type: 'success', message: '' })
const runForm      = ref({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), payment_date: '', notes: '' })

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' },   { value: 5, label: 'May' },       { value: 6, label: 'June' },
  { value: 7, label: 'July' },    { value: 8, label: 'August' },    { value: 9, label: 'September' },
  { value: 10, label: 'October' },{ value: 11, label: 'November' }, { value: 12, label: 'December' },
]
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

const openRunPayrollModal = () => {
  runForm.value = { month: new Date().getMonth() + 1, year: currentYear, payment_date: '', notes: '' }
  runNotif.value.show = false
  showRunModal.value  = true
}

const submitRunPayroll = async () => {
  if (!runForm.value.payment_date) {
    runNotif.value = { show: true, type: 'error', message: 'Payment date is required.' }; return
  }
  runSaving.value = true
  try {
    await apiFetch('/payroll/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runForm.value),
    })
    showRunModal.value = false
    notify('success', 'Payroll processed successfully.', { autoClose: 4000 })
    await loadData()
  } catch (e) {
    const msg = e?.data?.message || 'Failed to process payroll.'
    runNotif.value = { show: true, type: 'error', message: msg }
  } finally {
    runSaving.value = false
  }
}

// ── Adjustment modal ──────────────────────────────────────────────────────────
const showAdjModal = ref(false)
const adjSaving    = ref(false)
const adjEditId    = ref(null)
const adjNotif     = ref({ show: false, type: 'success', message: '' })
const defaultAdj   = () => ({ employee_id: '', type: 'deduction', label: '', amount: '', month: '', year: currentYear, note: '' })
const adjForm      = ref(defaultAdj())

const openAdjModal = (type = 'deduction', item = null) => {
  adjEditId.value = item?.id ?? null
  adjForm.value   = item
    ? { employee_id: item.employee_id, type: item.type, label: item.label, amount: item.amount, month: item.month ?? '', year: item.year ?? currentYear, note: item.note ?? '' }
    : { ...defaultAdj(), type }
  adjNotif.value.show = false
  showAdjModal.value  = true
}

const submitAdj = async () => {
  if (!adjForm.value.employee_id || !adjForm.value.label || !adjForm.value.amount) {
    adjNotif.value = { show: true, type: 'error', message: 'Employee, label and amount are required.' }; return
  }
  adjSaving.value = true
  try {
    const method   = adjEditId.value ? 'PUT' : 'POST'
    const endpoint = adjEditId.value ? `/payroll/adjustments/${adjEditId.value}` : '/payroll/adjustments'
    await apiFetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjForm.value),
    })
    showAdjModal.value = false
    notify('success', `${adjForm.value.type === 'bonus' ? 'Bonus' : 'Deduction'} saved.`, { autoClose: 3000 })
    await loadData()
  } catch (e) {
    adjNotif.value = { show: true, type: 'error', message: e?.data?.message || 'Save failed.' }
  } finally {
    adjSaving.value = false
  }
}

const handleAdjAction = ({ action, row }) => {
  if (action === 'edit')   openAdjModal(row.type, row)
  if (action === 'delete') deleteAdj(row)
}

const deleteAdj = async (row) => {
  if (!confirm(`Delete this ${row.type}?`)) return
  try {
    await apiFetch(`/payroll/adjustments/${row.id}`, { method: 'DELETE' })
    notify('success', 'Adjustment deleted.', { autoClose: 3000 })
    await loadData()
  } catch {
    notify('error', 'Delete failed.')
  }
}

// ── Employee salary modal ─────────────────────────────────────────────────────
const showEmpModal    = ref(false)
const empSaving       = ref(false)
const selectedEmployee = ref(null)
const empNotif        = ref({ show: false, type: 'success', message: '' })
const empForm         = ref({ basic_salary: '' })

const openEmpModal = (emp) => {
  selectedEmployee.value = emp
  empForm.value = { basic_salary: emp.basic_salary }
  empNotif.value.show = false
  showEmpModal.value  = true
}

const submitEmpSalary = async () => {
  empSaving.value = true
  try {
    await apiFetch(`/payroll/employees/${selectedEmployee.value.id}/salary`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ basic_salary: empForm.value.basic_salary }),
    })
    showEmpModal.value = false
    notify('success', 'Salary updated.', { autoClose: 3000 })
    await loadData()
  } catch (e) {
    empNotif.value = { show: true, type: 'error', message: e?.data?.message || 'Update failed.' }
  } finally {
    empSaving.value = false
  }
}

// ── Payslip modal ─────────────────────────────────────────────────────────────
const showPayslipModal = ref(false)
const payslipData      = ref(null)

const openPayslip = async (emp) => {
  try {
    const data = await apiFetch(`/payroll/employees/${emp.id}/payslip`)
    payslipData.value = {
      employee_name:    emp.name,
      department:       emp.department,
      designation:      emp.designation,
      period_label:     `${months.find(m => m.value === (new Date().getMonth() + 1))?.label} ${currentYear}`,
      payment_date:     data.payment_date ?? null,
      basic_salary:     Number(emp.basic_salary || 0),
      bonuses:          adjustments.value.filter(a => a.employee_id === emp.id && a.type === 'bonus'),
      deductions:       adjustments.value.filter(a => a.employee_id === emp.id && a.type === 'deduction'),
      gross:            Number(emp.basic_salary || 0) + totalBonuses(emp),
      total_deductions: totalDeductions(emp),
      net:              netSalary(emp),
      ...(data.payslip ?? {}),
    }
    showPayslipModal.value = true
  } catch {
    // Fallback: build from local data
    payslipData.value = {
      employee_name:    emp.name,
      department:       emp.department,
      designation:      emp.designation,
      period_label:     `${months.find(m => m.value === (new Date().getMonth() + 1))?.label} ${currentYear}`,
      payment_date:     null,
      basic_salary:     Number(emp.basic_salary || 0),
      bonuses:          adjustments.value.filter(a => a.employee_id === emp.id && a.type === 'bonus'),
      deductions:       adjustments.value.filter(a => a.employee_id === emp.id && a.type === 'deduction'),
      gross:            Number(emp.basic_salary || 0) + totalBonuses(emp),
      total_deductions: totalDeductions(emp),
      net:              netSalary(emp),
    }
    showPayslipModal.value = true
  }
}

const openHistoryPayslip = async (run) => {
  try {
    const data = await apiFetch(`/payroll/history/${run.id}/payslip`)
    payslipData.value = { ...data, period_label: run.period_label }
    showPayslipModal.value = true
  } catch {
    notify('error', 'Could not load payslip.')
  }
}

const downloadPayslip = async () => {
  const emp = selectedEmployee.value
  if (!emp?.id) { notify('error', 'No employee selected.'); return }
  try {
    const token = localStorage.getItem('token')
    const res   = await fetch(`${baseApi}/payroll/employees/${emp.id}/payslip/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error()
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `payslip-${emp.name}-${payslipData.value?.period_label ?? 'current'}.pdf`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  } catch {
    notify('error', 'Could not download payslip. Try again.')
  }
}

// ── Action handlers ───────────────────────────────────────────────────────────
const handleEmployeeAction = ({ action, row }) => {
  if (action === 'view')    openEmpModal(row)
  if (action === 'edit')    openEmpModal(row)
  if (action === 'payslip') openPayslip(row)
}

const handleHistoryAction = ({ action, row }) => {
  if (action === 'view_run') openHistoryPayslip(row)
  if (action === 'download') openHistoryPayslip(row)
}

// ── Data loading ──────────────────────────────────────────────────────────────
const loadData = async () => {
  isLoading.value = true
  hasError.value  = false
  try {
    const [empRes, adjRes, histRes] = await Promise.all([
      apiFetch('/payroll/employees'),
      apiFetch('/payroll/adjustments'),
      apiFetch('/payroll/history'),
    ])
    employees.value   = empRes.data ?? empRes ?? []
    adjustments.value = adjRes.data ?? adjRes ?? []
    history.value     = histRes.data ?? histRes ?? []
  } catch (e) {
    hasError.value  = true
    errorMessage.value = e?.data?.message || 'Failed to load payroll data.'
    notify('error', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val) || 0)

const formatDate = (d) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const initials = (name) =>
  (name ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

const payStatusClass = (s) => ({
  'Paid':    'pr-status-paid',
  'Unpaid':  'pr-status-unpaid',
  'Pending': 'pr-status-pending',
}[s] ?? 'pr-status-unpaid')

const runStatusClass = (s) => ({
  'completed': 'pr-status-paid',
  'draft':     'pr-status-pending',
  'failed':    'pr-status-unpaid',
}[s?.toLowerCase()] ?? 'pr-status-pending')

const handleSearch         = () => { currentPage.value = 1 }
const handleReset          = () => { searchFilters.value = { search: '', department: '', status: '' }; currentPage.value = 1 }
const handleSort           = (s) => { sortConfig.value = s }
const handlePageChange     = (p) => { currentPage.value = p }
const handlePageSizeChange = (ps) => { itemsPerPage.value = ps; currentPage.value = 1 }

onMounted(async () => {
  await loadCurrentUser()
  await loadData()
})
</script>

<style scoped>
/* ── Design tokens (same as leave management) ── */
.pr-tabs, .pr-modal-shell, .pr-payslip, .pr-salary-summary,
.pr-form-grid, .pr-adj-toolbar, .pr-run-summary {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.08);
  --onyx:           #0D0D0F;
  --onyx-2:         #131316;
  --onyx-3:         #1A1A1F;
  --onyx-4:         #222228;
  --text-primary:   #F0EAE0;
  --text-secondary: rgba(240,234,224,0.55);
  --text-muted:     rgba(240,234,224,0.28);
  --border:         rgba(201,169,110,0.12);
  --border-strong:  rgba(201,169,110,0.28);
  font-family: 'Jost', 'Inter', sans-serif;
}

/* ── Tab bar ── */
.pr-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  border-bottom: 1px solid rgba(201,169,110,0.15);
  margin-bottom: 20px;
  padding-bottom: 0;
}
.pr-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: rgba(240,234,224,0.38);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .05em;
  cursor: pointer;
  transition: color .14s, border-color .14s;
  margin-bottom: -1px;
  white-space: nowrap;
}
.pr-tab:hover { color: rgba(240,234,224,0.65); }
.pr-tab--active { color: #C9A96E; border-bottom-color: #C9A96E; }
.pr-tab-label { }
.pr-tab-badge {
  display: inline-block;
  padding: 1px 6px;
  font-size: 10px;
  background: rgba(201,169,110,0.12);
  border: 1px solid rgba(201,169,110,0.25);
  color: rgba(201,169,110,0.75);
  min-width: 20px;
  text-align: center;
}
.pr-tab-spacer { flex: 1; }

.pr-run-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  background: rgba(201,169,110,0.14);
  border: 1px solid rgba(201,169,110,0.50);
  color: #C9A96E;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .07em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .14s;
  margin-bottom: 1px;
}
.pr-run-btn:hover { background: rgba(201,169,110,0.24); }

/* ── Adj toolbar ── */
.pr-adj-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.pr-adj-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .14s;
  background: rgba(239,107,107,0.10);
  border: 1px solid rgba(239,107,107,0.35);
  color: #EF6B6B;
}
.pr-adj-add-btn:hover { background: rgba(239,107,107,0.18); }
.pr-adj-add-btn--bonus {
  background: rgba(110,207,169,0.10);
  border-color: rgba(110,207,169,0.35);
  color: #6ECFA9;
}
.pr-adj-add-btn--bonus:hover { background: rgba(110,207,169,0.18); }

/* ── Cell components ── */
.pr-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pr-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(201,169,110,0.15);
  border: 1px solid rgba(201,169,110,0.30);
  color: #C9A96E;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pr-avatar--lg { width: 40px; height: 40px; font-size: 13px; }

.pr-emp-name { display: block; font-size: 12px; color: #E8D5B0; font-weight: 500; }
.pr-emp-dept { display: block; font-size: 10px; color: rgba(240,234,224,0.35); margin-top: 1px; }

.pr-amount { font-size: 12px; font-weight: 600; font-family: 'Georgia', serif; color: rgba(240,234,224,0.75); }
.pr-amount--deduct { color: #EF6B6B; }
.pr-amount--bonus  { color: #6ECFA9; }
.pr-amount--net    { color: #C9A96E; font-size: 13px; }

.pr-status-badge {
  display: inline-block;
  padding: 3px 9px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .07em;
  text-transform: uppercase;
  border: 1px solid;
}
.pr-status-paid    { color: #6ECFA9; border-color: rgba(110,207,169,0.35); background: rgba(110,207,169,0.08); }
.pr-status-unpaid  { color: #EF6B6B; border-color: rgba(239,107,107,0.35); background: rgba(239,107,107,0.08); }
.pr-status-pending { color: #E8B84B; border-color: rgba(232,184,75,0.35);  background: rgba(232,184,75,0.08);  }

.pr-adj-type {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  border: 1px solid;
}
.pr-adj-bonus  { color: #6ECFA9; border-color: rgba(110,207,169,0.35); background: rgba(110,207,169,0.08); }
.pr-adj-deduct { color: #EF6B6B; border-color: rgba(239,107,107,0.35); background: rgba(239,107,107,0.08); }

.pr-period-cell  { display: flex; flex-direction: column; gap: 3px; }
.pr-period-label { font-size: 12px; color: #E8D5B0; font-weight: 500; }
.pr-period-sub   { font-size: 10px; color: rgba(240,234,224,0.35); }

/* ── Deep table overrides ── */
:deep(table) { table-layout: auto; width: 100%; }
:deep(.action-btn.btn-payslip),
:deep(.action-btn.action-btn--btn-payslip) {
  color: #85B7EB !important;
  border-color: rgba(133,183,235,0.35) !important;
  background: rgba(133,183,235,0.08) !important;
}
:deep(.action-btn.btn-payslip:hover:not(:disabled)),
:deep(.action-btn.action-btn--btn-payslip:hover:not(:disabled)) {
  background: rgba(133,183,235,0.18) !important;
  border-color: #85B7EB !important;
}

/* ══════════════════════════════════════════════════
   MODAL BASE
══════════════════════════════════════════════════ */
.pr-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 40px 16px; z-index: 9999; overflow-y: auto;
}
.pr-modal-shell {
  background: #17171D;
  border: 1px solid rgba(201,169,110,0.25);
  width: 100%; max-width: 620px;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.65);
}
.pr-emp-shell     { max-width: 560px; }
.pr-payslip-shell { max-width: 580px; }

.pr-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 26px 16px; border-bottom: 1px solid rgba(201,169,110,0.15); flex-shrink: 0;
}
.pr-modal-head-left { display: flex; align-items: center; gap: 12px; }
.pr-modal-icon {
  width: 36px; height: 36px; flex-shrink: 0;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.28);
  display: flex; align-items: center; justify-content: center; color: #C9A96E;
}
.pr-icon-bonus   { background: rgba(110,207,169,0.10) !important; border-color: rgba(110,207,169,0.35) !important; color: #6ECFA9 !important; }
.pr-icon-deduct  { background: rgba(239,107,107,0.10) !important; border-color: rgba(239,107,107,0.35) !important; color: #EF6B6B !important; }
.pr-icon-payslip { background: rgba(133,183,235,0.10) !important; border-color: rgba(133,183,235,0.28) !important; color: rgba(133,183,235,0.85) !important; }

.pr-modal-title    { font-size: 15px; font-weight: 600; color: #F0EAE0; margin: 0; }
.pr-modal-subtitle { font-size: 11px; color: rgba(240,234,224,0.38); margin: 3px 0 0; }
.pr-modal-close {
  width: 30px; height: 30px; background: transparent;
  border: 1px solid rgba(240,234,224,0.12); color: rgba(240,234,224,0.40);
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .13s;
}
.pr-modal-close:hover { border-color: rgba(240,234,224,0.28); color: #F0EAE0; }
.pr-modal-close svg { width: 13px; height: 13px; }

.pr-modal-notif { padding: 10px 26px; font-size: 12px; flex-shrink: 0; }
.pr-notif-success { background: rgba(110,207,169,0.12); color: #6ECFA9; border-bottom: 1px solid rgba(110,207,169,0.20); }
.pr-notif-error   { background: rgba(239,107,107,0.12); color: #EF6B6B; border-bottom: 1px solid rgba(239,107,107,0.20); }

.pr-modal-body { padding: 24px 26px; overflow-y: auto; max-height: calc(100vh - 220px); }
.pr-modal-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 26px; border-top: 1px solid rgba(201,169,110,0.12); flex-shrink: 0;
}

/* ── Buttons ── */
.pr-btn-cancel {
  padding: 9px 20px; background: transparent; border: 1px solid rgba(240,234,224,0.15);
  color: rgba(240,234,224,0.50); font-size: 12px; cursor: pointer; letter-spacing: .05em; transition: all .13s;
}
.pr-btn-cancel:hover { border-color: rgba(240,234,224,0.30); color: rgba(240,234,224,0.75); }
.pr-btn-submit {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 22px; background: rgba(201,169,110,0.14); border: 1px solid rgba(201,169,110,0.50);
  color: #C9A96E; font-size: 12px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  cursor: pointer; transition: all .14s;
}
.pr-btn-submit:hover:not(:disabled) { background: rgba(201,169,110,0.24); }
.pr-btn-submit:disabled { opacity: .45; cursor: not-allowed; }
.pr-btn-run   { background: rgba(201,169,110,0.18) !important; border-color: rgba(201,169,110,0.60) !important; }
.pr-btn-bonus { background: rgba(110,207,169,0.12) !important; border-color: rgba(110,207,169,0.45) !important; color: #6ECFA9 !important; }
.pr-btn-deduct{ background: rgba(239,107,107,0.12) !important; border-color: rgba(239,107,107,0.45) !important; color: #EF6B6B !important; }

/* ── Form fields ── */
.pr-form-section-title {
  font-size: 10px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
  color: rgba(201,169,110,0.70); padding-bottom: 10px;
  border-bottom: 1px solid rgba(201,169,110,0.15); margin-bottom: 18px;
}
.pr-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.pr-form-field { display: flex; flex-direction: column; gap: 6px; }
.pr-field-full { grid-column: 1 / -1; }
.pr-form-label {
  font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
  color: rgba(240,234,224,0.45);
}
.pr-req { color: rgba(239,107,107,0.80); }
.pr-form-input, .pr-form-select, .pr-form-textarea {
  background: rgba(18,18,24,0.98); border: 1px solid rgba(201,169,110,0.22);
  color: #F0EAE0; font-size: 13px; padding: 10px 13px; outline: none;
  font-family: inherit; transition: border-color .14s; box-sizing: border-box; width: 100%;
}
.pr-form-input:focus, .pr-form-select:focus, .pr-form-textarea:focus { border-color: rgba(201,169,110,0.55); }
.pr-form-textarea { resize: vertical; min-height: 60px; }
.pr-form-select {
  cursor: pointer; appearance: none; padding-right: 30px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(201,169,110,0.55)'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; background-color: rgba(18,18,24,0.98);
}
.pr-form-select option { background: #17171D; color: #F0EAE0; }

/* ── Type toggle ── */
.pr-type-toggle { display: flex; }
.pr-type-btn {
  flex: 1; padding: 9px 16px; background: transparent;
  border: 1px solid rgba(201,169,110,0.18); color: rgba(240,234,224,0.35);
  font-size: 12px; font-weight: 500; cursor: pointer; transition: all .13s;
}
.pr-type-btn:first-child { border-right: none; }
.pr-type-btn--active-deduct {
  background: rgba(239,107,107,0.12); border-color: rgba(239,107,107,0.40); color: #EF6B6B;
}
.pr-type-btn--active-bonus {
  background: rgba(110,207,169,0.12); border-color: rgba(110,207,169,0.40); color: #6ECFA9;
}

/* ── Run payroll summary strip ── */
.pr-run-summary {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0;
  margin: 20px 0 16px;
  border: 1px solid rgba(201,169,110,0.15);
  background: rgba(201,169,110,0.04);
}
.pr-run-sum-item { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
.pr-run-sum-divider { width: 1px; background: rgba(201,169,110,0.12); align-self: stretch; }
.pr-run-sum-label { font-size: 10px; letter-spacing: .07em; text-transform: uppercase; color: rgba(240,234,224,0.28); }
.pr-run-sum-val   { font-size: 15px; font-weight: 600; color: rgba(240,234,224,0.80); font-family: 'Georgia', serif; }
.pr-run-sum-deduct { color: #EF6B6B; }
.pr-run-sum-net    { color: #C9A96E; }

.pr-run-warning {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 14px;
  background: rgba(232,184,75,0.06); border: 1px solid rgba(232,184,75,0.18);
  color: rgba(232,184,75,0.70); font-size: 11px; line-height: 1.5;
}
.pr-run-warning svg { flex-shrink: 0; margin-top: 1px; color: rgba(232,184,75,0.70); }
.pr-run-warning strong { color: rgba(232,184,75,0.95); }

/* ── Salary summary (employee modal) ── */
.pr-salary-summary {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 0;
  border: 1px solid rgba(201,169,110,0.15); overflow: hidden;
}
.pr-sal-item {
  display: flex; flex-direction: column; gap: 5px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(201,169,110,0.08);
  border-right: 1px solid rgba(201,169,110,0.08);
}
.pr-sal-item:nth-child(even) { border-right: none; }
.pr-sal-item--net { background: rgba(201,169,110,0.05); }
.pr-sal-label { font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: rgba(240,234,224,0.30); }
.pr-sal-val   { font-size: 16px; font-weight: 600; font-family: 'Georgia', serif; color: rgba(240,234,224,0.80); }
.pr-sal-item--deduct .pr-sal-val { color: #EF6B6B; }
.pr-sal-item--bonus  .pr-sal-val { color: #6ECFA9; }
.pr-sal-item--net    .pr-sal-val { color: #C9A96E; font-size: 18px; }

/* ── Adj list in employee modal ── */
.pr-adj-list { display: flex; flex-direction: column; gap: 0; border: 1px solid rgba(201,169,110,0.12); }
.pr-adj-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-bottom: 1px solid rgba(201,169,110,0.08);
}
.pr-adj-row:last-child { border-bottom: none; }
.pr-adj-label { flex: 1; font-size: 12px; color: rgba(240,234,224,0.65); }
.pr-no-adj { font-size: 12px; color: rgba(240,234,224,0.25); padding: 16px 0; font-style: italic; }

/* ── Payslip ── */
.pr-payslip { background: rgba(255,255,255,0.02); border: 1px solid rgba(201,169,110,0.15); }
.pr-payslip-header {
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  padding: 20px 22px; border-bottom: 2px solid rgba(201,169,110,0.20);
  background: rgba(201,169,110,0.05);
}
.pr-payslip-company { display: flex; flex-direction: column; gap: 4px; }
.pr-payslip-company-name {
  font-size: 16px; font-weight: 600; color: #E8D5B0;
  font-family: 'Cormorant Garamond', 'Georgia', serif; letter-spacing: .04em;
}
.pr-payslip-period { font-size: 11px; color: rgba(201,169,110,0.65); letter-spacing: .06em; text-transform: uppercase; }
.pr-payslip-meta { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.pr-payslip-meta-row { display: flex; gap: 10px; font-size: 11px; }
.pr-payslip-meta-row span { color: rgba(240,234,224,0.35); }
.pr-payslip-meta-row strong { color: rgba(240,234,224,0.75); }

.pr-payslip-section-title {
  font-size: 10px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
  color: rgba(201,169,110,0.60); padding: 12px 22px 8px;
  border-bottom: 1px solid rgba(201,169,110,0.10);
}
.pr-payslip-table { }
.pr-payslip-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 22px; border-bottom: 1px solid rgba(201,169,110,0.06);
  font-size: 12px; color: rgba(240,234,224,0.65);
}
.pr-payslip-row--head {
  background: rgba(201,169,110,0.04);
  font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  color: rgba(240,234,224,0.28);
}
.pr-payslip-row--total {
  background: rgba(201,169,110,0.06);
  font-weight: 600; color: rgba(240,234,224,0.80);
  border-top: 1px solid rgba(201,169,110,0.15);
}
.pr-payslip-net {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 22px;
  background: rgba(201,169,110,0.10); border-top: 2px solid rgba(201,169,110,0.30);
  font-size: 13px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase;
  color: rgba(240,234,224,0.55);
}
.pr-payslip-net-amount {
  font-size: 20px; font-weight: 700; color: #C9A96E;
  font-family: 'Cormorant Garamond', 'Georgia', serif; letter-spacing: .04em;
}

/* ── Spinner ── */
.pr-spinner-sm {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.15);
  border-top-color: currentColor; border-radius: 50%; animation: prspin .6s linear infinite;
}
@keyframes prspin { to { transform: rotate(360deg); } }
</style>