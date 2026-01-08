<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  for?: string
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <label
    :for="props.for"
    :class="props.class"
    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    <slot />
  </label>
</template>
