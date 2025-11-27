<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header>
      <nav>
        <RouterLink to="/">Home</RouterLink> |
        <RouterLink to="/client">Client Booking</RouterLink> |
        <RouterLink to="/admin">Admin Dashboard</RouterLink>
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
}

nav {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

nav a {
  text-decoration: none;
  color: #2c3e50;
  font-weight: bold;
  margin: 0 0.5rem;
}

nav a.router-link-active {
  color: #42b983;
}
</style>
