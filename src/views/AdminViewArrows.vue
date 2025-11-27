<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, toRef } from 'vue';
import { useVenueStore } from '../stores/venue';
import { useVenueEditor } from '../composables/useVenueEditor';
import { useGeometry, type Point } from '../composables/useGeometry';
import { type EditMode } from '../constants/editor';

const venueStore = useVenueStore();

// Composables
const venueEditor = useVenueEditor(toRef(venueStore, 'currentVenue'));
const geometry = useGeometry();

// Edit mode state
const selectedSeats = ref<Set<string>>(new Set());

// Movement state
const moveStep = ref(10);

// Area selection state
const isAreaSelecting = ref(false);
const areaStart = ref<Point>({ x: 0, y: 0 });
const areaEnd = ref<Point>({ x: 0, y: 0 });

// Keyboard event handler
const handleKeydown = (event: KeyboardEvent) => {
  if (selectedSeats.value.size === 0) return;
  
  // Prevent default scrolling for arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }

  switch (event.key) {
    case 'ArrowUp':
      moveSelectedSeats(0, -1);
      break;
    case 'ArrowDown':
      moveSelectedSeats(0, 1);
      break;
    case 'ArrowLeft':
      moveSelectedSeats(-1, 0);
      break;
    case 'ArrowRight':
      moveSelectedSeats(1, 0);
      break;
  }
};

onMounted(() => {
  venueStore.loadVenue();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// Helper to get seats grid container
const getSeatsGridContainer = (): HTMLElement | null => {
  return document.querySelector('.seats-grid');
};

// Selection management
const clearSelection = () => {
  selectedSeats.value.clear();
};

const toggleSeatSelection = (seatId: string) => {
  if (selectedSeats.value.has(seatId)) {
    selectedSeats.value.delete(seatId);
  } else {
    selectedSeats.value.add(seatId);
  }
};

const setSingleSelection = (seatId: string) => {
  clearSelection();
  selectedSeats.value.add(seatId);
};

// Movement Logic
const moveSelectedSeats = (dx: number, dy: number) => {
  const stepX = dx * moveStep.value;
  const stepY = dy * moveStep.value;

  selectedSeats.value.forEach(seatId => {
    const seat = venueEditor.findSeatById(seatId);
    if (seat) {
      seat.x += stepX;
      seat.y += stepY;
    }
  });
};

// Unified Area Selection Handler
const handleCanvasMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  
  // If we clicked a seat, do nothing (let the seat's own handlers work)
  if (target.classList.contains('seat')) return;
  
  const container = getSeatsGridContainer();
  if (!container) return;
  
  // If Ctrl is NOT pressed, clear existing selection when clicking background
  if (!event.ctrlKey && !event.metaKey) {
    clearSelection();
  }
  
  areaStart.value = geometry.getRelativeCoordinates(event, container);
  areaEnd.value = { ...areaStart.value };
  isAreaSelecting.value = true;
  
  window.addEventListener('mousemove', handleWindowMouseMove);
  window.addEventListener('mouseup', handleWindowMouseUp);
  
  event.preventDefault();
};

const handleWindowMouseMove = (event: MouseEvent) => {
  const container = getSeatsGridContainer();
  if (!container) return;
  
  if (isAreaSelecting.value) {
    areaEnd.value = geometry.getRelativeCoordinates(event, container);
  }
};

const handleWindowMouseUp = () => {
  if (isAreaSelecting.value) {
    const bounds = geometry.calculateRectangleBounds(areaStart.value, areaEnd.value);
    const seatsInArea = venueEditor.getSeatsInArea(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY
    );
    
    // Add seats in area to selection
    seatsInArea.forEach(seat => selectedSeats.value.add(seat.id));
    
    isAreaSelecting.value = false;
  }
  
  window.removeEventListener('mousemove', handleWindowMouseMove);
  window.removeEventListener('mouseup', handleWindowMouseUp);
};

const selectionRectangle = computed(() => {
  if (!isAreaSelecting.value) return null;
  
  const bounds = geometry.calculateRectangleBounds(areaStart.value, areaEnd.value);
  return geometry.boundsToRectangle(bounds);
});

// Seat click handler for selection
const handleSeatClick = (seatId: string, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    toggleSeatSelection(seatId);
  } else {
    setSingleSelection(seatId);
  }
};
</script>

