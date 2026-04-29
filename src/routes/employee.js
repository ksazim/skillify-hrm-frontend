import adminLayout from '@/admin/layouts/LayoutOne.vue'

export default [
    {
        path: '/admin/employee/list',
        name: 'EmployeeManagement',
        component: () => import('@/admin/modules/employee/EmployeeManagement'),
        meta: { layout: adminLayout, requiresAuth:true }
    }
];