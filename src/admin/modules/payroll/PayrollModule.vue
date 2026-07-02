<template>
  <div class="pm-wrap">

    <!-- ── Page Header ── -->
    <div class="pm-header">
      <div class="pm-header-left">
        <div class="pm-header-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
        </div>
        <div>
          <h1 class="pm-title">Payroll</h1>
          <p class="pm-subtitle">Process payroll, manage deductions and download payslips</p>
        </div>
      </div>
      <button v-if="isAdmin" class="pm-run-btn" @click="openRunModal">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Run Payroll
      </button>
    </div>

    <!-- ── Stats ── -->
    <div class="pm-stats">
      <div class="pm-stat">
        <span class="pm-stat-label">Employees</span>
        <span class="pm-stat-value">{{ payrolls.length }}</span>
      </div>
      <div class="pm-stat">
        <span class="pm-stat-label">Total Gross</span>
        <span class="pm-stat-value">{{ formatCurrency(totalGross) }}</span>
      </div>
      <div class="pm-stat pm-stat--gold">
        <span class="pm-stat-label">Total Net</span>
        <span class="pm-stat-value">{{ formatCurrency(totalNet) }}</span>
      </div>
      <div class="pm-stat">
        <span class="pm-stat-label">Pending</span>
        <span class="pm-stat-value">{{ draftCount }}</span>
      </div>
    </div>

    <!-- ── Tab bar ── -->
    <div class="pm-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="pm-tab"
        :class="{ 'pm-tab--active': activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.badge" class="pm-tab-badge">{{ tab.badge }}</span>
      </button>
      <div class="pm-tab-spacer"></div>
      <div class="pm-search">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="searchQuery" type="text" placeholder="Search…" />
      </div>
    </div>

    <!-- ════ TAB: PAYROLL LIST ════ -->
    <div v-if="activeTab === 'payrolls'">
      <div v-if="isLoading" class="pm-state">
        <span class="pm-spinner"></span> Loading payroll data…
      </div>
      <div v-else-if="hasError" class="pm-state pm-state--error">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
        {{ errorMessage }}
        <button @click="loadPayrolls">Retry</button>
      </div>
      <template v-else>
        <div class="pm-filter-row">
          <div class="pm-filter-tabs">
            <button
              v-for="s in statusFilters"
              :key="s.value"
              class="pm-filter-tab"
              :class="{ 'pm-filter-tab--active': statusFilter === s.value }"
              @click="statusFilter = s.value; currentPage = 1"
            >
              {{ s.label }}
              <span class="pm-filter-count">{{ s.count }}</span>
            </button>
          </div>
          <div class="pm-period-filters">
            <select v-model="selectedMonth" class="pm-select" @change="currentPage = 1">
              <option value="">All Months</option>
              <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
            <select v-model="selectedYear" class="pm-select" @change="currentPage = 1">
              <option value="">All Years</option>
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>

        <div class="pm-table-wrap">
          <table class="pm-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th class="ta-r">Gross</th>
                <th class="ta-r">Deductions</th>
                <th class="ta-r">Overtime / Bonus</th>
                <th class="ta-r">Net Pay</th>
                <th class="ta-c">Status</th>
                <th class="ta-c">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedPayrolls.length === 0">
                <td colspan="8">
                  <div class="pm-empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                    <span>No payroll records found</span>
                  </div>
                </td>
              </tr>
              <tr
                v-for="row in paginatedPayrolls"
                :key="row.id"
                class="pm-tr"
                @click="openDetail(row)"
              >
                <td>
                  <div class="pm-name-cell">
                    <div class="pm-avatar" :style="{ background: avatarBg(row.employee?.user?.name) }">
                      {{ initials(row.employee?.user?.name) }}
                    </div>
                    <div>
                      <span class="pm-emp-name">{{ row.employee?.user?.name ?? '—' }}</span>
                      <span class="pm-emp-id">#{{ String(row.employee_id).padStart(4, '0') }}</span>
                    </div>
                  </div>
                </td>
                <td><span class="pm-period">{{ monthName(row.month) }} {{ row.year }}</span></td>
                <td class="ta-r pm-mono">{{ formatCurrency(row.gross_salary) }}</td>
                <td class="ta-r pm-mono pm-deduct">−{{ formatCurrency((row.late_deduction || 0) + (row.leave_deduction || 0)) }}</td>
                <td class="ta-r pm-mono pm-bonus">+{{ formatCurrency((row.overtime_amount || 0) + (row.bonus_amount || 0)) }}</td>
                <td class="ta-r pm-mono pm-net">{{ formatCurrency(row.net_salary) }}</td>
                <td class="ta-c">
                  <span class="pm-badge" :class="`pm-badge--${row.status}`">{{ row.status }}</span>
                </td>
                <td class="ta-c" @click.stop>
                  <div class="pm-actions">
                    <button class="pm-act pm-act--view" title="View" @click="openDetail(row)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button
                      class="pm-act pm-act--slip"
                      title="Download Payslip"
                      @click="sharePayslip(row)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button
                      v-if="row.status === 'draft' && isAdmin"
                      class="pm-act pm-act--pay"
                      title="Mark as Paid"
                      @click="confirmMarkPaid(row)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button
                      v-if="row.status !== 'paid' && isAdmin"
                      class="pm-act pm-act--del"
                      title="Delete"
                      @click="confirmDelete(row)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="pm-pagination">
          <button class="pm-page-btn" :disabled="currentPage === 1" @click="currentPage--">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="pm-page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button class="pm-page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </template>
    </div>

    <!-- ════ TAB: HISTORY ════ -->
    <div v-if="activeTab === 'history'">
      <div class="pm-table-wrap">
        <table class="pm-table">
          <thead>
            <tr>
              <th>Period</th>
              <th class="ta-r">Employees</th>
              <th class="ta-r">Total Gross</th>
              <th class="ta-r">Total Net</th>
              <th class="ta-c">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="historyRows.length === 0">
              <td colspan="5">
                <div class="pm-empty">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  <span>No payroll history</span>
                </div>
              </td>
            </tr>
            <tr v-for="row in historyRows" :key="row.period" class="pm-tr">
              <td><span class="pm-period">{{ row.period }}</span></td>
              <td class="ta-r pm-mono">{{ row.count }}</td>
              <td class="ta-r pm-mono">{{ formatCurrency(row.gross) }}</td>
              <td class="ta-r pm-mono pm-net">{{ formatCurrency(row.net) }}</td>
              <td class="ta-c">
                <span class="pm-badge" :class="row.count > 0 ? 'pm-badge--paid' : 'pm-badge--draft'">
                  {{ row.count > 0 ? 'Complete' : 'Empty' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ GENERATE / RUN PAYROLL MODAL ══ -->
    <Teleport to="body">
      <Transition name="pm-modal">
        <div v-if="showRunModal" class="pm-backdrop" @click.self="showRunModal = false">
          <div class="pm-modal">
            <div class="pm-modal-head">
              <div class="pm-modal-head-left">
                <div class="pm-modal-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div>
                  <h2 class="pm-modal-title">Generate Payroll</h2>
                  <p class="pm-modal-sub">Process salary disbursements for the selected period</p>
                </div>
              </div>
              <button class="pm-modal-close" @click="showRunModal = false">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </button>
            </div>
            <div v-if="runNotif.show" class="pm-modal-notif" :class="`pm-notif--${runNotif.type}`">
              {{ runNotif.message }}
            </div>
            <div class="pm-modal-body">
              <!-- Company selector — shown only when no company is pre-selected in store -->
              <template v-if="companyStore.company_id === 0">
                <div class="pm-section-title">Select Company</div>
                <div class="pm-field pm-field--full">
                  <label class="pm-label">Company <span class="pm-req">*</span></label>
                  <select v-model="runForm.company_id" class="pm-control">
                    <option :value="0" disabled>— Choose a company —</option>
                    <option v-for="c in companies" :key="c.value" :value="c.value">{{ c.label }}</option>
                  </select>
                  <span v-if="companiesLoading" class="pm-field-hint">
                    <span class="pm-spinner-sm"></span> Loading companies…
                  </span>
                  <span v-else-if="!companies.length" class="pm-field-hint pm-field-hint--warn">
                    No companies found. Make sure companies are configured.
                  </span>
                </div>
                <div class="pm-section-title" style="margin-top:20px">Payroll Period</div>
              </template>
              <template v-else>
                <div class="pm-section-title">Payroll Period</div>
              </template>

              <div class="pm-form-grid">
                <div class="pm-field">
                  <label class="pm-label">Month <span class="pm-req">*</span></label>
                  <select v-model="runForm.month" class="pm-control">
                    <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
                  </select>
                </div>
                <div class="pm-field">
                  <label class="pm-label">Year <span class="pm-req">*</span></label>
                  <select v-model="runForm.year" class="pm-control">
                    <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                  </select>
                </div>
              </div>
              <div class="pm-run-preview">
                <div class="pm-run-prev-item">
                  <span class="pm-run-prev-label">Company</span>
                  <span class="pm-run-prev-val">{{ selectedCompanyName }}</span>
                </div>
                <div class="pm-run-prev-sep"></div>
                <div class="pm-run-prev-item">
                  <span class="pm-run-prev-label">Period</span>
                  <span class="pm-run-prev-val">{{ monthName(runForm.month) }} {{ runForm.year }}</span>
                </div>
                <div class="pm-run-prev-sep"></div>
                <div class="pm-run-prev-item">
                  <span class="pm-run-prev-label">Net Est.</span>
                  <span class="pm-run-prev-val pm-run-prev-val--gold">{{ formatCurrency(totalNet) }}</span>
                </div>
              </div>
              <div class="pm-run-warning">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                Existing payroll records for the selected period will be skipped automatically.
              </div>
            </div>
            <div class="pm-modal-foot">
              <button class="pm-btn-cancel" @click="showRunModal = false">Cancel</button>
              <button class="pm-btn-primary pm-btn-run" :disabled="runSaving || runForm.company_id === 0" @click="submitGenerate">
                <span v-if="runSaving" class="pm-spinner-sm"></span>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                {{ runSaving ? 'Generating…' : 'Confirm & Generate' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ PAYROLL DETAIL MODAL ══ -->
    <Teleport to="body">
      <Transition name="pm-modal">
        <div v-if="showDetailModal && detailPayroll" class="pm-backdrop" @click.self="showDetailModal = false">
          <div class="pm-modal pm-modal--wide">
            <div class="pm-modal-head">
              <div class="pm-modal-head-left">
                <div class="pm-avatar pm-avatar--md" :style="{ background: avatarBg(detailPayroll.employee?.user?.name) }">
                  {{ initials(detailPayroll.employee?.user?.name) }}
                </div>
                <div>
                  <h2 class="pm-modal-title">{{ detailPayroll.employee?.user?.name ?? 'Employee' }}</h2>
                  <p class="pm-modal-sub">
                    Payslip · {{ monthName(detailPayroll.month) }} {{ detailPayroll.year }}
                    <span class="pm-badge pm-badge-inline" :class="`pm-badge--${detailPayroll.status}`">{{ detailPayroll.status }}</span>
                  </p>
                </div>
              </div>
              <button class="pm-modal-close" @click="showDetailModal = false">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </button>
            </div>
            <div class="pm-modal-body">
              <div class="pm-detail-summary">
                <div class="pm-ds-item">
                  <span class="pm-ds-label">Gross Salary</span>
                  <span class="pm-ds-val">{{ formatCurrency(detailPayroll.gross_salary) }}</span>
                </div>
                <div class="pm-ds-sep"></div>
                <div class="pm-ds-item">
                  <span class="pm-ds-label">Deductions</span>
                  <span class="pm-ds-val pm-ds-val--red">−{{ formatCurrency((detailPayroll.late_deduction || 0) + (detailPayroll.leave_deduction || 0)) }}</span>
                </div>
                <div class="pm-ds-sep"></div>
                <div class="pm-ds-item">
                  <span class="pm-ds-label">Overtime + Bonus</span>
                  <span class="pm-ds-val pm-ds-val--green">+{{ formatCurrency((detailPayroll.overtime_amount || 0) + (detailPayroll.bonus_amount || 0)) }}</span>
                </div>
                <div class="pm-ds-sep"></div>
                <div class="pm-ds-item pm-ds-item--net">
                  <span class="pm-ds-label">Net Salary</span>
                  <span class="pm-ds-val pm-ds-val--gold">{{ formatCurrency(detailPayroll.net_salary) }}</span>
                </div>
              </div>
              <div class="pm-breakdown-grid">
                <div class="pm-breakdown-col">
                  <div class="pm-section-title">
                    <span class="pm-dot pm-dot--green"></span>Earnings
                  </div>
                  <div class="pm-breakdown-list">
                    <div v-for="item in detailEarnings" :key="item.title" class="pm-breakdown-row">
                      <span class="pm-br-label">{{ item.title }}</span>
                      <span class="pm-br-val pm-bonus">{{ formatCurrency(item.amount) }}</span>
                    </div>
                    <div v-if="!detailEarnings.length" class="pm-br-empty">No earnings items</div>
                  </div>
                </div>
                <div class="pm-breakdown-col">
                  <div class="pm-section-title">
                    <span class="pm-dot pm-dot--red"></span>Deductions
                  </div>
                  <div class="pm-breakdown-list">
                    <div v-for="item in detailDeductions" :key="item.title" class="pm-breakdown-row">
                      <span class="pm-br-label">{{ item.title }}</span>
                      <span class="pm-br-val pm-deduct">−{{ formatCurrency(item.amount) }}</span>
                    </div>
                    <div v-if="!detailDeductions.length" class="pm-br-empty">No deductions</div>
                  </div>
                </div>
              </div>
              <div v-if="detailPayroll.paid_at" class="pm-paid-stamp">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Paid on {{ formatDate(detailPayroll.paid_at) }}
              </div>
            </div>
            <div class="pm-modal-foot">
              <button class="pm-btn-cancel" @click="showDetailModal = false">Close</button>
              <!-- Share Payslip button -->
              <button class="pm-btn-slip" @click="sharePayslip(detailPayroll)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Payslip
              </button>
              <button
                v-if="detailPayroll.status === 'draft' && isAdmin"
                class="pm-btn-primary pm-btn-run"
                @click="confirmMarkPaid(detailPayroll); showDetailModal = false"
              >
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ CONFIRM MODAL ══ -->
    <Teleport to="body">
      <Transition name="pm-modal">
        <div v-if="showConfirmModal" class="pm-backdrop" @click.self="showConfirmModal = false">
          <div class="pm-modal pm-modal--sm">
            <div class="pm-modal-head">
              <div class="pm-modal-head-left">
                <div class="pm-modal-icon" :class="confirmData.danger ? 'pm-icon--danger' : 'pm-icon--gold'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                </div>
                <h2 class="pm-modal-title">{{ confirmData.title }}</h2>
              </div>
              <button class="pm-modal-close" @click="showConfirmModal = false">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </button>
            </div>
            <div class="pm-modal-body">
              <p class="pm-confirm-msg">{{ confirmData.message }}</p>
            </div>
            <div class="pm-modal-foot">
              <button class="pm-btn-cancel" @click="showConfirmModal = false">Cancel</button>
              <button
                class="pm-btn-primary"
                :class="confirmData.danger ? 'pm-btn-danger' : 'pm-btn-run'"
                @click="executeConfirm"
              >
                {{ confirmData.action }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Toast ── -->
    <Transition name="pm-toast">
      <div v-if="toast.visible" class="pm-toast" :class="`pm-toast--${toast.type}`">
        <svg v-if="toast.type === 'success'" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
        {{ toast.message }}
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '@/store/company' // adjust path to match your project

/* ── Store ─────────────────────────────────────────────── */
const companyStore = useCompanyStore()

/* ── Props ─────────────────────────────────────────────── */
const apiBase = process.env.VUE_APP_BASE_API

/* ── Auth / fetch helper ───────────────────────────────── */
const authHeader = () => {
  const t = localStorage.getItem('token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/**
 * All payroll routes share the /payroll prefix.
 * path examples:
 *   ''           → GET  /payroll          (index)
 *   '/generate'  → POST /payroll/generate
 *   '/123'       → GET  /payroll/123      (show)
 *   '/123/mark-paid' → POST /payroll/123/mark-paid
 *   '/123'       → DELETE /payroll/123
 */
const apiFetch = async (path, options = {}) => {
  const res  = await fetch(`${apiBase}/payroll${path}`, {
    ...options,
    headers: { ...authHeader(), ...(options.headers ?? {}) }
  })
  const json = await res.json()
  if (!res.ok) throw json
  return json
}

/* ── Current user / admin check ────────────────────────── */
const currentUser = ref(null)

const isAdmin = computed(() => {
  const roles = currentUser.value?.roles ?? []
  return roles
    .map(r => (typeof r === 'object' ? r?.name ?? '' : r).toLowerCase())
    .some(r => ['admin', 'hr', 'super administrator', 'super_admin'].includes(r))
})

const loadCurrentUser = async () => {
  try {
    const res  = await fetch(`${apiBase}/user`, { headers: authHeader() })
    const data = await res.json()
    currentUser.value = data.user ?? data
  } catch { /* ignore */ }
}

/* ── Companies ─────────────────────────────────────────── */
const companies        = ref([])
const companiesLoading = ref(false)

const loadCompanies = async () => {
  companiesLoading.value = true
  try {
    const res  = await fetch(`${apiBase}/system/companies`, { headers: authHeader() })
    const data = await res.json()
    // Response shape: { companies: [{ value, label }] }
    companies.value = data.companies ?? []
  } catch { /* ignore — list stays empty */ }
  finally { companiesLoading.value = false }
}

/* ── State ─────────────────────────────────────────────── */
const payrolls     = ref([])
const isLoading    = ref(false)
const hasError     = ref(false)
const errorMessage = ref('')

const activeTab     = ref('payrolls')
const searchQuery   = ref('')
const statusFilter  = ref('all')
const selectedMonth = ref('')
const selectedYear  = ref('')
const currentPage   = ref(1)
const perPage       = 15

/* ── Constants ─────────────────────────────────────────── */
const months = [
  { value: 1,  label: 'January'   }, { value: 2,  label: 'February'  },
  { value: 3,  label: 'March'     }, { value: 4,  label: 'April'     },
  { value: 5,  label: 'May'       }, { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      }, { value: 8,  label: 'August'    },
  { value: 9,  label: 'September' }, { value: 10, label: 'October'   },
  { value: 11, label: 'November'  }, { value: 12, label: 'December'  }
]

const now   = new Date()
const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

const AVATAR_PALETTE = [
  '#8B6F47', '#6B8E7F', '#7B9EA8', '#8B7BA8',
  '#9E7B6B', '#6B7B8B', '#8B8B6B', '#7B8B6B'
]

/* ── Tabs ─────────────────────────────────────────────── */
const tabs = computed(() => [
  { key: 'payrolls', label: 'Payroll Records',   badge: payrolls.value.length || null },
  { key: 'history',  label: 'History by Period', badge: null }
])

const switchTab = (key) => {
  activeTab.value  = key
  currentPage.value = 1
}

/* ── Aggregate stats ────────────────────────────────────── */
const totalGross = computed(() =>
  payrolls.value.reduce((s, p) => s + (Number(p.gross_salary) || 0), 0)
)
const totalNet = computed(() =>
  payrolls.value.reduce((s, p) => s + (Number(p.net_salary) || 0), 0)
)
const draftCount = computed(() =>
  payrolls.value.filter(p => p.status === 'draft').length
)

/* ── Status filter tabs ─────────────────────────────────── */
const statusFilters = computed(() => [
  { value: 'all',   label: 'All',   count: payrolls.value.length },
  { value: 'draft', label: 'Draft', count: payrolls.value.filter(p => p.status === 'draft').length },
  { value: 'paid',  label: 'Paid',  count: payrolls.value.filter(p => p.status === 'paid').length }
])

/* ── Filtered & paginated list ──────────────────────────── */
const filteredPayrolls = computed(() => {
  let list = payrolls.value

  if (statusFilter.value !== 'all')
    list = list.filter(p => p.status === statusFilter.value)

  if (selectedMonth.value)
    list = list.filter(p => p.month === Number(selectedMonth.value))

  if (selectedYear.value)
    list = list.filter(p => p.year === Number(selectedYear.value))

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      (p.employee?.user?.name ?? '').toLowerCase().includes(q) ||
      String(p.employee_id).includes(q)
    )
  }

  return list
})

const paginatedPayrolls = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredPayrolls.value.slice(start, start + perPage)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredPayrolls.value.length / perPage))
)

/* ── History grouped by period ──────────────────────────── */
const historyRows = computed(() => {
  const map = {}
  payrolls.value.forEach(p => {
    const key = `${monthName(p.month)} ${p.year}`
    if (!map[key]) map[key] = { period: key, count: 0, gross: 0, net: 0 }
    map[key].count++
    map[key].gross += Number(p.gross_salary) || 0
    map[key].net   += Number(p.net_salary)   || 0
  })
  return Object.values(map).reverse()
})

/* ── Selected company name for preview ─────────────────── */
const selectedCompanyName = computed(() => {
  const id = companyStore.company_id !== 0 ? companyStore.company_id : runForm.value.company_id
  if (!id) return '—'
  const found = companies.value.find(c => c.value === id)
  return found?.label ?? `Company #${id}`
})

/* ── Load payrolls ──────────────────────────────────────── */
const loadPayrolls = async () => {
  isLoading.value = true
  hasError.value  = false
  try {
    // GET /payroll
    const data = await apiFetch('')
    payrolls.value = data.data?.data ?? data.data ?? []
  } catch (e) {
    hasError.value     = true
    errorMessage.value = e?.message || 'Failed to load payroll data.'
  } finally {
    isLoading.value = false
  }
}

/* ── Generate / Run payroll modal ───────────────────────── */
const showRunModal = ref(false)
const runSaving    = ref(false)
const runNotif     = ref({ show: false, type: 'success', message: '' })
const runForm      = ref({ company_id: 0, month: now.getMonth() + 1, year: now.getFullYear() })

const openRunModal = () => {
  runForm.value = {
    company_id: companyStore.company_id !== 0 ? companyStore.company_id : 0,
    month:      now.getMonth() + 1,
    year:       now.getFullYear()
  }
  runNotif.value.show = false
  showRunModal.value  = true
  // Fetch company list when store has no pre-selected company
  if (companyStore.company_id === 0 && companies.value.length === 0) {
    loadCompanies()
  }
}

const submitGenerate = async () => {
  // Use store company_id if it was set, otherwise use what user picked in the form
  const effectiveCompanyId = companyStore.company_id !== 0
    ? companyStore.company_id
    : runForm.value.company_id

  if (!effectiveCompanyId) {
    runNotif.value = { show: true, type: 'error', message: 'Please select a company before generating payroll.' }
    return
  }

  runSaving.value = true
  try {
    // POST /payroll/generate
    const payload = { ...runForm.value, company_id: effectiveCompanyId }
    const data = await apiFetch('/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    showRunModal.value = false
    showToast(data.message ?? 'Payroll generated successfully', 'success')
    await loadPayrolls()
  } catch (e) {
    runNotif.value = { show: true, type: 'error', message: e?.message || 'Generation failed.' }
  } finally {
    runSaving.value = false
  }
}

/* ── Detail modal ───────────────────────────────────────── */
const showDetailModal = ref(false)
const detailPayroll   = ref(null)

const detailEarnings   = computed(() =>
  detailPayroll.value?.items?.filter(i => i.type === 'earning')   ?? []
)
const detailDeductions = computed(() =>
  detailPayroll.value?.items?.filter(i => i.type === 'deduction') ?? []
)

const openDetail = async (row) => {
  try {
    // GET /payroll/{id}
    const data = await apiFetch(`/${row.id}`)
    detailPayroll.value = data.data
  } catch {
    detailPayroll.value = row
  }
  showDetailModal.value = true
}

/* ── Mark as paid ───────────────────────────────────────── */
const markAsPaid = async (payroll) => {
  try {
    // POST /payroll/{id}/mark-paid
    await apiFetch(`/${payroll.id}/mark-paid`, { method: 'POST' })
    showToast('Payroll marked as paid', 'success')
    const idx = payrolls.value.findIndex(p => p.id === payroll.id)
    if (idx !== -1) {
      payrolls.value[idx] = {
        ...payrolls.value[idx],
        status:  'paid',
        paid_at: new Date().toISOString()
      }
    }
  } catch {
    showToast('Failed to update status', 'error')
  }
}

/* ── Delete ─────────────────────────────────────────────── */
const deletePayroll = async (payroll) => {
  try {
    // DELETE /payroll/{id}
    await apiFetch(`/${payroll.id}`, { method: 'DELETE' })
    showToast('Payroll deleted', 'success')
    payrolls.value = payrolls.value.filter(p => p.id !== payroll.id)
  } catch (e) {
    showToast(e?.message || 'Delete failed', 'error')
  }
}

/* ── Confirm modal ──────────────────────────────────────── */
const showConfirmModal = ref(false)
const confirmData      = ref({ title: '', message: '', action: '', danger: false, fn: null })

const confirmMarkPaid = (payroll) => {
  confirmData.value = {
    title:   'Confirm Payment',
    message: `Mark ${payroll.employee?.user?.name ?? 'this employee'}'s payroll as paid? This cannot be undone.`,
    action:  'Mark as Paid',
    danger:  false,
    fn:      () => markAsPaid(payroll)
  }
  showConfirmModal.value = true
}

const confirmDelete = (payroll) => {
  confirmData.value = {
    title:   'Delete Payroll',
    message: 'Delete this payroll record permanently? This action cannot be undone.',
    action:  'Delete',
    danger:  true,
    fn:      () => deletePayroll(payroll)
  }
  showConfirmModal.value = true
}

const executeConfirm = () => {
  confirmData.value.fn?.()
  showConfirmModal.value = false
}

/* ── Share / Download Payslip ───────────────────────────── */
/**
 * Generates a self-contained payslip HTML document and triggers
 * a browser download. Works for any payroll row — fetches full
 * detail (with items) if they are not already present.
 */
const sharePayslip = async (row) => {
  let payroll = row

  // If items are missing, fetch full detail first
  if (!payroll.items) {
    try {
      const data = await apiFetch(`/${row.id}`)
      payroll = data.data
    } catch {
      showToast('Could not load payslip details', 'error')
      return
    }
  }

  const empName   = payroll.employee?.user?.name ?? 'Employee'
  const empId     = String(payroll.employee_id).padStart(4, '0')
  const period    = `${monthName(payroll.month)} ${payroll.year}`
  const earnings  = (payroll.items ?? []).filter(i => i.type === 'earning')
  const deductions = (payroll.items ?? []).filter(i => i.type === 'deduction')
  const paidLabel = payroll.paid_at ? `Paid on ${formatDate(payroll.paid_at)}` : 'Status: Draft'

  const earningsRows = earnings.map(i => `
    <tr>
      <td>${i.title}</td>
      <td class="amt green">${formatCurrency(i.amount)}</td>
    </tr>`).join('')

  const deductionRows = deductions.map(i => `
    <tr>
      <td>${i.title}</td>
      <td class="amt red">−${formatCurrency(i.amount)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Payslip – ${empName} – ${period}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Jost',sans-serif;background:#0D0D0F;color:#F0EAE0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
  .slip{background:#131316;border:1px solid rgba(201,169,110,0.25);width:100%;max-width:640px;padding:0}
  /* Header */
  .slip-head{padding:28px 32px 22px;border-bottom:1px solid rgba(201,169,110,0.15);display:flex;justify-content:space-between;align-items:flex-start}
  .company{font-size:18px;font-weight:700;color:#C9A96E;letter-spacing:.02em}
  .slip-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(240,234,224,0.35);margin-top:4px}
  .period-badge{background:rgba(201,169,110,0.10);border:1px solid rgba(201,169,110,0.30);color:#C9A96E;font-size:11px;font-weight:600;letter-spacing:.08em;padding:5px 14px;text-transform:uppercase;align-self:flex-start}
  /* Employee strip */
  .emp-strip{padding:18px 32px;background:rgba(201,169,110,0.04);border-bottom:1px solid rgba(201,169,110,0.10);display:flex;align-items:center;gap:16px}
  .avatar{width:42px;height:42px;border-radius:50%;background:#8B6F47;border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:rgba(255,255,255,0.85);flex-shrink:0}
  .emp-name{font-size:15px;font-weight:600;color:#F0EAE0}
  .emp-meta{font-size:11px;color:rgba(240,234,224,0.38);margin-top:3px}
  /* Summary band */
  .summary{display:flex;border-bottom:1px solid rgba(201,169,110,0.12)}
  .sum-item{flex:1;padding:16px 18px;display:flex;flex-direction:column;gap:5px;border-right:1px solid rgba(201,169,110,0.10)}
  .sum-item:last-child{border-right:none;background:rgba(201,169,110,0.06)}
  .sum-label{font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:rgba(240,234,224,0.35);font-weight:600}
  .sum-val{font-size:15px;font-weight:700;font-family:'Georgia',serif}
  .sum-val.gold{color:#C9A96E}
  .sum-val.red{color:#EF6B6B}
  .sum-val.green{color:#6ECFA9}
  /* Tables */
  .tables{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid rgba(201,169,110,0.10)}
  .tbl-col{padding:20px 24px}
  .tbl-col:first-child{border-right:1px solid rgba(201,169,110,0.10)}
  .tbl-head{font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:rgba(201,169,110,0.55);font-weight:600;padding-bottom:10px;border-bottom:1px solid rgba(201,169,110,0.10);margin-bottom:2px;display:flex;align-items:center;gap:6px}
  .dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
  .dot.g{background:#6ECFA9}.dot.r{background:#EF6B6B}
  table{width:100%;border-collapse:collapse}
  td{padding:7px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.04);color:rgba(240,234,224,0.65)}
  tr:last-child td{border-bottom:none}
  td.amt{text-align:right;font-family:'Georgia',serif;font-weight:600}
  td.green{color:#6ECFA9}
  td.red{color:#EF6B6B}
  /* Net pay footer */
  .net-foot{padding:20px 32px;display:flex;align-items:center;justify-content:space-between;background:rgba(201,169,110,0.06);border-bottom:1px solid rgba(201,169,110,0.15)}
  .net-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(240,234,224,0.45);font-weight:600}
  .net-val{font-size:24px;font-weight:700;color:#C9A96E;font-family:'Georgia',serif}
  /* Footer */
  .slip-foot{padding:16px 32px;display:flex;justify-content:space-between;align-items:center}
  .paid-stamp{display:inline-flex;align-items:center;gap:7px;font-size:11px;color:#6ECFA9;background:rgba(110,207,169,0.08);border:1px solid rgba(110,207,169,0.25);padding:5px 12px}
  .gen-note{font-size:10px;color:rgba(240,234,224,0.25);letter-spacing:.03em}
  @media print{body{background:#fff;padding:0}
    .slip{border:1px solid #ddd;max-width:100%}
    body,td,.emp-name,.net-val,.sum-val,.company{color:#111!important}
    .sum-val.gold,.net-val,.company{color:#8B6F47!important}
    .sum-val.green,td.green,.paid-stamp{color:#2a7a55!important}
    .sum-val.red,td.red{color:#b22!important}
  }
</style>
</head>
<body>
<div class="slip">
  <div class="slip-head">
    <div>
      <div class="company">Company Payroll</div>
      <div class="slip-label">Official Salary Slip</div>
    </div>
    <div class="period-badge">${period}</div>
  </div>

  <div class="emp-strip">
    <div class="avatar">${initials(empName)}</div>
    <div>
      <div class="emp-name">${empName}</div>
      <div class="emp-meta">Employee ID: #${empId} &nbsp;·&nbsp; ${period}</div>
    </div>
  </div>

  <div class="summary">
    <div class="sum-item">
      <span class="sum-label">Gross Salary</span>
      <span class="sum-val">${formatCurrency(payroll.gross_salary)}</span>
    </div>
    <div class="sum-item">
      <span class="sum-label">Deductions</span>
      <span class="sum-val red">−${formatCurrency((payroll.late_deduction || 0) + (payroll.leave_deduction || 0))}</span>
    </div>
    <div class="sum-item">
      <span class="sum-label">Overtime + Bonus</span>
      <span class="sum-val green">+${formatCurrency((payroll.overtime_amount || 0) + (payroll.bonus_amount || 0))}</span>
    </div>
    <div class="sum-item">
      <span class="sum-label">Net Pay</span>
      <span class="sum-val gold">${formatCurrency(payroll.net_salary)}</span>
    </div>
  </div>

  <div class="tables">
    <div class="tbl-col">
      <div class="tbl-head"><span class="dot g"></span>Earnings</div>
      <table>
        <tbody>${earningsRows || '<tr><td colspan="2" style="color:rgba(240,234,224,0.3);font-style:italic">No earnings</td></tr>'}</tbody>
      </table>
    </div>
    <div class="tbl-col">
      <div class="tbl-head"><span class="dot r"></span>Deductions</div>
      <table>
        <tbody>${deductionRows || '<tr><td colspan="2" style="color:rgba(240,234,224,0.3);font-style:italic">No deductions</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <div class="net-foot">
    <span class="net-label">Total Net Pay</span>
    <span class="net-val">${formatCurrency(payroll.net_salary)}</span>
  </div>

  <div class="slip-foot">
    <span class="paid-stamp">${paidLabel}</span>
    <span class="gen-note">Generated ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</span>
  </div>
</div>
</body>
</html>`

  // Trigger download
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Payslip_${empName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  showToast('Payslip downloaded', 'success')
}

/* ── Toast ──────────────────────────────────────────────── */
const toast = ref({ visible: false, message: '', type: 'success' })

const showToast = (message, type = 'success') => {
  toast.value = { visible: true, message, type }
  setTimeout(() => { toast.value.visible = false }, 3500)
}

/* ── Utilities ──────────────────────────────────────────── */
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(Number(val) || 0)

const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch { return iso }
}

const monthName = (num) =>
  months.find(m => m.value === Number(num))?.label ?? num

const initials = (name) =>
  (name ?? '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()

const avatarBg = (name) => {
  if (!name) return AVATAR_PALETTE[0]
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]
}

/* ── Lifecycle ──────────────────────────────────────────── */
onMounted(async () => {
  await loadCurrentUser()
  await loadPayrolls()
  // Pre-load companies if no company is already selected in the store
  if (companyStore.company_id === 0) {
    await loadCompanies()
  }
})
</script>

<style scoped>
/* ── Design tokens ──────────────────────────────────────── */
.pm-wrap {
  --gold:       #C9A96E;
  --gold-light: #E8D5B0;
  --gold-dim:   #8B6F47;
  --onyx:       #0D0D0F;
  --onyx-2:     #131316;
  --onyx-3:     #17171D;
  --onyx-4:     #1E1E26;
  --onyx-5:     #242430;
  --text-1:     #F0EAE0;
  --text-2:     rgba(240,234,224,0.55);
  --text-3:     rgba(240,234,224,0.28);
  --border:     rgba(201,169,110,0.13);
  --border-s:   rgba(201,169,110,0.28);
  --green:      #6ECFA9;
  --green-bg:   rgba(110,207,169,0.10);
  --green-bd:   rgba(110,207,169,0.30);
  --red:        #EF6B6B;
  --red-bg:     rgba(239,107,107,0.10);
  --red-bd:     rgba(239,107,107,0.30);
  --blue:       #85B7EB;
  --blue-bg:    rgba(133,183,235,0.10);
  --blue-bd:    rgba(133,183,235,0.30);

  font-family: 'Jost', 'Inter', sans-serif;
  background: var(--onyx);
  min-height: 100vh;
  color: var(--text-1);
  padding: 2rem 2rem 4rem;
  max-width: 1280px;
  margin: 0 auto;
  position: relative;
}

/* ── Header ─────────────────────────────────────────────── */
.pm-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 2rem; padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}
.pm-header-left { display: flex; align-items: center; gap: 14px; }
.pm-header-icon {
  width: 38px; height: 38px; flex-shrink: 0;
  background: rgba(201,169,110,0.10);
  border: 1px solid rgba(201,169,110,0.28);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold);
}
.pm-title   { font-size: 1.3rem; font-weight: 600; color: var(--text-1); margin: 0 0 3px; letter-spacing: .01em; }
.pm-subtitle { font-size: 11px; color: var(--text-3); margin: 0; letter-spacing: .02em; }

.pm-run-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 20px;
  background: rgba(201,169,110,0.12); border: 1px solid rgba(201,169,110,0.45);
  color: var(--gold); font-size: 11px; font-weight: 500; letter-spacing: .08em;
  text-transform: uppercase; cursor: pointer; font-family: inherit;
  transition: background .14s;
}
.pm-run-btn:hover { background: rgba(201,169,110,0.22); }

/* ── Stats ─────────────────────────────────────────────── */
.pm-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1px; border: 1px solid var(--border);
  margin-bottom: 1.75rem; background: var(--border);
}
.pm-stat {
  display: flex; flex-direction: column; gap: 5px;
  padding: 1.1rem 1.4rem; background: var(--onyx-3);
  position: relative;
}
.pm-stat::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: rgba(201,169,110,0.12);
}
.pm-stat--gold::after { background: var(--gold); }
.pm-stat-label {
  font-size: 10px; font-weight: 600; letter-spacing: .1em;
  text-transform: uppercase; color: var(--text-3);
}
.pm-stat-value {
  font-size: 1.4rem; font-weight: 700; color: var(--text-1);
  font-family: 'Georgia', serif; letter-spacing: -.01em;
}

