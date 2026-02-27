<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useVenueStore } from '../stores/venue';
import { useVenueEditor } from '../composables/useVenueEditor';
import { useGeometry, type Point } from '../composables/useGeometry';
import { usePrice } from '../composables/usePrice';
import { useKeyboardControls } from '../composables/useKeyboardControls';
import VenueGrid from '../components/VenueGrid.vue';
import SeatTypeModal from '../components/SeatTypeModal.vue';
import ToolBar from '../components/ToolBar.vue';
import type { Seat, SeatType, Venue } from '../services/mockData';
import type { VenueObject } from '../types/venueObjects';

import { OBJECT_TEMPLATES } from '../types/venueObjects';
import AdminVenueSettings from '../components/admin/AdminVenueSettings.vue';
import AdminBackgroundSettings from '../components/admin/AdminBackgroundSettings.vue';
import AdminObjectSettings from '../components/admin/AdminObjectSettings.vue';
import AdminSeatSettings from '../components/admin/AdminSeatSettings.vue';
import ColorSettingsModal from '../components/admin/ColorSettingsModal.vue';
import BaseButton from '../components/BaseButton.vue';

const venueStore = useVenueStore();
const route = useRoute();

// Composables
const venueRef = ref<Venue | null>(null);
const venueEditor = useVenueEditor(venueRef);

// Sync venueRef with store
watch(() => venueStore.currentVenue, (newVal) => {
  venueRef.value = newVal;
}, { immediate: true });

onMounted(async () => {
  const venueId = route.params.id as string;
  if (venueId) {
    if (venueStore.currentVenue?.id !== venueId) {
      await venueStore.loadVenue(venueId);
    }
  } else {
    // If no ID, maybe load default or redirect?
    // For now, let's assume valid ID is always passed or handled by router
  }
});

const { 
  initHistory, 
  commit, 
  undo, 
  redo, 
  canUndo, 
  canRedo 
} = venueEditor;
const geometry = useGeometry();
const { formatPrice } = usePrice();

const handleSave = async () => {
  try {
    await venueStore.saveVenue();
    alert('Venue saved successfully!');
  } catch (error: any) {
    console.error('Save error detailed:', error);
    const serverMessage = error.response?.data?.message || error.message || 'Unknown error';
    const trace = error.response?.data?.trace ? `\nAt: ${error.response.data.trace}` : '';
    alert(`Failed to save venue: ${serverMessage}${trace}`);
  }
};

// Edit mode state
const selectedSeats = ref<Set<string>>(new Set());

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
  const firstTypeId = seats[0]?.typeId;
  const allSameType = seats.every(seat => seat.typeId === firstTypeId);
  
  // Only return type if all selected seats have the same type
  if (!allSameType) return null;
  
  return firstTypeId;
});

// Area selection state
const isAreaSelecting = ref(false);
const areaStart = ref<Point>({ x: 0, y: 0 });
const areaEnd = ref<Point>({ x: 0, y: 0 });
const overlappingSeatIds = computed(() => {
  if (!venueStore.currentVenue) return new Set<string>();

  const seats = venueStore.currentVenue.seats;
  const overlapping = new Set<string>();

  for (let i = 0; i < seats.length; i++) {
    const seatA = seats[i];
    if (!seatA) continue;
    
    const styleA = getSeatStyle(seatA);
    const widthA = parseInt(styleA.width as string);
    const heightA = parseInt(styleA.height as string);

    for (let j = i + 1; j < seats.length; j++) {
      const seatB = seats[j];
      if (!seatB) continue;

      const styleB = getSeatStyle(seatB);
      const widthB = parseInt(styleB.width as string);
      const heightB = parseInt(styleB.height as string);

      if (geometry.checkIntersection(
        { x: seatA.x, y: seatA.y, width: widthA, height: heightA, rotation: seatA.rotation },
        { x: seatB.x, y: seatB.y, width: widthB, height: heightB, rotation: seatB.rotation }
      )) {
        overlapping.add(seatA.id);
        overlapping.add(seatB.id);
      }
    }
  }

  return overlapping;
});

