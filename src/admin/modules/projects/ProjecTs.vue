<template>
  <CrudLayout
    ref="layoutRef"
    title="Project Management"
    subtitle="Manage projects, timelines and team assignments"
    add-label="New Project"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading projects"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Projects"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >
    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 0 0-6 0c0 .14.11.56.18 1H10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v18h20V8a2 2 0 0 0-2-2zm-7-1a1 1 0 0 1 2 0c0 .63-.45 1.41-1 2.17C13.45 6.41 13 5.63 13 5zM4 4h4v2H4V4zm0 4h4v2H4V8zm4 10H4v-2h4v2zm0-4H4v-2h4v2zm10 4h-8v-2h8v2zm0-4h-8v-2h8v2zm0-4h-8v-2h8v2z"
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
      result-label="projects"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Thumbnail cell -->
      <template #cell-thumbnail="{ value }">
        <img
          v-if="value"
          :src="baseUrl + '/' + value"
          alt="thumbnail"
          class="project-thumbnail"
        />
        <div v-else class="project-thumbnail-placeholder">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"
            />
          </svg>
        </div>
      </template>

      <!-- Status cell -->
      <template #cell-priority="{ value }">
        <span v-if="value" :class="['priority-badge', `priority-${value}`]">
          {{ value }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Team cell -->
      <template #cell-team="{ value }">
        <span v-if="value && value.length" class="team-badge">
          {{
            Array.isArray(value)
              ? value.map((m) => m.name ?? m).join(", ")
              : value
          }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Progress cell -->
      <template #cell-progress="{ value }">
        <div class="progress-wrapper">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (value ?? 0) + '%' }"
            ></div>
          </div>
          <span class="progress-label">{{ value ?? 0 }}%</span>
        </div>
      </template>
    </DataTable>

    <!-- ── Pagination ── -->
    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="pagination.total"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]"
        item-label="projects"
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
    entity-name="project"
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
    entity-name="project"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This project and all its data will be permanently removed from the system."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />

  <BaseModal
    v-model="showViewModal"
    mode="view"
    entity-name="project"
    :fields="formFields"
    :initial-data="selectedItem"
    size="large"
  />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useCrudStore } from "@/store/crud";
import CrudLayout from "../components/CrudLayout.vue";
import FilterPanel from "../components/FilterComponent.vue";
import DataTable from "../components/TableComponent.vue";
import Pagination from "../components/PaginationComponent.vue";
import BaseModal from "../components/ActionModalComponent.vue";

const crudStore = useCrudStore();
const baseUrl = process.env.VUE_APP_BASE_URL;
const baseApi = process.env.VUE_APP_BASE_API;
const layoutRef = ref(null);

// ── Modal state ──────────────────────────────────────────────────────────────
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const modalMode = ref("create");
const selectedItem = ref({});
const allCategories = ref([]);
const allMembers = ref([]);

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

// ── Pagination meta (from server response) ───────────────────────────────────
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
    label: "Active",
    value: items.value.filter((i) => i.status === "active").length,
  },
  {
    label: "Completed",
    value: items.value.filter((i) => i.status === "completed").length,
  },
  {
    label: "On Hold",
    value: items.value.filter((i) => i.status === "on_hold").length,
  },
]);

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Project Management" },
];

// ── Search / sort / pagination state ─────────────────────────────────────────
const searchFilters = ref({ search: "", status: "", priority: "", date: "" });
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortConfig = ref({ by: "created_at", order: "desc" });

