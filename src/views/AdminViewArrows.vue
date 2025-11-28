<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, toRef } from 'vue';
import { useVenueStore } from '../stores/venue';
import { useVenueEditor } from '../composables/useVenueEditor';
import { useGeometry, type Point } from '../composables/useGeometry';
import VenueGrid from '../components/VenueGrid.vue';

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

// Tool state
type Tool = 'select';
const activeTool = ref<Tool>('select');

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
      <!-- Sidebar -->
      <div class="sidebar">
        <!-- Tools Section -->
        <div class="sidebar-section tools-section">
          <button 
            class="tool-btn" 
            :class="{ active: activeTool === 'select' }"
            @click="activeTool = 'select'"
            title="Selection Tool"
          >
            <span class="tool-icon">⬚</span>
          </button>
        </div>

        <!-- Movement Section (Conditional) -->
        <div v-if="selectedSeats.size > 0" class="sidebar-section movement-section">
          <div class="movement-controls-vertical">
            
            <!-- Arrow Controls -->
            <div class="arrow-buttons">
              <button class="arrow-btn up" @click="moveSelectedSeats(0, -1)">↑</button>
              <div class="horizontal-arrows">
                <button class="arrow-btn left" @click="moveSelectedSeats(-1, 0)">←</button>
                
                <!-- Step Control (Centered) -->
                <div class="step-control-compact">
                  <label>Step</label>
                  <input type="number" v-model="moveStep" min="1" class="step-input" />
                </div>

                <button class="arrow-btn right" @click="moveSelectedSeats(1, 0)">→</button>
              </div>
              <button class="arrow-btn down" @click="moveSelectedSeats(0, 1)">↓</button>
            </div>

            <!-- Selection Info (Vertical) -->
            <div class="selection-info-vertical">
              <span class="selected-count">Selected: {{ selectedSeats.size }}</span>
              <button class="clear-btn" @click="clearSelection">Clear</button>
            </div>
          </div>
        </div>

        <!-- Help Section -->
        <div class="sidebar-footer">
          <div class="help-container">
            <button class="help-btn">?</button>
            <div class="help-tooltip">
              <p><strong>Selection Tool</strong></p>
              <ul>
                <li>Click seat to select</li>
                <li>Ctrl+Click to multi-select</li>
                <li>Drag to area select</li>
                <li>Use arrows to move</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Venue Editor -->
      <VenueGrid 
        :venue="venueStore.currentVenue"
        @grid-mousedown="handleCanvasMouseDown"
      >
        <template #overlay>
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
        </template>

        <template #seat="{ seat }">
          <div
            class="seat"
            :class="{ 
              selected: selectedSeats.has(seat.id)
            }"
            :style="{ left: seat.x + 'px', top: seat.y + 'px' }"
            @mousedown.stop="handleSeatClick(seat.id, $event)"
          >
            {{ seat.label }}
          </div>
        </template>
      </VenueGrid>
    </div>
    
    <p v-else>Loading venue...</p>
  </div>
</template>

<style scoped>

@import '../assets/venue.css';

.editor-container {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  height: 600px;
}

/* Sidebar */
.sidebar {
  width: 120px; /* Wider fixed width */
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  height: 100%; /* Full height of container */
  position: relative;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Tools */
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

/* Vertical Movement Controls */
.movement-controls-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.step-control-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.step-control-compact label {
  font-size: 0.65rem;
  color: #aaa;
  text-transform: uppercase;
  line-height: 1;
}

.selection-info-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0.5rem;
  width: 100%;
}

.selected-count {
  font-size: 0.8rem;
  color: #42b983;
  font-weight: bold;
}

.clear-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #aaa;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  width: 100%;
  text-align: center;
}

.clear-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Footer / Help */
.sidebar-footer {
  margin-top: auto;
}

.help-container {
  position: relative;
}

.help-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #aaa;
  font-weight: bold;
  cursor: help;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.help-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.help-tooltip {
  display: none;
  position: absolute;
  left: 100%;
  bottom: 0;
  margin-left: 10px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 6px;
  width: 180px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  font-size: 0.8rem;
  text-align: left;
}

.help-container:hover .help-tooltip {
  display: block;
}

.help-tooltip p {
  margin: 0 0 0.5rem 0;
  color: #42b983;
}

.help-tooltip ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-tooltip li {
  margin-bottom: 0.25rem;
  color: #ccc;
  line-height: 1.3;
}

.step-control-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.step-control-compact label {
  font-size: 0.65rem;
  color: #aaa;
  text-transform: uppercase;
  line-height: 1;
}

.step-input {
  width: 36px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 2px 0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.8rem;
  /* Hide spinner buttons for number input */
  -moz-appearance: textfield;
}

.step-input::-webkit-outer-spin-button,
.step-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
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
  align-items: center;
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

/* Admin Specific Seat Styles */
.seat {
  cursor: pointer;
  background: #9b59b6;
}
</style>