// Background tool state
const backgroundMoveStep = ref(10);

// Tool state
type Tool = 'select' | 'pan' | 'settings' | 'add-seat' | 'background' | 'objects';
const activeTool = ref<Tool>('pan');

// Panning state
const isPanning = ref(false);
const lastMousePos = ref<Point>({ x: 0, y: 0 });

// Add seat preview state
const previewSeatPos = ref<Point | null>(null);

// Modal state
const showTypeModal = ref(false);
const showColorModal = ref(false);

// Objects tool state
const selectedObjectId = ref<string | null>(null);
const isDraggingObject = ref(false);
const objectDragStart = ref<Point>({ x: 0, y: 0 });
const objectTemplates = OBJECT_TEMPLATES;

// Row labels visibility
const showLeftRowLabels = ref(true);
const showRightRowLabels = ref(false);

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
        commit(); // Save state after upload/replace
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
};

// Handle seat types update from modal
const handleTypesUpdate = (types: SeatType[]) => {
  if (venueStore.currentVenue) {
    venueStore.currentVenue.seatTypes = types;
  }
};

// Watch activeTool and clear selection when switching away from select tool
watch(activeTool, (newTool, oldTool) => {
  // Clear selection when switching from select to any other tool
  if (oldTool === 'select' && newTool !== 'select') {
    clearSelection();
  }
});


onMounted(async () => {
  try {
    const route = useRoute();
    const venueId = route.params.id as string;
    
    if (venueId) {
        await venueStore.loadVenue(venueId);
    } else {
        await venueStore.loadVenues();
    }
    
    if (venueStore.currentVenue) {
      initHistory();
    }
    
  } catch (e) {
    console.error('Error in AdminView onMounted:', e);
  }
});

// onUnmounted(() => {
//   window.removeEventListener('keydown', handleUndoRedoKeydown);
// });

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

  if (selectedObjectId.value && venueStore.currentVenue) {
    // Move selected object
    const object = venueStore.currentVenue.objects?.find(o => o.id === selectedObjectId.value);
    if (object) {
      object.x += stepX;
      object.y += stepY;
    }
  } else {
    if (selectedSeats.value.size === 0) return;
    
    commit(); // Save state before movement
    
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
  
  commit(); // Save state before rotation
  
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
  
  commit(); // Save state before rotation
  
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
  
  // Delete background when background tool is active
  if (activeTool.value === 'background') {
    removeBackground();
    return;
  }
  
  // Delete selected object when objects tool is active
  if (activeTool.value === 'objects' && selectedObjectId.value) {
    deleteSelectedObject();
    return;
  }
  
  // Delete selected seats when select tool is active
  if (activeTool.value === 'select' && selectedSeats.value.size > 0) {
    commit(); // Save state before deletion
    
    venueStore.currentVenue.seats = venueStore.currentVenue.seats.filter(
      seat => !selectedSeats.value.has(seat.id)
    );
    
    clearSelection();
  }
};

// Update type for selected seats
const updateSelectedSeatsType = (typeId: string) => {
  if (!venueStore.currentVenue || selectedSeats.value.size === 0) return;
  
  commit(); // Save state before change
  
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
  enabled: computed(() => selectedSeats.value.size > 0 || selectedObjectId.value !== null),
  onArrowKey: moveSelection,
  onDelete: deleteSelection,
  onUndo: undo,
  onRedo: redo
});

// Background handlers
const removeBackground = () => {
  if (venueStore.currentVenue) {
    venueStore.currentVenue.backgroundImage = undefined;
    commit(); // Save state after removal
  }
};

const moveBackground = (dx: number, dy: number) => {
  if (!venueStore.currentVenue?.backgroundImage) return;
  
  const step = backgroundMoveStep.value;
  venueStore.currentVenue.backgroundImage.x += dx * step;
  venueStore.currentVenue.backgroundImage.y += dy * step;
  
  commit(); // Save state after movement
};