/* ── Tab bar ─────────────────────────────────────────────── */
.pm-tabs {
  display: flex; align-items: center; gap: 2px;
  border-bottom: 1px solid rgba(201,169,110,0.15);
  margin-bottom: 1.25rem;
}
.pm-tab {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 16px; background: transparent; border: none;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  color: var(--text-3); font-size: 12px; font-weight: 500; letter-spacing: .05em;
  cursor: pointer; transition: color .14s, border-color .14s;
  white-space: nowrap; font-family: inherit;
}
.pm-tab:hover { color: var(--text-2); }
.pm-tab--active { color: var(--gold); border-bottom-color: var(--gold); }
.pm-tab-badge {
  padding: 1px 6px; font-size: 10px;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.22);
  color: rgba(201,169,110,0.65);
}
.pm-tab-spacer { flex: 1; }
.pm-search {
  display: flex; align-items: center; gap: 7px;
  background: var(--onyx-4); border: 1px solid var(--border);
  padding: 0 12px; margin-bottom: 1px; color: var(--text-3);
}
.pm-search input {
  border: none; outline: none; background: transparent;
  color: var(--text-1); font-size: 12px; font-family: inherit;
  padding: 8px 0; width: 160px;
}
.pm-search input::placeholder { color: var(--text-3); }

