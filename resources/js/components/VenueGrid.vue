<script setup lang="ts">
import { toRef, ref } from 'vue';
import { type Venue } from '../types/venue';
import { useVenueEditor } from '../composables/useVenueEditor';
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  venue: Venue;
}>();

const emit = defineEmits<{
  (e: 'grid-mousedown', event: MouseEvent): void;
}>();

const venueEditor = useVenueEditor(toRef(props, 'venue'));

// Zoom State
const zoomLevel = ref(1);
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

const zoomIn = () => {
  if (zoomLevel.value < MAX_ZOOM) {
    zoomLevel.value = Math.min(zoomLevel.value + ZOOM_STEP, MAX_ZOOM);
  }
};

const zoomOut = () => {
  if (zoomLevel.value > MIN_ZOOM) {
    zoomLevel.value = Math.max(zoomLevel.value - ZOOM_STEP, MIN_ZOOM);
  }
};

// Drag-to-scroll state
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const wrapperRef = ref<HTMLElement | null>(null);

const handleMouseDown = (event: MouseEvent) => {
  if (!wrapperRef.value) return;
  
  // Only allow drag-to-scroll with middle mouse button or when explicitly enabled
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX + wrapperRef.value.scrollLeft,
    y: event.clientY + wrapperRef.value.scrollTop
  };
  event.preventDefault();
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !wrapperRef.value) return;
  
  const dx = dragStart.value.x - event.clientX;
  const dy = dragStart.value.y - event.clientY;
  
  wrapperRef.value.scrollLeft = dx;
  wrapperRef.value.scrollTop = dy;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseLeave = () => {
  isDragging.value = false;
};
</script>

<template>
  <div class="venue-container">
    <h2>{{ venue.name }}</h2>

    <!-- Zoom Controls -->
    <div class="zoom-controls">
      <BaseButton size="small" variant="light" @click="zoomOut" :disabled="zoomLevel <= MIN_ZOOM" title="Zoom Out">-</BaseButton>
      <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
      <BaseButton size="small" variant="light" @click="zoomIn" :disabled="zoomLevel >= MAX_ZOOM" title="Zoom In">+</BaseButton>
    </div>

    <!-- Scrollable wrapper -->
    <div 
      ref="wrapperRef"
      class="venue-wrapper"
      :class="{ 'dragging': isDragging }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <div 
        class="venue-scalable-content"
        :style="{ 
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          width: venue.width + 'px',
          height: venue.height + 'px'
        }"
      >

      
        <div class="seating-area">
          <!-- Left row labels -->
          <div class="row-labels row-labels-left">
            <div 
              v-for="row in venueEditor.getRows.value" 
              :key="'left-' + row"
              class="row-label"
              :style="{ top: venueEditor.getRowY(row) + 'px' }"
            >
              {{ row }}
            </div>
          </div>

          <!-- Seats grid -->
          <div 
            class="seats-grid"
            @mousedown="emit('grid-mousedown', $event)"
          >            <!-- Background Image -->
            <img 
              v-if="venue.backgroundImage?.url" 
              :src="venue.backgroundImage.url"
              class="background-image"
              :style="{
                transform: `translate(${venue.backgroundImage.x}px, ${venue.backgroundImage.y}px) scale(${venue.backgroundImage.scale / 100}) rotate(${venue.backgroundImage.rotation}deg)`,
                transformOrigin: 'center center'
              }"
            />

            <!-- Objects Layer (between background and seats) -->
            <div 
              v-for="obj in venue.objects" 
              :key="obj.id"
              class="venue-object"
              :style="{
                position: 'absolute',
                left: obj.x + 'px',
                top: obj.y + 'px',
                width: obj.type === 'text' ? 'auto' : obj.width + 'px',
                height: obj.type === 'text' ? 'auto' : obj.height + 'px',
                transform: `rotate(${obj.rotation || 0}deg)`
              }"
            >
              <div 
                class="object-content" 
                :class="obj.type"
                :style="obj.type === 'text' ? { 
                  color: obj.color || '#000000',
                  fontSize: (obj.fontSize || 16) + 'px'
                } : {}"
              >
                {{ obj.label || (obj.type === 'text' ? 'Text' : obj.type) }}
              </div>
            </div>

            <!-- Overlay Slot (for selection rectangle) -->
            <slot name="overlay"></slot>

            <!-- Seats Slot -->
            <slot name="seat" v-for="seat in venue.seats" :seat="seat"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.venue-container {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%; /* Fill the editor container */
  max-width: none; /* Remove max-width limitation if inside editor */
  margin: 0;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  overflow: hidden; /* Prevent container itself from scrolling */
}

.venue-container h2 {
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  flex-shrink: 0; /* Keep header from shrinking */
}

.venue-wrapper {
  flex: 1; /* Take remaining height */
  min-height: 0; /* Important for scroll to work in flex child */
  width: 100%;
  overflow: auto;
  border: 2px solid var(--border-secondary);
  border-radius: 8px;
  background: var(--bg-primary);
  position: relative;
  cursor: grab;
  user-select: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.venue-wrapper.dragging {
  cursor: grabbing;
}

.venue-scalable-content {
  position: relative;
  /* transform and transform-origin set inline via :style */
  transition: transform 0.2s ease-out;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 0;
  pointer-events: none;
  opacity: 0.7;
}

.zoom-controls {
  position: absolute;
  top: 20px;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-primary);
  border-radius: 8px;
  transition: all 0.2s;
  padding: 4px;
  border: 1px solid var(--border-secondary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  z-index: 10;
}

.zoom-level {
  font-size: 0.85rem;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* Selected object highlighting - not scoped to work with dynamic elements */
.venue-object.selected {
  z-index: 2!important;
  box-shadow: 0 0 0 3px var(--color-accent) !important;
}
</style>

