import adminLayout from '@/admin/layouts/LayoutOne.vue'

export default [
    {
        path: '/admin/payroll',
        name: 'PayrollModule',
        component: () => import('@/admin/modules/payroll/PayrollModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    }
];