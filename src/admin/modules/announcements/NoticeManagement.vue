<template>
  <CrudLayout
    ref="layoutRef"
    title="Notice Management"
    subtitle="Manage and publish notices and announcements"
    add-label="New Notice"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading notices"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Notices"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >
    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
        />
      </svg>
    </template>

    <!-- ── Filters ── -->
    <template #filters>
      <FilterPanel
        title="Search & Filter"
        :fields="filterFields"
        v-model="searchFilters"
        @submit="handleSearch"
        @reset="handleReset"
      />
    </template>

    <!-- ── Table ── -->
    <DataTable
      :data="paginatedData"
      :columns="tableColumns"
      :actions="tableActions"
      result-label="notices"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Type cell -->
      <template #cell-type="{ value }">
        <span v-if="value" :class="['type-badge', `type-${value}`]">
          {{ value }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Audience cell -->
      <template #cell-audience="{ value }">
        <span v-if="value" class="audience-badge">
          {{ value }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Published At cell -->
      <template #cell-published_at="{ value }">
        <span
          :class="['publish-date', { 'publish-scheduled': isScheduled(value) }]"
        >
          {{ value ?? "—" }}
        </span>
      </template>
    </DataTable>

    <!-- ── Pagination ── -->
    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="pagination.total"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]"
        item-label="notices"
        :show-first-last="true"
        :show-labels="false"
        :show-jump-to="false"
        @update:page-size="handlePageSizeChange"
        @page-change="handlePageChange"
      />
    </template>
  </CrudLayout>

  <!-- ── Modals ── -->
  <BaseModal
    v-model="showFormModal"
    :mode="modalMode"
    entity-name="notice"
    :fields="formFields"
    :initial-data="selectedItem"
    :on-submit="handleFormSubmit"
    size="large"
    @success="handleModalSuccess"
    @error="handleModalError"
  />

  <BaseModal
    v-model="showDeleteModal"
    mode="delete"
    entity-name="notice"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This notice will be permanently removed from the system."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />

  <BaseModal
    v-model="showViewModal"
    mode="view"
    entity-name="notice"
    :fields="formFields"
    :initial-data="selectedItem"
    size="large"
  />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, defineOptions } from "vue";
import { useCrudStore } from "@/store/crud";
import CrudLayout from "../components/CrudLayout.vue";
import FilterPanel from "../components/FilterComponent.vue";
import DataTable from "../components/TableComponent.vue";
import Pagination from "../components/PaginationComponent.vue";
import BaseModal from "../components/ActionModalComponent.vue";

// Multi-word component name for eslint compliance
defineOptions({
  name: "NoticeManagement",
});

const crudStore = useCrudStore();
const layoutRef = ref(null);

// ── Modal state ──────────────────────────────────────────────────────────────
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const modalMode = ref("create");
const selectedItem = ref({});

// ── Notification ─────────────────────────────────────────────────────────────
const notification = ref({
  show: false,
  type: "info",
  title: "",
  message: "",
  autoClose: 0,
});

const notify = (type, message, { title = "", autoClose = 3000 } = {}) => {
  if (layoutRef.value?.showBanner) {
    layoutRef.value.showBanner(type, message, { title, autoClose });
    return;
  }
  notification.value = { show: false, type, title, message, autoClose };
  setTimeout(() => {
    notification.value = { show: true, type, title, message, autoClose };
  }, 0);
};

// ── Store computed ───────────────────────────────────────────────────────────
const items = computed(() => crudStore.getAllItems);
const isLoading = computed(() => crudStore.isLoading);
const hasError = computed(() => crudStore.hasError);
const errorMessage = computed(
  () => crudStore.getError?.message || "An error occurred",
);

// ── Pagination meta ───────────────────────────────────────────────────────────
const pagination = ref({
  current_page: 1,
  total_pages: 1,
  total: 0,
  per_page: 10,
});

// ── Header stats ─────────────────────────────────────────────────────────────
const pageStats = computed(() => [
  { label: "Total", value: pagination.value.total },
  {
    label: "Published",
    value: items.value.filter((i) => i.status === "published").length,
  },
  {
    label: "Draft",
    value: items.value.filter((i) => i.status === "draft").length,
  },
  {
    label: "Archived",
    value: items.value.filter((i) => i.status === "archived").length,
  },
]);

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Announcement", to: "/admin/announcement" },
  { label: "Notice Management" },
];