const rotateBackground = (angle: number) => {
  if (!venueStore.currentVenue?.backgroundImage) return;
  
  const currentRotation = venueStore.currentVenue.backgroundImage.rotation || 0;
  venueStore.currentVenue.backgroundImage.rotation = (currentRotation + angle) % 360;
  
  commit(); // Save state after rotation
};

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
  commit(); // Save state after change
};

const addSeatBlock = (rows: number, seatsPerRow: number) => {
  if (!venueStore.currentVenue) return;
  
  const seatWidth = venueStore.currentVenue.defaultSeatStyle.width;
  const seatHeight = venueStore.currentVenue.defaultSeatStyle.height;
  const gap = 10;

  // Calculate start position based on existing seats
  let startX = 100;
  let startY = 100;

  if (venueStore.currentVenue.seats.length > 0) {
    const maxX = Math.max(...venueStore.currentVenue.seats.map(s => s.x + (s.typeId ? 0 : seatWidth))); 
    startX = maxX + 50; // Add 50px gap
    
    const minY = Math.min(...venueStore.currentVenue.seats.map(s => s.y));
    startY = minY;
  }
  
  commit();
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < seatsPerRow; c++) {
      const x = startX + c * (seatWidth + gap);
      const y = startY + r * (seatHeight + gap);
      
      const newSeat = {
        id: `seat-${Date.now()}-${r}-${c}`,
        x,
        y,
        status: 'free' as const,
        row: r + 1,
        place: c + 1,
        typeId: 'standard',
        rotation: 0
      };
      
      venueStore.currentVenue.seats.push(newSeat);
    }
  }
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
  
  // Only allow area selection in 'select' tool
  if (activeTool.value !== 'select') return;
  
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
  
  // Normal seat selection logic
  if (activeTool.value === 'select') {
    toggleSeatSelection(seatId);
  }
};


// Clear object selection when switching tools
watch(activeTool, (newTool) => {
  if (newTool !== 'objects') {
    selectedObjectId.value = null;
  }
});

