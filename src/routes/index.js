import { createRouter, createWebHistory } from 'vue-router'

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


function isLoggedIn()
{
    return localStorage.getItem('token')
}

router.beforeEach((to, from, next) => {
   if(to.matched.some(record => record.meta.requiresAuth)) {
     if(!isLoggedIn()) {
        next({
            name: 'LoginPage'
        })
     } else {
        next()
     }
   } else if(to.matched.some(record => record.meta.isAuthenticated)) {
     if(isLoggedIn()) {
        next({
            name: 'DashboardPage'
        })
     } else {
        next()
     }
   } else {
     next()
   }
})

export default router