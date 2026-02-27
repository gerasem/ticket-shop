<script setup lang="ts">
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
</script>

<template>
  <!-- Main Toolbar -->
  <div class="main-toolbar">
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'pan' }"
      @click="emit('update:activeTool', 'pan')"
      title="Pan Tool"
    >
      <i class="bi bi-arrows-move" style="font-size: 24px;"></i>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'select' }"
      @click="emit('update:activeTool', 'select')"
      title="Selection Tool"
    >
      <i class="bi bi-cursor" style="font-size: 24px;"></i>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'settings' }"
      @click="emit('update:activeTool', 'settings')"
      title="Settings"
    >
      <i class="bi bi-gear" style="font-size: 24px;"></i>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'add-seat' }"
      @click="emit('update:activeTool', 'add-seat')"
      title="Add Seat"
    >
      <i class="bi bi-plus-lg" style="font-size: 24px;"></i>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'background' }"
      @click="emit('update:activeTool', 'background')"
      title="Background"
    >
      <i class="bi bi-image" style="font-size: 24px;"></i>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'objects' }"
      @click="emit('update:activeTool', 'objects')"
      title="Objects"
    >
      <i class="bi bi-box" style="font-size: 24px;"></i>
    </button>
    <div v-if="activeTool === 'select' || activeTool === 'add-seat' || activeTool === 'background' || activeTool === 'objects'" class="separator"></div>
    <button 
      v-if="activeTool === 'select' || activeTool === 'add-seat' || activeTool === 'background' || activeTool === 'objects'"
      class="tool-btn" 
      @click="$emit('undo')"
      :disabled="!canUndo"
      title="Undo (Ctrl+Z)"
    >
      <i class="bi bi-arrow-90deg-left" style="font-size: 24px;"></i>
    </button>
    <button 
      v-if="activeTool === 'select' || activeTool === 'add-seat' || activeTool === 'background' || activeTool === 'objects'"
      class="tool-btn" 
      @click="$emit('redo')"
      :disabled="!canRedo"
      title="Redo (Ctrl+Y)"
    >
      <i class="bi bi-arrow-90deg-right" style="font-size: 24px;"></i>
    </button>
    <button 
      v-if="activeTool === 'select' || activeTool === 'background' || activeTool === 'objects'"
      class="tool-btn delete-btn" 
      @click="$emit('delete')"
      :disabled="!canDelete"
      title="Delete (Del)"
    >
      <i class="bi bi-trash" style="font-size: 24px;"></i>
    </button>
  </div>
</template>

<style scoped lang="scss">
/* Main Toolbar */
.main-toolbar {
  width: 60px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  align-items: center;
  height: 100%;
}

.tool-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: rgb(var(--color-primary-light));
  color: rgb(var(--color-primary));
}

.tool-btn.active {
  background: rgb(var(--color-primary-light));
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
}

.tool-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  color: #555;
}

.tool-btn:disabled:hover {
  background: transparent;
  color: #555;
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
