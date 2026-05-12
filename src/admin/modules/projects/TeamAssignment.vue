<template>
  <CrudLayout
    ref="layoutRef"
    title="Team Assignment"
    subtitle="Manage team members and project assignments"
    add-label="New Assignment"
    :breadcrumbs="breadcrumbs"
    :stats="pageStats"
    :loading="isLoading"
    loading-message="Loading assignments"
    :error="hasError ? errorMessage : ''"
    error-title="Failed to Load Assignments"
    :has-data="!!items.length"
    :notification="notification"
    @add="openCreateModal"
    @retry="loadData"
  >
    <!-- ── Icon slot ── -->
    <template #icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
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
      result-label="assignments"
      @action="handleAction"
      @sort="handleSort"
    >
      <!-- Member cell -->
      <template #cell-member="{ value }">
        <div v-if="value" class="member-cell">
          <img
            v-if="value.photo"
            :src="baseUrl + '/' + value.photo"
            alt="photo"
            class="member-avatar"
          />
          <div v-else class="member-avatar-placeholder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          </div>
          <span class="member-name">{{ value.name ?? value }}</span>
        </div>
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Project cell -->
      <template #cell-project="{ value }">
        <span v-if="value" class="project-tag">
          {{ value?.name ?? value }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>

      <!-- Role cell -->
      <template #cell-role="{ value }">
        <span v-if="value" class="role-badge">
          {{ value }}
        </span>
        <span v-else class="cell-dash">—</span>
      </template>
    </DataTable>

    <!-- ── Pagination ── -->
    <template #pagination>
      <Pagination
        v-model="currentPage"
        :total-items="pagination.total"
        :page-size="itemsPerPage"
        :page-size-options="[10, 25, 50, 100]"
        item-label="assignments"
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
    entity-name="assignment"
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
    entity-name="assignment"
    :initial-data="selectedItem"
    :on-submit="handleDeleteSubmit"
    delete-message="This team assignment will be permanently removed from the system."
    @success="handleDeleteSuccess"
    @error="handleModalError"
  />

  <BaseModal
    v-model="showViewModal"
    mode="view"
    entity-name="assignment"
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
const allProjects = ref([]);
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
    label: "Active",
    value: items.value.filter((i) => i.status === "active").length,
  },
  {
    label: "Inactive",
    value: items.value.filter((i) => i.status === "inactive").length,
  },
]);

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Project", to: "/admin/projects" },
  { label: "Team Assignment" },
];

// ── Search / sort / pagination state ─────────────────────────────────────────
const searchFilters = ref({
  search: "",
  status: "",
  project_id: "",
  role: "",
  date: "",
});
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortConfig = ref({ by: "created_at", order: "desc" });

