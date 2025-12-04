<script setup lang="ts">
import { ref, onMounted, computed, toRef, watch } from 'vue';
import { useVenueStore } from '../stores/venue';
import { useVenueEditor } from '../composables/useVenueEditor';
import { useGeometry, type Point } from '../composables/useGeometry';
import { usePrice } from '../composables/usePrice';
import { useKeyboardControls } from '../composables/useKeyboardControls';
import VenueGrid from '../components/VenueGrid.vue';
import SeatTypeModal from '../components/SeatTypeModal.vue';
import ToolBar from '../components/ToolBar.vue';
import type { Seat, SeatType } from '../services/mockData';
import type { VenueObject } from '../types/venueObjects';
import { OBJECT_TEMPLATES } from '../types/venueObjects';

const venueStore = useVenueStore();

// Composables
const venueEditor = useVenueEditor(toRef(venueStore, 'currentVenue'));
const geometry = useGeometry();
const { formatPrice } = usePrice();

// Edit mode state
const selectedSeats = ref<Set<string>>(new Set());
const isStageSelected = ref(false);

// Movement state
const moveStep = ref(10);

// Helper functions for seat types
const getSeatType = (seat: Seat) => {
  return venueStore.currentVenue?.seatTypes.find(t => t.id === seat.typeId);
};

const getSeatStyle = (seat: Seat) => {
  const type = getSeatType(seat);
  const defaultStyle = venueStore.currentVenue?.defaultSeatStyle;
  
  if (!defaultStyle) return {};
  
  // Merge default and type styles
  const mergedStyle = {
    ...defaultStyle,
    ...type?.style
  };
  
  // Map 'color' to 'backgroundColor' for CSS
  return {
    width: mergedStyle.width + 'px',
    height: mergedStyle.height + 'px',
    backgroundColor: mergedStyle.color,
    borderRadius: mergedStyle.borderRadius,
    transform: seat.rotation ? `rotate(${seat.rotation}deg)` : undefined
  };
};

// Computed property to get current type of selected seat(s)
// Returns type only if all selected seats have the same type
const currentType = computed(() => {
  if (selectedSeats.value.size === 0 || !venueStore.currentVenue) return null;
  
  const seatsArray = Array.from(selectedSeats.value);
  
  // Get all selected seats
  const seats = seatsArray
    .map(id => venueEditor.findSeatById(id))
    .filter((seat): seat is Seat => seat !== undefined);
  
  if (seats.length === 0) return null;
  
  // Check if all seats have the same type
  const firstTypeId = seats[0].typeId;
  const allSameType = seats.every(seat => seat.typeId === firstTypeId);
  
  // Only return type if all selected seats have the same type
  if (!allSameType) return null;
  
  return firstTypeId;
});

// Area selection state
const isAreaSelecting = ref(false);
const areaStart = ref<Point>({ x: 0, y: 0 });
const areaEnd = ref<Point>({ x: 0, y: 0 });

// Tool state
type Tool = 'select' | 'pan' | 'settings' | 'add-seat' | 'background' | 'objects';
const activeTool = ref<Tool>('pan');

// Panning state
const isPanning = ref(false);
const lastMousePos = ref<Point>({ x: 0, y: 0 });

// Add seat preview state
const previewSeatPos = ref<Point | null>(null);

// Background tool - movement step
const backgroundMoveStep = ref(10);

// Modal state
const showTypeModal = ref(false);

// Objects tool state
const selectedObjectId = ref<string | null>(null);
const isDraggingObject = ref(false);
const objectDragStart = ref<Point>({ x: 0, y: 0 });
const objectTemplates = OBJECT_TEMPLATES;


// Background image handlers
const handleBackgroundUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (venueStore.currentVenue && e.target?.result) {
        if (!venueStore.currentVenue.backgroundImage) {
          venueStore.currentVenue.backgroundImage = {
            url: e.target.result as string,
            scale: 100,
            x: 0,
            y: 0,
            rotation: 0
          };
        } else {
          venueStore.currentVenue.backgroundImage.url = e.target.result as string;
        }
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
};

const moveBackground = (dx: number, dy: number) => {
  if (venueStore.currentVenue?.backgroundImage) {
    venueStore.currentVenue.backgroundImage.x += dx * backgroundMoveStep.value;
    venueStore.currentVenue.backgroundImage.y += dy * backgroundMoveStep.value;
  }
};

const rotateBackground = (delta: number) => {
  if (venueStore.currentVenue?.backgroundImage) {
    venueStore.currentVenue.backgroundImage.rotation += delta;
  }
};

const removeBackground = () => {
  if (venueStore.currentVenue) {
    venueStore.currentVenue.backgroundImage = undefined;
  }
};

// Handle seat types update from modal
const handleTypesUpdate = (types: SeatType[]) => {
  if (venueStore.currentVenue) {
    venueStore.currentVenue.seatTypes = types;
  }
};

// Curvature controls
const increaseCurvature = () => {
  if (!venueStore.currentVenue) return;
  const newCurvature = Math.min(venueStore.currentVenue.curvature + 10, 100);
  venueStore.currentVenue.curvature = newCurvature;
  applyCurvature();
};

