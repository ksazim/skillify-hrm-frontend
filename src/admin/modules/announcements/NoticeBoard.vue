<template>
  <CrudLayout
    title="Notice Board"
    subtitle="Active announcements for you"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading notices"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to load notices"
    :has-data="!!notices.length"
    :show-add-button="false"
    @retry="loadNotices"
  >
    <!-- Icon -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    </template>

    <!-- Notice cards grid -->
    <div class="notice-grid">
      <div
        v-for="notice in notices"
        :key="notice.id"
        class="notice-card"
        tabindex="0"
        role="button"
        :aria-label="`Read notice: ${notice.name}`"
        @click="openNotice(notice)"
        @keydown.enter.prevent="openNotice(notice)"
        @keydown.space.prevent="openNotice(notice)"
      >
        <div class="notice-card-top">
          <h3 class="notice-title">{{ notice.name }}</h3>
          <span :class="['status-badge', `status-${notice.status}`]">
            {{ notice.status }}
          </span>
        </div>

        <p class="notice-snippet">{{ notice.details }}</p>

        <div class="notice-footer">
          <span class="notice-date">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{ formatDate(notice.created_at) }}
          </span>
          <div class="notice-card-actions">
            <span v-if="notice.attachment" class="attach-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              Attachment
            </span>
            <button class="read-btn" tabindex="-1">
              Read
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="!isLoading && !notices.length" class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <p>No notices at this time</p>
      </div>
    </div>
  </CrudLayout>

  <!-- Read modal -->
  <BaseModal
    v-model="showViewModal"
    mode="view"
    entity-name="notice"
    :fields="viewFields"
    :initial-data="selectedNotice"
    size="large"
  >
    <template #view-content>
      <div v-if="selectedNotice" class="modal-notice">
        <div class="modal-meta">
          <span :class="['status-badge', `status-${selectedNotice.status}`]">
            {{ selectedNotice.status }}
          </span>
          <span class="notice-date">
            {{ formatDate(selectedNotice.created_at) }}
          </span>
        </div>

        <div class="modal-body">{{ selectedNotice.details }}</div>

        <div v-if="selectedNotice.attachment" class="modal-attachment">
          <a :href="selectedNotice.attachment" target="_blank" rel="noopener" class="attachment-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            {{ selectedNotice.attachment }}
          </a>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted, defineOptions } from "vue";
import axios from "axios";
import CrudLayout from "../components/CrudLayout.vue";
import BaseModal from "../components/ActionModalComponent.vue";

defineOptions({ name: "NoticeBoard" });

// ── State ────────────────────────────────────────────────────────────────────
const notices        = ref([]);
const isLoading      = ref(false);
const hasError       = ref(false);
const errorMessage   = ref("");
const showViewModal  = ref(false);
const selectedNotice = ref(null);

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Notice Board" },
];

// ── Header stats ──────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: "Total",           value: notices.value.length },
  { label: "With attachment", value: notices.value.filter((n) => n.attachment).length },
]);

// ── viewFields drives BaseModal field labels in view mode ─────────────────────
const viewFields = [
  { name: "name",    label: "Title" },
  { name: "details", label: "Content", type: "textarea" },
];

const baseApi = process.env.VUE_APP_BASE_API

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── API calls ─────────────────────────────────────────────────────────────────
const loadNotices = async () => {
  isLoading.value = true;
  hasError.value  = false;
  try {
    const { data } = await axios.get(`${baseApi}/notices/list`);
    notices.value = Array.isArray(data) ? data : (data.data ?? []);
  } catch (err) {
    hasError.value     = true;
    errorMessage.value =
      err.response?.data?.message || err.message || "Failed to load notices.";
  } finally {
    isLoading.value = false;
  }
};

const openNotice = async (notice) => {
  selectedNotice.value = notice;
  showViewModal.value  = true;
  try {
    const { data } = await axios.get(`${baseApi}/notices/single/${notice.id}`);
    selectedNotice.value = data;
  } catch (_) {
    // keep list data already shown
  }
};

onMounted(loadNotices);
</script>

<style scoped>
.notice-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-card {
  background: #131316;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: border-color 0.15s;
  outline: none;
}
.notice-card:hover,
.notice-card:focus-visible {
  border-color: rgba(0, 0, 0, 0.28);
}

.notice-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.notice-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
}

.notice-snippet {
  font-size: 13px;
  color: rgba(240, 234, 224, 0.65);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
}

.notice-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notice-card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notice-date {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(240, 234, 224, 0.45);
}

.attach-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(240, 234, 224, 0.4);
}

.read-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #63b3ed;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.read-btn:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 20px;
  white-space: nowrap;
}
.status-active {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}
.status-inactive {
  background: rgba(240, 234, 224, 0.06);
  border: 1px solid rgba(240, 234, 224, 0.15);
  color: rgba(240, 234, 224, 0.45);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(240, 234, 224, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  font-size: 14px;
}

.modal-notice {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.modal-body {
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  color: rgba(240, 234, 224, 0.75);
}

.modal-attachment {
  padding-top: 0.75rem;
  border-top: 0.5px solid rgba(240, 234, 224, 0.12);
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #90cdf4;
  text-decoration: none;
}
.attachment-link:hover {
  text-decoration: underline;
}
</style>