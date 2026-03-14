/// <reference types="vite/client" />
import { createRouter, createWebHistory } from 'vue-router'

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
      path: '/payment',
      name: 'payment',
      component: () => import('../views/PaymentView.vue')
    }
  ]
})

export default router
