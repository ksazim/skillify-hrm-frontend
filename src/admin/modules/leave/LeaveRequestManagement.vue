<template>
  <CrudLayout
    ref="layoutRef"
    title="Leave Requests"
    subtitle="Submit and track your leave applications"
    add-label="New Request"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading leave requests"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Leave Requests"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >

    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
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

    <DataTable
      :data="paginatedData"
      :columns="tableColumns"
      :actions="tableActions"
      result-label="requests"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Policy cell -->
      <template #cell-policy="{ row }">
        <div class="policy-cell">
          <span class="policy-name">{{ row.policy?.name ?? `Policy #${row.leave_policy_id}` }}</span>
          <span v-if="row.policy?.type" class="policy-type">{{ row.policy.type }}</span>
        </div>
      </template>

      <!-- Duration cell -->
      <template #cell-duration="{ row }">
        <div class="duration-cell">
          <span class="duration-dates">{{ formatDate(row.start_date) }} → {{ formatDate(row.end_date) }}</span>
          <span class="duration-days">{{ row.total_days }} day{{ row.total_days != 1 ? 's' : '' }}</span>
        </div>
      </template>

      <!-- ── Multi-stage status cell ── -->
      <template #cell-status="{ row }">
        <div class="lr-pipeline-cell">
          <!-- Overall badge -->
          <span class="lr-status-badge" :class="overallBadgeClass(row)">
            {{ overallBadgeLabel(row) }}
          </span>
          <!-- Mini stage dots (only when there are approval_steps) -->
          <div v-if="row.approval_steps?.length" class="lr-stage-dots">
            <span
              v-for="step in row.approval_steps"
              :key="step.stage"
              class="lr-stage-dot"
              :class="stageDotClass(step)"
              :title="`${step.role}: ${step.status}`"
            ></span>
          </div>
        </div>
      </template>

      <!-- Attachment cell -->
      <template #cell-attachment="{ row }">
        <button
          v-if="row.attachment"
          class="lr-dl-btn"
          title="Download application file"
          @click.stop="downloadAttachment(row)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
          </svg>
        </button>
        <span v-else class="lr-no-file">—</span>
      </template>
    </DataTable>

    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="pagination.total"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]"
        item-label="requests"
        :show-first-last="true"
        :show-labels="false"
        :show-jump-to="false"
        @update:page-size="handlePageSizeChange"
        @page-change="handlePageChange"
      />
    </template>

  </CrudLayout>

  <!-- ══════════════════════════════════════════════════
       CREATE / EDIT MODAL
  ══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showFormModal" class="lr-modal-backdrop" @click.self="closeFormModal">
      <div class="lr-modal-shell">

        <div class="lr-modal-head">
          <div class="lr-modal-head-left">
            <div class="lr-modal-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
              </svg>
            </div>
            <div>
              <h2 class="lr-modal-title">{{ isEditMode ? 'Edit Leave Request' : 'New Leave Request' }}</h2>
              <p class="lr-modal-subtitle">
                {{ isEditMode ? 'Update the details below' : 'Fill in your leave details and attach the application document' }}
              </p>
            </div>
          </div>
          <button class="lr-modal-close" @click="closeFormModal">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <div v-if="modalNotif.show" class="lr-modal-notif" :class="'lr-notif-' + modalNotif.type">
          {{ modalNotif.message }}
        </div>

        <div class="lr-modal-body">
          <div class="lr-form-section-title">Leave Details</div>
          <div class="lr-form-grid">

            <div class="lr-form-field lr-field-full">
              <label class="lr-form-label">Leave Policy <span class="lr-req">*</span></label>
              <div v-if="policiesLoading" class="lr-policies-loading">
                <span class="lr-spinner-sm" style="border-top-color:#C9A96E"></span>
                <span style="font-size:12px;color:rgba(240,234,224,0.35)">Loading policies…</span>
              </div>
              <template v-else>
                <select v-model="form.leave_policy_id" class="lr-form-select" :disabled="isEditMode">
                  <option value="">Select leave policy…</option>
                  <option v-for="p in leavePolicies" :key="p.value" :value="p.value">{{ p.label }}</option>
                </select>
                <span v-if="isEditMode" class="lr-field-hint">
                  Policy cannot be changed after submission
                  <template v-if="selectedPolicyLabel"> · <strong style="color:rgba(240,234,224,0.55)">{{ selectedPolicyLabel }}</strong></template>
                </span>
                <span v-else-if="leavePolicies.length === 0" class="lr-field-hint lr-hint-warn">
                  No policies assigned to you. Contact HR to assign a leave policy.
                </span>
              </template>
            </div>

            <div class="lr-form-field">
              <label class="lr-form-label">Start Date <span class="lr-req">*</span></label>
              <input v-model="form.start_date" class="lr-form-input" type="date" @change="recalcDays" />
            </div>

            <div class="lr-form-field">
              <label class="lr-form-label">End Date <span class="lr-req">*</span></label>
              <input v-model="form.end_date" class="lr-form-input" type="date" @change="recalcDays" />
            </div>

            <div class="lr-form-field">
              <label class="lr-form-label">Total Days <span class="lr-req">*</span></label>
              <input v-model="form.total_days" class="lr-form-input" type="number" min="0.5" step="0.5" placeholder="e.g. 2" />
              <span class="lr-field-hint">Auto-calculated · adjust for half-days</span>
            </div>

            <div class="lr-form-field lr-field-full">
              <label class="lr-form-label">Reason</label>
              <textarea v-model="form.reason" class="lr-form-textarea" rows="3"
                placeholder="Briefly describe the reason for your leave…"></textarea>
            </div>

          </div>

          <div v-if="form.start_date && form.end_date && form.total_days" class="lr-duration-strip">
            <div class="lr-dur-item">
              <span class="lr-dur-label">From</span>
              <span class="lr-dur-value">{{ formatDate(form.start_date) }}</span>
            </div>
            <span class="lr-dur-arrow">→</span>
            <div class="lr-dur-item">
              <span class="lr-dur-label">To</span>
              <span class="lr-dur-value">{{ formatDate(form.end_date) }}</span>
            </div>
            <div class="lr-dur-divider"></div>
            <div class="lr-dur-item">
              <span class="lr-dur-label">Duration</span>
              <span class="lr-dur-value lr-dur-highlight">
                {{ form.total_days }} day{{ form.total_days != 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <div class="lr-form-section-title" style="margin-top: 28px">Official Application Document</div>
          <div class="lr-form-grid">
            <div class="lr-form-field lr-field-full">
              <label class="lr-form-label">
                Application File
                <span class="lr-field-hint" style="margin-left:8px;text-transform:none;letter-spacing:0;font-size:10px">
                  Attach your signed leave application — PDF, Word or image
                </span>
              </label>

              <div
                class="lr-doc-dropzone"
                :class="{
                  'lr-doc-dropzone--active': docDragOver,
                  'lr-doc-dropzone--filled': !!form.document
                }"
                @dragover.prevent="docDragOver = true"
                @dragleave.prevent="docDragOver = false"
                @drop.prevent="handleDocDrop"
                @click="$refs.docFileInput.click()"
              >
                <input
                  ref="docFileInput"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  class="lr-doc-file-input"
                  @change="handleDocSelect"
                />
                <div v-if="!form.document" class="lr-doc-placeholder">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="lr-doc-icon">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                  </svg>
                  <div class="lr-doc-placeholder-text">
                    <span class="lr-doc-placeholder-main">Click to browse or drag file here</span>
                    <span class="lr-doc-placeholder-sub">PDF · DOC · DOCX · JPG · PNG</span>
                  </div>
                </div>
                <div v-else class="lr-doc-selected">
                  <div class="lr-doc-selected-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <div class="lr-doc-selected-info">
                    <span class="lr-doc-selected-name">{{ form.document.name }}</span>
                    <span class="lr-doc-selected-size">{{ formatFileSize(form.document.size) }}</span>
                  </div>
                  <button class="lr-doc-remove" @click.stop="form.document = null" title="Remove file">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div v-if="isEditMode && editItem?.attachment && !form.document" class="lr-existing-file">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                </svg>
                <span>Current file: {{ editItem.attachment }}</span>
                <button class="lr-inline-dl-btn" @click.stop="downloadAttachment(editItem)" title="Download current file">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
                  </svg>
                  Download
                </button>
                <span class="lr-field-hint" style="margin-left:4px">(upload new to replace)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="lr-modal-foot">
          <button class="lr-btn-cancel" @click="closeFormModal">Cancel</button>
          <button class="lr-btn-submit" :disabled="formSaving" @click="submitForm">
            <span v-if="formSaving" class="lr-spinner-sm"></span>
            {{ formSaving ? 'Saving…' : (isEditMode ? 'Update Request' : 'Submit Request') }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- ══════════════════════════════════════════════════
       APPROVE / REJECT ACTION MODAL
  ══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showActionModal" class="lr-modal-backdrop" @click.self="showActionModal = false">
      <div class="lr-modal-shell lr-action-shell">

        <div class="lr-modal-head">
          <div class="lr-modal-head-left">
            <div class="lr-modal-icon" :class="actionModalMode === 'approve' ? 'lr-icon-approve' : 'lr-icon-reject'">
              <svg v-if="actionModalMode === 'approve'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </div>
            <div>
              <h2 class="lr-modal-title">
                {{ actionModalMode === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request' }}
              </h2>
              <p class="lr-modal-subtitle">
                <!-- Show which stage this approver is acting on -->
                Stage {{ (actionItem?.current_stage ?? 0) + 1 }} ·
                {{ APPROVAL_STAGES[(actionItem?.current_stage ?? 0)]?.label ?? 'Approver' }} action
              </p>
            </div>
          </div>
          <button class="lr-modal-close" @click="showActionModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <div v-if="actionModalNotif.show" class="lr-modal-notif" :class="'lr-notif-' + actionModalNotif.type">
          {{ actionModalNotif.message }}
        </div>

        <div class="lr-modal-body">

          <!-- ── Approval pipeline progress bar ── -->
          <div class="lr-pipeline-progress">
            <div
              v-for="(stage, idx) in APPROVAL_STAGES"
              :key="idx"
              class="lr-pip-step"
              :class="pipelineStepClass(actionItem, idx)"
            >
              <div class="lr-pip-circle">
                <!-- Completed -->
                <svg v-if="stageIsDone(actionItem, idx)" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
                <!-- Rejected -->
                <svg v-else-if="stageIsRejected(actionItem, idx)" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                <!-- Active -->
                <span v-else-if="(actionItem?.current_stage ?? 0) === idx" class="lr-pip-dot"></span>
                <!-- Future -->
                <span v-else class="lr-pip-num">{{ idx + 1 }}</span>
              </div>
              <span class="lr-pip-label">{{ stage.label }}</span>
              <!-- Connector line -->
              <div v-if="idx < APPROVAL_STAGES.length - 1" class="lr-pip-line" :class="stageIsDone(actionItem, idx) ? 'lr-pip-line--done' : ''"></div>
            </div>
          </div>

          <!-- Request summary card -->
          <div class="lr-action-summary">
            <div class="lr-action-summary-row">
              <span class="lr-action-summary-label">Employee</span>
              <span class="lr-action-summary-val">
                {{ actionItem?.user?.name ?? actionItem?.employee?.name ?? `Employee #${actionItem?.user_id}` }}
              </span>
            </div>
            <div class="lr-action-summary-row">
              <span class="lr-action-summary-label">Policy</span>
              <span class="lr-action-summary-val">
                {{ actionItem?.policy?.name ?? `Policy #${actionItem?.leave_policy_id}` }}
              </span>
            </div>
            <div class="lr-action-summary-row">
              <span class="lr-action-summary-label">Duration</span>
              <span class="lr-action-summary-val">
                {{ formatDate(actionItem?.start_date) }} → {{ formatDate(actionItem?.end_date) }}
                <em class="lr-action-days">{{ actionItem?.total_days }} day{{ actionItem?.total_days != 1 ? 's' : '' }}</em>
              </span>
            </div>
            <div v-if="actionItem?.reason" class="lr-action-summary-row">
              <span class="lr-action-summary-label">Reason</span>
              <span class="lr-action-summary-val">{{ actionItem.reason }}</span>
            </div>
            <div v-if="actionItem?.attachment" class="lr-action-summary-row">
              <span class="lr-action-summary-label">Application</span>
              <button class="lr-action-dl-btn" @click="downloadAttachment(actionItem)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
                </svg>
                {{ actionItem.attachment }}
              </button>
            </div>
          </div>

          <!-- Previous approvals summary (compact) -->
          <div v-if="previousApprovals(actionItem).length" class="lr-prev-approvals">
            <div class="lr-form-section-title" style="margin-bottom:10px">Previous approvals</div>
            <div
              v-for="step in previousApprovals(actionItem)"
              :key="step.stage"
              class="lr-prev-approval-row"
            >
              <span class="lr-prev-role">{{ step.role }}</span>
              <span class="lr-prev-check">✓</span>
              <span class="lr-prev-name">{{ step.approved_by ?? 'Unknown' }}</span>
              <span class="lr-prev-date">{{ formatDate(step.approved_at) }}</span>
            </div>
          </div>

          <!-- Notes / reason field -->
          <div class="lr-form-field" style="margin-top: 20px">
            <label class="lr-form-label">
              {{ actionModalMode === 'approve' ? 'Approval Note' : 'Rejection Reason' }}
              <span v-if="actionModalMode === 'reject'" class="lr-req">*</span>
              <span v-else class="lr-field-hint" style="margin-left: 6px">(optional)</span>
            </label>
            <textarea
              v-model="actionNotes"
              class="lr-form-textarea"
              rows="3"
              :placeholder="actionModalMode === 'approve'
                ? 'e.g. Approved — enjoy your leave!'
                : 'e.g. Insufficient leave balance, please reapply after…'"
            ></textarea>
          </div>

          <!-- Next stage hint -->
          <div v-if="actionModalMode === 'approve' && nextStageName(actionItem)" class="lr-next-stage-hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            After approval, this request will be forwarded to <strong>{{ nextStageName(actionItem) }}</strong> for the next review.
          </div>
          <div v-else-if="actionModalMode === 'approve' && !nextStageName(actionItem)" class="lr-next-stage-hint lr-next-stage-hint--final">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/>
            </svg>
            This is the <strong>final approval stage</strong>. Confirming will fully approve the leave request.
          </div>

        </div>

        <div class="lr-modal-foot">
          <button class="lr-btn-cancel" @click="showActionModal = false">Cancel</button>
          <button
            class="lr-btn-submit"
            :class="actionModalMode === 'approve' ? 'lr-btn-approve-submit' : 'lr-btn-reject-submit'"
            :disabled="actionSaving || (actionModalMode === 'reject' && !actionNotes.trim())"
            @click="submitAction"
          >
            <span v-if="actionSaving" class="lr-spinner-sm"></span>
            {{ actionSaving
              ? 'Saving…'
              : actionModalMode === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- ══════════════════════════════════════════════════
       VIEW MODAL — with full approval timeline
  ══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showViewModal" class="lr-modal-backdrop" @click.self="showViewModal = false">
      <div class="lr-modal-shell lr-view-shell">

        <div class="lr-modal-head">
          <div class="lr-modal-head-left">
            <div class="lr-modal-icon lr-icon-view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </div>
            <div>
              <h2 class="lr-modal-title">Leave Request Details</h2>
              <p class="lr-modal-subtitle">Request #{{ selectedItem?.id }}</p>
            </div>
          </div>
          <button class="lr-modal-close" @click="showViewModal = false">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <div class="lr-modal-body">

          <!-- ── Request details grid ── -->
          <div class="lr-form-section-title">Request Information</div>
          <div class="lr-view-grid">
            <div class="lr-view-row">
              <span class="lr-view-label">Request ID</span>
              <span class="lr-view-val">#{{ selectedItem?.id ?? '—' }}</span>
            </div>
            <div class="lr-view-row">
              <span class="lr-view-label">Overall Status</span>
              <span>
                <span class="lr-status-badge" :class="overallBadgeClass(selectedItem)">
                  {{ overallBadgeLabel(selectedItem) }}
                </span>
              </span>
            </div>
            <div class="lr-view-row">
              <span class="lr-view-label">Leave Policy</span>
              <span class="lr-view-val">
                {{ selectedItem?.policy?.name ?? (selectedItem?.leave_policy_id ? `Policy #${selectedItem.leave_policy_id}` : '—') }}
                <em v-if="selectedItem?.policy?.type" class="lr-view-sub">{{ selectedItem.policy.type }}</em>
              </span>
            </div>
            <div class="lr-view-row">
              <span class="lr-view-label">Employee</span>
              <span class="lr-view-val">
                {{ selectedItem?.user?.name ?? selectedItem?.employee?.name ?? (selectedItem?.user_id ? `Employee #${selectedItem.user_id}` : '—') }}
              </span>
            </div>
            <div class="lr-view-row">
              <span class="lr-view-label">Start Date</span>
              <span class="lr-view-val">{{ formatDate(selectedItem?.start_date) }}</span>
            </div>
            <div class="lr-view-row">
              <span class="lr-view-label">End Date</span>
              <span class="lr-view-val">{{ formatDate(selectedItem?.end_date) }}</span>
            </div>
            <div class="lr-view-row lr-view-row--full">
              <span class="lr-view-label">Duration</span>
              <span class="lr-view-val">
                <span class="duration-days" style="font-size:13px">
                  {{ selectedItem?.total_days }} day{{ selectedItem?.total_days != 1 ? 's' : '' }}
                </span>
              </span>
            </div>
            <div v-if="selectedItem?.reason" class="lr-view-row lr-view-row--full">
              <span class="lr-view-label">Reason</span>
              <span class="lr-view-val lr-view-reason">{{ selectedItem.reason }}</span>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════
               APPROVAL TIMELINE (the key new section)
          ══════════════════════════════════════════════════ -->
          <div class="lr-form-section-title" style="margin-top: 28px">Approval Timeline</div>

          <div class="lr-timeline">
            <div
              v-for="(stage, idx) in APPROVAL_STAGES"
              :key="idx"
              class="lr-timeline-step"
              :class="timelineStepClass(selectedItem, idx)"
            >
              <!-- Left: connector line + icon circle -->
              <div class="lr-tl-left">
                <div class="lr-tl-circle">
                  <!-- Approved -->
                  <svg v-if="stageIsDone(selectedItem, idx)" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                  <!-- Rejected -->
                  <svg v-else-if="stageIsRejected(selectedItem, idx)" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  <!-- Active / pending -->
                  <span v-else-if="(selectedItem?.current_stage ?? 0) === idx" class="lr-tl-active-dot"></span>
                  <!-- Future -->
                  <span v-else class="lr-tl-future-num">{{ idx + 1 }}</span>
                </div>
                <!-- Vertical connector (not on last item) -->
                <div v-if="idx < APPROVAL_STAGES.length - 1" class="lr-tl-line" :class="stageIsDone(selectedItem, idx) ? 'lr-tl-line--done' : ''"></div>
              </div>

              <!-- Right: content -->
              <div class="lr-tl-content">
                <div class="lr-tl-header">
                  <span class="lr-tl-role">{{ stage.label }}</span>
                  <!-- Status pill -->
                  <span class="lr-tl-pill" :class="timelinePillClass(selectedItem, idx)">
                    {{ timelinePillLabel(selectedItem, idx) }}
                  </span>
                </div>

                <!-- If this stage was actioned, show who + when + note -->
                <template v-if="getStep(selectedItem, idx)">
                  <div v-if="getStep(selectedItem, idx).approved_by || getStep(selectedItem, idx).approved_at" class="lr-tl-meta">
                    <span v-if="getStep(selectedItem, idx).approved_by" class="lr-tl-who">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="opacity:.45">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                      {{ getStep(selectedItem, idx).approved_by }}
                    </span>
                    <span v-if="getStep(selectedItem, idx).approved_at" class="lr-tl-when">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="opacity:.45">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                      </svg>
                      {{ formatDateTime(getStep(selectedItem, idx).approved_at) }}
                    </span>
                  </div>
                  <div v-if="getStep(selectedItem, idx).notes" class="lr-tl-note">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="opacity:.4">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    {{ getStep(selectedItem, idx).notes }}
                  </div>
                </template>

                <!-- Pending/awaiting message for current stage -->
                <div v-else-if="(selectedItem?.current_stage ?? 0) === idx && selectedItem?.overall_status !== 'rejected'" class="lr-tl-awaiting">
                  <span class="lr-tl-awaiting-dot"></span>
                  Awaiting {{ stage.label }} review
                </div>
                <!-- Future stage message -->
                <div v-else-if="!stageIsDone(selectedItem, idx) && !stageIsRejected(selectedItem, idx) && selectedItem?.overall_status !== 'rejected'" class="lr-tl-future">
                  Will be forwarded after {{ idx > 0 ? APPROVAL_STAGES[idx - 1].label : 'submission' }} approval
                </div>
              </div>
            </div>
          </div>

          <!-- ── Attachment section ── -->
          <template v-if="selectedItem?.attachment">
            <div class="lr-form-section-title" style="margin-top:28px">Application Document</div>
            <div class="lr-attachment-card">
              <div class="lr-attachment-info">
                <div class="lr-attachment-file-icon" :class="attachmentIconClass(selectedItem.attachment)">
                  <svg v-if="isPdf(selectedItem.attachment)" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM13 13h1V8.5h-1V13z"/>
                  </svg>
                  <svg v-else-if="isWord(selectedItem.attachment)" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-3.06 9l-1.44-5.42L7.06 18H5.5l-2-8h1.6l1.34 5.48L7.9 10h1.2l1.44 5.48L11.9 10h1.58l-2 8h-1.54z"/>
                  </svg>
                  <svg v-else-if="isImage(selectedItem.attachment)" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
                  </svg>
                </div>
                <div class="lr-attachment-meta">
                  <span class="lr-attachment-name">{{ selectedItem.attachment }}</span>
                  <span class="lr-attachment-type">{{ attachmentTypeLabel(selectedItem.attachment) }}</span>
                </div>
                <button class="lr-attachment-dl-btn" :disabled="attachmentDownloading" @click="downloadAttachment(selectedItem)">
                  <span v-if="attachmentDownloading" class="lr-spinner-sm"></span>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
                  </svg>
                  {{ attachmentDownloading ? 'Downloading…' : 'Download' }}
                </button>
              </div>
              <div v-if="isImage(selectedItem.attachment) && attachmentPreviewUrl" class="lr-attachment-preview">
                <img :src="attachmentPreviewUrl" :alt="selectedItem.attachment" class="lr-attachment-img" />
              </div>
              <div v-else-if="isPdf(selectedItem.attachment) && attachmentPreviewUrl" class="lr-attachment-pdf-wrap">
                <iframe :src="attachmentPreviewUrl" class="lr-attachment-pdf" title="PDF Preview" frameborder="0"></iframe>
              </div>
              <div v-else-if="(isPdf(selectedItem.attachment) || isImage(selectedItem.attachment)) && !attachmentPreviewUrl" class="lr-attachment-preview-trigger">
                <button class="lr-preview-btn" :disabled="attachmentDownloading" @click="loadAttachmentPreview(selectedItem)">
                  <span v-if="attachmentDownloading" class="lr-spinner-sm"></span>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  {{ attachmentDownloading ? 'Loading preview…' : 'Preview file' }}
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="lr-form-section-title" style="margin-top:28px">Application Document</div>
            <div class="lr-no-attachment">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
              </svg>
              <span>No application document attached</span>
            </div>
          </template>

          <!-- ── Admin quick-action buttons (only if this role can act on this stage) ── -->
          <div v-if="canActOnRequest(selectedItem)" class="lr-view-admin-actions">
            <div class="lr-form-section-title" style="margin-top:28px">Your Action Required</div>
            <div class="lr-view-action-row">
              <button class="lr-view-action-btn lr-view-action-approve" @click="handleViewModalAction('approve')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
                Approve Request
              </button>
              <button class="lr-view-action-btn lr-view-action-reject" @click="handleViewModalAction('reject')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                Reject Request
              </button>
            </div>
          </div>

        </div>

        <div class="lr-modal-foot">
          <button class="lr-btn-cancel" @click="showViewModal = false">Close</button>
          <template v-if="canActOnRequest(selectedItem)">
            <button class="lr-btn-submit lr-btn-approve-submit" @click="handleViewModalAction('approve')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
              Approve
            </button>
            <button class="lr-btn-submit lr-btn-reject-submit" @click="handleViewModalAction('reject')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Reject
            </button>
          </template>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- ── Delete confirm modal ── -->
  <BaseModal
    v-model="showDeleteModal"
    mode="delete"
    entity-name="leave request"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This leave request will be permanently removed. This action cannot be undone."
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

const crudStore    = useCrudStore()
const baseApi      = process.env.VUE_APP_BASE_API ?? ''
const layoutRef    = ref(null)
const docFileInput = ref(null)

// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL PIPELINE DEFINITION
// Adjust roles / labels to match your backend's Spatie role names exactly.
// stage index maps to approval_steps[].stage on the API response.
// ─────────────────────────────────────────────────────────────────────────────
const APPROVAL_STAGES = [
  { label: 'Team Lead',  roles: ['team_lead', 'manager']             },
  { label: 'Admin / HR', roles: ['admin', 'hr', 'superadmin']        },
  { label: 'CEO',        roles: ['ceo', 'super_admin', 'executive']   },
]

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
  } catch (e) {
    console.error('Could not load current user:', e)
  }
}

const userRoles = computed(() => {
  const roles = currentUser.value?.roles
  if (!Array.isArray(roles) || roles.length === 0) return []
  return roles.map(r => (typeof r === 'object' ? r?.name ?? '' : r).toLowerCase())
})

// The stage index (0-based) that this user is responsible for approving.
// Returns -1 if the user has no approver role in the pipeline.
const userApproverStage = computed(() => {
  for (let i = 0; i < APPROVAL_STAGES.length; i++) {
    if (APPROVAL_STAGES[i].roles.some(r => userRoles.value.includes(r))) return i
  }
  return -1
})

const isAdminUser = computed(() => userApproverStage.value >= 0)

// Can this user act on a specific request right now?
// True only when: user has an approver role AND the request's current_stage
// matches the user's stage AND overall_status is still in-progress.
const canActOnRequest = (item) => {
  if (!item) return false
  if (userApproverStage.value < 0) return false
  const overallOk = !['approved', 'rejected'].includes(item.overall_status)
  return overallOk && item.current_stage === userApproverStage.value
}

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

// ── Stats ─────────────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: 'Total',    value: pagination.value.total },
  { label: 'Pending',  value: items.value.filter(i => i.overall_status === 'pending' || i.status === 'pending').length  },
  { label: 'Approved', value: items.value.filter(i => i.overall_status === 'approved' || i.status === 'approved').length },
  { label: 'Rejected', value: items.value.filter(i => i.overall_status === 'rejected' || i.status === 'rejected').length },
])

const breadcrumbs = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Leave Requests' },
]

// ── Search / sort / pagination ────────────────────────────────────────────────
const searchFilters = ref({ search: '', status: '', date: '' })
const currentPage   = ref(1)
const itemsPerPage  = ref(10)
const sortConfig    = ref({ by: 'created_at', order: 'desc' })

// ── Modal state ───────────────────────────────────────────────────────────────
const showFormModal   = ref(false)
const showDeleteModal = ref(false)
const showViewModal   = ref(false)
const isEditMode      = ref(false)
const editItem        = ref(null)
const selectedItem    = ref({})
const formSaving      = ref(false)
const docDragOver     = ref(false)

const leavePolicies   = ref([])
const policiesLoading = ref(false)

const selectedPolicyLabel = computed(() => {
  if (!form.value.leave_policy_id) return ''
  const found = leavePolicies.value.find(p => String(p.value) === String(form.value.leave_policy_id))
  return found?.label ?? ''
})

// ── Approve / Reject modal ────────────────────────────────────────────────────
const showActionModal  = ref(false)
const actionModalMode  = ref('approve')
const actionItem       = ref(null)
const actionNotes      = ref('')
const actionSaving     = ref(false)
const actionModalNotif = ref({ show: false, type: 'success', message: '' })

const attachmentPreviewUrl  = ref(null)
const attachmentDownloading = ref(false)

const showActionModalNotif = (type, message) => {
  actionModalNotif.value = { show: true, type, message }
  setTimeout(() => { actionModalNotif.value.show = false }, 4000)
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the approval_step object for a given stage index, or null. */
const getStep = (item, stageIdx) => {
  return item?.approval_steps?.find(s => s.stage === stageIdx) ?? null
}

/** True when a stage has been approved. */
const stageIsDone = (item, stageIdx) => {
  const step = getStep(item, stageIdx)
  return step?.status === 'approved'
}

/** True when a stage has been rejected. */
const stageIsRejected = (item, stageIdx) => {
  const step = getStep(item, stageIdx)
  return step?.status === 'rejected'
}

/** Name of the next stage after the current one, or null if this is the last. */
const nextStageName = (item) => {
  const cur = item?.current_stage ?? 0
  return APPROVAL_STAGES[cur + 1]?.label ?? null
}

/** All steps that have already been approved (for the action modal summary). */
const previousApprovals = (item) => {
  return (item?.approval_steps ?? []).filter(s => s.status === 'approved')
}

// Overall badge (handles legacy single-status AND new multi-stage)
const overallBadgeLabel = (item) => {
  if (!item) return '—'
  const os = item.overall_status ?? item.status ?? 'pending'
  if (os === 'approved') return 'Approved'
  if (os === 'rejected') return 'Rejected'
  // Partially approved
  const cur = item.current_stage ?? 0
  if (cur > 0 && os !== 'rejected') return `In Review — Stage ${cur + 1}`
  return 'Pending'
}

const overallBadgeClass = (item) => {
  const os = item?.overall_status ?? item?.status ?? 'pending'
  if (os === 'approved') return 'lr-status-approved'
  if (os === 'rejected') return 'lr-status-rejected'
  const cur = item?.current_stage ?? 0
  if (cur > 0) return 'lr-status-inreview'
  return 'lr-status-pending'
}

// Mini stage dots in table
const stageDotClass = (step) => {
  if (step.status === 'approved') return 'lr-dot-approved'
  if (step.status === 'rejected') return 'lr-dot-rejected'
  if (step.status === 'pending')  return 'lr-dot-pending'
  return 'lr-dot-future'
}

// Pipeline progress bar in action modal
const pipelineStepClass = (item, idx) => {
  if (stageIsDone(item, idx))      return 'lr-pip-done'
  if (stageIsRejected(item, idx))  return 'lr-pip-rejected'
  if ((item?.current_stage ?? 0) === idx) return 'lr-pip-active'
  return 'lr-pip-future'
}

// Timeline step class in view modal
const timelineStepClass = (item, idx) => {
  if (stageIsDone(item, idx))      return 'lr-tl-done'
  if (stageIsRejected(item, idx))  return 'lr-tl-rejected'
  if ((item?.current_stage ?? 0) === idx && item?.overall_status !== 'rejected') return 'lr-tl-active'
  return 'lr-tl-future'
}

const timelinePillLabel = (item, idx) => {
  if (stageIsDone(item, idx))                                     return 'Approved'
  if (stageIsRejected(item, idx))                                  return 'Rejected'
  if ((item?.current_stage ?? 0) === idx && item?.overall_status !== 'rejected') return 'Awaiting review'
  if (item?.overall_status === 'rejected')                         return 'Skipped'
  return 'Pending'
}

const timelinePillClass = (item, idx) => {
  if (stageIsDone(item, idx))     return 'lr-pill-approved'
  if (stageIsRejected(item, idx)) return 'lr-pill-rejected'
  if ((item?.current_stage ?? 0) === idx && item?.overall_status !== 'rejected') return 'lr-pill-active'
  return 'lr-pill-future'
}

// ── Open action modal ─────────────────────────────────────────────────────────
const openActionModal = (item, mode) => {
  if (!canActOnRequest(item)) {
    const os = item?.overall_status ?? item?.status ?? 'pending'
    if (os === 'approved') { notify('warning', 'This request has already been fully approved.', { autoClose: 3000 }); return }
    if (os === 'rejected') { notify('warning', 'This request has already been rejected.', { autoClose: 3000 }); return }
    notify('warning', 'This request is not at your approval stage yet.', { autoClose: 3000 })
    return
  }
  actionItem.value            = { ...item }
  actionModalMode.value       = mode
  actionNotes.value           = ''
  actionModalNotif.value.show = false
  showActionModal.value       = true
}

const handleViewModalAction = (mode) => {
  const item = { ...selectedItem.value }
  showViewModal.value = false
  setTimeout(() => openActionModal(item, mode), 80)
}

const submitAction = async () => {
  if (actionModalMode.value === 'reject' && !actionNotes.value.trim()) {
    showActionModalNotif('error', 'A rejection reason is required.')
    return
  }
  actionSaving.value = true
  try {
    const payload = {
      status: actionModalMode.value === 'approve' ? 'approved' : 'rejected',
      stage:  actionItem.value.current_stage ?? 0,
      ...(actionNotes.value.trim() && { notes: actionNotes.value.trim() }),
    }
    // PUT /leave/approvals/{id}/status — backend advances current_stage on approval
    await apiFetch(`/leave/approvals/${actionItem.value.id}/status`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    showActionModal.value = false
    const nextName = nextStageName(actionItem.value)
    const msg = payload.status === 'approved'
      ? (nextName
          ? `Approved at Stage ${(actionItem.value.current_stage ?? 0) + 1}. Forwarded to ${nextName}.`
          : 'Leave request fully approved.')
      : 'Leave request rejected and employee notified.'
    notify('success', msg, { autoClose: 4000 })
    await loadData()
  } catch (e) {
    const errData = e?.data
    const msg = errData?.errors
      ? Object.entries(errData.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
      : errData?.message || 'Action failed. Please try again.'
    showActionModalNotif('error', msg)
  } finally {
    actionSaving.value = false
  }
}

// ── Form ──────────────────────────────────────────────────────────────────────
const defaultForm = () => ({
  leave_policy_id: '',
  start_date:      '',
  end_date:        '',
  total_days:      '',
  reason:          '',
  document:        null,
})
const form = ref(defaultForm())

// ── Table definitions ─────────────────────────────────────────────────────────
const filterFields = [
  { name: 'search', label: 'Reason', type: 'text', placeholder: 'Search by reason…' },
  {
    name: 'status', label: 'Status', type: 'select', placeholder: 'All Status',
    options: [
      { value: 'pending',  label: 'Pending'  },
      { value: 'inreview', label: 'In Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
    ],
  },
  { name: 'date', label: 'Date', type: 'date' },
]

const tableColumns = [
  { key: 'id',         label: 'ID',       sortable: true,  width: '60px',  minWidth: '60px'  },
  { key: 'policy',     label: 'Policy',   type: 'custom',  sortable: false, width: '190px', minWidth: '140px' },
  { key: 'duration',   label: 'Duration', type: 'custom',  sortable: false, width: '200px', minWidth: '160px' },
  { key: 'reason',     label: 'Reason',   sortable: false, width: '180px', minWidth: '120px' },
  { key: 'attachment', label: 'File',     type: 'custom',  sortable: false, width: '70px',  minWidth: '70px',  align: 'center' },
  { key: 'status',     label: 'Status',   type: 'custom',  sortable: true,  width: '140px', minWidth: '120px', align: 'center' },
  { key: 'actions',    label: 'Actions',  type: 'actions', sortable: false, width: '220px', minWidth: '220px', align: 'center' },
]

const tableActions = computed(() => [
  { name: 'view',    label: 'View',    class: 'btn-view'    },
  { name: 'edit',    label: 'Edit',    class: 'btn-edit'    },
  ...(isAdminUser.value
    ? [
        { name: 'approve', label: 'Approve', class: 'btn-approve' },
        { name: 'reject',  label: 'Reject',  class: 'btn-reject'  },
      ]
    : []
  ),
  { name: 'delete',  label: 'Delete',  class: 'btn-delete'  },
])

const paginatedData = computed(() => items.value)

// ── Attachment helpers ────────────────────────────────────────────────────────
const isPdf   = (name) => /\.pdf$/i.test(name ?? '')
const isWord  = (name) => /\.(doc|docx)$/i.test(name ?? '')
const isImage = (name) => /\.(jpe?g|png|gif|webp)$/i.test(name ?? '')

const attachmentTypeLabel = (name) => {
  if (isPdf(name))   return 'PDF Document'
  if (isWord(name))  return 'Word Document'
  if (isImage(name)) return 'Image File'
  return 'File'
}

const attachmentIconClass = (name) => {
  if (isPdf(name))   return 'lr-file-pdf'
  if (isWord(name))  return 'lr-file-word'
  if (isImage(name)) return 'lr-file-image'
  return 'lr-file-generic'
}

const loadAttachmentPreview = async (item) => {
  if (!item?.id) return
  attachmentDownloading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${baseApi}/leave/requests/${item.id}/attachment`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error(`Server returned ${res.status}`)
    const blob = await res.blob()
    if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value)
    attachmentPreviewUrl.value = URL.createObjectURL(blob)
  } catch {
    notify('error', 'Could not load file preview.')
  } finally {
    attachmentDownloading.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const formatDateTime = (d) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return d }
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024)    return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

const recalcDays = () => {
  if (!form.value.start_date || !form.value.end_date) return
  const s = new Date(form.value.start_date)
  const e = new Date(form.value.end_date)
  if (e >= s) form.value.total_days = Math.round((e - s) / 86400000) + 1
}

const handleDocSelect = (ev) => {
  const file = ev.target.files?.[0]
  if (file) form.value.document = file
  ev.target.value = ''
}

const handleDocDrop = (ev) => {
  docDragOver.value = false
  const file = ev.dataTransfer.files?.[0]
  if (file) form.value.document = file
}

const downloadAttachment = async (item) => {
  if (!item?.attachment && !item?.id) return
  attachmentDownloading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${baseApi}/leave/requests/${item.id}/attachment`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error(`Server returned ${res.status}`)
    const blob        = await res.blob()
    const contentDisp = res.headers.get('content-disposition') ?? ''
    const match       = contentDisp.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i)
    const filename    = match?.[1]?.trim() || item.attachment || `leave-request-${item.id}`
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; a.download = decodeURIComponent(filename)
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  } catch {
    notify('error', 'Could not download the file. Please try again.')
  } finally {
    attachmentDownloading.value = false
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────
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
  const result = await crudStore.fetchAll('/leave/requests', params)
  if (!result.success) { notify('error', result.error?.message || 'Failed to load leave requests.'); return }
  pagination.value = result.data?.pagination ?? {
    current_page: currentPage.value, total_pages: 1,
    total: items.value.length, per_page: itemsPerPage.value,
  }
}

const loadLeavePolicies = async () => {
  policiesLoading.value = true
  try {
    const data = await apiFetch('/system/leave-policies')
    const raw  = data.policies ?? data.data ?? data ?? []
    leavePolicies.value = Array.isArray(raw)
      ? raw.map(p => ({ value: p.id, label: p.name ?? p.label, ...p }))
      : []
  } catch (e) {
    console.error('Failed to load leave policies:', e)
    leavePolicies.value = []
  } finally {
    policiesLoading.value = false
  }
}

// ── Modal openers ─────────────────────────────────────────────────────────────
const openCreateModal = () => {
  isEditMode.value      = false
  editItem.value        = null
  form.value            = defaultForm()
  modalNotif.value.show = false
  showFormModal.value   = true
}

const openEditModal = async (item) => {
  const os = item.overall_status ?? item.status ?? 'pending'
  if (os !== 'pending' || (item.current_stage ?? 0) > 0) {
    notify('warning', 'Only requests that have not entered the approval pipeline can be edited.', { autoClose: 3500 })
    return
  }
  try {
    const res = await apiFetch(`/leave/requests/${item.id}`)
    const r   = res.data ?? res
    isEditMode.value = true
    editItem.value   = r
    form.value = {
      leave_policy_id: r.leave_policy_id != null ? Number(r.leave_policy_id) : '',
      start_date:      r.start_date  ?? '',
      end_date:        r.end_date    ?? '',
      total_days:      r.total_days  ?? '',
      reason:          r.reason      ?? '',
      document:        null,
    }
    modalNotif.value.show = false
    showFormModal.value   = true
  } catch (e) {
    notify('error', e?.data?.message || 'Could not load request.')
  }
}

const openDeleteModal = (item) => {
  const os = item.overall_status ?? item.status ?? 'pending'
  if (os === 'approved') {
    notify('warning', 'Approved requests cannot be deleted.', { autoClose: 3000 })
    return
  }
  selectedItem.value    = { ...item }
  showDeleteModal.value = true
}

const openViewModal = async (item) => {
  if (attachmentPreviewUrl.value) {
    URL.revokeObjectURL(attachmentPreviewUrl.value)
    attachmentPreviewUrl.value = null
  }
  attachmentDownloading.value = false
  try {
    const res = await apiFetch(`/leave/requests/${item.id}`)
    selectedItem.value  = { ...(res.data ?? res) }
    showViewModal.value = true
    if (selectedItem.value?.attachment && isImage(selectedItem.value.attachment)) {
      loadAttachmentPreview(selectedItem.value)
    }
  } catch (e) {
    notify('error', e?.data?.message || 'Could not load request.')
  }
}

const closeFormModal = () => {
  showFormModal.value   = false
  modalNotif.value.show = false
}

// ── Submit ────────────────────────────────────────────────────────────────────
const submitForm = async () => {
  if (!form.value.leave_policy_id)                                { showModalNotif('error', 'Please select a leave policy.'); return }
  if (!form.value.start_date)                                     { showModalNotif('error', 'Start date is required.'); return }
  if (!form.value.end_date)                                       { showModalNotif('error', 'End date is required.'); return }
  if (!form.value.total_days || parseFloat(form.value.total_days) < 0.5) {
    showModalNotif('error', 'Total days must be at least 0.5.'); return
  }
  formSaving.value = true
  try {
    const fd = new FormData()
    fd.append('leave_policy_id', form.value.leave_policy_id)
    fd.append('start_date',      form.value.start_date)
    fd.append('end_date',        form.value.end_date)
    fd.append('total_days',      parseFloat(form.value.total_days))
    if (form.value.reason)   fd.append('reason',   form.value.reason)
    if (form.value.document) fd.append('document', form.value.document)

    let result
    if (isEditMode.value) {
      fd.append('_method', 'PUT')
      result = await crudStore.post(`/leave/requests/${editItem.value.id}`, fd)
    } else {
      result = await crudStore.create('/leave/requests', fd)
    }
    if (!result.success) throw new Error(result.error?.message ?? 'Request failed')
    closeFormModal()
    notify('success', isEditMode.value ? 'Leave request updated.' : 'Leave request submitted.', { autoClose: 3000 })
    await loadData()
  } catch (e) {
    const errData = e?.data ?? e?.response?.data
    const msg = e?.message || (errData?.errors
      ? Object.entries(errData.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
      : errData?.message || 'Save failed.')
    showModalNotif('error', msg)
  } finally {
    formSaving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete('/leave/requests/', data.id)
  if (!result.success) throw new Error(result.error?.message ?? 'Delete failed')
  return result.data
}

const handleDeleteSuccess = () => {
  showDeleteModal.value = false
  notify('success', 'Leave request deleted.', { autoClose: 3000 })
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
const handleSearch         = () => { currentPage.value = 1; loadData() }
const handleReset          = () => { searchFilters.value = { search: '', status: '', date: '' }; currentPage.value = 1; loadData() }
const handleSort           = (s) => { sortConfig.value = s; currentPage.value = 1; loadData() }
const handlePageChange     = (page) => { currentPage.value = page; loadData() }
const handlePageSizeChange = (pageSize) => { itemsPerPage.value = pageSize; currentPage.value = 1; loadData() }

const handleAction = ({ action, row }) => {
  const map = {
    view:    openViewModal,
    edit:    openEditModal,
    delete:  openDeleteModal,
    approve: (item) => openActionModal(item, 'approve'),
    reject:  (item) => openActionModal(item, 'reject'),
  }
  map[action]?.(row)
}

onMounted(async () => {
  await loadCurrentUser()
  await Promise.all([loadData(), loadLeavePolicies()])
})

onBeforeUnmount(() => {
  crudStore.clearCurrentItem()
  if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value)
})
</script>

<style scoped>
/* ── Policy cell ── */
.policy-cell { display: flex; flex-direction: column; gap: 3px; }
.policy-name { font-size: 12px; color: #E8D5B0; font-weight: 500; }
.policy-type {
  display: inline-block; padding: 1px 7px; font-size: 9px; font-weight: 500;
  letter-spacing: .05em; text-transform: uppercase;
  background: rgba(133,183,235,0.08); border: 1px solid rgba(133,183,235,0.22);
  color: rgba(133,183,235,0.75); white-space: nowrap; width: fit-content;
}

/* ── Duration cell ── */
.duration-cell  { display: flex; flex-direction: column; gap: 3px; }
.duration-dates { font-size: 11px; color: rgba(240,234,224,0.50); }
.duration-days  {
  display: inline-block; padding: 1px 7px; font-size: 11px; font-weight: 600;
  font-family: 'Georgia', serif;
  background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.25);
  color: rgba(167,139,250,0.90); width: fit-content;
}

/* ── Status badges ── */
.lr-status-badge {
  display: inline-block; padding: 3px 9px; font-size: 10px; font-weight: 600;
  letter-spacing: .07em; text-transform: uppercase; border: 1px solid;
}
.lr-status-pending  { color: #E8B84B; border-color: rgba(232,184,75,0.35);  background: rgba(232,184,75,0.08);  }
.lr-status-inreview { color: #85B7EB; border-color: rgba(133,183,235,0.35); background: rgba(133,183,235,0.08); }
.lr-status-approved { color: #6ECFA9; border-color: rgba(110,207,169,0.35); background: rgba(110,207,169,0.08); }
.lr-status-rejected { color: #EF6B6B; border-color: rgba(239,107,107,0.35); background: rgba(239,107,107,0.08); }

/* ── Pipeline cell (table) ── */
.lr-pipeline-cell { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.lr-stage-dots { display: flex; gap: 4px; }
.lr-stage-dot {
  width: 8px; height: 8px; border-radius: 50%; border: 1px solid;
}
.lr-dot-approved { background: rgba(110,207,169,0.40); border-color: rgba(110,207,169,0.70); }
.lr-dot-rejected { background: rgba(239,107,107,0.40); border-color: rgba(239,107,107,0.70); }
.lr-dot-pending  { background: rgba(232,184,75,0.30);  border-color: rgba(232,184,75,0.60);  }
.lr-dot-future   { background: rgba(240,234,224,0.06); border-color: rgba(240,234,224,0.18); }

/* ── Table layout ── */
:deep(table) { table-layout: auto; width: 100%; }
:deep(td .cell-text)    { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
:deep(td .cell-actions) { white-space: nowrap; overflow: visible; }

:deep(.btn-approve) {
  background: rgba(110,207,169,0.10) !important; border-color: rgba(110,207,169,0.40) !important; color: #6ECFA9 !important;
}
:deep(.btn-approve:hover) { background: rgba(110,207,169,0.20) !important; }
:deep(.btn-reject) {
  background: rgba(239,107,107,0.10) !important; border-color: rgba(239,107,107,0.40) !important; color: #EF6B6B !important;
}
:deep(.btn-reject:hover) { background: rgba(239,107,107,0.20) !important; }

/* ── Download button ── */
.lr-dl-btn {
  width: 30px; height: 30px; background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.35);
  color: #C9A96E; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all .14s;
}
.lr-dl-btn:hover { background: rgba(201,169,110,0.22); border-color: rgba(201,169,110,0.60); }
.lr-no-file { font-size: 12px; color: rgba(240,234,224,0.20); }

.lr-inline-dl-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; font-size: 10px;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.30);
  color: #C9A96E; cursor: pointer; transition: all .13s; margin-left: 6px;
}
.lr-inline-dl-btn:hover { background: rgba(201,169,110,0.20); }

.lr-policies-loading {
  display: flex; align-items: center; gap: 8px; padding: 10px 13px;
  border: 1px solid rgba(201,169,110,0.14); background: rgba(18,18,24,0.98);
}

/* ══════════════════════════════════════════════════
   PIPELINE PROGRESS BAR (action modal)
══════════════════════════════════════════════════ */
.lr-pipeline-progress {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px; position: relative;
}
.lr-pip-step {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; flex: 1; position: relative;
}
.lr-pip-circle {
  width: 32px; height: 32px; border-radius: 50%; border: 2px solid;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; z-index: 1; background: #17171D;
  transition: all .2s;
}
.lr-pip-dot   { width: 8px; height: 8px; border-radius: 50%; }
.lr-pip-num   { font-size: 11px; }
.lr-pip-label { font-size: 10px; letter-spacing: .04em; text-align: center; white-space: nowrap; }
.lr-pip-line  {
  position: absolute; top: 16px; left: calc(50% + 16px);
  width: calc(100% - 32px); height: 2px;
  background: rgba(240,234,224,0.10); z-index: 0; transition: background .2s;
}
.lr-pip-line--done  { background: rgba(110,207,169,0.50); }

.lr-pip-done     .lr-pip-circle { border-color: rgba(110,207,169,0.70); color: #6ECFA9; }
.lr-pip-done     .lr-pip-dot    { background: #6ECFA9; }
.lr-pip-done     .lr-pip-label  { color: rgba(110,207,169,0.80); }
.lr-pip-rejected .lr-pip-circle { border-color: rgba(239,107,107,0.70); color: #EF6B6B; }
.lr-pip-rejected .lr-pip-label  { color: rgba(239,107,107,0.80); }
.lr-pip-active   .lr-pip-circle { border-color: rgba(201,169,110,0.80); color: #C9A96E; box-shadow: 0 0 0 3px rgba(201,169,110,0.12); }
.lr-pip-active   .lr-pip-dot    { background: #C9A96E; animation: lr-pulse 1.4s ease-in-out infinite; }
.lr-pip-active   .lr-pip-label  { color: #C9A96E; }
.lr-pip-future   .lr-pip-circle { border-color: rgba(240,234,224,0.15); color: rgba(240,234,224,0.25); }
.lr-pip-future   .lr-pip-label  { color: rgba(240,234,224,0.25); }

@keyframes lr-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .6; transform: scale(0.8); }
}

/* Previous approvals in action modal */
.lr-prev-approvals { margin-top: 16px; }
.lr-prev-approval-row {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 12px; background: rgba(110,207,169,0.05);
  border: 1px solid rgba(110,207,169,0.12); margin-bottom: 4px;
}
.lr-prev-role  { font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: rgba(240,234,224,0.35); min-width: 70px; }
.lr-prev-check { color: #6ECFA9; font-size: 13px; }
.lr-prev-name  { font-size: 12px; color: rgba(240,234,224,0.70); flex: 1; }
.lr-prev-date  { font-size: 10px; color: rgba(240,234,224,0.28); white-space: nowrap; }

/* Next stage hint */
.lr-next-stage-hint {
  display: flex; align-items: flex-start; gap: 8px;
  margin-top: 14px; padding: 10px 14px;
  background: rgba(133,183,235,0.06); border: 1px solid rgba(133,183,235,0.18);
  color: rgba(133,183,235,0.75); font-size: 11px; line-height: 1.5;
}
.lr-next-stage-hint svg { flex-shrink: 0; margin-top: 1px; }
.lr-next-stage-hint strong { color: rgba(133,183,235,0.95); }
.lr-next-stage-hint--final {
  background: rgba(110,207,169,0.06) !important;
  border-color: rgba(110,207,169,0.18) !important;
  color: rgba(110,207,169,0.75) !important;
}
.lr-next-stage-hint--final strong { color: rgba(110,207,169,0.95) !important; }

/* ══════════════════════════════════════════════════
   APPROVAL TIMELINE (view modal)
══════════════════════════════════════════════════ */
.lr-timeline { display: flex; flex-direction: column; }

.lr-timeline-step {
  display: flex; gap: 16px; padding-bottom: 4px;
}
.lr-timeline-step:last-child .lr-tl-line { display: none; }

.lr-tl-left {
  display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 32px;
}
.lr-tl-circle {
  width: 32px; height: 32px; border-radius: 50%; border: 2px solid;
  display: flex; align-items: center; justify-content: center;
  background: #17171D; flex-shrink: 0; transition: all .2s;
}
.lr-tl-line {
  width: 2px; flex: 1; min-height: 24px;
  background: rgba(240,234,224,0.08); margin: 4px 0;
}
.lr-tl-line--done { background: rgba(110,207,169,0.35); }

.lr-tl-active-dot { width: 9px; height: 9px; border-radius: 50%; background: #C9A96E; animation: lr-pulse 1.4s ease-in-out infinite; }
.lr-tl-future-num { font-size: 11px; color: rgba(240,234,224,0.25); }

.lr-tl-done     .lr-tl-circle { border-color: rgba(110,207,169,0.70); color: #6ECFA9; }
.lr-tl-rejected .lr-tl-circle { border-color: rgba(239,107,107,0.70); color: #EF6B6B; }
.lr-tl-active   .lr-tl-circle { border-color: rgba(201,169,110,0.80); color: #C9A96E; box-shadow: 0 0 0 3px rgba(201,169,110,0.10); }
.lr-tl-future   .lr-tl-circle { border-color: rgba(240,234,224,0.12); color: rgba(240,234,224,0.20); }
.lr-tl-done     .lr-tl-line   { background: rgba(110,207,169,0.35); }

.lr-tl-content { flex: 1; padding-bottom: 20px; }
.lr-tl-header  { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; padding-top: 6px; }
.lr-tl-role    { font-size: 13px; font-weight: 600; color: rgba(240,234,224,0.78); }

/* Timeline pills */
.lr-tl-pill {
  display: inline-block; padding: 2px 8px; font-size: 9px; font-weight: 600;
  letter-spacing: .06em; text-transform: uppercase; border: 1px solid;
}
.lr-pill-approved { color: #6ECFA9; border-color: rgba(110,207,169,0.35); background: rgba(110,207,169,0.08); }
.lr-pill-rejected { color: #EF6B6B; border-color: rgba(239,107,107,0.35); background: rgba(239,107,107,0.08); }
.lr-pill-active   { color: #E8B84B; border-color: rgba(232,184,75,0.35);  background: rgba(232,184,75,0.08);  }
.lr-pill-future   { color: rgba(240,234,224,0.25); border-color: rgba(240,234,224,0.10); background: transparent; }

.lr-tl-meta {
  display: flex; flex-wrap: wrap; gap: 12px;
  margin-bottom: 6px;
}
.lr-tl-who, .lr-tl-when {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: rgba(240,234,224,0.45);
}
.lr-tl-note {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 11px; color: rgba(240,234,224,0.50); line-height: 1.5;
  padding: 6px 10px; border-left: 2px solid rgba(201,169,110,0.22);
  background: rgba(201,169,110,0.04); margin-top: 4px;
}
.lr-tl-awaiting {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; color: rgba(232,184,75,0.60);
}
.lr-tl-awaiting-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(232,184,75,0.60); animation: lr-pulse 1.4s ease-in-out infinite;
}
.lr-tl-future {
  font-size: 11px; color: rgba(240,234,224,0.22); font-style: italic;
}

/* Admin action row in view modal */
.lr-view-admin-actions { }
.lr-view-action-row { display: flex; gap: 12px; flex-wrap: wrap; }
.lr-view-action-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 20px; font-size: 12px; font-weight: 500; letter-spacing: .05em; text-transform: uppercase;
  cursor: pointer; transition: all .14s; border: 1px solid;
}
.lr-view-action-approve { background: rgba(110,207,169,0.10); border-color: rgba(110,207,169,0.40); color: #6ECFA9; }
.lr-view-action-approve:hover { background: rgba(110,207,169,0.20); }
.lr-view-action-reject  { background: rgba(239,107,107,0.10); border-color: rgba(239,107,107,0.40); color: #EF6B6B; }
.lr-view-action-reject:hover  { background: rgba(239,107,107,0.20); }

/* ══════════════════════════════════════════════════
   SHARED MODAL BASE
══════════════════════════════════════════════════ */
.lr-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 40px 16px; z-index: 9999; overflow-y: auto;
}
.lr-modal-shell {
  background: #17171D; border: 1px solid rgba(201,169,110,0.25);
  width: 100%; max-width: 680px; display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.65);
}
.lr-action-shell { max-width: 600px; }
.lr-view-shell   { max-width: 760px; }

.lr-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 26px 16px; border-bottom: 1px solid rgba(201,169,110,0.15); flex-shrink: 0;
}
.lr-modal-head-left { display: flex; align-items: center; gap: 12px; }
.lr-modal-icon {
  width: 36px; height: 36px; flex-shrink: 0;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.28);
  display: flex; align-items: center; justify-content: center; color: #C9A96E;
}
.lr-icon-approve { background: rgba(110,207,169,0.10) !important; border-color: rgba(110,207,169,0.35) !important; color: #6ECFA9 !important; }
.lr-icon-reject  { background: rgba(239,107,107,0.10) !important; border-color: rgba(239,107,107,0.35) !important; color: #EF6B6B !important; }
.lr-icon-view    { background: rgba(133,183,235,0.10) !important; border-color: rgba(133,183,235,0.28) !important; color: rgba(133,183,235,0.85) !important; }

.lr-modal-title    { font-size: 15px; font-weight: 600; color: #F0EAE0; margin: 0; }
.lr-modal-subtitle { font-size: 11px; color: rgba(240,234,224,0.38); margin: 3px 0 0; }
.lr-modal-close {
  width: 30px; height: 30px; background: transparent; border: 1px solid rgba(240,234,224,0.12);
  color: rgba(240,234,224,0.40); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all .13s; flex-shrink: 0;
}
.lr-modal-close:hover { border-color: rgba(240,234,224,0.28); color: #F0EAE0; }
.lr-modal-close svg { width: 13px; height: 13px; }

.lr-modal-notif { padding: 10px 26px; font-size: 12px; flex-shrink: 0; }
.lr-notif-success { background: rgba(110,207,169,0.12); color: #6ECFA9; border-bottom: 1px solid rgba(110,207,169,0.20); }
.lr-notif-error   { background: rgba(239,107,107,0.12); color: #EF6B6B; border-bottom: 1px solid rgba(239,107,107,0.20); }

.lr-modal-body { padding: 24px 26px; overflow-y: auto; max-height: calc(100vh - 240px); }

/* Action summary card */
.lr-action-summary { background: rgba(255,255,255,0.03); border: 1px solid rgba(201,169,110,0.15); overflow: hidden; }
.lr-action-summary-row {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 11px 16px; border-bottom: 1px solid rgba(201,169,110,0.08);
}
.lr-action-summary-row:last-child { border-bottom: none; }
.lr-action-summary-label {
  font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  color: rgba(240,234,224,0.32); min-width: 78px; flex-shrink: 0; padding-top: 1px;
}
.lr-action-summary-val  { font-size: 12px; color: rgba(240,234,224,0.72); line-height: 1.5; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.lr-action-days {
  font-size: 11px; font-style: normal; font-weight: 600; font-family: 'Georgia', serif;
  color: rgba(167,139,250,0.85); padding: 1px 7px;
  border: 1px solid rgba(167,139,250,0.25); background: rgba(167,139,250,0.08);
}
.lr-action-dl-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; font-size: 11px;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.35);
  color: #C9A96E; cursor: pointer; transition: all .14s;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.lr-action-dl-btn:hover { background: rgba(201,169,110,0.20); }

/* ── View detail grid ── */
.lr-view-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  border: 1px solid rgba(201,169,110,0.15); overflow: hidden;
}
.lr-view-row {
  display: flex; flex-direction: column; gap: 5px;
  padding: 13px 16px; border-bottom: 1px solid rgba(201,169,110,0.08);
  border-right: 1px solid rgba(201,169,110,0.08);
}
.lr-view-row:nth-child(even) { border-right: none; }
.lr-view-row--full { grid-column: 1 / -1; border-right: none; }
.lr-view-label { font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: rgba(240,234,224,0.30); }
.lr-view-val   { font-size: 13px; color: rgba(240,234,224,0.78); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lr-view-sub   { font-style: normal; font-size: 10px; color: rgba(133,183,235,0.70); }
.lr-view-reason { line-height: 1.55; font-size: 12px; }

/* Attachment card */
.lr-attachment-card { border: 1px solid rgba(201,169,110,0.20); background: rgba(201,169,110,0.03); overflow: hidden; }
.lr-attachment-info {
  display: flex; align-items: center; gap: 14px; padding: 14px 18px;
  border-bottom: 1px solid rgba(201,169,110,0.10);
}
.lr-attachment-file-icon {
  width: 40px; height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  border: 1px solid; transition: all .14s;
}
.lr-file-pdf    { background: rgba(239,107,107,0.10); border-color: rgba(239,107,107,0.30); color: #EF6B6B; }
.lr-file-word   { background: rgba(133,183,235,0.10); border-color: rgba(133,183,235,0.30); color: rgba(133,183,235,0.85); }
.lr-file-image  { background: rgba(110,207,169,0.10); border-color: rgba(110,207,169,0.30); color: #6ECFA9; }
.lr-file-generic { background: rgba(201,169,110,0.10); border-color: rgba(201,169,110,0.30); color: #C9A96E; }
.lr-attachment-meta { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.lr-attachment-name { font-size: 13px; color: rgba(240,234,224,0.80); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lr-attachment-type { font-size: 10px; color: rgba(240,234,224,0.30); letter-spacing: .05em; text-transform: uppercase; }
.lr-attachment-dl-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 16px; flex-shrink: 0;
  background: rgba(201,169,110,0.12); border: 1px solid rgba(201,169,110,0.42);
  color: #C9A96E; font-size: 12px; font-weight: 500; letter-spacing: .04em;
  cursor: pointer; transition: all .14s;
}
.lr-attachment-dl-btn:hover:not(:disabled) { background: rgba(201,169,110,0.22); }
.lr-attachment-dl-btn:disabled { opacity: .5; cursor: not-allowed; }
.lr-attachment-preview { padding: 0; line-height: 0; }
.lr-attachment-img { width: 100%; max-height: 420px; object-fit: contain; background: rgba(0,0,0,0.40); display: block; }
.lr-attachment-pdf-wrap { padding: 0; }
.lr-attachment-pdf { width: 100%; height: 480px; border: none; display: block; }
.lr-attachment-preview-trigger {
  display: flex; justify-content: center; padding: 16px;
  border-top: 1px solid rgba(201,169,110,0.10); background: rgba(0,0,0,0.15);
}
.lr-preview-btn {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; font-size: 12px;
  background: rgba(133,183,235,0.08); border: 1px solid rgba(133,183,235,0.28);
  color: rgba(133,183,235,0.80); cursor: pointer; transition: all .14s;
}
.lr-preview-btn:hover:not(:disabled) { background: rgba(133,183,235,0.16); }
.lr-preview-btn:disabled { opacity: .5; cursor: not-allowed; }
.lr-no-attachment {
  display: flex; align-items: center; gap: 10px; padding: 18px;
  border: 1px dashed rgba(240,234,224,0.10); color: rgba(240,234,224,0.22); font-size: 12px;
}

/* ══════════════════════════════════════════════════
   FORM FIELDS
══════════════════════════════════════════════════ */
.lr-form-section-title {
  font-size: 10px; font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
  color: rgba(201,169,110,0.70); padding-bottom: 10px;
  border-bottom: 1px solid rgba(201,169,110,0.15); margin-bottom: 18px;
}
.lr-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.lr-form-field { display: flex; flex-direction: column; gap: 6px; }
.lr-field-full { grid-column: 1 / -1; }
.lr-form-label {
  font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
  color: rgba(240,234,224,0.45); display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
}
.lr-req { color: rgba(239,107,107,0.80); }
.lr-form-input, .lr-form-select, .lr-form-textarea {
  background: rgba(18,18,24,0.98); border: 1px solid rgba(201,169,110,0.22);
  color: #F0EAE0; font-size: 13px; padding: 10px 13px; outline: none;
  font-family: inherit; transition: border-color .14s; box-sizing: border-box; width: 100%;
}
.lr-form-input:focus, .lr-form-select:focus, .lr-form-textarea:focus { border-color: rgba(201,169,110,0.55); }
.lr-form-input::placeholder, .lr-form-textarea::placeholder { color: rgba(240,234,224,0.22); }
.lr-form-input:disabled, .lr-form-select:disabled { opacity: .45; cursor: not-allowed; }
.lr-form-select {
  cursor: pointer; appearance: none; -webkit-appearance: none; padding-right: 30px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(201,169,110,0.55)'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; background-color: rgba(18,18,24,0.98);
}
.lr-form-select option { background: #17171D; color: #F0EAE0; }
.lr-form-textarea { resize: vertical; min-height: 80px; }
.lr-field-hint { font-size: 10px; color: rgba(240,234,224,0.28); letter-spacing: .02em; }
.lr-hint-warn  { color: rgba(232,184,75,0.70) !important; }

.lr-duration-strip {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  margin-top: 16px; padding: 14px 18px;
  background: rgba(201,169,110,0.05); border: 1px solid rgba(201,169,110,0.15);
}
.lr-dur-item      { display: flex; flex-direction: column; gap: 3px; }
.lr-dur-label     { font-size: 10px; letter-spacing: .07em; text-transform: uppercase; color: rgba(240,234,224,0.28); }
.lr-dur-value     { font-size: 13px; color: rgba(240,234,224,0.78); }
.lr-dur-highlight { font-size: 18px; font-weight: 600; color: #C9A96E; font-family: 'Georgia', serif; }
.lr-dur-arrow     { font-size: 16px; color: rgba(201,169,110,0.38); margin-top: 14px; }
.lr-dur-divider   { width: 1px; height: 36px; background: rgba(201,169,110,0.18); margin: 0 4px; }

.lr-doc-dropzone {
  border: 1px dashed rgba(201,169,110,0.28); position: relative; cursor: pointer;
  transition: border-color .15s, background .15s; min-height: 96px;
  display: flex; align-items: center;
}
.lr-doc-dropzone:hover,
.lr-doc-dropzone--active { border-color: rgba(201,169,110,0.58); background: rgba(201,169,110,0.04); }
.lr-doc-dropzone--filled  { border-style: solid; border-color: rgba(201,169,110,0.32); }
.lr-doc-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
.lr-doc-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 26px; width: 100%; text-align: center;
}
.lr-doc-icon { color: rgba(201,169,110,0.22); }
.lr-doc-placeholder-text  { display: flex; flex-direction: column; gap: 4px; }
.lr-doc-placeholder-main  { font-size: 12px; color: rgba(240,234,224,0.42); }
.lr-doc-placeholder-sub   { font-size: 10px; color: rgba(240,234,224,0.20); letter-spacing: .07em; text-transform: uppercase; }
.lr-doc-selected { display: flex; align-items: center; gap: 14px; padding: 14px 18px; width: 100%; }
.lr-doc-selected-icon {
  width: 36px; height: 36px; flex-shrink: 0;
  background: rgba(201,169,110,0.10); border: 1px solid rgba(201,169,110,0.25);
  display: flex; align-items: center; justify-content: center; color: #C9A96E;
}
.lr-doc-selected-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.lr-doc-selected-name { font-size: 13px; color: rgba(240,234,224,0.78); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lr-doc-selected-size { font-size: 10px; color: rgba(240,234,224,0.28); }
.lr-doc-remove {
  width: 28px; height: 28px; flex-shrink: 0;
  background: rgba(239,107,107,0.10); border: 1px solid rgba(239,107,107,0.28);
  color: rgba(239,107,107,0.70); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all .13s; z-index: 1;
}
.lr-doc-remove:hover { background: rgba(239,107,107,0.18); color: #EF6B6B; }
.lr-existing-file {
  display: flex; align-items: center; gap: 7px; margin-top: 8px;
  font-size: 11px; color: rgba(240,234,224,0.38);
}
.lr-existing-file svg { color: rgba(201,169,110,0.40); flex-shrink: 0; }

/* Modal footer */
.lr-modal-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 26px; border-top: 1px solid rgba(201,169,110,0.12); flex-shrink: 0;
}
.lr-btn-cancel {
  padding: 9px 20px; background: transparent; border: 1px solid rgba(240,234,224,0.15);
  color: rgba(240,234,224,0.50); font-size: 12px; cursor: pointer; letter-spacing: .05em; transition: all .13s;
}
.lr-btn-cancel:hover { border-color: rgba(240,234,224,0.30); color: rgba(240,234,224,0.75); }
.lr-btn-submit {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 22px; background: rgba(201,169,110,0.14); border: 1px solid rgba(201,169,110,0.50);
  color: #C9A96E; font-size: 12px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  cursor: pointer; transition: all .14s;
}
.lr-btn-submit:hover:not(:disabled) { background: rgba(201,169,110,0.22); }
.lr-btn-submit:disabled { opacity: .45; cursor: not-allowed; }
.lr-btn-approve-submit {
  background: rgba(110,207,169,0.12) !important; border-color: rgba(110,207,169,0.45) !important; color: #6ECFA9 !important;
}
.lr-btn-approve-submit:hover:not(:disabled) { background: rgba(110,207,169,0.22) !important; }
.lr-btn-reject-submit {
  background: rgba(239,107,107,0.12) !important; border-color: rgba(239,107,107,0.45) !important; color: #EF6B6B !important;
}
.lr-btn-reject-submit:hover:not(:disabled) { background: rgba(239,107,107,0.20) !important; }

.lr-spinner-sm {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.15);
  border-top-color: currentColor; border-radius: 50%; animation: lrspin .6s linear infinite;
}
@keyframes lrspin { to { transform: rotate(360deg); } }
</style>