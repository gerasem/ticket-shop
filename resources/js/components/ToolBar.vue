<script setup lang="ts">
import BaseButton from './BaseButton.vue';
type Tool = 'select' | 'pan' | 'settings' | 'add-seat' | 'background' | 'objects';

defineProps<{
  activeTool: Tool;
  canUndo?: boolean;
  canRedo?: boolean;
  canDelete?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:activeTool', tool: Tool): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'delete'): void;
}>();

const primaryTools = [
  { id: 'select', name: 'Select', icon: 'bi-cursor' },
  { id: 'pan', name: 'Pan View', icon: 'bi-arrows-move' },
  { id: 'settings', name: 'Properties', icon: 'bi-gear' },
  { id: 'add-seat', name: 'Add Seat', icon: 'bi-plus-lg' },
  { id: 'background', name: 'Background', icon: 'bi-image' },
  { id: 'objects', name: 'Objects', icon: 'bi-box' },
];
</script>

<template>
  <!-- Main Toolbar -->
  <div class="main-toolbar">
    <BaseButton
      v-for="tool in primaryTools"
      :key="tool.id"
      :variant="activeTool === tool.id ? 'primary' : 'light'"
      class="mb-2"
      :class="{ active: activeTool === tool.id }"
      :title="tool.name"
      @click="emit('update:activeTool', tool.id as Tool)"
    >
      <span class="icon is-medium">
        <i :class="'bi ' + tool.icon" style="font-size: 24px;"></i>
      </span>
    </BaseButton>
    <div v-if="activeTool === 'select' || activeTool === 'add-seat' || activeTool === 'background' || activeTool === 'objects'" class="separator"></div>
    <BaseButton
      variant="light"
      class="mb-2"
      @click="$emit('undo')"
      :disabled="!canUndo"
      title="Undo (Ctrl+Z)"
    >
      <i class="bi bi-arrow-counterclockwise" style="font-size: 24px;"></i>
    </BaseButton>
    <BaseButton
      variant="light"
      class="mb-2"
      @click="$emit('redo')"
      :disabled="!canRedo"
      title="Redo (Ctrl+Y)"
    >
      <i class="bi bi-arrow-clockwise" style="font-size: 24px;"></i>
    </BaseButton>
    <div v-if="activeTool === 'select' || activeTool === 'add-seat' || activeTool === 'background' || activeTool === 'objects'" class="separator"></div>
    <BaseButton
      v-if="activeTool === 'select' || activeTool === 'add-seat' || activeTool === 'background' || activeTool === 'objects'"
      class="mb-2"
      variant="danger"
      @click="$emit('delete')"
      :disabled="!canDelete"
      title="Delete (Del/Backspace)"
    >
      <i class="bi bi-trash" style="font-size: 24px;"></i>
    </BaseButton>
  </div>
</template>

<style scoped lang="scss">
.main-toolbar {
  width: 60px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.tool-icon {
  font-size: 1.4rem;
}

.separator {
  width: 80%;
  height: 1px;
  background: var(--border-primary);
  margin: 0.5rem 0;
}
</style>
