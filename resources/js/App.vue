<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from './components/NavBar.vue';

const route = useRoute();
const isFullscreen = computed(() => !!route.meta.fullscreen);
</script>

<template>
  <div class="app-container">
    <NavBar />
    <main :class="['section', { 'is-fullscreen': isFullscreen }]">
      <div v-if="!isFullscreen" class="container is-fluid">
        <RouterView />
      </div>
      <RouterView v-else />
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

  &.is-fullscreen {
    padding: 0;
    overflow: hidden;
  }
}
</style>
