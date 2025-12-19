<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  size?: string | number;
}>();

// Load all SVGs as raw strings
const icons = import.meta.glob('../../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true });

const iconContent = computed(() => {
  const path = `../../assets/icons/${props.name}.svg`;
  return (icons[path] as string) || '';
});

const style = computed(() => {
  const sizeVal = typeof props.size === 'number' ? `${props.size}px` : props.size || '1em';
  return {
    width: sizeVal,
    height: sizeVal,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit' // Ensure it inherits color
  };
});
</script>

<template>
  <span 
    class="icon-image" 
    :style="style" 
    v-html="iconContent"
  ></span>
</template>

<style scoped>
.icon-image {
  line-height: 0;
}

.icon-image :deep(svg) {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
}
</style>