// Objects tool handlers
const addObjectFromTemplate = (templateType: VenueObject['type'], x?: number, y?: number) => {
  if (!venueStore.currentVenue) return;
  
  const template = objectTemplates.find(t => t.type === templateType);
  if (!template) return;
  
  // Default to center of view or a fixed position if x/y not provided
  const defaultX = 100;
  const defaultY = 100;

  const newObject: VenueObject = {
    id: `object-${Date.now()}`,
    type: templateType,
    x: x ?? defaultX,
    y: y ?? defaultY,
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
  
  commit(); // Save state after adding object
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
  if (isDraggingObject.value) {
    commit(); // Save state after drag
  }
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
  commit(); // Save state after deletion
};

const updateObjectProperty = (property: keyof VenueObject, value: any) => {
  if (!selectedObjectId.value || !venueStore.currentVenue) return;
  
  const object = venueStore.currentVenue.objects?.find(o => o.id === selectedObjectId.value);
  if (object) {
    (object as any)[property] = value;
  }
  
  commit(); // Save state after update
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
    <div class="header">
      <h1>Venue Layout Editor</h1>
      <div class="header-actions">
        <BaseButton 
          variant="primary" 
          @click="handleSave" 
          :disabled="venueStore.isLoading"
          :loading="venueStore.isLoading"
        >
          {{ venueStore.isLoading ? 'Saving...' : 'Save Venue' }}
        </BaseButton>
      </div>
    </div>
    
    <div 
      v-if="venueStore.currentVenue" 
      class="editor-container"
      @mousedown="handleContainerMouseDown"
    >
      <!-- Main Toolbar -->
      <ToolBar 
        :activeTool="activeTool" 
        :canUndo="canUndo"
        :canRedo="canRedo"
        :canDelete="
          (activeTool === 'select' && selectedSeats.size > 0) || 
          (activeTool === 'objects' && selectedObjectId !== null) ||
          (activeTool === 'background' && venueStore.currentVenue?.backgroundImage !== undefined)
        "
        @update:activeTool="activeTool = $event"
        @undo="undo"
        @redo="redo"
        @delete="deleteSelection"
      />

      <!-- Properties Panel (Sidebar) -->
      <div class="sidebar">
        <!-- Tool Title -->
        <div class="sidebar-header">
          <h3>{{ activeTool === 'pan' ? 'Pan' : activeTool === 'select' ? 'Select' : activeTool === 'add-seat' ? 'Add Seat' : activeTool === 'background' ? 'Background' : activeTool === 'objects' ? 'Objects' : 'Settings' }}</h3>
        </div>

        <!-- Settings Section -->
        <!-- Settings Section -->
        <AdminVenueSettings
          v-if="activeTool === 'settings'"
          :venue="venueStore.currentVenue"
          v-model:showLeftRowLabels="showLeftRowLabels"
          v-model:showRightRowLabels="showRightRowLabels"
          @recalculate-rows="recalculateRows"
          @open-type-modal="showTypeModal = true"
          @open-color-modal="showColorModal = true"
        />

        <!-- Add Seat Tool Section -->
        <AdminSeatSettings
          v-if="activeTool === 'add-seat'"
          @add-seat-block="addSeatBlock"
        />

        <!-- Background Settings Section -->
        <AdminBackgroundSettings
          v-if="activeTool === 'background'"
          :venue="venueStore.currentVenue"
          v-model:moveStep="backgroundMoveStep"
          @remove-background="removeBackground"
          @move-background="moveBackground"
          @rotate-background="rotateBackground"
          @upload-background="handleBackgroundUpload"
        />


        <!-- Objects Tool Section -->
        <AdminObjectSettings
          v-if="activeTool === 'objects'"
          :selectedObject="getSelectedObject"
          v-model:moveStep="moveStep"
          @add-object="addObjectFromTemplate"
          @update-property="updateObjectProperty"
          @move-selection="moveSelection"
          @delete-object="deleteSelectedObject"
          @deselect="selectedObjectId = null"
        />


        <!-- Select All Section (when select tool is active) -->
        <div v-if="activeTool === 'select'" class="sidebar-section select-all-section">
          <BaseButton variant="light" size="small" outlined fullwidth @click="selectAllSeats">
            Select All Seats
          </BaseButton>
        </div>
          

        <!-- Help: Select tool with no seats selected -->
        <div v-if="activeTool === 'select' && selectedSeats.size === 0" class="tool-help">
          <p class="tool-help-title"><strong>Selection Tool</strong></p>
          <ul class="tool-help-list">
            <li>Click seat to toggle select</li>
            <li>Drag to area select</li>
            <li>Click row/col label to select all</li>
            <li>Use arrows to move</li>
          </ul>
        </div>

        <!-- Help: Pan tool -->
        <div v-if="activeTool === 'pan'" class="tool-help">
          <p class="tool-help-title"><strong>Pan Tool</strong></p>
          <ul class="tool-help-list">
            <li>Drag to move view</li>
            <li>Navigate around the venue</li>
          </ul>
        </div>

        <!-- Movement Section (Conditional) -->
        <div v-if="selectedSeats.size > 0 && activeTool === 'select'" class="sidebar-section movement-section">
          <div class="movement-controls-vertical">
            
            <!-- Arrow Controls -->
            <div class="arrow-buttons">
              <BaseButton size="small" variant="light" @click="moveSelection(0, -1)">↑</BaseButton>
              <div class="horizontal-arrows">
                <BaseButton size="small" variant="light" @click="moveSelection(-1, 0)">←</BaseButton>
                
                <!-- Step Control (Centered) -->
                <div class="step-control-compact">
                  <label>Step</label>
                  <input type="number" v-model="moveStep" min="1" class="step-input" />
                </div>

                <BaseButton size="small" variant="light" @click="moveSelection(1, 0)">→</BaseButton>
              </div>
              <BaseButton size="small" variant="light" @click="moveSelection(0, 1)">↓</BaseButton>
            </div>

            <!-- Rotation Controls -->
            <div class="rotation-controls">
              <label>Rotate</label>
              <div class="rotation-buttons">
                <BaseButton size="small" variant="light" @click="rotateCounterClockwise" title="Rotate Counter-Clockwise">↶</BaseButton>
                <BaseButton size="small" variant="light" @click="rotateClockwise" title="Rotate Clockwise">↷</BaseButton>
              </div>
            </div>

            <!-- Selection Info (Vertical) -->
            <div class="selection-info-vertical">
              <span class="selected-count">Selected: {{ selectedSeats.size }}</span>
              <BaseButton size="small" variant="danger" outlined fullwidth @click="clearSelection">Clear Selection</BaseButton>
              
              <!-- Type Selection (only for seats, not stage) -->
              <div v-if="selectedSeats.size > 0" class="settings-group type-edit-section">
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
        :active-tool="activeTool"
        :show-left-row-labels="showLeftRowLabels"
        :show-right-row-labels="showRightRowLabels"
        :class="{ 
          'cursor-grab': activeTool === 'pan',
          'cursor-add': activeTool === 'add-seat',
          'cursor-select': activeTool === 'select',
          'cursor-default': activeTool === 'settings' || activeTool === 'background' || activeTool === 'objects'
        }"
        @grid-mousedown="handleCanvasMouseDown"

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
              transparent: activeTool === 'objects',
              overlapping: overlappingSeatIds.has(seat.id)
            }"
            :style="{ 
              left: seat.x + 'px', 
              top: seat.y + 'px',
              zIndex: 1,
              ...getSeatStyle(seat)
            }"
            :title="`Row: ${seat.row}, Place: ${seat.place} | Type: ${getSeatType(seat)?.name || 'Unknown'} | Price: ${formatPrice(getSeatType(seat)?.priceInCents || 0)}`"
            @mousedown="(e) => { 
              if (activeTool !== 'pan') { e.stopPropagation(); } 
              if (activeTool === 'select') { toggleSeatSelection(seat.id); } 
            }"
          >
            {{ seat.place }}
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
    
    <!-- Color Settings Modal -->
    <ColorSettingsModal 
      v-model="showColorModal"
    />
  </div>
