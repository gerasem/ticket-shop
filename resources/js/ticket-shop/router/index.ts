import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// Placeholder components
const HomeView = () => import('../views/HomeView.vue'); // Assuming created or default
const LoginView = () => import('../views/LoginView.vue');
const EventDetailsView = () => import('../views/EventDetailsView.vue');
const BookingView = () => import('../views/BookingView.vue');
const PaymentView = () => import('../views/PaymentView.vue');

// Admin Components
const AdminEventsView = () => import('../views/AdminEventsView.vue');
const EventCreateView = () => import('../views/EventCreateView.vue');
const EventEditView = () => import('../views/EventEditView.vue');
const AdminVenuesView = () => import('../views/AdminVenuesView.vue');
const VenueEditorView = () => import('../views/VenueEditorView.vue');

const router = createRouter({
  history: createWebHistory('/ticket-shop'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/event/:id',
      name: 'event-details',
      component: EventDetailsView
    },
    {
      path: '/booking',
      name: 'booking',
      component: BookingView
    },
    {
      path: '/payment',
      name: 'payment',
      component: PaymentView
    },
    {
        path: '/admin',
        children: [
            { path: '', redirect: 'events' },
            { 
                path: 'events', 
                name: 'admin-events',
                component: AdminEventsView 
            },
            {
                path: 'events/create',
                name: 'admin-events-create',
                component: EventCreateView
            },
            {
                path: 'events/:id/edit',
                name: 'admin-events-edit',
                component: EventEditView
            },
            {
                path: 'venues',
                name: 'admin-venues',
                component: AdminVenuesView
            },
            {
                path: 'venues/:id/editor',
                name: 'venue-editor',
                component: VenueEditorView
            }
        ],
        meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    
    // Ensure auth check is done (optional, depending on how authStore.checkAuth works)
    if (!authStore.user && !authStore.isAuthenticated) {
        await authStore.checkAuth();
    }

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!authStore.isAuthenticated) {
            next({ name: 'login' });
        } else {
            next();
        }
    } else if (to.name === 'login' && authStore.isAuthenticated) {
        next({ name: 'admin-events' }); // or home
    } else {
        next();
    }
});

export default router;
