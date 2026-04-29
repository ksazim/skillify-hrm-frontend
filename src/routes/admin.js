import adminLayout from '@/admin/layouts/LayoutOne.vue'
import neutralLayout from '@/admin/layouts/LayoutTwo.vue'

export default [
    {
        path: '/',
        name: 'LoginPage',
        component: () => import('@/admin/modules/LoginPage'),
        meta: { layout: neutralLayout, isAuthenticated: true }
    },
    {
        path: '/admin/dashboard',
        name: 'DashboardPage',
        component: () => import('@/admin/modules/DashboardPage'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/categories',
        name: 'CategoryModule',
        component: () => import('@/admin/modules/CategoryModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/flash-sales',
        name: 'FlashSaleModule',
        component: () => import('@/admin/modules/FlashSaleModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/products',
        name: 'ProductModule',
        component: () => import('@/admin/modules/ProductModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/orders',
        name: 'OrderModule',
        component: () => import('@/admin/modules/OrderModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/subscriptions',
        name: 'SubscriptionModule',
        component: () => import('@/admin/modules/SubscriptionModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/carousel',
        name: 'CarouselModule',
        component: () => import('@/admin/modules/website/CarouselModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/faqs',
        name: 'FaqModule',
        component: () => import('@/admin/modules/website/FaqModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/contacts',
        name: 'ContactModule',
        component: () => import('@/admin/modules/ContactModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/settings',
        name: 'SettingsModule',
        component: () => import('@/admin/modules/auth/SettingsModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/admin/dashboard/setup',
        name: 'SetupModule',
        component: () => import('@/admin/modules/SetupModule'),
        meta: { layout: adminLayout, requiresAuth:true }
    },
    {
        path: '/:pathmatch(.*)*',
        name: 'notFound',
        component: () => import('../admin/NotFound'),
        meta: { layout: adminLayout }
    }
];