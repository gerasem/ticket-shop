<script setup lang="ts">
defineProps<{
  title: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyIcon: string;
  emptyTitle: string;
  emptySubtitle: string;
}>();
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="level mb-5">
      <div class="level-left">
        <div class="level-item">
          <h1 class="title is-3">{{ title }}</h1>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <slot name="header-actions"></slot>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="has-text-centered py-6 has-text-grey">
      <p>Loading...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="isEmpty" class="has-text-centered py-6">
      <i :class="['bi', emptyIcon]" style="font-size: 3rem; color: var(--border-secondary);"></i>
      <h2 class="title is-4 mt-4">{{ emptyTitle }}</h2>
      <p class="has-text-grey">{{ emptySubtitle }}</p>
    </div>

    <!-- List -->
    <div v-else class="is-flex is-flex-direction-column">
      <slot></slot>
    </div>
  </div>
</template>
