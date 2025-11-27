<script setup lang="ts">
import { ref, onMounted, computed, toRef } from 'vue';
import { useVenueStore } from '../stores/venue';
import { useVenueEditor } from '../composables/useVenueEditor';
import { useGeometry, type Point } from '../composables/useGeometry';
import { type EditMode } from '../constants/editor';

const venueStore = useVenueStore();

// Composables
const venueEditor = useVenueEditor(toRef(venueStore, 'currentVenue'));
const geometry = useGeometry();

// Edit mode state
const currentMode = ref<EditMode>('select');
const selectedSeats = ref<Set<string>>(new Set());
const isDragging = ref(false);
const dragOffset = ref<Point>({ x: 0, y: 0 });

// Area selection state
const isAreaSelecting = ref(false);
const areaStart = ref<Point>({ x: 0, y: 0 });
const areaEnd = ref<Point>({ x: 0, y: 0 });

onMounted(() => {
  venueStore.loadVenue();
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

// Seat interaction handlers
const handleSeatMouseDown = (seatId: string, event: MouseEvent) => {
  if (currentMode.value !== 'select') return;
  
  event.stopPropagation(); // Prevent canvas area selection
  
  // Handle selection
  if (event.ctrlKey || event.metaKey) {
    // Multi-select with Ctrl/Cmd
    toggleSeatSelection(seatId);
    return; // Don't start dragging when Ctrl is pressed
  } else {
    // Single select (if not already selected)
    if (!selectedSeats.value.has(seatId)) {
      setSingleSelection(seatId);
    }
  }
  
  // Start dragging
  const seat = venueEditor.findSeatById(seatId);
  if (!seat) return;
  
  isDragging.value = true;
  dragOffset.value = {
    x: event.clientX - seat.x,
    y: event.clientY - seat.y
  };
  
  event.preventDefault();
};

// Area selection handlers
const handleCanvasMouseDown = (event: MouseEvent) => {
  if (currentMode.value !== 'area') return;
  
  // Check if clicked on a seat - if so, ignore
  const target = event.target as HTMLElement;
  if (target.classList.contains('seat')) return;
  
  const container = getSeatsGridContainer();
  if (!container) return;
  
  areaStart.value = geometry.getRelativeCoordinates(event, container);
  areaEnd.value = { ...areaStart.value };
  isAreaSelecting.value = true;
  
  event.preventDefault();
};

const handleCanvasMouseMove = (event: MouseEvent) => {
  const container = getSeatsGridContainer();
  if (!container) return;
  
  // Handle dragging in select mode
  if (currentMode.value === 'select' && isDragging.value && venueStore.currentVenue) {
    const relativePos = geometry.getRelativeCoordinates(event, container);
    const newX = relativePos.x - dragOffset.value.x;
    const newY = relativePos.y - dragOffset.value.y;
    
    // Get first selected seat to calculate offset
    const firstSeatId = Array.from(selectedSeats.value)[0];
    if (!firstSeatId) return;
    
    const firstSeat = venueEditor.findSeatById(firstSeatId);
    if (!firstSeat) return;
    
    const deltaX = newX - firstSeat.x;
    const deltaY = newY - firstSeat.y;
    
    // Move all selected seats
    selectedSeats.value.forEach(seatId => {
      const seat = venueEditor.findSeatById(seatId);
      if (seat) {
        seat.x += deltaX;
        seat.y += deltaY;
      }
    });
  }
  
  // Handle area selection in area mode
  if (currentMode.value === 'area' && isAreaSelecting.value) {
    areaEnd.value = geometry.getRelativeCoordinates(event, container);
  }
};

const handleCanvasMouseUp = () => {
  // Handle area selection completion
  if (currentMode.value === 'area' && isAreaSelecting.value) {
    const bounds = geometry.calculateRectangleBounds(areaStart.value, areaEnd.value);
    const seatsInArea = venueEditor.getSeatsInArea(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY
    );
    
    clearSelection();
    seatsInArea.forEach(seat => selectedSeats.value.add(seat.id));
    
    isAreaSelecting.value = false;
  }
  
  // Handle drag completion
  if (isDragging.value) {
    isDragging.value = false;
  }
};

// Computed selection rectangle for visual feedback
const selectionRectangle = computed(() => {
  if (!isAreaSelecting.value) return null;
  
  const bounds = geometry.calculateRectangleBounds(areaStart.value, areaEnd.value);
  return geometry.boundsToRectangle(bounds);
});
</script>

<template>
  <div class="admin-view">
    <h1>Venue Layout Editor</h1>
    
    <div v-if="venueStore.currentVenue" class="editor-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <h3>Edit Tools</h3>
        <div class="tool-buttons">
          <button 
            :class="{ active: currentMode === 'select' }"
            @click="currentMode = 'select'; selectedSeats.clear()"
          >
            Select Mode
          </button>
          <button 
            :class="{ active: currentMode === 'area' }"
            @click="currentMode = 'area'; selectedSeats.clear()"
          >
            Area Select
          </button>
        </div>
        <div class="tool-info">
          <p><strong>Select Mode:</strong> Click to select, Ctrl+Click for multi-select, drag to move</p>
          <p><strong>Area Select:</strong> Click and drag to select multiple seats</p>
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
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @mouseleave="handleCanvasMouseUp"
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
              :class="{ selected: selectedSeats.has(seat.id) }"
              :style="{ left: seat.x + 'px', top: seat.y + 'px' }"
              @mousedown="handleSeatMouseDown(seat.id, $event)"
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

.tool-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tool-buttons button {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.tool-buttons button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tool-buttons button.active {
  background: #42b983;
  border-color: #42b983;
  font-weight: bold;
}

.tool-info {
  font-size: 0.85rem;
  color: #aaa;
  line-height: 1.5;
}

.tool-info p {
  margin: 0.5rem 0;
}

.selected-count {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #42b983;
  font-weight: bold;
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
  gap: 20px;
  margin-bottom: 10px;
}

.column-spacer {
  width: 40px;
  flex-shrink: 0;
}

.column-labels {
  position: relative;
  flex: 1;
  height: 30px;
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

.selection-rectangle {
  position: absolute;
  border: 2px dashed #42b983;
  background: rgba(66, 185, 131, 0.1);
  pointer-events: none;
  z-index: 5;
}
</style>
