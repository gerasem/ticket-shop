<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { type ButtonVariants, buttonVariants } from './variants'
import { cn } from '../../../lib/utils'

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  asChild?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  asChild: false,
})
</script>

<template>
  <button
    :class="cn(buttonVariants({ variant, size }), props.class)"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
