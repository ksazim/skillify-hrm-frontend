<template>
  <div class="payroll-app">
    <PayrollPageHeader :is-admin="isAdmin" @run-payroll="openRunModal" />

    <PayrollStatsCards :employee-count="payrolls.length" :total-gross="totalGross" :total-net="totalNet"
      :draft-count="draftCount" />

    <PayrollTabs :tabs="tabs" :active-tab="activeTab" :search-query="searchQuery"
      :show-search="activeTab === 'payrolls'" @change="switchTab" @update:search-query="searchQuery = $event" />

    <!-- ════ TAB: PAYROLL RECORDS ════ -->
    <div v-if="activeTab === 'payrolls'">
      <PayrollFiltersBar v-model="statusFilter" v-model:month="selectedMonth" v-model:year="selectedYear"
        :status-filters="statusFilters" :months="MONTHS" :years="YEARS" @update:model-value="resetPage"
        @update:month="resetPage" @update:year="resetPage" />

      <PayrollRecordsTable :rows="paginatedPayrolls" :is-loading="isLoading" :has-error="hasError"
        :error-message="errorMessage" :is-admin="isAdmin" :current-page="currentPage" :total-pages="totalPages"
        @retry="loadPayrolls" @open-detail="openDetail" @share-payslip="sharePayslip" @mark-paid="confirmMarkPaid"
        @delete="confirmDelete" @update:current-page="currentPage = $event" />
    </div>

    <!-- ════ TAB: HISTORY ════ -->
    <div v-if="activeTab === 'history'">
      <PayrollHistoryTable :rows="historyRows" />
    </div>

    <RunPayrollModal v-model="showRunModal" v-model:form="runForm" :companies="companies"
      :companies-loading="companiesLoading" :show-company-selector="companyStore.company_id === 0" :months="MONTHS"
      :years="YEARS" :total-net="totalNet" :saving="runSaving" :notif="runNotif" @submit="submitGenerate" />

    <PayrollDetailModal v-model="showDetailModal" :payroll="detailPayroll" :is-admin="isAdmin"
      @share-payslip="sharePayslip" @mark-paid="(p) => { confirmMarkPaid(p); showDetailModal = false }" />

    <ConfirmDialog v-model="confirmDialog.isOpen.value" :data="confirmDialog.data.value"
      @confirm="confirmDialog.confirm" />

    <AppToast :toast="toast" />
  </div>
</template>

<script setup>
import { useCompanyStore } from '@/store/company'; // adjust path to match your project
import { computed, onMounted, ref } from 'vue';

import { CURRENT_MONTH, CURRENT_YEAR, MONTHS, YEARS } from '@/utils/constants';

import { useConfirmDialog } from '@/composables/payroll/useConfirmDialog';
import { usePayrollApi } from '@/composables/payroll/usePayrollApi';
import { usePayrollFilters } from '@/composables/payroll/usePayrollFilters';
import { usePayslipGenerator } from '@/composables/payroll/usePayslipGenerator';
import { useToast } from '@/composables/payroll/useToast';

import PayrollFiltersBar from './PayrollFiltersBar.vue';
import PayrollHistoryTable from './PayrollHistoryTable.vue';
import PayrollPageHeader from './PayrollPageHeader.vue';
import PayrollRecordsTable from './PayrollRecordsTable.vue';
import PayrollStatsCards from './PayrollStatsCards.vue';
import PayrollTabs from './PayrollTabs.vue';
import ConfirmDialog from './modals/ConfirmDialog.vue';
import PayrollDetailModal from './modals/PayrollDetailModal.vue';
import RunPayrollModal from './modals/RunPayrollModal.vue';
import AppToast from './ui/AppToast.vue';

import './payroll-theme.css';

/* ── Store ──────────────────────────────────────────────── */
const companyStore = useCompanyStore()

/* ── API / data composable ─────────────────────────────── */
const {
  isAdmin, loadCurrentUser,
  companies, companiesLoading, loadCompanies,
  fetchPayrolls, fetchPayrollDetail,
  generatePayroll, markPayrollPaid, deletePayrollRecord
} = usePayrollApi()

