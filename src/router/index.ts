import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ClientView from '../views/ClientView.vue'
import AdminView from '../views/AdminView.vue'
import AdminViewArrows from '../views/AdminViewArrows.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
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
      path: '/admin-arrows',
      name: 'admin-arrows',
      component: AdminViewArrows
    }
  ]
})

export default router
