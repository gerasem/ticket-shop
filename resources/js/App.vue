<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useVenueStore } from './stores/venue';
import { useAuthStore } from './stores/auth';

// Import shared styles
import './assets/theme.css';
import './assets/styles/buttons.css';
import './assets/styles/layout.css';

const venueStore = useVenueStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const showAdminToolbar = computed(() => {
  return route.path.startsWith('/admin') && authStore.isAuthenticated;
});

const handleExportJSON = async () => {
  const success = await venueStore.copyVenueJSON();
  if (success) {
    alert('✅ Venue JSON copied to clipboard!');
  } else {
    alert('❌ Failed to copy. Please try again.');
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="app-container">
    <header>
      <nav>
        <div class="nav-left">
          <RouterLink to="/">Home</RouterLink> |
          <RouterLink to="/client">Client Booking</RouterLink> |
          <template v-if="authStore.isAuthenticated">
            <RouterLink to="/admin">Admin</RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/login">Login</RouterLink>
          </template>
        </div>
        <div class="nav-right">
            <template v-if="authStore.isAuthenticated">
                 <a href="#" @click.prevent="handleLogout" class="logout-link">Logout</a>
            </template>
            <div v-if="showAdminToolbar" id="admin-toolbar-actions"></div>
             <button v-if="showAdminToolbar" class="export-btn" @click="handleExportJSON">Export</button>
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
  font-family: 'Inter', sans-serif;
  margin: 0 auto;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  min-height: 100vh;
}

nav {
  padding: 1rem;
  background: var(--color-bg-panel);
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

nav a {
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: bold;
  margin: 0 0.25rem;
  transition: color 0.2s;
}

nav a:hover {
  color: var(--color-text-primary);
}

nav a.router-link-active {
  color: var(--color-accent);
}

.logout-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: bold;
  margin-right: 1rem;
  font-size: 0.9rem;
}

.logout-link:hover {
  color: #ef4444; /* Red color for logout */
}
</style>

<style>
.export-btn {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>

