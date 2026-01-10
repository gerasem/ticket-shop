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
      path: '/booking',
      name: 'booking',
      component: ClientView
    },
    {
      path: '/admin',
      redirect: '/admin/events'
    },
    {
      path: '/admin/venue',
      redirect: '/admin/venues' // Backward compatibility or just redirect
    },
    {
        path: '/admin/venues',
        name: 'admin-venues',
        component: () => import('../views/AdminVenuesView.vue')
    },
    {
      path: '/admin/venues/:id/editor',
      name: 'venue-editor',
      component: AdminView,
      beforeEnter: (to, from, next) => {
          // You might want to preload the venue here or just let the view handle it
          next(); 
      }
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

import { useAuthStore } from '../stores/auth'

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Protect admin routes
  if (to.path.startsWith('/admin') && !authStore.isAuthenticated) {
    next('/login')
  } 
  // Redirect to dashboard if already logged in and visiting login
  else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/admin/events')
  } 
  else {
    next()
  }
})

export default router