const decreaseCurvature = () => {
  if (!venueStore.currentVenue) return;
  const newCurvature = Math.max(venueStore.currentVenue.curvature - 10, -100);
  venueStore.currentVenue.curvature = newCurvature;
  applyCurvature();
};

const applyCurvature = () => {
  if (!venueStore.currentVenue) return;
  
  const venue = venueStore.currentVenue;
  const curvature = venue.curvature / 100; // -1 to 1
  
  // Calculate the actual horizontal center of all seats for symmetry
  const allSeatsX = venue.seats.map(s => s.originalX ?? s.x);
  const minX = Math.min(...allSeatsX);
  const maxX = Math.max(...allSeatsX);
  const seatsCenter = (minX + maxX) / 2;
  const seatsWidth = maxX - minX;
  
  venue.seats.forEach(seat => {
    if (seat.originalX === undefined || seat.originalY === undefined) {
      seat.originalX = seat.x;
      seat.originalY = seat.y;
    }
    
    // Calculate distance from seats center (for symmetry)
    const offsetX = seat.originalX - seatsCenter;
    
    // Normalized offset from center: -1 (left edge) to 1 (right edge)
    const normalizedOffset = offsetX / (seatsWidth / 2);
    
    // Parabolic curve - same for all rows
    const arcOffset = normalizedOffset * normalizedOffset * curvature * 150;
    
    // Rotation towards stage - increased from 8 to 20 for more visibility
    // Left seats rotate inward (right), right seats rotate inward (left)
    const rotationAmount = normalizedOffset * curvature * 20; // degrees
    
    // Apply transformation
    seat.x = seat.originalX;
    seat.y = seat.originalY + arcOffset;
    seat.rotation = rotationAmount;
  });
};


// Watch activeTool and clear selection when switching away from select tool
watch(activeTool, (newTool, oldTool) => {
  // Clear selection when switching from select to any other tool
  if (oldTool === 'select' && newTool !== 'select') {
    clearSelection();
  }
});

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
  isStageSelected.value = false;
};

const toggleSeatSelection = (seatId: string) => {
  if (selectedSeats.value.has(seatId)) {
    selectedSeats.value.delete(seatId);
  } else {
    selectedSeats.value.add(seatId);
  }
};


// Select all seats (toggle: if all selected, deselect all)
const selectAllSeats = () => {
  if (!venueStore.currentVenue) return;
  
  // Check if all seats are already selected
  const allSelected = venueStore.currentVenue.seats.every(seat => 
    selectedSeats.value.has(seat.id)
  );
  
  if (allSelected) {
    // Deselect all
    clearSelection();
  } else {
    // Select all
    clearSelection();
    venueStore.currentVenue.seats.forEach(seat => {
      selectedSeats.value.add(seat.id);
    });
  }
};

// Select all seats in a row (toggle: if all in row selected, deselect them)
const selectRow = (rowNumber: number) => {
  if (!venueStore.currentVenue) return;
  
  // Get all seats in this row
  const rowSeats = venueStore.currentVenue.seats.filter(seat =>
    seat.row === rowNumber
  );
  
  // Check if all seats in this row are already selected
  const allRowSelected = rowSeats.every(seat => 
    selectedSeats.value.has(seat.id)
  );
  
  if (allRowSelected) {
    // Deselect all seats in this row
    rowSeats.forEach(seat => {
      selectedSeats.value.delete(seat.id);
    });
  } else {
    // Select all seats in this row
    rowSeats.forEach(seat => {
      selectedSeats.value.add(seat.id);
    });
  }
};

// Select all seats in a column (toggle: if all in column selected, deselect them)
const selectColumn = (colNumber: number) => {
  if (!venueStore.currentVenue) return;
  
  // Get all seats in this column
  const colSeats = venueStore.currentVenue.seats.filter(seat =>
    seat.place === colNumber
  );
  
  // Check if all seats in this column are already selected
  const allColSelected = colSeats.every(seat => 
    selectedSeats.value.has(seat.id)
  );
  
  if (allColSelected) {
    // Deselect all seats in this column
    colSeats.forEach(seat => {
      selectedSeats.value.delete(seat.id);
    });
  } else {
    // Select all seats in this column
    colSeats.forEach(seat => {
      selectedSeats.value.add(seat.id);
    });
  }
};

