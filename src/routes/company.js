import adminLayout from '@/admin/layouts/LayoutOne.vue'

export default [
    {
        path: '/admin/company/list',
        name: 'CompanyManagement',
        component: () => import('@/admin/modules/company/CompanyManagement'),
        meta: { layout: adminLayout, requiresAuth:true }
    }
];