/* ── Filter row ─────────────────────────────────────────── */
.pm-filter-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; gap: 12px; flex-wrap: wrap;
}
.pm-filter-tabs { display: flex; border: 1px solid var(--border); overflow: hidden; }
.pm-filter-tab {
  background: none; border: none; border-right: 1px solid var(--border);
  padding: 7px 14px; font-family: inherit; font-size: 11px; font-weight: 500;
  letter-spacing: .05em; color: var(--text-3); cursor: pointer; transition: all .14s;
  display: flex; align-items: center; gap: 6px;
}
.pm-filter-tab:last-child { border-right: none; }
.pm-filter-tab--active { background: rgba(201,169,110,0.12); color: var(--gold); }
.pm-filter-count {
  font-size: 10px; padding: 0 5px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  color: inherit;
}
.pm-period-filters { display: flex; gap: 8px; }
.pm-select {
  font-family: inherit; font-size: 12px; color: var(--text-2);
  background: var(--onyx-4); border: 1px solid var(--border);
  padding: 7px 30px 7px 12px; outline: none; cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(201,169,110,0.50)'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
  transition: border-color .14s;
}
.pm-select:focus { border-color: var(--border-s); }
.pm-select option { background: var(--onyx-3); color: var(--text-1); }

/* ── Table ─────────────────────────────────────────────── */
.pm-table-wrap { border: 1px solid var(--border); background: var(--onyx-3); overflow: hidden; }
.pm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.pm-table thead tr { background: var(--onyx-4); border-bottom: 1px solid var(--border); }
.pm-table th {
  padding: .85rem 1rem; font-size: 10px; font-weight: 600; letter-spacing: .10em;
  text-transform: uppercase; color: var(--text-3); text-align: left; white-space: nowrap;
}
.pm-tr { border-bottom: 1px solid var(--border); transition: background .12s; cursor: pointer; }
.pm-tr:hover { background: rgba(201,169,110,0.04); }
.pm-tr:last-child { border-bottom: none; }
.pm-table td { padding: .85rem 1rem; color: var(--text-2); vertical-align: middle; }
.ta-r { text-align: right; }
.ta-c { text-align: center; }