/* ── Core list state ───────────────────────────────────── */
const payrolls = ref([])
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

const loadPayrolls = async () => {
  isLoading.value = true
  hasError.value = false
  try {
    payrolls.value = await fetchPayrolls()
  } catch (e) {
    hasError.value = true
    errorMessage.value = e?.message || 'Failed to load payroll data.'
  } finally {
    isLoading.value = false
  }
}

/* ── Tabs ───────────────────────────────────────────────── */
const activeTab = ref('payrolls')
const tabs = computed(() => [
  { key: 'payrolls', label: 'Payroll Records', badge: payrolls.value.length || null },
  { key: 'history', label: 'History by Period', badge: null }
])
const switchTab = (key) => {
  activeTab.value = key
  currentPage.value = 1
}

/* ── Filters / pagination / stats / history (composable) ─── */
const {
  searchQuery, statusFilter, selectedMonth, selectedYear,
  currentPage, resetPage,
  totalGross, totalNet, draftCount,
  statusFilters, paginatedPayrolls, totalPages, historyRows
} = usePayrollFilters(payrolls)

/* ── Toast + confirm dialog ────────────────────────────── */
const { toast, showToast } = useToast()
const confirmDialog = useConfirmDialog()

const confirmMarkPaid = (payroll) => {
  confirmDialog.open({
    title: 'Confirm Payment',
    message: `Mark ${payroll.employee?.user?.name ?? 'this employee'}'s payroll as paid? This cannot be undone.`,
    action: 'Mark as Paid',
    danger: false,
    fn: () => markAsPaid(payroll)
  })
}

const confirmDelete = (payroll) => {
  confirmDialog.open({
    title: 'Delete Payroll',
    message: 'Delete this payroll record permanently? This action cannot be undone.',
    action: 'Delete',
    danger: true,
    fn: () => deletePayroll(payroll)
  })
}

/* ── Mutations ──────────────────────────────────────────── */
const markAsPaid = async (payroll) => {
  try {
    await markPayrollPaid(payroll.id)
    showToast('Payroll marked as paid', 'success')
    const idx = payrolls.value.findIndex(p => p.id === payroll.id)
    if (idx !== -1) {
      payrolls.value[idx] = {
        ...payrolls.value[idx],
        status: 'paid',
        paid_at: new Date().toISOString()
      }
    }
  } catch {
    showToast('Failed to update status', 'error')
  }
}

const deletePayroll = async (payroll) => {
  try {
    await deletePayrollRecord(payroll.id)
    showToast('Payroll deleted', 'success')
    payrolls.value = payrolls.value.filter(p => p.id !== payroll.id)
  } catch (e) {
    showToast(e?.message || 'Delete failed', 'error')
  }
}

/* ── Run / Generate payroll modal ──────────────────────── */
const showRunModal = ref(false)
const runSaving = ref(false)
const runNotif = ref({ show: false, type: 'success', message: '' })
const runForm = ref({ company_id: 0, month: CURRENT_MONTH, year: CURRENT_YEAR })

const openRunModal = () => {
  runForm.value = {
    company_id: companyStore.company_id !== 0 ? companyStore.company_id : 0,
    month: CURRENT_MONTH,
    year: CURRENT_YEAR
  }
  runNotif.value.show = false
  showRunModal.value = true
  // Fetch company list when store has no pre-selected company
  if (companyStore.company_id === 0 && companies.value.length === 0) {
    loadCompanies()
  }
}

const submitGenerate = async () => {
  console.log("Submit Generate Button Click");

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
    const payload = { ...runForm.value, company_id: effectiveCompanyId }
    const data = await generatePayroll(payload)
    console.log('Payroll generated successfully', data)
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
const detailPayroll = ref(null)

const openDetail = async (row) => {
  try {
    detailPayroll.value = await fetchPayrollDetail(row.id)
  } catch {
    detailPayroll.value = row
  }
  showDetailModal.value = true
}

/* ── Payslip download ───────────────────────────────────── */
const { sharePayslip } = usePayslipGenerator({ fetchPayrollDetail, showToast })

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
