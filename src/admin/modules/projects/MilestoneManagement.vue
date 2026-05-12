<template>
  <CrudLayout
    ref="layoutRef"
    title="Milestones"
    subtitle="Track project milestones and delivery targets"
    add-label="New Milestone"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading milestones"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Milestones"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >
    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
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
      result-label="milestones"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Project cell -->
      <template #cell-project="{ value }">
        <span v-if="value" class="project-tag">
          {{ value?.name ?? value }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Priority cell -->
      <template #cell-priority="{ value }">
        <span v-if="value" :class="['priority-badge', `priority-${value}`]">
          {{ value }}
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

      <!-- Due date cell — highlights overdue -->
      <template #cell-due_date="{ value, row }">
        <span
          :class="['due-date', { 'due-overdue': isOverdue(value, row.status) }]"
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
        item-label="milestones"
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
    entity-name="milestone"
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
    entity-name="milestone"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This milestone will be permanently removed from the system."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />

  <BaseModal
    v-model="showViewModal"
    mode="view"
    entity-name="milestone"
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
  name: "MilestoneManagement",
});

const crudStore = useCrudStore();
const baseApi = process.env.VUE_APP_BASE_API;
const layoutRef = ref(null);

// ── Modal state ──────────────────────────────────────────────────────────────
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const modalMode = ref("create");
const selectedItem = ref({});
const allProjects = ref([]);

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
    label: "Pending",
    value: items.value.filter((i) => i.status === "pending").length,
  },
  {
    label: "In Progress",
    value: items.value.filter((i) => i.status === "in_progress").length,
  },
  {
    label: "Completed",
    value: items.value.filter((i) => i.status === "completed").length,
  },
]);

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Project", to: "/admin/projects" },
  { label: "Milestones" },
];

// ── Search / sort / pagination state ─────────────────────────────────────────
const searchFilters = ref({
  search: "",
  status: "",
  priority: "",
  project_id: "",
  date: "",
});
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortConfig = ref({ by: "due_date", order: "asc" });

// ── Helpers ───────────────────────────────────────────────────────────────────
const isOverdue = (dueDate, status) => {
  if (!dueDate || status === "completed") return false;
  return new Date(dueDate) < new Date();
};

// ── Form fields ──────────────────────────────────────────────────────────────
const formFields = computed(() => [
  {
    name: "title",
    label: "Milestone Title",
    type: "text",
    required: true,
    placeholder: "Enter milestone title…",
    description: "A clear title describing what this milestone represents",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    placeholder: "Describe the milestone deliverables and success criteria…",
  },
  {
    name: "project_id",
    label: "Project",
    type: "select",
    required: true,
    placeholder: "Select a project…",
    options: allProjects.value,
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
    name: "due_date",
    label: "Due Date",
    type: "date",
    required: true,
  },
  {
    name: "progress",
    label: "Progress (%)",
    type: "number",
    required: false,
    placeholder: "0",
    description: "Completion percentage between 0 and 100",
  },
  {
    name: "status",
    label: "Status",
    type: "radio",
    required: true,
    default: "pending",
    options: [
      { value: "pending", label: "Pending" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
]);

// ── Filter fields ─────────────────────────────────────────────────────────────
const filterFields = computed(() => [
  {
    name: "search",
    label: "Title or Description",
    type: "text",
    placeholder: "Search by title…",
  },
  {
    name: "project_id",
    label: "Project",
    type: "select",
    placeholder: "All Projects",
    options: allProjects.value,
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
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "All Statuses",
    options: [
      { value: "pending", label: "Pending" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  { name: "date", label: "Due Date", type: "date" },
]);

// ── Table columns ─────────────────────────────────────────────────────────────
const tableColumns = [
  { key: "id", label: "ID", sortable: true, width: "60px", minWidth: "60px" },
  {
    key: "title",
    label: "Title",
    sortable: true,
    width: "200px",
    minWidth: "140px",
  },
  {
    key: "project",
    label: "Project",
    type: "custom",
    sortable: false,
    width: "160px",
    minWidth: "120px",
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
    key: "due_date",
    label: "Due Date",
    type: "custom",
    sortable: true,
    width: "120px",
    minWidth: "100px",
  },
  {
    key: "status",
    label: "Status",
    type: "status",
    sortable: true,
    width: "120px",
    minWidth: "100px",
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
const loadProjects = async () => {
  try {
    const response = await fetch(`${baseApi}/system/projects`);
    if (!response.ok) throw new Error("Non-200");
    const data = await response.json();
    allProjects.value = (data.projects ?? []).map((p) => ({
      value: p.id,
      label: p.name,
    }));
  } catch {
    notify("warning", "Could not load projects list.", { autoClose: 3000 });
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
    ...(searchFilters.value.project_id && {
      project_id: searchFilters.value.project_id,
    }),
    ...(searchFilters.value.date && { date: searchFilters.value.date }),
    ...(sortConfig.value.by && {
      sort_by: sortConfig.value.by,
      sort_order: sortConfig.value.order,
    }),
  };

  const result = await crudStore.fetchAll("/milestones", params);

  if (!result.success) {
    notify("error", result.error?.message || "Failed to load milestones.");
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
  const result = await crudStore.fetchById("/milestones/", item.id);
  if (result.success) {
    modalMode.value = "edit";
    selectedItem.value = { ...result.data };
    showFormModal.value = true;
  } else {
    notify("error", result.error?.message || "Could not load milestone.");
  }
};

const openDeleteModal = (item) => {
  selectedItem.value = { ...item };
  showDeleteModal.value = true;
};

const openViewModal = async (item) => {
  const result = await crudStore.fetchById("/milestones/", item.id);
  if (result.success) {
    selectedItem.value = { ...result.data };
    showViewModal.value = true;
  } else {
    notify("error", result.error?.message || "Could not load milestone.");
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
    result = await crudStore.create("/milestones", fd);
  } else {
    fd.append("_method", "PUT");
    result = await crudStore.post(`/milestones/${initialData.id}`, fd);
  }

  if (!result.success)
    throw new Error(result.error?.message ?? "Request failed");
  return result.data;
};

const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete("/milestones/", data.id);
  if (!result.success)
    throw new Error(result.error?.message ?? "Delete failed");
  return result.data;
};

// ── Success / error handlers ──────────────────────────────────────────────────
const handleModalSuccess = ({ data, mode }) => {
  showFormModal.value = false;
  notify(
    "success",
    `Milestone ${mode === "create" ? "created" : "updated"} successfully!`,
    {
      title: data?.title,
      autoClose: 3000,
    },
  );
  loadData();
};

const handleDeleteSuccess = () => {
  showDeleteModal.value = false;
  notify("success", "Milestone deleted successfully.", { autoClose: 3000 });
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
    priority: "",
    project_id: "",
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

onMounted(() => {
  loadProjects();
  loadData();
});
onBeforeUnmount(() => crudStore.clearCurrentItem());
</script>

<style scoped>
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

/* ── Project tag ── */
.project-tag {
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

/* ── Due date ── */
.due-date {
  font-size: 13px;
  color: rgba(240, 234, 224, 0.75);
}

.due-overdue {
  color: #fca5a5;
  font-weight: 500;
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
