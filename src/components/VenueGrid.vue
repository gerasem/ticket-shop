<script setup lang="ts">
import { toRef, ref } from 'vue';
import { type Venue } from '../services/mockData';
import { useVenueEditor } from '../composables/useVenueEditor';

const props = defineProps<{
  venue: Venue;
  enableLabelSelection?: boolean; // Enable row/column selection by clicking labels
}>();

const emit = defineEmits<{
  (e: 'grid-mousedown', event: MouseEvent): void;
  (e: 'stage-mousedown', event: MouseEvent): void;
  (e: 'row-click', row: number): void;
  (e: 'col-click', col: number): void;
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
        <div 
          v-if="venue.stage"
          class="stage"
          :style="{
            left: venue.stage.x + 'px',
            top: venue.stage.y + 'px',
            width: venue.stage.width + 'px',
            height: venue.stage.height + 'px'
          }"
          @mousedown.stop="emit('stage-mousedown', $event)"
        >SCREEN / STAGE</div>
        
        <!-- Top column labels -->
        <div class="column-labels-container">
          <div class="column-spacer"></div>
          <div class="column-labels">
            <div 
              v-for="col in venueEditor.getColumns.value" 
              :key="'top-' + col"
              class="column-label"
              :class="{ 'clickable': enableLabelSelection }"
              :style="{ left: venueEditor.getColX(col) + 'px' }"
              @click="enableLabelSelection && emit('col-click', col)"
            >
              {{ col }}
            </div>
          </div>
        </div>

        <div class="seating-area">
          <!-- Left row labels -->
          <div class="row-labels row-labels-left">
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
          >
            <!-- Overlay Slot (for selection rectangle) -->
            <slot name="overlay"></slot>

            <!-- Seats -->
            <template v-for="seat in venue.seats" :key="seat.id">
              <slot name="seat" :seat="seat"></slot>
            </template>
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
  max-height: 80vh;
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
  background-color: #bdbdbd;
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
</style>

