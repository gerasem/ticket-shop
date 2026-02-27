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
  customClass?: string;
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: undefined,
  size: undefined,
  outlined: false,
  loading: false,
  fullwidth: false,
  disabled: false,
  type: 'button',
  customClass: ''
});

const buttonClasses = computed(() => {
  return [
    'button',
    props.variant ? `is-${props.variant}` : '',
    props.size ? `is-${props.size}` : '',
    {
      'is-outlined': props.outlined,
      'is-loading': props.loading,
      'is-fullwidth': props.fullwidth
    },
    props.customClass
  ].filter(Boolean).join(' ');
});
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