.pm-name-cell { display: flex; align-items: center; gap: 10px; }
.pm-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.85); font-size: 10px; font-weight: 700;
  border: 1px solid rgba(255,255,255,0.12);
}
.pm-avatar--md { width: 38px; height: 38px; font-size: 12px; }
.pm-emp-name { display: block; font-size: 12px; color: var(--text-1); font-weight: 500; }
.pm-emp-id   { display: block; font-size: 10px; color: var(--text-3); margin-top: 1px; }

.pm-period {
  font-size: 11px; color: var(--text-3);
  background: rgba(255,255,255,0.03); border: 1px solid var(--border);
  padding: 2px 8px; letter-spacing: .03em;
}
.pm-mono   { font-family: 'Georgia', serif; font-size: 12px; color: var(--text-2); font-weight: 600; }
.pm-deduct { color: var(--red); }
.pm-bonus  { color: var(--green); }
.pm-net    { color: var(--gold); }

.pm-badge {
  display: inline-block; padding: 3px 9px;
  font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
  border: 1px solid;
}
.pm-badge-inline { margin-left: 8px; vertical-align: middle; }
.pm-badge--draft { color: var(--blue);  border-color: var(--blue-bd);  background: var(--blue-bg);  }
.pm-badge--paid  { color: var(--green); border-color: var(--green-bd); background: var(--green-bg); }

