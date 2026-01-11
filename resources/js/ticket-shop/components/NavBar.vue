<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
const authStore = useAuthStore();
</script>
<template>
  <nav class="navbar is-light" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <h1 class="navbar-item title is-4 mb-0">Ticket Shop V2</h1>
    </div>

    <div class="navbar-menu">
      <div class="navbar-start">
        <router-link to="/" class="navbar-item">Events</router-link>
      </div>

      <div class="navbar-end">
        <div class="navbar-item">
          <div class="buttons">
                <router-link  v-if="!authStore.isAuthenticated" to="/login" class="button is-primary is-small">
                  Login
                </router-link>
                 <a v-else class="button is-light is-small" @click="authStore.logout">
                  Logout
                </a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