// Movement Logic
const moveSelection = (dx: number, dy: number) => {
  const stepX = dx * moveStep.value;
  const stepY = dy * moveStep.value;

  if (isStageSelected.value && venueStore.currentVenue) {
    venueStore.currentVenue.stage.x += stepX;
    venueStore.currentVenue.stage.y += stepY;
  } else if (selectedObjectId.value && venueStore.currentVenue) {
    // Move selected object
    const object = venueStore.currentVenue.objects?.find(o => o.id === selectedObjectId.value);
    if (object) {
      object.x += stepX;
      object.y += stepY;
    }
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

// Rotation Logic
const rotateAngle = 15; // Degrees per click

const rotateClockwise = () => {
  // Rotate selected object
  if (selectedObjectId.value && venueStore.currentVenue) {
    const object = venueStore.currentVenue.objects?.find(o => o.id === selectedObjectId.value);
    if (object) {
      object.rotation = ((object.rotation || 0) + rotateAngle) % 360;
    }
    return;
  }
  
  if (selectedSeats.value.size === 0) return;
  
  // Find center of selected seats
  const seats = Array.from(selectedSeats.value)
    .map(id => venueEditor.findSeatById(id))
    .filter((s): s is Seat => s !== undefined);
  if (seats.length === 0) return;
  
  const centerX = seats.reduce((sum, seat) => sum + seat.x, 0) / seats.length;
  const centerY = seats.reduce((sum, seat) => sum + seat.y, 0) / seats.length;
  
  const angleRad = (rotateAngle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  // Rotate each seat around the common center
  seats.forEach(seat => {
    const dx = seat.x - centerX;
    const dy = seat.y - centerY;
    
    seat.x = centerX + dx * cos - dy * sin;
    seat.y = centerY + dx * sin + dy * cos;
    seat.rotation = ((seat.rotation || 0) + rotateAngle) % 360;
  });
};

const rotateCounterClockwise = () => {
  // Rotate selected object
  if (selectedObjectId.value && venueStore.currentVenue) {
    const object = venueStore.currentVenue.objects?.find(o => o.id === selectedObjectId.value);
    if (object) {
      object.rotation = ((object.rotation || 0) - rotateAngle + 360) % 360;
    }
    return;
  }
  
  if (selectedSeats.value.size === 0) return;
  
  // Find center of selected seats
  const seats = Array.from(selectedSeats.value)
    .map(id => venueEditor.findSeatById(id))
    .filter((s): s is Seat => s !== undefined);
  if (seats.length === 0) return;
  
  const centerX = seats.reduce((sum, seat) => sum + seat.x, 0) / seats.length;
  const centerY = seats.reduce((sum, seat) => sum + seat.y, 0) / seats.length;
  
  const angleRad = (-rotateAngle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  // Rotate each seat around the common center
  seats.forEach(seat => {
    const dx = seat.x - centerX;
    const dy = seat.y - centerY;
    
    seat.x = centerX + dx * cos - dy * sin;
    seat.y = centerY + dx * sin + dy * cos;
    seat.rotation = ((seat.rotation || 0) - rotateAngle + 360) % 360;
  });
};

const deleteSelection = () => {
  if (!venueStore.currentVenue) return;
  
  // Delete selected object
  if (selectedObjectId.value) {
    deleteSelectedObject();
    return;
  }
  
  // Delete selected seats
  if (selectedSeats.value.size === 0) return;
  
  venueStore.currentVenue.seats = venueStore.currentVenue.seats.filter(
    seat => !selectedSeats.value.has(seat.id)
  );
  
  clearSelection();
};

// Update type for selected seats
const updateSelectedSeatsType = (typeId: string) => {
  if (!venueStore.currentVenue || selectedSeats.value.size === 0) return;
  
  // Update all selected seats
  selectedSeats.value.forEach(seatId => {
    const seat = venueEditor.findSeatById(seatId);
    if (seat) {
      seat.typeId = typeId;
    }
  });
  
  // Clear selection after updating type
  clearSelection();
};

// Setup keyboard controls after function declarations
useKeyboardControls({
  enabled: computed(() => selectedSeats.value.size > 0 || isStageSelected.value || selectedObjectId.value !== null),
  onArrowKey: moveSelection,
  onDelete: deleteSelection
});

const recalculateRows = () => {
  if (!venueStore.currentVenue) return;

  const seats = [...venueStore.currentVenue.seats];

  // 1. Sort by originalY (or Y if original not set), then originalX (or X)
  // This ensures row calculation is based on actual seat position, not curved position
  seats.sort((a, b) => {
    const aY = a.originalY ?? a.y;
    const bY = b.originalY ?? b.y;
    const aX = a.originalX ?? a.x;
    const bX = b.originalX ?? b.x;
    
    // Tolerance for same row (e.g. 10px)
    if (Math.abs(aY - bY) < 10) {
      return aX - bX;
    }
    return aY - bY;
  });

  // 2. Group seats by rows (based on originalY or Y coordinate)
  const rows: { y: number; seats: typeof seats }[] = [];
  let currentRowY = -1000;
  let currentRow: typeof seats = [];

  seats.forEach(seat => {
    const seatY = seat.originalY ?? seat.y;
    
    if (Math.abs(seatY - currentRowY) > 10) {
      // New row
      if (currentRow.length > 0) {
        rows.push({ y: currentRowY, seats: currentRow });
      }
      currentRow = [seat];
      currentRowY = seatY;
    } else {
      // Same row
      currentRow.push(seat);
    }
  });
  
  // Don't forget the last row
  if (currentRow.length > 0) {
    rows.push({ y: currentRowY, seats: currentRow });
  }

  // 3. Assign row and place: row number and column number
  rows.forEach((row, rowIndex) => {
    row.seats.forEach((seat, colIndex) => {
      seat.row = rowIndex + 1;
      seat.place = colIndex + 1;
      // Clean up old label field if it exists
      delete (seat as any).label;
    });
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

const handleMouseMoveForPreview = (event: MouseEvent) => {
  if (activeTool.value !== 'add-seat') {
    previewSeatPos.value = null;
    return;
  }

  const container = getSeatsGridContainer();
  if (!container) return;

  const coords = geometry.getRelativeCoordinates(event, container);
  
  // Offset by half seat size (15px) to center on cursor
  const offsetX = coords.x - 15;
  const offsetY = coords.y - 15;
  
  // Snap to grid (10px)
  const x = Math.round(offsetX / 10) * 10;
  const y = Math.round(offsetY / 10) * 10;

  previewSeatPos.value = { x, y };
};

const addSeat = (event: MouseEvent) => {
  const container = getSeatsGridContainer();
  if (!container || !venueStore.currentVenue) return;

  const coords = geometry.getRelativeCoordinates(event, container);
  
  // Offset by half seat size (15px) to center on cursor
  const offsetX = coords.x - 15;
  const offsetY = coords.y - 15;
  
  // Snap to grid (10px)
  const x = Math.round(offsetX / 10) * 10;
  const y = Math.round(offsetY / 10) * 10;

  const newSeat = {
    id: `seat-${Date.now()}`,
    x,
    y,
    status: 'free' as const,
    row: 0,
    place: 0,
    typeId: 'standard', // Default type
    rotation: 0
  };

  venueStore.currentVenue.seats.push(newSeat);
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
  
  if (activeTool.value === 'add-seat') {
    addSeat(event);
    return;
  }

  // Objects tool: deselect when clicking empty space
  if (activeTool.value === 'objects') {
    const target = event.target as HTMLElement;
    // Only deselect if clicking on the grid itself, not on an object
    if (!target.classList.contains('venue-object')) {
      selectedObjectId.value = null;
    }
    return;
  }

  const target = event.target as HTMLElement;
  
  // If we clicked a seat, do nothing (let the seat's own handlers work)
  if (target.classList.contains('seat')) return;
  
  const container = getSeatsGridContainer();
  if (!container) return;
  
  // Don't clear selection when starting area select (allow adding to selection)
  
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

  // Always toggle selection (multi-select by default)
  toggleSeatSelection(seatId);
};

// Objects tool handlers
const addObjectFromTemplate = (templateType: VenueObject['type'], x: number, y: number) => {
  if (!venueStore.currentVenue) return;
  
  const template = objectTemplates.find(t => t.type === templateType);
  if (!template) return;
  
  const newObject: VenueObject = {
    id: `object-${Date.now()}`,
    type: templateType,
    x,
    y,
    width: template.defaultWidth,
    height: template.defaultHeight,
    rotation: 0,
    label: template.label,
    attachedSeatIds: []
  };
  
  if (!venueStore.currentVenue.objects) {
    venueStore.currentVenue.objects = [];
  }
  
  venueStore.currentVenue.objects.push(newObject);
  selectedObjectId.value = newObject.id;
};

const handleObjectClick = (objectId: string, event: MouseEvent) => {
  event.stopPropagation();
  selectedObjectId.value = objectId;
};

const handleObjectDragStart = (objectId: string, event: MouseEvent) => {
  if (activeTool.value !== 'objects') return;
  
  selectedObjectId.value = objectId;
  isDraggingObject.value = true;
  objectDragStart.value = { x: event.clientX, y: event.clientY };
  
  event.preventDefault();
};

const handleObjectDragMove = (event: MouseEvent) => {
  if (!isDraggingObject.value || !selectedObjectId.value || !venueStore.currentVenue) return;
  
  const dx = event.clientX - objectDragStart.value.x;
  const dy = event.clientY - objectDragStart.value.y;
  
  const object = venueStore.currentVenue.objects?.find(o => o.id === selectedObjectId.value);
  if (object) {
    object.x += dx;
    object.y += dy;
  }
  
  objectDragStart.value = { x: event.clientX, y: event.clientY };
};

const handleObjectDragEnd = () => {
  isDraggingObject.value = false;
};

const deleteSelectedObject = () => {
  if (!selectedObjectId.value || !venueStore.currentVenue) return;
  
  if (venueStore.currentVenue.objects) {
    venueStore.currentVenue.objects = venueStore.currentVenue.objects.filter(
      o => o.id !== selectedObjectId.value
    );
  }
  
  selectedObjectId.value = null;
};

const updateObjectProperty = (property: keyof VenueObject, value: any) => {
  if (!selectedObjectId.value || !venueStore.currentVenue) return;
  
  const object = venueStore.currentVenue.objects?.find(o => o.id === selectedObjectId.value);
  if (object) {
    (object as any)[property] = value;
  }
};

const getSelectedObject = computed(() => {
  if (!selectedObjectId.value || !venueStore.currentVenue) return null;
  return venueStore.currentVenue.objects?.find(o => o.id === selectedObjectId.value) || null;
});

// Clear object selection when switching tools
watch(activeTool, (newTool) => {
  if (newTool !== 'objects') {
    selectedObjectId.value = null;
  }
});

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
      <ToolBar 
        :activeTool="activeTool" 
        @update:activeTool="activeTool = $event"
      />

      <!-- Properties Panel (Sidebar) -->
      <div class="sidebar">
        <!-- Tool Title -->
        <div class="sidebar-header">
          <h3>{{ activeTool === 'pan' ? 'Pan' : activeTool === 'select' ? 'Select' : activeTool === 'add-seat' ? 'Add Seat' : activeTool === 'background' ? 'Background' : activeTool === 'objects' ? 'Objects' : 'Settings' }}</h3>
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
          
          <div class="settings-row">
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
          </div>

          <div class="settings-group">
            <button class="action-btn select-all-btn" @click="recalculateRows">
              Recalculate Rows
            </button>
          </div>



          <!-- Seat Styling Settings -->
          <div class="settings-divider"></div>
          <div class="settings-subtitle">Default Seat Style</div>

          <!-- Color and Shape in a row -->
          <div class="settings-row">
            <div class="settings-group">
              <label>Color</label>
              <input 
                type="color" 
                v-model="venueStore.currentVenue.defaultSeatStyle.color" 
                class="settings-input color-input"
              />
            </div>
            
            <div class="settings-group">
              <label>Shape</label>
              <select 
                v-model="venueStore.currentVenue.defaultSeatStyle.borderRadius" 
                class="settings-input"
              >
                <option value="8px">Square</option>
                <option value="50%">Circle</option>
              </select>
            </div>
          </div>

          <!-- Width and Height in a row -->
          <div class="settings-row">
            <div class="settings-group">
              <label>Width (px)</label>
              <input 
                type="number" 
                v-model.number="venueStore.currentVenue.defaultSeatStyle.width" 
                class="settings-input"
                min="10"
                max="100"
              />
            </div>
            
            <div class="settings-group">
              <label>Height (px)</label>
              <input 
                type="number" 
                v-model.number="venueStore.currentVenue.defaultSeatStyle.height" 
                class="settings-input"
                min="10"
                max="100"
              />
            </div>
          </div>
          
          <!-- Focal Point Curvature -->
          <div class="settings-divider"></div>
          <div class="settings-subtitle">Focal Point Curvature</div>
          
          <div class="settings-group">
            <label>Row Arc Towards Stage</label>
            <div class="curvature-controls">
              <button 
                class="curvature-btn" 
                @click="decreaseCurvature"
                :disabled="venueStore.currentVenue.curvature === -100"
              >↶</button>
              <span class="curvature-value">{{ venueStore.currentVenue.curvature }}%</span>
              <button 
                class="curvature-btn" 
                @click="increaseCurvature"
                :disabled="venueStore.currentVenue.curvature === 100"
              >↷</button>
            </div>
          </div>
          
          <!-- Manage Seat Types Button -->
          <div class="settings-divider"></div>
          <div class="settings-group">
            <button class="action-btn manage-types-btn" @click="showTypeModal = true">
              Manage Seat Types
            </button>
          </div>
        </div>

        <!-- Background Settings Section -->
        <div v-if="activeTool === 'background'" class="sidebar-section settings-section">
          <!-- Upload Background -->
          <div class="settings-group">
            <label>Background Image</label>
            <label for="background-upload" class="upload-button">
              <span class="upload-icon">📁</span>
              <span class="upload-text">Choose Image</span>
            </label>
            <input 
              id="background-upload"
              type="file" 
              accept="image/*"
              @change="handleBackgroundUpload"
              style="display: none;"
            />
          </div>

          <div v-if="venueStore.currentVenue?.backgroundImage" class="settings-group">
            <button class="action-btn select-all-btn" @click="removeBackground">
              Remove Background
            </button>
          </div>

          <!-- Scale Control -->
          <div v-if="venueStore.currentVenue?.backgroundImage" class="settings-group">
            <label>Scale (%)</label>
            <input 
              type="number" 
              v-model.number="venueStore.currentVenue.backgroundImage.scale" 
              class="settings-input"
              min="10"
              max="200"
              step="5"
              style="width: 100%; margin-bottom: 8px;"
            />
            <input 
              type="range" 
              v-model.number="venueStore.currentVenue.backgroundImage.scale" 
              min="10"
              max="200"
              step="5"
              style="width: 100%;"
            />
          </div>

          <!-- Position Controls -->
          <div v-if="venueStore.currentVenue?.backgroundImage" class="settings-group">
            <label>Position</label>
            <div class="arrow-buttons">
              <button class="arrow-btn up" @click="moveBackground(0, -1)">↑</button>
              <div class="horizontal-arrows">
                <button class="arrow-btn left" @click="moveBackground(-1, 0)">←</button>
                <div class="step-control-compact">
                  <label>Step</label>
                  <input type="number" v-model.number="backgroundMoveStep" min="1" class="step-input" />
                </div>
                <button class="arrow-btn right" @click="moveBackground(1, 0)">→</button>
              </div>
              <button class="arrow-btn down" @click="moveBackground(0, 1)">↓</button>
            </div>
          </div>

          <!-- Rotation Control -->
          <div v-if="venueStore.currentVenue?.backgroundImage" class="settings-group">
            <label>Rotation</label>
            <div class="curvature-controls">
              <button class="curvature-btn" @click="rotateBackground(-5)">↓</button>
              <span class="curvature-value">{{ venueStore.currentVenue.backgroundImage.rotation }}°</span>
              <button class="curvature-btn" @click="rotateBackground(5)">↑</button>
            </div>
          </div>
        </div>


        <!-- Objects Tool Section -->
        <div v-if="activeTool === 'objects'" class="sidebar-section objects-section">
          <!-- Object Templates (show only when nothing is selected) -->
          <div v-if="!getSelectedObject" class="objects-templates">
            <div class="settings-subtitle">Add Object</div>
            <div 
              v-for="template in objectTemplates" 
              :key="template.type"
              class="object-template-item"
              @click="addObjectFromTemplate(template.type, 100, 100)"
            >
              <span class="object-icon">{{ template.icon }}</span>
              <span class="object-label">{{ template.label }}</span>
            </div>
          </div>

          <!-- Selected Object Settings (show only when object is selected) -->
          <div v-if="getSelectedObject" class="object-settings">
            <div class="settings-subtitle">Object Settings</div>
            
            <!-- Label -->
            <div class="settings-group">
              <label>Label</label>
              <input 
                type="text" 
                :value="getSelectedObject.label"
                @input="updateObjectProperty('label', ($event.target as HTMLInputElement).value)"
                class="settings-input"
              />
            </div>

            <!-- Width & Height -->
            <div class="settings-row">
              <div class="settings-group">
                <label>Width (px)</label>
                <input 
                  type="number" 
                  :value="getSelectedObject.width"
                  @input="updateObjectProperty('width', Number(($event.target as HTMLInputElement).value))"
                  class="settings-input"
                  min="20"
                  max="500"
                />
              </div>
              
              <div class="settings-group">
                <label>Height (px)</label>
                <input 
                  type="number" 
                  :value="getSelectedObject.height"
                  @input="updateObjectProperty('height', Number(($event.target as HTMLInputElement).value))"
                  class="settings-input"
                  min="20"
                  max="500"
                />
              </div>
            </div>

            <!-- Rotation -->
            <div class="settings-group">
              <label>Rotation (°)</label>
              <div class="curvature-controls">
                <button 
                  class="curvature-btn" 
                  @click="updateObjectProperty('rotation', getSelectedObject.rotation - 15)"
                >↶</button>
                <span class="curvature-value">{{ getSelectedObject.rotation }}°</span>
                <button 
                  class="curvature-btn" 
                  @click="updateObjectProperty('rotation', getSelectedObject.rotation + 15)"
                >↷</button>
              </div>
            </div>

            <!-- Movement Controls -->
            <div class="settings-group">
              <label>Movement</label>
              <div class="movement-controls">
                <div class="arrow-grid">
                  <button class="arrow-btn" @click="moveSelection(0, -1)">↑</button>
                  <div class="arrow-row">
                    <button class="arrow-btn" @click="moveSelection(-1, 0)">←</button>
                    <div class="step-control">
                      <label>STEP</label>
                      <input 
                        type="number" 
                        v-model.number="moveStep" 
                        class="step-input"
                        min="1"
                        max="100"
                      />
                    </div>
                    <button class="arrow-btn" @click="moveSelection(1, 0)">→</button>
                  </div>
                  <button class="arrow-btn" @click="moveSelection(0, 1)">↓</button>
                </div>
              </div>
            </div>

            <!-- Delete and Deselect Buttons -->
            <div class="settings-group">
              <button class="action-btn delete-btn" @click="deleteSelectedObject">
                Delete Object
              </button>
              <button class="clear-btn" @click="selectedObjectId = null" style="margin-top: 0.5rem;">
                Deselect
              </button>
            </div>
          </div>

          <!-- Help Text (show only when nothing is selected) -->
          <div v-if="!getSelectedObject" class="settings-divider"></div>
          <div v-if="!getSelectedObject" style="padding: 10px; font-size: 0.75rem; color: var(--color-text-tertiary);">
            <p style="margin: 0 0 8px 0;"><strong>Objects Tool</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Click template to add object</li>
              <li>Click object to select & edit</li>
              <li>Click empty space to deselect</li>
            </ul>
          </div>
        </div>


        <!-- Select All Section (when select tool is active) -->
        <div v-if="activeTool === 'select'" class="sidebar-section select-all-section">
          <button class="action-btn select-all-btn" @click="selectAllSeats">
            Select All Seats
          </button>
          
          <!-- Selected Seats Controls -->
          <div v-if="selectedSeats.size > 0" style="margin-top: 1rem;">
            <div class="settings-divider"></div>
            <div class="settings-subtitle">Selected: {{ selectedSeats.size }} seat(s)</div>
            
            <div class="settings-group">
              <button class="action-btn delete-btn" @click="deleteSelection">
                Delete Selected
              </button>
              <button class="clear-btn" @click="clearSelection" style="margin-top: 0.5rem;">
                Deselect All
              </button>
            </div>
          </div>
        </div>

        <!-- Help: Select tool with no seats selected -->
        <div v-if="activeTool === 'select' && selectedSeats.size === 0" style="padding: 10px; font-size: 0.75rem; color: #aaa;">
          <p style="margin: 0 0 8px 0;"><strong>Selection Tool</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Click seat to toggle select</li>
            <li>Drag to area select</li>
            <li>Click row/col label to select all</li>
            <li>Use arrows to move</li>
          </ul>
        </div>

        <!-- Help: Pan tool -->
        <div v-if="activeTool === 'pan'" style="padding: 10px; font-size: 0.75rem; color: #aaa;">
          <p style="margin: 0 0 8px 0;"><strong>Pan Tool</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Drag to move view</li>
            <li>Navigate around the venue</li>
          </ul>
        </div>

        <!-- Help: Add Seat tool -->
        <div v-if="activeTool === 'add-seat'" style="padding: 10px; font-size: 0.75rem; color: #aaa;">
          <p style="margin: 0 0 8px 0;"><strong>Add Seat Tool</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Click anywhere to add a seat</li>
            <li>Seats snap to 10px grid</li>
            <li>Use Recalculate Rows to update numbering</li>
          </ul>
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

            <!-- Rotation Controls -->
            <div class="rotation-controls" v-if="!isStageSelected">
              <label>Rotate</label>
              <div class="rotation-buttons">
                <button class="rotate-btn" @click="rotateCounterClockwise" title="Rotate Counter-Clockwise">↶</button>
                <button class="rotate-btn" @click="rotateClockwise" title="Rotate Clockwise">↷</button>
              </div>
            </div>

            <!-- Selection Info (Vertical) -->
            <div class="selection-info-vertical">
              <span class="selected-count" v-if="isStageSelected">Stage Selected</span>
              <span class="selected-count" v-else>Selected: {{ selectedSeats.size }}</span>
              <button class="action-btn delete-btn" @click="deleteSelectedSeats">Delete</button>
              <button class="clear-btn" @click="clearSelection">Clear Selection</button>
              
              <!-- Type Selection (only for seats, not stage) -->
              <div v-if="!isStageSelected && selectedSeats.size > 0" class="settings-group type-edit-section">
                <div class="settings-subtitle">Seat Type</div>
                
                <div class="current-type-info" v-if="currentType">
                  <span class="label">Current:</span>
                  <span class="value">{{ venueStore.currentVenue.seatTypes.find(t => t.id === currentType)?.name }}</span>
                </div>
                
                <select 
                  class="settings-input type-select"
                  @change="updateSelectedSeatsType(($event.target as HTMLSelectElement).value)"
                >
                  <option value="">Change Type...</option>
                  <option 
                    v-for="type in venueStore.currentVenue.seatTypes" 
                    :key="type.id"
                    :value="type.id"
                  >
                    {{ type.name }} ({{ formatPrice(type.priceInCents) }})
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div></div>

      <!-- Venue Editor -->
      <VenueGrid 
        :venue="venueStore.currentVenue"
        :enable-label-selection="activeTool === 'select'"
        :transparent-seats="activeTool === 'objects'"
        :selected-object-id="selectedObjectId"
        :class="{ 
          'cursor-grab': activeTool === 'pan',
          'cursor-add': activeTool === 'add-seat'
        }"
        @grid-mousedown="handleCanvasMouseDown"
        @stage-mousedown="handleStageMouseDown"
        @mousemove="handleMouseMoveForPreview"
        @row-click="selectRow"
        @col-click="selectColumn"
        @object-click="handleObjectClick"
        @object-mousedown="handleObjectDragStart"
        @object-mousemove="handleObjectDragMove"
        @object-mouseup="handleObjectDragEnd"
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
          
          <!-- Preview seat for add-seat tool -->
          <div
            v-if="previewSeatPos && activeTool === 'add-seat'"
            class="seat preview-seat"
            :style="{ left: previewSeatPos.x + 'px', top: previewSeatPos.y + 'px' }"
          >
            +
          </div>
        </template>

        <template #seat="{ seat }">
          <div
            class="seat"
            :class="{ 
              selected: selectedSeats.has(seat.id),
              transparent: activeTool === 'objects'
            }"
            :style="{ 
              left: seat.x + 'px', 
              top: seat.y + 'px',
              zIndex: 1,
              ...getSeatStyle(seat)
            }"
            :title="`Row: ${seat.row}, Place: ${seat.place} | Type: ${getSeatType(seat)?.name || 'Unknown'} | Price: ${formatPrice(getSeatType(seat)?.priceInCents || 0)}`"
            @mousedown.stop="handleSeatClick(seat.id, $event)"
          >
          </div>
        </template>
      </VenueGrid>
    </div>
    
    <p v-else>Loading venue...</p>
    
    <!-- Seat Type Management Modal -->
    <SeatTypeModal 
      v-model="showTypeModal"
      :venue="venueStore.currentVenue"
      @save="handleTypesUpdate"
    />
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
  background: var(--color-bg-panel);
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
  background: var(--color-bg-panel);
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
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
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
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  line-height: 1;
}

.selection-info-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-border-light);
  padding-top: 0.5rem;
  width: 100%;
}



.clear-btn {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-tertiary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  width: 100%;
  text-align: center;
}

.clear-btn:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
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
  background: var(--color-danger-light);
  color: var(--color-danger);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-strong);
  margin-top: 0.5rem;
}

