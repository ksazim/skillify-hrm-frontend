import adminLayout from '@/admin/layouts/LayoutOne.vue'

export default [
    {
        path: '/admin/dashboard/users',
        name: 'UserManagement',
        component: () => import('@/admin/modules/user/UserManagement'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/users/roles',
        name: 'RolePermissionManagement',
        component: () => import('@/admin/modules/user/RolePermissionManagement'),
        meta: { layout: adminLayout, requiresAuth:true }
    }
];