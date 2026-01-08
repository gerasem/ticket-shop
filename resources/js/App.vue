<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useVenueStore } from './stores/venue';
import { useAuthStore } from './stores/auth';

const venueStore = useVenueStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="app-container">
    <header class="header">
      <nav class="nav-container">
        <div class="nav-left">
          <router-link to="/" class="logo">TicketShop</router-link>
          <router-link to="/">Events</router-link>
          <router-link v-if="authStore.isAuthenticated" to="/admin/events">Admin</router-link>
        </div>
        <div class="nav-right">
          <router-link v-if="!authStore.isAuthenticated" to="/login">Login</router-link>
          <a v-if="authStore.isAuthenticated" @click="handleLogout" class="logout-link" href="#">Logout</a>
        </div>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
}

.header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(8px);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
  color: #111827;
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

.nav-left a:not(.logo) {
  text-decoration: none;
  color: #4b5563;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.nav-left a:not(.logo):hover {
  color: #111827;
  background: #f3f4f6;
}

.nav-left a.router-link-active {
  color: rgb(var(--color-primary));
  background: rgba(var(--color-primary), 0.1);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-right a {
  text-decoration: none;
  color: #4b5563;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.nav-right a:hover {
  color: #111827;
  background: #f3f4f6;
}

.logout-link {
  color: #dc2626;
  cursor: pointer;
}

.logout-link:hover {
  background: #fef2f2;
}

.export-btn {
  background: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #f9fafb;
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
}

main {
  flex: 1;
}
</style>
