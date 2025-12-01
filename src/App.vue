<script setup lang="ts">
import { RouterView } from 'vue-router';

// Import shared styles
import './assets/theme.css';
import './assets/styles/buttons.css';
import './assets/styles/layout.css';
</script>

<template>
  <div class="app-container">
    <header>
      <nav>
        <RouterLink to="/">Home</RouterLink> |
        <RouterLink to="/client">Client Booking</RouterLink> |
        <RouterLink to="/admin">Admin</RouterLink>
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
}

nav a {
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: bold;
  margin: 0 0.5rem;
  transition: color 0.2s;
}

nav a:hover {
  color: var(--color-text-primary);
}

nav a.router-link-active {
  color: var(--color-accent);
}
</style>