</template>

<style scoped lang="scss">


.admin-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
.header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.editor-container {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  height: calc(100vh - 100px); /* Fill available space */
}

/* Main Toolbar */
.main-toolbar {
  width: 60px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  align-items: center;
  height: 100%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

/* Sidebar (Properties) */
.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  height: 100%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow-y: auto;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1rem;
  color: rgb(var(--color-primary));
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
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
  color: var(--text-secondary);
  text-transform: uppercase;
  line-height: 1;
}

.selection-info-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--border-subtle);
  padding-top: 0.5rem;
  width: 100%;
}

.selected-count {
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: 600;
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
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  color: var(--text-secondary);
  font-weight: bold;
  cursor: help;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  padding: 0;
}

.help-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.help-tooltip {
  display: none;
  position: absolute;
  left: 100%;
  bottom: 0;
  margin-left: 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  padding: 1rem;
  border-radius: 6px;
  width: 200px;
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  font-size: 0.85rem;
  text-align: left;
}

.help-container:hover .help-tooltip {
  display: block;
}

.help-tooltip p {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-weight: bold;
}

.help-tooltip ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-tooltip li {
  margin-bottom: 0.25rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.step-input {
  width: 40px;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
  padding: 4px;
  border-radius: 4px;
  text-align: center;
  font-size: 0.85rem;
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
  width: 32px;
  height: 32px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.2s;
}

.arrow-btn:hover {
  background: var(--bg-secondary);
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
}

.arrow-btn:active {
  transform: scale(0.95);
}

.rotation-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 1rem;
}