.recalc-btn:hover {
  background: var(--color-accent-medium);
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
  background: var(--color-border-light);
  border: none;
  color: var(--color-text-tertiary);
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
  color: var(--color-text-white);
}

.help-tooltip {
  display: none;
  position: absolute;
  left: 100%;
  bottom: 0;
  margin-left: 10px;
  background: var(--color-bg-tooltip);
  border: 1px solid var(--color-border-light);
  padding: 1rem;
  border-radius: 6px;
  width: 180px;
  z-index: 100;
  box-shadow: var(--shadow-tooltip);
  font-size: 0.8rem;
  text-align: left;
}

.help-container:hover .help-tooltip {
  display: block;
}

.help-tooltip p {
  margin: 0 0 0.5rem 0;
  color: var(--color-accent);
}

.help-tooltip ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-tooltip li {
  margin-bottom: 0.25rem;
  color: var(--color-text-muted);
  line-height: 1.3;
}



.step-input {
  width: 36px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-white);
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

.movement-controls {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.arrow-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.arrow-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.step-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 50px;
}

.step-control label {
  font-size: 0.6rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  line-height: 1;
}

.step-input {
  width: 48px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-white);
  padding: 4px 2px;
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

.arrow-btn {
  width: 30px;
  height: 30px;
  background: var(--color-accent);
  border: none;
  border-radius: 4px;
  color: var(--color-text-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: background 0.2s;
}

.arrow-btn:hover {
  background: var(--color-accent-hover);
}

.arrow-btn:active {
  transform: scale(0.95);
}

/* Admin Specific Seat Styles */
.seat {
  cursor: pointer;
  background: var(--color-seat-admin);
  z-index: 1;
}

.seat.selected {
  box-shadow: 0 0 0 3px var(--color-accent);
}

.seat.transparent {
  opacity: 0.2;
  pointer-events: none; /* Disable interaction when transparent */
}

.cursor-grab :deep(.seats-grid),
.cursor-grab :deep(.seat) {
  cursor: grab;
}

.cursor-grab :deep(.seats-grid):active,
.cursor-grab :deep(.seat):active {
  cursor: grabbing;
}

.cursor-add :deep(.seats-grid) {
  cursor: crosshair;
}

/* Settings Styles */
.settings-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 0.25rem;
}

