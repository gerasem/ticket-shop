<script setup lang="ts">
import NavBar from './components/NavBar.vue';
</script>

<template>
  <div class="app-container">
    <NavBar />
    <main class="section">
      <div class="container is-fluid">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
}

main.section {
  flex: 1;
}
</style>