.pm-actions { display: flex; align-items: center; justify-content: center; gap: 5px; }
.pm-act {
  width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--border); cursor: pointer;
  color: var(--text-3); transition: all .14s;
}
.pm-act--view:hover { background: var(--blue-bg);  color: var(--blue);  border-color: var(--blue-bd);  }
.pm-act--slip:hover { background: rgba(201,169,110,0.12); color: var(--gold); border-color: rgba(201,169,110,0.45); }
.pm-act--pay:hover  { background: var(--green-bg); color: var(--green); border-color: var(--green-bd); }
.pm-act--del:hover  { background: var(--red-bg);   color: var(--red);   border-color: var(--red-bd);   }

.pm-empty {
  display: flex; flex-direction: column; align-items: center; gap: .75rem;
  padding: 3rem; color: var(--text-3); font-style: italic; font-size: 12px;
}

.pm-state {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 3rem; font-size: 13px; color: var(--text-3);
  border: 1px solid var(--border);
}
.pm-state--error {
  color: var(--red); border-color: var(--red-bd); background: var(--red-bg);
}
.pm-state--error button {
  margin-left: 12px; padding: 4px 10px; font-size: 11px; font-family: inherit;
  background: none; border: 1px solid var(--red-bd); color: var(--red); cursor: pointer;
}

