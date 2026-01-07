/// <reference types="vite/client" />
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ClientView from '../views/ClientView.vue'
import AdminView from '../views/AdminView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/event/:id',
      name: 'event-details',
      component: () => import('../views/EventDetailsView.vue')
    },
    {
      path: '/client',
      name: 'client',
      component: ClientView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    },
    {
      path: '/admin/events',
      name: 'admin-events',
      component: () => import('../views/AdminEventsView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/AuthView.vue')
    }
  ]
})

import { useAuthStore } from '../stores/auth'

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Protect admin routes
  if (to.path.startsWith('/admin') && !authStore.isAuthenticated) {
    next('/login')
  } 
  // Redirect to admin if already logged in
  else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/admin')
  } 
  else {
    next()
  }
})

export default router