<template>
  <div class="admin-view">
    <h1>Venue Layout Editor (Arrows)</h1>
    
    <div v-if="venueStore.currentVenue" class="editor-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <h3>Edit Tools</h3>
        
        <!-- Movement Controls -->
        <div class="movement-controls">
          <h4>Movement</h4>
          <div class="step-control">
            <label>Step:</label>
            <input type="number" v-model="moveStep" min="1" class="step-input" />
          </div>
          <div class="arrow-buttons">
            <button class="arrow-btn up" @click="moveSelectedSeats(0, -1)">↑</button>
            <div class="horizontal-arrows">
              <button class="arrow-btn left" @click="moveSelectedSeats(-1, 0)">←</button>
              <button class="arrow-btn right" @click="moveSelectedSeats(1, 0)">→</button>
            </div>
            <button class="arrow-btn down" @click="moveSelectedSeats(0, 1)">↓</button>
          </div>
        </div>

        <div class="tool-info">
          <p><strong>Smart Selection:</strong></p>
          <ul>
            <li><strong>Click Seat:</strong> Select</li>
            <li><strong>Ctrl+Click:</strong> Multi-select</li>
            <li><strong>Arrows:</strong> Move selected</li>
            <li><strong>Drag Background:</strong> Area select</li>
          </ul>
          <p class="selected-count">Selected: {{ selectedSeats.size }} seat(s)</p>
        </div>
      </div>

      <!-- Venue Editor -->
      <div class="venue-container">
        <h2>{{ venueStore.currentVenue.name }}</h2>
        <div class="stage">SCREEN / STAGE</div>
        
        <!-- Top column labels -->
        <div class="column-labels-container">
          <div class="column-spacer"></div>
          <div class="column-labels">
            <div 
              v-for="col in venueEditor.getColumns.value" 
              :key="'top-' + col"
              class="column-label"
              :style="{ left: venueEditor.getColX(col) + 'px' }"
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
              :style="{ top: venueEditor.getRowY(row) + 'px' }"
            >
              {{ row }}
            </div>
          </div>

          <!-- Seats grid -->
          <div 
            class="seats-grid"
            @mousedown="handleCanvasMouseDown"
          >
            <!-- Area selection rectangle -->
            <div 
              v-if="selectionRectangle"
              class="selection-rectangle"
              :style="{
                left: selectionRectangle.left + 'px',
                top: selectionRectangle.top + 'px',
                width: selectionRectangle.width + 'px',
                height: selectionRectangle.height + 'px'
              }"
            ></div>

            <!-- Seats -->
            <div
              v-for="seat in venueStore.currentVenue.seats"
              :key="seat.id"
              class="seat"
              :class="{ 
                selected: selectedSeats.has(seat.id)
              }"
              :style="{ left: seat.x + 'px', top: seat.y + 'px' }"
              @mousedown.stop="handleSeatClick(seat.id, $event)"
            >
              {{ seat.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <p v-else>Loading venue...</p>
  </div>
</template>

<style scoped>

.admin-view {
  padding: 2rem;
  background: #1a1a1a;
  min-height: 100vh;
  color: white;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.editor-container {
  display: flex;
  gap: 2rem;
  width: 100%;
}

/* Toolbar */
.toolbar {
  width: 250px;
  background: #2a2a2a;
  padding: 1.5rem;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.toolbar h3 {
  margin: 0 0 1rem 0;
  color: #42b983;
}

.tool-info {
  font-size: 0.9rem;
  color: #aaa;
  line-height: 1.6;
}

.tool-info ul {
  padding-left: 1.2rem;
  margin: 0.5rem 0;
}

.tool-info li {
  margin-bottom: 0.25rem;
}

.selected-count {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #42b983;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Venue Container */
.venue-container {
  flex: 1;
  background: #222;
  border-radius: 12px;
  padding: 1.5rem;
  overflow: auto;
}

.venue-container h2 {
  text-align: center;
  margin: 0 0 1rem 0;
}

.stage {
  width: 80%;
  height: 30px;
  background: #555;
  margin: 10px auto;
  text-align: center;
  line-height: 30px;
  border-radius: 0 0 20px 20px;
}

.column-labels-container {
  display: flex;
  height: 30px;
  margin-bottom: -40px;
}

.column-spacer {
  width: 40px;
  flex-shrink: 0;
}

.column-labels {
  position: relative;
  flex: 1;
}

.column-label {
  position: absolute;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  color: #888;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.seating-area {
  position: relative;
  display: flex;
  gap: 20px;
  padding: 20px 0;
}

.row-labels {
  position: relative;
  width: 40px;
  flex-shrink: 0;
}

.row-label {
  position: absolute;
  width: 40px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  color: #888;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.seats-grid {
  position: relative;
  flex: 1;
  height: 600px;
  cursor: crosshair;
}

.seat {
  position: absolute;
  width: 30px;
  height: 30px;
  background: #9b59b6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: move;
  user-select: none;
  transition: all 0.1s;
  border: 2px solid transparent;
}

.seat:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.seat.selected {
  background: #42b983;
  border-color: #fff;
  box-shadow: 0 0 15px #42b983;
  z-index: 10;
}

.seat.dragging {
  opacity: 0.3;
}

.selection-rectangle {
  position: absolute;
  border: 2px dashed #42b983;
  background: rgba(66, 185, 131, 0.1);
  pointer-events: none;
  z-index: 5;
}

/* Drag Ghost */
#drag-ghost {
  position: absolute;
  top: -9999px;
  left: -9999px;
  background: #42b983;
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  display: none; /* Hidden by default */
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.admin-view {
  padding: 2rem;
  background: #1a1a1a;
  min-height: 100vh;
  color: white;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.editor-container {
  display: flex;
  gap: 2rem;
  width: 100%;
}

/* Toolbar */
.toolbar {
  width: 250px;
  background: #2a2a2a;
  padding: 1.5rem;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.toolbar h3 {
  margin: 0 0 1rem 0;
  color: #42b983;
}

/* Movement Controls */
.movement-controls {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.movement-controls h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #aaa;
}

.step-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.step-input {
  width: 60px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.arrow-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.horizontal-arrows {
  display: flex;
  gap: 4px;
}

.arrow-btn {
  width: 30px;
  height: 30px;
  background: #42b983;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: background 0.2s;
}

.arrow-btn:hover {
  background: #3aa876;
}

.arrow-btn:active {
  transform: scale(0.95);
}

.tool-info {
  font-size: 0.9rem;
  color: #aaa;
  line-height: 1.6;
}

.tool-info ul {
  padding-left: 1.2rem;
  margin: 0.5rem 0;
}

.tool-info li {
  margin-bottom: 0.25rem;
}

.selected-count {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #42b983;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Admin Specific Seat Styles */
.seat {
  cursor: pointer;
}

.selection-rectangle {
  position: absolute;
  border: 2px dashed #42b983;
  background: rgba(66, 185, 131, 0.1);
  pointer-events: none;
  z-index: 5;
}
</style>