.settings-group label {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}



/* Preview Seat Styles */
.preview-seat {
  opacity: 0.5;
  background: #42b983 !important;
  border: 2px dashed var(--color-accent);
  pointer-events: none;
  font-size: 16px;
  color: var(--color-text-white);
}

/* Price Editing Styles */
.price-edit-section {
  width: 100%;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.current-price {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.current-price label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

.price-value {
  font-size: 0.9rem;
  color: var(--color-accent);
  font-weight: bold;
}

.price-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}

.price-input-group label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

.price-input {
  width: 100%;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-white);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  text-align: center;
}

.price-input:focus {
  border-color: var(--color-accent);
  outline: none;
}

.price-btn {
  background: var(--color-accent-light);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-strong);
  margin-top: 0.25rem;
}

.price-btn:hover {
  background: var(--color-accent-medium);
}

/* Select All Button */
.select-all-section {
  padding: 0 0.25rem;
}

.select-all-btn {
  background: var(--color-accent-light);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-strong);
}

.select-all-btn:hover {
  background: var(--color-accent-medium);
}

.manage-types-btn {
  background: var(--color-accent-light);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-strong);
  width: 100%;
}

.manage-types-btn:hover {
  background: var(--color-accent-medium);
}

/* Curvature Controls */
.curvature-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.curvature-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border-medium);
  background: var(--color-border-light);
  color: var(--color-text-white);
  cursor: pointer;
  font-size: 1.6rem;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.curvature-btn:hover:not(:disabled) {
  background: var(--color-accent-strong);
  border-color: var(--color-accent);
}

