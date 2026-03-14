<script setup lang="ts">
import { computed } from 'vue';

interface BaseButtonProps {
  variant?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'white' | 'light' | 'dark' | 'black' | 'text' | 'ghost';
  size?: 'small' | 'normal' | 'medium' | 'large';
  outlined?: boolean;
  loading?: boolean;
  fullwidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: undefined,
  size: undefined,
  outlined: false,
  loading: false,
  fullwidth: false,
  disabled: false,
  type: 'button',
});

const buttonClasses = computed(() => [
  'button',
  props.variant && `is-${props.variant}`,
  props.size && `is-${props.size}`,
  props.outlined && 'is-outlined',
  props.loading && 'is-loading',
  props.fullwidth && 'is-fullwidth',
].filter(Boolean).join(' '));
</script>

<template>
  <button 
    :class="buttonClasses"
    :type="type"
    :disabled="disabled || loading"
  >
    <slot></slot>
  </button>
</template>
