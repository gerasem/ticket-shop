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
      <VenueGrid 
        :venue="venueStore.currentVenue"
        @grid-mousedown="handleCanvasMouseDown"
        @row-click="toggleRowSelection"
        @col-click="toggleColumnSelection"
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

/* Admin Specific Seat Styles */
.seat {
  cursor: pointer;
  background: #9b59b6;
}
</style>
