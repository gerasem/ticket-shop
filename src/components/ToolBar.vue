<script setup lang="ts">
type Tool = 'select' | 'pan' | 'settings' | 'add-seat' | 'background' | 'objects';

defineProps<{
  activeTool: Tool;
}>();

const emit = defineEmits<{
  (e: 'update:activeTool', tool: Tool): void;
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
      <span class="tool-icon">✋</span>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'select' }"
      @click="emit('update:activeTool', 'select')"
      title="Selection Tool"
    >
      <span class="tool-icon">⬚</span>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'settings' }"
      @click="emit('update:activeTool', 'settings')"
      title="Settings"
    >
      <span class="tool-icon">⚙️</span>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'add-seat' }"
      @click="emit('update:activeTool', 'add-seat')"
      title="Add Seat"
    >
      <span class="tool-icon">➕</span>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'background' }"
      @click="emit('update:activeTool', 'background')"
      title="Background"
    >
      <span class="tool-icon">🖼️</span>
    </button>
    <button 
      class="tool-btn" 
      :class="{ active: activeTool === 'objects' }"
      @click="emit('update:activeTool', 'objects')"
      title="Objects"
    >
      <span class="tool-icon">📦</span>
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

.tool-icon {
  font-size: 1.4rem;
}
</style>