.curvature-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.curvature-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.curvature-value {
  font-size: 1rem;
  color: var(--color-accent);
  min-width: 45px;
  text-align: center;
  font-weight: 600;
}

/* Rotation Controls */
.rotation-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-light);
}

.rotation-controls label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

.rotation-buttons {
  display: flex;
  gap: 0.5rem;
}

.rotate-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border-medium);
  background: var(--color-border-light);
  color: var(--color-text-white);
  cursor: pointer;
  font-size: 1.6rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.rotate-btn:hover {
  background: var(--color-accent-strong);
  border-color: var(--color-accent);
}

.rotate-btn:active {
  transform: scale(0.95);
}



/* Settings Styles */
.settings-divider {
  width: 100%;
  height: 1px;
  background: var(--color-border-light);
  margin: 1rem 0;
}

.settings-subtitle {
  font-size: 0.75rem;
  color: var(--color-accent);
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
}

.settings-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  min-width: 0; /* Prevent flex items from overflowing */
}

.settings-row .settings-group {
  margin-bottom: 0;
}

.settings-input {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-white);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.current-type-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  padding: 0 2px;
}

.current-type-info .label {
  color: var(--color-text-tertiary);
}

.current-type-info .value {
  color: var(--color-accent);
  font-weight: bold;
}

.settings-input:focus {
  border-color: var(--color-accent);
  outline: none;
}

.color-input {
  height: 25px;
  width: 100%;
  padding: 2px;
  cursor: pointer;
}

/* Upload Button */
.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 8px 12px;
  background: var(--color-accent-light);
  border: 1px solid var(--color-accent-strong);
  border-radius: 6px;
  color: var(--color-accent);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.25rem;
}

.upload-button:hover {
  background: var(--color-accent-medium);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-accent-medium);
}

.upload-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px var(--color-accent-light);
}

.upload-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.upload-text {
  line-height: 1;
}

/* Objects Tool Styles */
.objects-section {
  width: 100%;
  padding: 0 0.25rem;
}

.objects-templates {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.object-template-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.object-template-item:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
}

.object-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.object-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-white);
}

.object-settings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
