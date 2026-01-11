<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from './components/NavBar.vue';
</script>

<template>
  <div class="ticket-shop-app">
    <NavBar />

    <main class="section">
      <div class="container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style>
/* New styles for V2 specific can go here or in a new SCSS file */
</style>
