import adminLayout from '@/admin/layouts/LayoutOne.vue'

export default [
    {
        path: '/attendance',
        name: 'EmployeeAttendance',
        component: () => import('@/admin/modules/attendance/EmployeeAttendance'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/attendance/daily',
        name: 'DailyAttendance',
        component: () => import('@/admin/modules/attendance/admin/DailyAttendance'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/attendance/log',
        name: 'AttendanceHistory',
        component: () => import('@/admin/modules/attendance/admin/AttendanceHistory'),
        meta: { layout: adminLayout, requiresAuth:true }
    }
];