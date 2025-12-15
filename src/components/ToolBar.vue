<script setup lang="ts">
import IconImage from './ui/IconImage.vue';

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
      <IconImage name="pan" size="24px" />
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'select' }"
      @click="emit('update:activeTool', 'select')"
      title="Selection Tool"
    >
      <IconImage name="select" size="24px" />
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'settings' }"
      @click="emit('update:activeTool', 'settings')"
      title="Settings"
    >
      <IconImage name="settings" size="24px" />
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'add-seat' }"
      @click="emit('update:activeTool', 'add-seat')"
      title="Add Seat"
    >
      <IconImage name="plus" size="24px" />
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'background' }"
      @click="emit('update:activeTool', 'background')"
      title="Background"
    >
      <IconImage name="image" size="24px" />
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'objects' }"
      @click="emit('update:activeTool', 'objects')"
      title="Objects"
    >
      <IconImage name="box" size="24px" />
    </button>
    <div v-if="activeTool === 'select'" class="separator"></div>
    <button 
      v-if="activeTool === 'select'"
      class="tool-btn" 
      @click="$emit('undo')"
      :disabled="!canUndo"
      title="Undo (Ctrl+Z)"
    >
      <IconImage name="undo" size="24px" />
    </button>
    <button 
      v-if="activeTool === 'select'"
      class="tool-btn" 
      @click="$emit('redo')"
      :disabled="!canRedo"
      title="Redo (Ctrl+Y)"
    >
      <IconImage name="redo" size="24px" />
    </button>
    <button 
      v-if="activeTool === 'select'"
      class="tool-btn delete-btn" 
      @click="$emit('delete')"
      :disabled="!canDelete"
      title="Delete Selected (Del)"
    >
      <IconImage name="trash" size="24px" />
    </button>
  </div>
</template>

<style scoped>
/* Main Toolbar */
.main-toolbar {
  width: 60px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
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
  color: #aaa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.tool-btn.active {
  background: rgba(66, 185, 131, 0.2);
  border-color: #42b983;
  color: #42b983;
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
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}
</style>
