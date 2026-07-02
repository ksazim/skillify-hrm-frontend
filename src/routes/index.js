import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

// Layouts
import adminRoutes from './admin'
import userRoutes from './user'
import companyRoutes from './company'
import employeeRoutes from './employee'
import attendanceRoutes from './attendance'
import leaveRoutes from './leave'
import payrollRoutes from './payroll'

const routes = [
    ...adminRoutes,
    ...userRoutes,
    ...companyRoutes,
    ...employeeRoutes,
    ...attendanceRoutes,
    ...leaveRoutes,
    ...payrollRoutes,
]

var router = createRouter({
    history: createWebHistory('/'),
    routes
})

function isLoggedIn() {
    return localStorage.getItem('token')
}

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // If token exists but user/permissions not loaded yet, fetch them
    if (isLoggedIn() && !authStore.isAuthenticated) {
        await authStore.getUser()
    }

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isLoggedIn()) {
            next({ name: 'LoginPage' })
        } else {
            next()
        }
    } else if (to.matched.some(record => record.meta.isAuthenticated)) {
        if (isLoggedIn()) {
            next({ name: 'DashboardPage' })
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router