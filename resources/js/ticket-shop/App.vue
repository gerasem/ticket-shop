<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="ticket-shop-app">
    <header class="p-4 border-b">
        <h1 class="text-xl font-bold">Ticket Shop V2</h1>
        <nav class="flex gap-4 mt-2">
            <router-link to="/">Events</router-link>
            <!-- Add more links as views are created -->
        </nav>
    </header>
    <main class="p-4">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* New styles for V2 specific can go here or in a new SCSS file */
</style>
