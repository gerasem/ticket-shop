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
// We keep 'select' as the primary mode which now handles both single/multi select and area select
const currentMode = ref<EditMode>('select');
const selectedSeats = ref<Set<string>>(new Set());
const isDragging = ref(false);
const dragOffset = ref<Point>({ x: 0, y: 0 });

// Area selection state
const isAreaSelecting = ref(false);
const areaStart = ref<Point>({ x: 0, y: 0 });
const areaEnd = ref<Point>({ x: 0, y: 0 });

// Drag Ghost Element Reference
const dragGhostRef = ref<HTMLElement | null>(null);

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

// Native Drag and Drop Handlers
const handleDragStart = (seatId: string, event: DragEvent) => {
  // Always allow dragging seats in select mode
  
  const seat = venueEditor.findSeatById(seatId);
  if (!seat) return;

  // Smart Selection Logic:
  // 1. If the dragged seat is NOT already selected:
  //    - If Ctrl is pressed: Add it to selection.
  //    - If Ctrl is NOT pressed: Select ONLY this seat (clear others).
  // 2. If the dragged seat IS already selected:
  //    - Keep the current selection (allows moving the whole group).
  
  if (!selectedSeats.value.has(seatId)) {
    if (event.ctrlKey || event.metaKey) {
      toggleSeatSelection(seatId);
    } else {
      setSingleSelection(seatId);
    }
  }
  // If it IS selected, we do nothing here, preserving the group selection.
  
  isDragging.value = true;

  // Calculate offset from the seat's top-left corner
  dragOffset.value = {
    x: event.offsetX,
    y: event.offsetY
  };

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', seatId);

    // Custom Drag Image for Multi-Select
    if (selectedSeats.value.size > 1 && dragGhostRef.value) {
      // We need to temporarily make it visible to set it as the drag image
      // The browser makes a copy of it at that moment.
      const ghost = dragGhostRef.value;
      ghost.style.display = 'flex'; 
      ghost.textContent = `Moving ${selectedSeats.value.size} seats`;
      
      // Set the drag image centered on the cursor
      event.dataTransfer.setDragImage(ghost, 75, 25);
      
      // Hide it again immediately (in the next tick or via CSS if possible, but JS is safer here)
      setTimeout(() => {
        ghost.style.display = 'none';
      }, 0);
    }
  }
};

const handleDragOver = (event: DragEvent) => {
  // Allow drop
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;

  const container = getSeatsGridContainer();
  if (!container) return;

  // Get the ID of the seat that started the drag
  const sourceSeatId = event.dataTransfer?.getData('text/plain');
  if (!sourceSeatId) return;

  const sourceSeat = venueEditor.findSeatById(sourceSeatId);
  if (!sourceSeat) return;

  // Calculate drop position relative to container
  const relativePos = geometry.getRelativeCoordinates(event, container);
  
  // Calculate the new position for the source seat
  // New X = Mouse X (relative to container) - Offset X (relative to seat)
  const newX = relativePos.x - dragOffset.value.x;
  const newY = relativePos.y - dragOffset.value.y;

  // Calculate delta
  const deltaX = newX - sourceSeat.x;
  const deltaY = newY - sourceSeat.y;

  // Apply delta to all selected seats
  selectedSeats.value.forEach(seatId => {
    const seat = venueEditor.findSeatById(seatId);
    if (seat) {
      seat.x += deltaX;
      seat.y += deltaY;
    }
  });
};

const handleDragEnd = () => {
  isDragging.value = false;
};

// Unified Area Selection Handler
// This handles clicks on the background to start area selection
const handleCanvasMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  
  // If we clicked a seat, do nothing (let the seat's own handlers work)
  if (target.classList.contains('seat')) return;
  
  // If we clicked the background, start area selection
  // We don't need to check for 'area' mode anymore, it's implicit
  
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
    // Note: We don't clear here because we might be adding to a selection (if Ctrl was held)
    // or we already cleared on mousedown.
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
</script>

<template>
  <div class="admin-view">
    <h1>Venue Layout Editor</h1>
    
    <div v-if="venueStore.currentVenue" class="editor-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <h3>Edit Tools</h3>
        <!-- We can simplify the toolbar since modes are unified -->
        <div class="tool-info">
          <p><strong>Smart Selection:</strong></p>
          <ul>
            <li><strong>Click Seat:</strong> Select</li>
            <li><strong>Ctrl+Click:</strong> Multi-select</li>
            <li><strong>Drag Seat:</strong> Move selected</li>
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
            @dragover="handleDragOver"
            @drop="handleDrop"
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
                selected: selectedSeats.has(seat.id),
                dragging: isDragging && selectedSeats.has(seat.id)
              }"
              :style="{ left: seat.x + 'px', top: seat.y + 'px' }"
              draggable="true"
              @dragstart="handleDragStart(seat.id, $event)"
              @dragend="handleDragEnd"
            >
              {{ seat.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <p v-else>Loading venue...</p>

    <!-- Custom Drag Ghost Element -->
    <div ref="dragGhostRef" id="drag-ghost">
      Moving {{ selectedSeats.size }} seats
    </div>
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
</style>