/* Pagination */
.pm-pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  margin-top: 1.25rem;
}
.pm-page-btn {
  width: 28px; height: 28px; background: var(--onyx-4);
  border: 1px solid var(--border); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-3); transition: all .14s;
}
.pm-page-btn:hover:not(:disabled) { border-color: var(--border-s); color: var(--gold); }
.pm-page-btn:disabled { opacity: .3; cursor: not-allowed; }
.pm-page-info { font-size: 11px; color: var(--text-3); }

/* Spinners */
.pm-spinner {
  width: 16px; height: 16px; border: 2px solid rgba(201,169,110,0.15);
  border-top-color: var(--gold); border-radius: 50%; animation: pm-spin .7s linear infinite;
}
.pm-spinner-sm {
  width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.15);
  border-top-color: currentColor; border-radius: 50%; animation: pm-spin .6s linear infinite;
}
@keyframes pm-spin { to { transform: rotate(360deg); } }

/* ══ Modals ══ */
.pm-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.78);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 48px 16px; z-index: 9999; overflow-y: auto;
  backdrop-filter: blur(3px);
}
.pm-modal {
  background: var(--onyx-3); border: 1px solid rgba(201,169,110,0.25);
  width: 100%; max-width: 560px;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.65);
}
.pm-modal--wide { max-width: 700px; }
.pm-modal--sm   { max-width: 420px; }
/* ── Modal interior: force light text regardless of host page reset ── */
.pm-modal .pm-section-title  { color: rgba(201,169,110,0.70); }
.pm-modal .pm-label           { color: rgba(240,234,224,0.55); }
.pm-modal .pm-control         { color: #F0EAE0 !important; background: #131316 !important; }
.pm-modal .pm-control option  { background: #17171D !important; color: #F0EAE0 !important; }
.pm-modal .pm-run-prev-label  { color: rgba(240,234,224,0.40); }
.pm-modal .pm-run-prev-val    { color: var(--text-1); }
.pm-modal .pm-run-prev-val--gold { color: var(--gold); }
.pm-modal .pm-run-warning     { color: rgba(232,184,75,0.75); }
.pm-modal .pm-confirm-msg     { color: var(--text-2); }
.pm-modal .pm-modal-title     { color: var(--text-1); }
.pm-modal .pm-modal-sub       { color: var(--text-3); }
.pm-modal .pm-field-hint {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--text-3); margin-top: 4px;
}
.pm-modal .pm-field-hint--warn { color: rgba(239,107,107,0.75); }
.pm-field--full { grid-column: 1 / -1; }


.pm-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid rgba(201,169,110,0.12);
  flex-shrink: 0;
}
.pm-modal-head-left { display: flex; align-items: center; gap: 12px; }
.pm-modal-icon {
  width: 34px; height: 34px; flex-shrink: 0;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.28);
  display: flex; align-items: center; justify-content: center; color: var(--gold);
}
.pm-icon--gold   { background: rgba(201,169,110,0.10); border-color: rgba(201,169,110,0.28); color: var(--gold); }
.pm-icon--danger { background: var(--red-bg); border-color: var(--red-bd); color: var(--red); }
.pm-modal-title { font-size: 14px; font-weight: 600; color: var(--text-1); margin: 0; }
.pm-modal-sub   { font-size: 11px; color: var(--text-3); margin: 3px 0 0; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.pm-modal-close {
  width: 28px; height: 28px; background: transparent;
  border: 1px solid rgba(240,234,224,0.12); color: var(--text-3);
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .13s;
}
.pm-modal-close:hover { border-color: rgba(240,234,224,0.28); color: var(--text-1); }

.pm-modal-notif { padding: 10px 24px; font-size: 12px; flex-shrink: 0; }
.pm-notif--success { background: var(--green-bg); color: var(--green); border-bottom: 1px solid var(--green-bd); }
.pm-notif--error   { background: var(--red-bg);   color: var(--red);   border-bottom: 1px solid var(--red-bd);   }

.pm-modal-body { padding: 22px 24px; overflow-y: auto; max-height: calc(100vh - 220px); }
.pm-modal-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 24px; border-top: 1px solid rgba(201,169,110,0.12); flex-shrink: 0;
}

