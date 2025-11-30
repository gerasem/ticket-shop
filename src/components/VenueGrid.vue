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

    <div 
      class="venue-scalable-content"
      :style="{ 
        transform: `scale(${zoomLevel})`,
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
</template>

<style scoped>
.venue-scalable-content {
  transform-origin: top left;
  transition: transform 0.2s ease-out;
  /* Visual boundary */
  background: #2a2a2a;
  border: 1px solid #444;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  /* Rigid binding */
  overflow: auto;
  position: relative;
}

.zoom-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.5rem;
  border-radius: 8px;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.zoom-controls button {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.2s;
  padding: 0;
}

.zoom-controls button:hover:not(:disabled) {
  background: rgba(66, 185, 131, 0.5);
  border-color: #42b983;
}

.zoom-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  font-size: 0.7rem;
  color: #aaa;
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
</style>