// ── Search / sort / pagination state ─────────────────────────────────────────
const searchFilters = ref({
  search: "",
  status: "",
  type: "",
  audience: "",
  date: "",
});
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortConfig = ref({ by: "created_at", order: "desc" });

// ── Helpers ───────────────────────────────────────────────────────────────────
const isScheduled = (publishedAt) => {
  if (!publishedAt) return false;
  return new Date(publishedAt) > new Date();
};

// ── Form fields ──────────────────────────────────────────────────────────────
const formFields = computed(() => [
  {
    name: "name",
    label: "Notice Title",
    type: "text",
    required: true,
    placeholder: "Enter notice title…",
    description: "A clear, descriptive title for the notice",
  },
  {
    name: "details",
    label: "Content",
    type: "textarea",
    required: true,
    placeholder: "Write the full notice content here…",
  },
  {
    name: "attachment",
    label: "Attachment",
    type: "file",
    required: false,
    accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg",
    description: "Optional file attachment (PDF, Word, or image)",
  },
  {
    name: "status",
    label: "Status",
    type: "radio",
    required: true,
    default: "inactive",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" }
    ],
  },
]);

// ── Filter fields ─────────────────────────────────────────────────────────────
const filterFields = [
  {
    name: "search",
    label: "Title or Content",
    type: "text",
    placeholder: "Search by title…",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "All Statuses",
    options: [
      { value: "active", label: "Active" },
      { value: "inctive", label: "Inctive" }
    ],
  },
  { name: "date", label: "Publish Date", type: "date" },
];

// ── Table columns ─────────────────────────────────────────────────────────────
const tableColumns = [
  { key: "id", label: "ID", sortable: true, width: "60px", minWidth: "60px" },
  {
    key: "name",
    label: "Title",
    sortable: true,
    width: "220px",
    minWidth: "150px",
  },
  {
    key: "status",
    label: "Status",
    type: "status",
    sortable: true,
    width: "110px",
    minWidth: "90px",
    align: "center",
  },
  {
    key: "actions",
    label: "Actions",
    type: "actions",
    sortable: false,
    width: "160px",
    minWidth: "160px",
    align: "center",
  },
];

const tableActions = [
  { name: "view", label: "View", class: "btn-view" },
  { name: "edit", label: "Edit", class: "btn-edit" },
  { name: "delete", label: "Delete", class: "btn-delete" },
];

// Server already paginates — pass items directly
const paginatedData = computed(() => items.value);

// ── API calls ─────────────────────────────────────────────────────────────────
const loadData = async () => {
  crudStore.clearError();
  const params = {
    page: currentPage.value,
    limit: itemsPerPage.value,
    ...(searchFilters.value.search && { search: searchFilters.value.search }),
    ...(searchFilters.value.status && { status: searchFilters.value.status }),
    ...(searchFilters.value.type && { type: searchFilters.value.type }),
    ...(searchFilters.value.audience && {
      audience: searchFilters.value.audience,
    }),
    ...(searchFilters.value.date && { date: searchFilters.value.date }),
    ...(sortConfig.value.by && {
      sort_by: sortConfig.value.by,
      sort_order: sortConfig.value.order,
    }),
  };

  const result = await crudStore.fetchAll("/notices", params);

  if (!result.success) {
    notify("error", result.error?.message || "Failed to load notices.");
    return;
  }

  if (result.data?.pagination) {
    pagination.value = result.data.pagination;
  } else {
    pagination.value = {
      current_page: currentPage.value,
      total_pages: 1,
      total: items.value.length,
      per_page: itemsPerPage.value,
    };
  }
};

// ── Modal openers ─────────────────────────────────────────────────────────────
const openCreateModal = () => {
  modalMode.value = "create";
  selectedItem.value = {};
  showFormModal.value = true;
};

const openEditModal = async (item) => {
  const result = await crudStore.fetchById("/notices/", item.id);
  if (result.success) {
    modalMode.value = "edit";
    selectedItem.value = { ...result.data };
    showFormModal.value = true;
  } else {
    notify("error", result.error?.message || "Could not load notice.");
  }
};