/* Form */
.pm-section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 10px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
  color: rgba(201,169,110,0.60);
  padding-bottom: 10px; border-bottom: 1px solid rgba(201,169,110,0.12); margin-bottom: 18px;
}
.pm-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.pm-dot--green { background: var(--green); }
.pm-dot--red   { background: var(--red);   }

.pm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pm-field  { display: flex; flex-direction: column; gap: 6px; }
.pm-label  { font-size: 11px; letter-spacing: .05em; text-transform: uppercase; color: var(--text-3); }
.pm-req    { color: rgba(239,107,107,0.80); }
.pm-control {
  background: var(--onyx-2); border: 1px solid rgba(201,169,110,0.20);
  color: #F0EAE0 !important; font-size: 13px; padding: 9px 30px 9px 12px;
  outline: none; font-family: inherit; transition: border-color .14s;
  appearance: none; width: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(201,169,110,0.50)'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
}
.pm-control:focus { border-color: rgba(201,169,110,0.55); }
.pm-control option { background: #17171D; color: #F0EAE0; }

/* Run preview */
.pm-run-preview {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0;
  border: 1px solid rgba(201,169,110,0.12); background: rgba(201,169,110,0.04);
  margin: 18px 0 14px;
}
.pm-run-prev-item { flex: 1; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; min-width: 90px; }
.pm-run-prev-sep  { width: 1px; background: rgba(201,169,110,0.10); align-self: stretch; }
.pm-run-prev-label { font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--text-3); }
.pm-run-prev-val  { font-size: 14px; font-weight: 700; color: var(--text-1); font-family: 'Georgia', serif; }
.pm-run-prev-val--gold { color: var(--gold); }