// ── Form fields ──────────────────────────────────────────────────────────────
const formFields = computed(() => [
  {
    name: "member_id",
    label: "Member",
    type: "select",
    required: true,
    placeholder: "Select a member…",
    options: allMembers.value,
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
    name: "role",
    label: "Team Role",
    type: "select",
    required: true,
    placeholder: "Select a role…",
    options: [
      { value: "project_manager", label: "Project Manager" },
      { value: "team_lead", label: "Team Lead" },
      { value: "developer", label: "Developer" },
      { value: "designer", label: "Designer" },
      { value: "qa_engineer", label: "QA Engineer" },
      { value: "analyst", label: "Analyst" },
      { value: "devops", label: "DevOps" },
      { value: "other", label: "Other" },
    ],
  },
  {
    name: "join_date",
    label: "Join Date",
    type: "date",
    required: true,
  },
  {
    name: "end_date",
    label: "End Date",
    type: "date",
    required: false,
    description: "Leave blank if the assignment has no end date",
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
    required: false,
    placeholder: "Any additional notes about this assignment…",
  },
  {
    name: "status",
    label: "Status",
    type: "radio",
    required: true,
    default: "active",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
]);

// ── Filter fields ─────────────────────────────────────────────────────────────
const filterFields = computed(() => [
  {
    name: "search",
    label: "Member or Notes",
    type: "text",
    placeholder: "Search by member name…",
  },
  {
    name: "project_id",
    label: "Project",
    type: "select",
    placeholder: "All Projects",
    options: allProjects.value,
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    placeholder: "All Roles",
    options: [
      { value: "project_manager", label: "Project Manager" },
      { value: "team_lead", label: "Team Lead" },
      { value: "developer", label: "Developer" },
      { value: "designer", label: "Designer" },
      { value: "qa_engineer", label: "QA Engineer" },
      { value: "analyst", label: "Analyst" },
      { value: "devops", label: "DevOps" },
      { value: "other", label: "Other" },
    ],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "All Statuses",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  { name: "date", label: "Join Date", type: "date" },
]);

// ── Table columns ─────────────────────────────────────────────────────────────
const tableColumns = [
  { key: "id", label: "ID", sortable: true, width: "60px", minWidth: "60px" },
  {
    key: "member",
    label: "Member",
    type: "custom",
    sortable: false,
    width: "180px",
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
    key: "role",
    label: "Role",
    type: "custom",
    sortable: true,
    width: "150px",
    minWidth: "110px",
  },
  {
    key: "join_date",
    label: "Join Date",
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
    ...(searchFilters.value.project_id && {
      project_id: searchFilters.value.project_id,
    }),
    ...(searchFilters.value.role && { role: searchFilters.value.role }),
    ...(searchFilters.value.date && { date: searchFilters.value.date }),
    ...(sortConfig.value.by && {
      sort_by: sortConfig.value.by,
      sort_order: sortConfig.value.order,
    }),
  };

  const result = await crudStore.fetchAll("/team-assignments", params);

  if (!result.success) {
    notify("error", result.error?.message || "Failed to load assignments.");
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
  const result = await crudStore.fetchById("/team-assignments/", item.id);
  if (result.success) {
    modalMode.value = "edit";
    selectedItem.value = { ...result.data };
    showFormModal.value = true;
  } else {
    notify("error", result.error?.message || "Could not load assignment.");
  }
};

const openDeleteModal = (item) => {
  selectedItem.value = { ...item };
  showDeleteModal.value = true;
};

const openViewModal = async (item) => {
  const result = await crudStore.fetchById("/team-assignments/", item.id);
  if (result.success) {
    selectedItem.value = { ...result.data };
    showViewModal.value = true;
  } else {
    notify("error", result.error?.message || "Could not load assignment.");
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
    result = await crudStore.create("/team-assignments", fd);
  } else {
    fd.append("_method", "PUT");
    result = await crudStore.post(`/team-assignments/${initialData.id}`, fd);
  }

  if (!result.success)
    throw new Error(result.error?.message ?? "Request failed");
  return result.data;
};

const handleDeleteSubmit = async (data) => {
  const result = await crudStore.delete("/team-assignments/", data.id);
  if (!result.success)
    throw new Error(result.error?.message ?? "Delete failed");
  return result.data;
};

// ── Success / error handlers ──────────────────────────────────────────────────
const handleModalSuccess = ({ data, mode }) => {
  showFormModal.value = false;
  notify(
    "success",
    `Assignment ${mode === "create" ? "created" : "updated"} successfully!`,
    {
      title: data?.member?.name ?? "",
      autoClose: 3000,
    },
  );
  loadData();
};

const handleDeleteSuccess = () => {
  showDeleteModal.value = false;
  notify("success", "Assignment removed successfully.", { autoClose: 3000 });
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
    project_id: "",
    role: "",
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
  loadMembers();
  loadData();
});
onBeforeUnmount(() => crudStore.clearCurrentItem());
</script>

<style scoped>
/* ── Member cell ── */
.member-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(201, 169, 110, 0.25);
  flex-shrink: 0;
}

.member-avatar-placeholder {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.08);
  border: 1px solid rgba(201, 169, 110, 0.2);
  color: rgba(240, 234, 224, 0.35);
  flex-shrink: 0;
}

.member-name {
  font-size: 13px;
  color: rgba(240, 234, 224, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Role badge ── */
.role-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(99, 179, 237, 0.09);
  border: 1px solid rgba(99, 179, 237, 0.28);
  color: #90cdf4;
  white-space: nowrap;
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