.rotation-controls label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.rotation-buttons {
  display: flex;
  gap: 8px;
}

.rotate-btn {
  width: 32px;
  height: 32px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.rotate-btn:hover {
  background: var(--bg-secondary);
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
}


/* Admin Specific Seat Styles */
.seat {
  cursor: pointer;
  background: #64748b; /* slate-500 */
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.seat.selected {
  outline: 2px solid rgb(var(--color-primary));
  outline-offset: 2px;
  z-index: 10;
}

.seat.overlapping {
  outline: 2px solid var(--error) !important;
  outline-offset: 2px;
  z-index: 20 !important;
}

.seat.transparent {
  opacity: 0.3;
  pointer-events: none;
}

.cursor-grab :deep(.seats-grid),
.cursor-grab :deep(.seat) {
  cursor: grab;
}

.cursor-grab :deep(.seats-grid):active,
.cursor-grab :deep(.seat):active {
  cursor: grabbing;
}

.cursor-select :deep(.seats-grid) {
  cursor: crosshair;
}

.cursor-select :deep(.seat) {
  cursor: pointer;
}

.cursor-default :deep(.seats-grid),
.cursor-default :deep(.seat) {
  cursor: default;
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
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  display: block;
}

/* Seat Type dropdown specific */
.type-edit-section {
  width: 100%;
}

.settings-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.current-type-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  padding: 4px;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.current-type-info .label {
  color: var(--text-secondary);
}

.current-type-info .value {
  color: var(--text-primary);
  font-weight: 600;
}

.type-select {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.85rem;
}

/* Preview Seat Styles */
.preview-seat {
  opacity: 0.6;
  background: rgb(var(--color-primary)) !important;
  border: 2px dashed white;
  pointer-events: none;
  font-size: 16px;
  color: white;
  border-radius: 4px;
}

.price-input:focus {
  border-color: rgb(var(--color-primary));
  outline: none;
}

.price-btn {
  background: var(--color-primary-light);
  color: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary));
  margin-top: 0.25rem;
}

.price-btn:hover {
  background: rgb(var(--color-primary));
  color: white;
}

/* Select All Button */
.select-all-section {
  padding: 0 0.25rem;
}

.manage-types-btn {
  background: white;
  color: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary));
  width: 100%;
}

.manage-types-btn:hover {
  background: var(--color-primary-light);
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
  border: 1px solid var(--border-secondary);
  background: var(--bg-tertiary);
  color: var(--text-primary);
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
  background: var(--bg-secondary);
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
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
  color: var(--text-primary);
  min-width: 45px;
  text-align: center;
  font-weight: 600;
}

/* Settings Styles */
.settings-divider {
  width: 100%;
  height: 1px;
  background: var(--border-subtle);
  margin: 1rem 0;
}

.settings-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
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
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.current-type-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.current-type-info .label {
  color: var(--text-secondary);
}

.current-type-info .value {
  color: var(--text-primary);
  font-weight: 600;
}

.settings-input:focus {
  border-color: rgb(var(--color-primary));
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
  background: white;
  border: 1px solid rgb(var(--color-primary));
  border-radius: 6px;
  color: rgb(var(--color-primary));
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.25rem;
}

.upload-button:hover {
  background: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.upload-button:active {
  transform: translateY(0);
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
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.object-template-item:hover {
  background: var(--bg-tertiary);
  border-color: rgb(var(--color-primary));
}

.object-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.object-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.object-settings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Tool Help Sections */
.tool-help {
  padding: 10px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tool-help-title {
  margin: 0 0 8px 0;
  color: var(--text-secondary);
  font-weight: 600;
}

.tool-help-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-muted);
}

.tool-help-list li {
  margin-bottom: 4px;
}
</style>