.pm-run-warning {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 13px;
  background: rgba(232,184,75,0.06); border: 1px solid rgba(232,184,75,0.18);
  color: rgba(232,184,75,0.65); font-size: 11px; line-height: 1.5;
}
.pm-run-warning svg { flex-shrink: 0; margin-top: 1px; }

/* Detail summary */
.pm-detail-summary {
  display: flex; flex-wrap: wrap; gap: 0;
  border: 1px solid rgba(201,169,110,0.12); background: rgba(201,169,110,0.03);
  margin-bottom: 1.5rem;
}
.pm-ds-item { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
.pm-ds-item--net { background: rgba(201,169,110,0.07); }
.pm-ds-sep { width: 1px; background: rgba(201,169,110,0.10); align-self: stretch; }
.pm-ds-label { font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--text-3); }
.pm-ds-val { font-size: 14px; font-weight: 700; color: var(--text-1); font-family: 'Georgia', serif; }
.pm-ds-val--red   { color: var(--red); }
.pm-ds-val--green { color: var(--green); }
.pm-ds-val--gold  { color: var(--gold); font-size: 16px; }

/* Breakdown */
.pm-breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
.pm-breakdown-list { border: 1px solid rgba(201,169,110,0.10); }
.pm-breakdown-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; border-bottom: 1px solid rgba(201,169,110,0.07); font-size: 12px;
}
.pm-breakdown-row:last-child { border-bottom: none; }
.pm-br-label { color: var(--text-2); }
.pm-br-val   { font-weight: 600; font-family: 'Georgia', serif; color: var(--text-1); }
.pm-br-empty { padding: 12px; font-size: 11px; color: var(--text-3); font-style: italic; }

.pm-paid-stamp {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--green);
  background: var(--green-bg); border: 1px solid var(--green-bd);
  padding: 5px 12px;
}

.pm-confirm-msg { font-size: 13px; color: var(--text-2); line-height: 1.6; margin: 0; }

/* Buttons */
.pm-btn-cancel {
  padding: 9px 20px; background: transparent;
  border: 1px solid rgba(240,234,224,0.13); color: var(--text-3);
  font-size: 12px; font-family: inherit; cursor: pointer; letter-spacing: .04em; transition: all .13s;
}
.pm-btn-cancel:hover { border-color: rgba(240,234,224,0.28); color: var(--text-2); }

.pm-btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 22px;
  background: rgba(201,169,110,0.13); border: 1px solid rgba(201,169,110,0.45);
  color: var(--gold); font-size: 12px; font-weight: 500; letter-spacing: .07em;
  text-transform: uppercase; font-family: inherit; cursor: pointer; transition: all .14s;
}
.pm-btn-primary:hover:not(:disabled) { background: rgba(201,169,110,0.22); }
.pm-btn-primary:disabled { opacity: .4; cursor: not-allowed; }
.pm-btn-danger {
  background: var(--red-bg) !important; border-color: var(--red-bd) !important;
  color: var(--red) !important;
}
.pm-btn-danger:hover:not(:disabled) { background: rgba(239,107,107,0.20) !important; }

/* Download Payslip button */
.pm-btn-slip {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px;
  background: rgba(110,207,169,0.08); border: 1px solid rgba(110,207,169,0.30);
  color: var(--green); font-size: 12px; font-weight: 500; letter-spacing: .06em;
  text-transform: uppercase; font-family: inherit; cursor: pointer; transition: all .14s;
}
.pm-btn-slip:hover { background: rgba(110,207,169,0.16); }

/* Toast */
.pm-toast {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 10000;
  display: flex; align-items: center; gap: 9px;
  padding: 11px 18px; font-size: 12px; font-family: inherit; letter-spacing: .02em;
  border: 1px solid;
}
.pm-toast--success { background: rgba(110,207,169,0.12); color: var(--green); border-color: var(--green-bd); }
.pm-toast--error   { background: var(--red-bg); color: var(--red); border-color: var(--red-bd); }

/* Transitions */
.pm-modal-enter-active, .pm-modal-leave-active { transition: opacity .2s; }
.pm-modal-enter-active .pm-modal, .pm-modal-leave-active .pm-modal { transition: transform .2s, opacity .2s; }
.pm-modal-enter-from, .pm-modal-leave-to { opacity: 0; }
.pm-modal-enter-from .pm-modal, .pm-modal-leave-to .pm-modal { transform: translateY(14px); opacity: 0; }

.pm-toast-enter-active, .pm-toast-leave-active { transition: opacity .3s, transform .3s; }
.pm-toast-enter-from, .pm-toast-leave-to { opacity: 0; transform: translateY(8px); }

/* Responsive */
@media (max-width: 900px) {
  .pm-stats { grid-template-columns: repeat(2, 1fr); }
  .pm-table th:nth-child(5), .pm-table td:nth-child(5) { display: none; }
  .pm-breakdown-grid { grid-template-columns: 1fr; }
  .pm-detail-summary { flex-direction: column; }
  .pm-ds-sep { display: none; }
}
@media (max-width: 640px) {
  .pm-wrap   { padding: 1.25rem 1rem; }
  .pm-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .pm-stats  { grid-template-columns: 1fr 1fr; }
  .pm-filter-row { flex-direction: column; align-items: stretch; }
  .pm-form-grid  { grid-template-columns: 1fr; }
  .pm-tabs  { flex-wrap: wrap; }
  .pm-tab-spacer { display: none; }
}
</style>