// ── Form fields ──────────────────────────────────────────────────────────────
const formFields = computed(() => [
  {
    name: "name",
    label: "Project Name",
    type: "text",
    required: true,
    placeholder: "Enter project name…",
    description: "A clear, descriptive name for the project",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    placeholder: "Describe the project goals and scope…",
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    required: true,
    placeholder: "Select a category…",
    options: allCategories.value,
  },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    required: true,
    placeholder: "Select priority…",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" },
    ],
  },
  {
    name: "start_date",
    label: "Start Date",
    type: "date",
    required: true,
  },
  {
    name: "end_date",
    label: "End Date",
    type: "date",
    required: true,
  },
  {
    name: "budget",
    label: "Budget",
    type: "number",
    required: false,
    placeholder: "Enter budget amount…",
  },
  {
    name: "manager_id",
    label: "Project Manager",
    type: "select",
    required: true,
    placeholder: "Assign a project manager…",
    options: allMembers.value,
  },
  {
    name: "thumbnail",
    label: "Thumbnail",
    type: "file",
    required: false,
    accept: "image/*",
  },
  {
    name: "status",
    label: "Status",
    type: "radio",
    required: true,
    default: "active",
    options: [
      { value: "active", label: "Active" },
      { value: "on_hold", label: "On Hold" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
]);

// ── Filter fields ─────────────────────────────────────────────────────────────
const filterFields = [
  {
    name: "search",
    label: "Name or Description",
    type: "text",
    placeholder: "Search by name or description…",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "All Statuses",
    options: [
      { value: "active", label: "Active" },
      { value: "on_hold", label: "On Hold" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    placeholder: "All Priorities",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" },
    ],
  },
  { name: "date", label: "Start Date", type: "date" },
];

// ── Table columns ─────────────────────────────────────────────────────────────
const tableColumns = [
  { key: "id", label: "ID", sortable: true, width: "60px", minWidth: "60px" },
  {
    key: "thumbnail",
    label: "Thumbnail",
    type: "custom",
    sortable: false,
    width: "80px",
    minWidth: "76px",
    align: "center",
  },
  {
    key: "name",
    label: "Name",
    sortable: true,
    width: "180px",
    minWidth: "130px",
  },
  {
    key: "category",
    label: "Category",
    sortable: true,
    width: "130px",
    minWidth: "100px",
  },
  {
    key: "priority",
    label: "Priority",
    type: "custom",
    sortable: true,
    width: "110px",
    minWidth: "90px",
    align: "center",
  },
  {
    key: "progress",
    label: "Progress",
    type: "custom",
    sortable: false,
    width: "140px",
    minWidth: "120px",
  },
  {
    key: "start_date",
    label: "Start Date",
    sortable: true,
    width: "120px",
    minWidth: "100px",
  },
  {
    key: "end_date",
    label: "End Date",
    sortable: true,
    width: "120px",
    minWidth: "100px",
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

// Server already paginates — pass items directly, no client-side slicing
const paginatedData = computed(() => items.value);

// ── API calls ─────────────────────────────────────────────────────────────────
const loadCategories = async () => {
  try {
    const response = await fetch(`${baseApi}/system/project-categories`);
    if (!response.ok) throw new Error("Non-200");
    const data = await response.json();
    allCategories.value = (data.categories ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    }));
  } catch {
    notify("warning", "Could not load categories list.", { autoClose: 3000 });
  }
};

const loadMembers = async () => {
  try {
    const response = await fetch(`${baseApi}/system/members`);
    if (!response.ok) throw new Error("Non-200");
    const data = await response.json();
    allMembers.value = (data.members ?? []).map((m) => ({
      value: m.id,
      label: m.name,
    }));
  } catch {
    notify("warning", "Could not load members list.", { autoClose: 3000 });
  }
};

const loadData = async () => {
  crudStore.clearError();
  const params = {
    page: currentPage.value,
    limit: itemsPerPage.value,
    ...(searchFilters.value.search && { search: searchFilters.value.search }),
    ...(searchFilters.value.status && { status: searchFilters.value.status }),
    ...(searchFilters.value.priority && {
      priority: searchFilters.value.priority,
    }),
    ...(searchFilters.value.date && { date: searchFilters.value.date }),
    ...(sortConfig.value.by && {
      sort_by: sortConfig.value.by,
      sort_order: sortConfig.value.order,
    }),
  };

  const result = await crudStore.fetchAll("/projects", params);

  if (!result.success) {
    notify("error", result.error?.message || "Failed to load projects.");
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
  const result = await crudStore.fetchById("/projects/", item.id);
  if (result.success) {
    modalMode.value = "edit";
    selectedItem.value = { ...result.data };
    showFormModal.value = true;
  } else {
    notify("error", result.error?.message || "Could not load project.");
  }
};

const openDeleteModal = (item) => {
  selectedItem.value = { ...item };
  showDeleteModal.value = true;
};

const openViewModal = async (item) => {
  const result = await crudStore.fetchById("/projects/", item.id);
  if (result.success) {
    selectedItem.value = { ...result.data };
    showViewModal.value = true;
  } else {
    notify("error", result.error?.message || "Could not load project.");
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
    result = await crudStore.create("/projects", fd);
  } else {
    fd.append("_method", "PUT");
    result = await crudStore.post(`/projects/${initialData.id}`, fd);
  }

  if (!result.success)
    throw new Error(result.error?.message ?? "Request failed");
  return result.data;
};

const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete("/projects/", data.id);
  if (!result.success)
    throw new Error(result.error?.message ?? "Delete failed");
  return result.data;
};

// ── Success / error handlers ──────────────────────────────────────────────────
const handleModalSuccess = ({ data, mode }) => {
  showFormModal.value = false;
  notify(
    "success",
    `Project ${mode === "create" ? "created" : "updated"} successfully!`,
    {
      title: data?.name,
      autoClose: 3000,
    },
  );
  loadData();
};

const handleDeleteSuccess = () => {
  showDeleteModal.value = false;
  notify("success", "Project deleted successfully.", { autoClose: 3000 });
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
  searchFilters.value = { search: "", status: "", priority: "", date: "" };
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

onMounted(() => {
  loadCategories();
  loadMembers();
  loadData();
});
onBeforeUnmount(() => crudStore.clearCurrentItem());
</script>

<style scoped>
/* ── Thumbnail ── */
.project-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid rgba(201, 169, 110, 0.25);
}

.project-thumbnail-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.08);
  border: 1px solid rgba(201, 169, 110, 0.2);
  color: rgba(240, 234, 224, 0.35);
}

/* ── Priority badge ── */
.priority-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  border-radius: 3px;
}

.priority-low {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.priority-medium {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  color: #fde047;
}

.priority-high {
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  color: #fdba74;
}

.priority-critical {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

/* ── Team badge ── */
.team-badge {
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

/* ── Progress ── */
.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(240, 234, 224, 0.1);
  border-radius: 99px;
  overflow: hidden;
  min-width: 60px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(201, 169, 110, 0.7),
    rgba(201, 169, 110, 1)
  );
  border-radius: 99px;
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 11px;
  color: rgba(240, 234, 224, 0.55);
  min-width: 30px;
  text-align: right;
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
