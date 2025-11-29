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
const isStageSelected = ref(false);

// Movement state
const moveStep = ref(10);

// Area selection state
const isAreaSelecting = ref(false);
const areaStart = ref<Point>({ x: 0, y: 0 });
const areaEnd = ref<Point>({ x: 0, y: 0 });

// Tool state
type Tool = 'select' | 'pan' | 'settings';
const activeTool = ref<Tool>('pan');

// Panning state
const isPanning = ref(false);
const lastMousePos = ref<Point>({ x: 0, y: 0 });

// Keyboard event handler
const handleKeydown = (event: KeyboardEvent) => {
  if (selectedSeats.value.size === 0 && !isStageSelected.value) return;
  
  // Prevent default scrolling for arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }

  switch (event.key) {
    case 'ArrowUp':
      moveSelection(0, -1);
      break;
    case 'ArrowDown':
      moveSelection(0, 1);
      break;
    case 'ArrowLeft':
      moveSelection(-1, 0);
      break;
    case 'ArrowRight':
      moveSelection(1, 0);
      break;
    case 'Delete':
    case 'Backspace':
      deleteSelectedSeats();
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
  isStageSelected.value = false;
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
const moveSelection = (dx: number, dy: number) => {
  const stepX = dx * moveStep.value;
  const stepY = dy * moveStep.value;

  if (isStageSelected.value && venueStore.currentVenue) {
    venueStore.currentVenue.stage.x += stepX;
    venueStore.currentVenue.stage.y += stepY;
  } else {
    selectedSeats.value.forEach(seatId => {
      const seat = venueEditor.findSeatById(seatId);
      if (seat) {
        seat.x += stepX;
        seat.y += stepY;
      }
    });
  }
};

const deleteSelectedSeats = () => {
  if (!venueStore.currentVenue || selectedSeats.value.size === 0) return;
  
  // Filter out selected seats
  venueStore.currentVenue.seats = venueStore.currentVenue.seats.filter(
    seat => !selectedSeats.value.has(seat.id)
  );
  
  clearSelection();
};

const recalculateRows = () => {
  if (!venueStore.currentVenue) return;

  const seats = [...venueStore.currentVenue.seats];

  // 1. Sort by Y, then X
  seats.sort((a, b) => {
    // Tolerance for same row (e.g. 10px)
    if (Math.abs(a.y - b.y) < 10) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  // 2. Assign new labels
  let currentRowY = -1000;
  let currentRowNum = 0;
  let currentSeatNum = 0;

  seats.forEach(seat => {
    // Check if this is a new row (y diff > 10)
    if (Math.abs(seat.y - currentRowY) > 10) {
      currentRowNum++;
      currentSeatNum = 1;
      currentRowY = seat.y;
    } else {
      currentSeatNum++;
    }

    // Update label
    seat.label = `${currentRowNum}-${currentSeatNum}`;
  });
};

const handleStageMouseDown = (event?: MouseEvent) => {
  if (activeTool.value === 'pan' && event) {
    startPanning(event);
    return;
  }
  clearSelection();
  isStageSelected.value = true;
};

const handleContainerMouseDown = (event: MouseEvent) => {
  // Ignore if clicking sidebar or if already panning
  if ((event.target as HTMLElement).closest('.sidebar')) return;
  
  if (activeTool.value === 'pan') {
    startPanning(event);
  }
};

// Panning Logic
const startPanning = (event: MouseEvent) => {
  if (isPanning.value) return;
  
  isPanning.value = true;
  lastMousePos.value = { x: event.clientX, y: event.clientY };
  document.body.style.cursor = 'grabbing';
  
  window.addEventListener('mousemove', handlePanMove);
  window.addEventListener('mouseup', handlePanUp);
  event.preventDefault();
};

const handlePanMove = (event: MouseEvent) => {
  if (!isPanning.value) return;
  
  const dx = event.clientX - lastMousePos.value.x;
  const dy = event.clientY - lastMousePos.value.y;
  
  // Scroll venue content (user requested panning inside this element)
  const container = document.querySelector('.venue-scalable-content');
  if (container) {
    container.scrollBy(-dx, -dy);
  }
  
  lastMousePos.value = { x: event.clientX, y: event.clientY };
};

const handlePanUp = () => {
  isPanning.value = false;
  document.body.style.cursor = '';
  window.removeEventListener('mousemove', handlePanMove);
  window.removeEventListener('mouseup', handlePanUp);
};

// Unified Area Selection Handler
const handleCanvasMouseDown = (event: MouseEvent) => {
  if (activeTool.value === 'pan') return;

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
  if (activeTool.value === 'pan') {
    startPanning(event);
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    toggleSeatSelection(seatId);
  } else {
    setSingleSelection(seatId);
  }
};

</script>

<template>
  <div class="admin-view">
    <h1>Venue Layout Editor</h1>
    
    <div 
      v-if="venueStore.currentVenue" 
      class="editor-container"
      @mousedown="handleContainerMouseDown"
    >
      <!-- Main Toolbar -->
      <div class="main-toolbar">
        <button 
          class="tool-btn" 
          :class="{ active: activeTool === 'pan' }"
          @click="activeTool = 'pan'"
          title="Pan Tool"
        >
          <span class="tool-icon">✋</span>
        </button>
        <button 
          class="tool-btn" 
          :class="{ active: activeTool === 'select' }"
          @click="activeTool = 'select'"
          title="Selection Tool"
        >
          <span class="tool-icon">⬚</span>
        </button>
        <button 
          class="tool-btn" 
          :class="{ active: activeTool === 'settings' }"
          @click="activeTool = 'settings'"
          title="Settings"
        >
          <span class="tool-icon">⚙️</span>
        </button>
      </div>

      <!-- Properties Panel (Sidebar) -->
      <div class="sidebar">
        <!-- Tool Title -->
        <div class="sidebar-header">
          <h3>{{ activeTool === 'pan' ? 'Pan' : activeTool === 'select' ? 'Select' : 'Settings' }}</h3>
        </div>

        <!-- Settings Section -->
        <div v-if="activeTool === 'settings'" class="sidebar-section settings-section">
          <div class="settings-group">
            <label>Name</label>
            <input 
              type="text" 
              v-model="venueStore.currentVenue.name" 
              class="settings-input"
            />
          </div>
          
          <div class="settings-group">
            <label>Width (px)</label>
            <input 
              type="number" 
              v-model.number="venueStore.currentVenue.width" 
              class="settings-input"
              step="10"
            />
          </div>

          <div class="settings-group">
            <label>Height (px)</label>
            <input 
              type="number" 
              v-model.number="venueStore.currentVenue.height" 
              class="settings-input"
              step="10"
            />
          </div>

          <div class="settings-group">
            <button class="action-btn recalc-btn" @click="recalculateRows">
              Recalculate Rows
            </button>
          </div>
        </div>

        <!-- Movement Section (Conditional) -->
        <div v-if="(selectedSeats.size > 0 || isStageSelected) && activeTool === 'select'" class="sidebar-section movement-section">
          <div class="movement-controls-vertical">
            
            <!-- Arrow Controls -->
            <div class="arrow-buttons">
              <button class="arrow-btn up" @click="moveSelection(0, -1)">↑</button>
              <div class="horizontal-arrows">
                <button class="arrow-btn left" @click="moveSelection(-1, 0)">←</button>
                
                <!-- Step Control (Centered) -->
                <div class="step-control-compact">
                  <label>Step</label>
                  <input type="number" v-model="moveStep" min="1" class="step-input" />
                </div>

                <button class="arrow-btn right" @click="moveSelection(1, 0)">→</button>
              </div>
              <button class="arrow-btn down" @click="moveSelection(0, 1)">↓</button>
            </div>

            <!-- Selection Info (Vertical) -->
            <div class="selection-info-vertical">
              <span class="selected-count" v-if="isStageSelected">Stage Selected</span>
              <span class="selected-count" v-else>Selected: {{ selectedSeats.size }}</span>
              <button class="action-btn delete-btn" @click="deleteSelectedSeats">Delete</button>
              <button class="clear-btn" @click="clearSelection">Clear Selection</button>
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
              <p><strong>Pan Tool</strong></p>
              <ul>
                <li>Drag to move view</li>
              </ul>
              <p><strong>Settings</strong></p>
              <ul>
                <li>Edit venue props</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Venue Editor -->
      <VenueGrid 
        :venue="venueStore.currentVenue"
        :class="{ 'cursor-grab': activeTool === 'pan' }"
        @grid-mousedown="handleCanvasMouseDown"
        @stage-mousedown="handleStageMouseDown"
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

.editor-container {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

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

/* Sidebar (Properties) */
.sidebar {
  width: 160px; /* Wider for properties */
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  height: 100%;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #42b983;
  text-transform: uppercase;
  letter-spacing: 1px;
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

.action-btn {
  width: 100%;
  padding: 6px;
  border-radius: 4px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.delete-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.4);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.4);
}

.recalc-btn {
  background: rgba(66, 185, 131, 0.2);
  color: #42b983;
  border: 1px solid rgba(66, 185, 131, 0.5);
  margin-top: 0.5rem;
}

.recalc-btn:hover {
  background: rgba(66, 185, 131, 0.4);
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
  padding: 0;
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

.cursor-grab :deep(.seats-grid),
.cursor-grab :deep(.seat) {
  cursor: grab;
}

.cursor-grab :deep(.seats-grid):active,
.cursor-grab :deep(.seat):active {
  cursor: grabbing;
}

/* Settings Styles */
.settings-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 0.25rem;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}

.settings-group label {
  font-size: 0.7rem;
  color: #aaa;
  text-transform: uppercase;
}

.settings-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.settings-input:focus {
  border-color: #42b983;
  outline: none;
}
</style>
