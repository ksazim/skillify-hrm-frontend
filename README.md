# Skillify HRM Frontend

A Vue 3 + Pinia-based HR Management System frontend with comprehensive modules for employee, project, and organizational management.

## Project Setup

### Install Dependencies

```bash
pnpm install
```

### Development Server

```bash
pnpm run serve
```

Runs at `http://localhost:8080/`

### Production Build

```bash
pnpm run build
```

### Linting

```bash
pnpm run lint
```

## Available Modules

### HR Modules

- **Employee Management** - `/admin/dashboard/employees` - Manage employee records and information
- **Attendance** - `/admin/dashboard/attendance` - Track employee attendance
- **Leave Management** - `/admin/dashboard/leave` - Manage leave requests and types
- **User & Role Management** - `/admin/dashboard/users` - User accounts and role permissions
- **Company Management** - `/admin/dashboard/company` - Organizational structure and settings

### Project Management

- **Projects** - `/admin/dashboard/projects` - Manage projects, timelines, team assignments, and progress tracking
- **Tasks** - `/admin/dashboard/tasks` - Manage tasks, assignments, deadlines, and progress
- **Team Assignments** - `/admin/dashboard/team-assignments` - Assign team members to projects with specific roles
- **Milestone Management** - `/admin/dashboard/milestones` - Track project milestones and delivery targets

### Business Modules

- **Products** - `/admin/dashboard/products` - Product catalog management
- **Categories** - `/admin/dashboard/categories` - Product categories
- **Orders** - `/admin/dashboard/orders` - Order management
- **Subscriptions** - `/admin/dashboard/subscriptions` - Subscription tracking
- **Flash Sales** - `/admin/dashboard/flash-sales` - Promotional campaigns

### Communication

- **Announcements** - `/admin/announcements/all` - Manage company notices and announcements

### Other

- **Dashboard** - `/admin/dashboard` - Overview and analytics
- **Settings** - `/admin/settings` - System and user settings
- **Setup** - `/admin/dashboard/setup` - Initial system configuration

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Axios** - HTTP client
- **FontAwesome** - Icon library

## Mock Mode

The frontend runs in mock mode (no backend required) for development:

- Mock login accepts any valid email/password
- System configuration uses hardcoded defaults
- API calls return mock data

## Configuration

### Environment Variables (`.env`)

```env
VUE_APP_BASE_API='http://127.0.0.1:8000/api'
VUE_APP_BASE_URL='http://127.0.0.1:8000/storage'
```

## Recently Added Modules

### Project Management Suite

A comprehensive set of modules for managing projects, tasks, and team collaboration:

1. **Projects Module** (`ProjecTs.vue`)

   - Location: `src/admin/modules/projects/ProjecTs.vue`
   - Route: `/admin/dashboard/projects`
   - Features: Create, edit, delete projects; track progress, budgets, timelines
   - Fields: name, description, category, priority, start_date, end_date, budget, manager_id, status, thumbnail, progress

2. **Tasks Module** (`TaskModuLe.vue`)

   - Location: `src/admin/modules/projects/TaskModuLe.vue`
   - Route: `/admin/dashboard/tasks`
   - Features: Task assignment, progress tracking, priority management
   - Fields: title, description, project_id, assigned_to, priority, due_date, progress, status
   - Statuses: To Do, In Progress, In Review, Done

3. **Team Assignments Module** (`TeamAssignment.vue`)

   - Location: `src/admin/modules/projects/TeamAssignment.vue`
   - Route: `/admin/dashboard/team-assignments`
   - Features: Assign team members to projects with specific roles
   - Roles: Project Manager, Team Lead, Developer, Designer, QA Engineer, Analyst, DevOps, Other
   - Fields: member_id, project_id, role, join_date, end_date, notes, status

4. **Milestone Management Module** (`MilestoneManagement.vue`)
   - Location: `src/admin/modules/projects/MilestoneManagement.vue`
   - Route: `/admin/dashboard/milestones`
   - Features: Track project milestones, progress bars, overdue highlighting
   - Fields: title, description, project_id, priority, start_date, due_date, progress, status
   - Statuses: Pending, In Progress, Completed, Cancelled

### Communication Module

1. **Announcements Module** (`NoticeManagement.vue`)
   - Location: `src/admin/modules/announcements/NoticeManagement.vue`
   - Routes:
     - `/admin/announcements/all` - All announcements
     - `/admin/announcements/create` - Create announcement
     - `/admin/announcements/notice` - Notice board
   - Features: Create, publish, and manage company notices and announcements
   - Fields: title, content, type, audience, published_at, expires_at, attachment, status
   - Types: General, Important, Event, Policy, Update
   - Audience: All Employees, Department, Specific Users

### Technical Implementation Details

- All modules use Vue 3 Composition API with `<script setup>` syntax
- State management via Pinia stores (`useCrudStore`)
- Consistent UI patterns with `CrudLayout`, `FilterPanel`, `DataTable`, `Pagination`
- ESLint compliant with multi-word component names
- Mock data support for offline development
- Responsive design with consistent styling
- Integrated with sidebar navigation and role-based permissions

### Customize Vue CLI Configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
