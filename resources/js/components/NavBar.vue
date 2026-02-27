<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <nav class="navbar is-white has-shadow" role="navigation" aria-label="main navigation">
    <div class="container is-fluid">
      <div class="navbar-brand">
        <router-link to="/" class="navbar-item">
          <strong class="is-size-5">🎟 TicketShop</strong>
        </router-link>
      </div>

      <div class="navbar-menu">
        <div class="navbar-start">
          <router-link to="/" class="navbar-item">Events</router-link>
          <template v-if="authStore.isAuthenticated">
            <router-link to="/admin/events" class="navbar-item">Events Dashboard</router-link>
            <router-link to="/admin/venues" class="navbar-item">Venues</router-link>
          </template>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="buttons">
              <router-link v-if="!authStore.isAuthenticated" to="/login" class="button is-primary">
                Login
              </router-link>
              <button v-else class="button is-light is-danger" @click="handleLogout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
