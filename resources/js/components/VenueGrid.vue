<script setup lang="ts">
import { toRef, ref } from 'vue';
import { type Venue } from '../services/mockData';
import { useVenueEditor } from '../composables/useVenueEditor';

const props = defineProps<{
  venue: Venue;
  enableLabelSelection?: boolean; // Enable row/column selection by clicking labels
  transparentSeats?: boolean; // Make seats semi-transparent when using objects tool
  selectedObjectId?: string | null; // Currently selected object ID
  activeTool?: string; // Current active tool
  showLeftRowLabels?: boolean; // Show row labels on the left
  showRightRowLabels?: boolean; // Show row labels on the right
}>();

const emit = defineEmits<{
  (e: 'grid-mousedown', event: MouseEvent): void;

  (e: 'row-click', row: number): void;
  (e: 'col-click', col: number): void;
  (e: 'object-click', objectId: string, event: MouseEvent): void;
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
  
  // Only allow drag-to-scroll if Pan tool is active
  if (props.activeTool !== 'pan') return;
  
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
      <button @click="zoomOut" :disabled="zoomLevel <= MIN_ZOOM" title="Zoom Out">-</button>
      <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
      <button @click="zoomIn" :disabled="zoomLevel >= MAX_ZOOM" title="Zoom In">+</button>
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
          <div 
            v-if="showLeftRowLabels !== false"
            class="row-labels row-labels-left"
          >
            <div 
              v-for="row in venueEditor.getRows.value" 
              :key="'left-' + row"
              class="row-label"
              :class="{ 'clickable': enableLabelSelection }"
              :style="{ top: venueEditor.getRowY(row) + 'px' }"
              @click="enableLabelSelection && emit('row-click', row)"
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
              :class="{ selected: selectedObjectId === obj.id }"
              @click="(e) => { if (activeTool === 'objects') { e.stopPropagation(); emit('object-click', obj.id, e); } }"
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

          <!-- Right row labels -->
          <div 
            v-if="showRightRowLabels"
            class="row-labels-right"
          >
            <div 
              v-for="row in venueEditor.getRows.value" 
              :key="'right-' + row"
              class="row-label"
              :class="{ 'clickable': enableLabelSelection }"
              :style="{ top: venueEditor.getRowY(row) + 'px' }"
              @click="enableLabelSelection && emit('row-click', row)"
            >
              {{ row }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.venue-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.venue-wrapper {
  overflow: auto;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-primary);
  position: relative;
  cursor: grab;
  user-select: none;
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
  background: rgba(0, 0, 0, 0.6);
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  padding: 0;
 }

.zoom-controls button {
  width: 25px;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 3px 0;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  background-color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.25s;
}

.zoom-controls button:hover:not(:disabled) {
  background: var(--color-accent-strong);
  border-color: var(--color-accent);
}

.zoom-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  font-size: 0.85rem;
  color: var(--color-text-tertiary);
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

