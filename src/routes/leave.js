import adminLayout from '@/admin/layouts/LayoutOne.vue'

export default [
    {
        path: '/leave/requests',
        name: 'LeaveRequestManagement',
        component: () => import('@/admin/modules/leave/LeaveRequestManagement'),
        meta: { layout: adminLayout, requiresAuth:true }
    }
];