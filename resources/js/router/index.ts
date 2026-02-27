/// <reference types="vite/client" />
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/event/:id',
      name: 'event-details',
      component: () => import('../views/EventDetailsView.vue')
    },
    {
      path: '/booking',
      name: 'booking',
      component: () => import('../views/ClientView.vue')
    },
    {
      path: '/admin',
      redirect: '/admin/events'
    },
    {
      path: '/admin/venue',
      redirect: '/admin/venues'
    },
    {
      path: '/admin/venues',
      name: 'admin-venues',
      component: () => import('../views/AdminVenuesView.vue')
    },
    {
      path: '/admin/venues/:id/editor',
      name: 'venue-editor',
      component: () => import('../views/AdminView.vue')
    },
    {
      path: '/admin/events',
      name: 'admin-events',
      component: () => import('../views/AdminEventsView.vue')
    },
    {
      path: '/admin/events/create',
      name: 'admin-events-create',
      component: () => import('../views/EventCreateView.vue')
    },
    {
      path: '/admin/events/:id/edit',
      name: 'admin-events-edit',
      component: () => import('../views/EventEditView.vue')
    },
    {
      path: '/payment',
      name: 'payment',
      component: () => import('../views/PaymentView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/AuthView.vue')
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (!authStore.user) {
    await authStore.checkAuth()
  }

  if (to.path.startsWith('/admin') && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/admin/events')
  } else {
    next()
  }
})

export default router