const openDeleteModal = (item) => {
  selectedItem.value = { ...item };
  showDeleteModal.value = true;
};

const openViewModal = async (item) => {
  const result = await crudStore.fetchById("/notices/", item.id);
  if (result.success) {
    selectedItem.value = { ...result.data };
    showViewModal.value = true;
  } else {
    notify("error", result.error?.message || "Could not load notice.");
  }
};

// ── Submit handlers ───────────────────────────────────────────────────────────
const handleFormSubmit = async (data, mode, initialData) => {
  const fd = new FormData();
  const plain =
    data instanceof FormData ? Object.fromEntries(data.entries()) : data;

  Object.entries(plain).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") {
      fd.append(k, v instanceof File ? v : String(v));
    }
  });

  let result;
  if (mode === "create") {
    result = await crudStore.create("/notices", fd);
  } else {
    fd.append("_method", "PUT");
    result = await crudStore.post(`/notices/${initialData.id}`, fd);
  }

  if (!result.success)
    throw new Error(result.error?.message ?? "Request failed");
  return result.data;
};

const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete("/notices/", data.id);
  if (!result.success)
    throw new Error(result.error?.message ?? "Delete failed");
  return result.data;
};

// ── Success / error handlers ──────────────────────────────────────────────────
const handleModalSuccess = ({ data, mode }) => {
  showFormModal.value = false;
  notify(
    "success",
    `Notice ${mode === "create" ? "created" : "updated"} successfully!`,
    {
      title: data?.title,
      autoClose: 3000,
    },
  );
  loadData();
};

const handleDeleteSuccess = () => {
  showDeleteModal.value = false;
  notify("success", "Notice deleted successfully.", { autoClose: 3000 });
  loadData();
};

const handleModalError = ({ error }) => {
  let msg = error?.message || "An unexpected error occurred.";
  if (error?.response?.data?.errors) {
    msg = Object.entries(error.response.data.errors)
      .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(", ") : m}`)
      .join(" · ");
  }
  notify("error", msg);
};

// ── Sort / search / pagination handlers ──────────────────────────────────────
const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

const handleReset = () => {
  searchFilters.value = {
    search: "",
    status: "",
    type: "",
    audience: "",
    date: "",
  };
  currentPage.value = 1;
  loadData();
};

const handleSort = (s) => {
  sortConfig.value = s;
  currentPage.value = 1;
  loadData();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  loadData();
};

const handlePageSizeChange = (pageSize) => {
  itemsPerPage.value = pageSize;
  currentPage.value = 1;
  loadData();
};

const handleAction = ({ action, row }) =>
  ({ view: openViewModal, edit: openEditModal, delete: openDeleteModal }[
    action
  ]?.(row));

onMounted(() => loadData());
onBeforeUnmount(() => crudStore.clearCurrentItem());
</script>

<style scoped>
/* ── Type badge ── */
.type-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  border-radius: 3px;
}

.type-general {
  background: rgba(99, 179, 237, 0.09);
  border: 1px solid rgba(99, 179, 237, 0.28);
  color: #90cdf4;
}

.type-urgent {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.type-event {
  background: rgba(167, 139, 250, 0.1);
  border: 1px solid rgba(167, 139, 250, 0.3);
  color: #c4b5fd;
}

.type-policy {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  color: #fde047;
}

.type-maintenance {
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  color: #fdba74;
}

.type-holiday {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

/* ── Audience badge ── */
.audience-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(201, 169, 110, 0.09);
  border: 1px solid rgba(201, 169, 110, 0.28);
  color: #e8d5b0;
  white-space: nowrap;
}

/* ── Publish date ── */
.publish-date {
  font-size: 13px;
  color: rgba(240, 234, 224, 0.75);
}

.publish-scheduled {
  color: #fde047;
  font-weight: 500;
}

/* ── Dash ── */
.cell-dash {
  color: rgba(240, 234, 224, 0.25);
  font-size: 14px;
}

/* ── Table layout ── */
:deep(table) {
  table-layout: auto;
  width: 100%;
}

:deep(td .cell-text) {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

:deep(td .cell-actions) {
  white-space: nowrap;
  overflow: visible;
}
</style>
