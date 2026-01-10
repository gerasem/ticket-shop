import { createRouter, createWebHistory } from 'vue-router';

// Placeholder components until we create/copy views
const HomeView = { template: '<div><h2>Events List (V2)</h2><p>Redesigned events list will go here.</p></div>' };

const router = createRouter({
  history: createWebHistory('/ticket-shop'), // Base URL
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
        path: '/admin',
        children: [
            { path: 'events', component: { template: '<div>Admin Events V2</div>' } }
        ]
    }
  ]
});

export default router;
