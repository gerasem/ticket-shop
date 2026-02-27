<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useVenueStore } from '../stores/venue';
import { useVenueHistory } from '../composables/useVenueHistory';
import { useGeometry } from '../composables/useGeometry';
import { usePrice } from '../composables/usePrice';
import { useKeyboardControls } from '../composables/useKeyboardControls';
import { useAdminEditor } from '../composables/useAdminEditor';
import { useAreaSelection } from '../composables/useAreaSelection';
import { useObjectDrag } from '../composables/useObjectDrag';
import VenueGrid from '../components/VenueGrid.vue';
import SeatTypeModal from '../components/SeatTypeModal.vue';
import ToolBar from '../components/ToolBar.vue';
import BaseButton from '../components/BaseButton.vue';
import type { Seat, SeatType } from '../types/venue';
import AdminVenueSettings from '../components/admin/AdminVenueSettings.vue';
import AdminBackgroundSettings from '../components/admin/AdminBackgroundSettings.vue';
import AdminObjectSettings from '../components/admin/AdminObjectSettings.vue';
import AdminSeatSettings from '../components/admin/AdminSeatSettings.vue';
import ColorSettingsModal from '../components/admin/ColorSettingsModal.vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

const venueStore = useVenueStore();
const route = useRoute();
const venueRef = ref(venueStore.currentVenue);
const venueHistory = useVenueHistory(venueRef);
const geometry = useGeometry();
const { formatPrice } = usePrice();

// Sync venueRef with store
watch(() => venueStore.currentVenue, (val) => { venueRef.value = val; }, { immediate: true });

// ─── History ─────────────────────────────────────────────────────────────────
const { initHistory, commit, undo, redo, canUndo, canRedo } = venueHistory;

// ─── Composables ─────────────────────────────────────────────────────────────
const {
  activeTool,
  moveStep,
  selectedSeats,
  currentType,
  clearSelection,
  toggleSeatSelection,
  selectAllSeats,
  selectRow,
  selectColumn,
  moveSelection,
  rotateClockwise,
  rotateCounterClockwise,
  updateSelectedSeatsType,
  deleteSeats,
} = useAdminEditor(venueRef, commit, undo, redo);

const {
  isAreaSelecting,
  selectionRectangle,
  startAreaSelection,
  updateAreaSelection,
  finishAreaSelection,
} = useAreaSelection(venueRef);

const {
  selectedObjectId,
  getSelectedObject,
  addObjectFromTemplate,
  selectObject,
  deselectObject,
  startObjectDrag,
  handleObjectDragMove,
  endObjectDrag,
  deleteSelectedObject,
  updateObjectProperty,
  moveSelectedObject,
} = useObjectDrag(venueRef, commit);

// ─── Row label visibility ─────────────────────────────────────────────────────
const showLeftRowLabels = ref(true);
const showRightRowLabels = ref(false);

// ─── Modal State ─────────────────────────────────────────────────────────────
const showTypeModal = ref(false);
const showColorModal = ref(false);

// ─── Seat Preview (add-seat tool) ─────────────────────────────────────────────
const previewSeatPos = ref<{ x: number; y: number } | null>(null);

const getSeatsGridContainer = (): HTMLElement | null =>
  document.querySelector('.seats-grid');

const handleMouseMoveForPreview = (event: MouseEvent) => {
  if (activeTool.value !== 'add-seat') { previewSeatPos.value = null; return; }
  const container = getSeatsGridContainer();
  if (!container) return;
  const coords = geometry.getRelativeCoordinates(event, container);
  previewSeatPos.value = {
    x: Math.round((coords.x - 15) / 10) * 10,
    y: Math.round((coords.y - 15) / 10) * 10,
  };
};

// ─── Seat Click Handler ───────────────────────────────────────────────────────
const handleSeatClick = (seatId: string, event: MouseEvent) => {
  if (activeTool.value === 'select') {
    event.stopPropagation();
    toggleSeatSelection(seatId);
  }
};

// ─── Add Seat ─────────────────────────────────────────────────────────────────
const addSeat = (event: MouseEvent) => {
  const container = getSeatsGridContainer();
  if (!container || !venueRef.value) return;
  const coords = geometry.getRelativeCoordinates(event, container);
  const x = Math.round((coords.x - 15) / 10) * 10;
  const y = Math.round((coords.y - 15) / 10) * 10;
  venueRef.value.seats.push({
    id: `seat-${Date.now()}`,
    x, y,
    status: 'free',
    row: 0, place: 0,
    typeId: 'standard',
    rotation: 0,
  });
  commit();
};

const addSeatBlock = (rows: number, seatsPerRow: number) => {
  if (!venueRef.value) return;
  const { width: w, height: h } = venueRef.value.defaultSeatStyle;
  const gap = 10;
  let startX = 100, startY = 100;
  if (venueRef.value.seats.length > 0) {
    startX = Math.max(...venueRef.value.seats.map(s => s.x)) + 50;
    startY = Math.min(...venueRef.value.seats.map(s => s.y));
  }
  commit();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < seatsPerRow; c++) {
      venueRef.value.seats.push({
        id: `seat-${Date.now()}-${r}-${c}`,
        x: startX + c * (w + gap),
        y: startY + r * (h + gap),
        status: 'free',
        row: r + 1, place: c + 1,
        typeId: 'standard',
        rotation: 0,
      });
    }
  }
};

// ─── Canvas Mouse Handling ────────────────────────────────────────────────────
const handleCanvasMouseDown = (event: MouseEvent) => {
  if (activeTool.value === 'pan') return;

  if (activeTool.value === 'add-seat') { addSeat(event); return; }

  if (activeTool.value === 'objects') {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('venue-object')) deselectObject();
    return;
  }

  if (activeTool.value !== 'select') return;
  const target = event.target as HTMLElement;
  if (target.classList.contains('seat')) return;

  const container = getSeatsGridContainer();
  if (!container) return;

  startAreaSelection(event, container);
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
  event.preventDefault();
};

const onWindowMouseMove = (event: MouseEvent) => {
  const container = getSeatsGridContainer();
  if (container) updateAreaSelection(event, container);
};

const onWindowMouseUp = () => {
  const ids = finishAreaSelection();
  ids.forEach(id => selectedSeats.value.add(id));
  window.removeEventListener('mousemove', onWindowMouseMove);
  window.removeEventListener('mouseup', onWindowMouseUp);
};

// ─── Background ───────────────────────────────────────────────────────────────
const backgroundMoveStep = ref(10);

const handleBackgroundUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.[0] || !venueRef.value) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (!venueRef.value || !e.target?.result) return;
    if (!venueRef.value.backgroundImage) {
      venueRef.value.backgroundImage = { url: e.target.result as string, scale: 100, x: 0, y: 0, rotation: 0 };
    } else {
      venueRef.value.backgroundImage.url = e.target.result as string;
    }
    commit();
  };
  reader.readAsDataURL(input.files[0]);
};

const removeBackground = () => {
  if (venueRef.value) { venueRef.value.backgroundImage = undefined; commit(); }
};

const moveBackground = (dx: number, dy: number) => {
  if (!venueRef.value?.backgroundImage) return;
  venueRef.value.backgroundImage.x += dx * backgroundMoveStep.value;
  venueRef.value.backgroundImage.y += dy * backgroundMoveStep.value;
  commit();
};

const rotateBackground = (angle: number) => {
  if (!venueRef.value?.backgroundImage) return;
  venueRef.value.backgroundImage.rotation = ((venueRef.value.backgroundImage.rotation || 0) + angle) % 360;
  commit();
};

// ─── Recalculate Rows ─────────────────────────────────────────────────────────
const recalculateRows = () => {
  if (!venueRef.value) return;
  const seats = [...venueRef.value.seats].sort((a, b) => {
    const aY = a.originalY ?? a.y, bY = b.originalY ?? b.y;
    const aX = a.originalX ?? a.x, bX = b.originalX ?? b.x;
    return Math.abs(aY - bY) < 10 ? aX - bX : aY - bY;
  });
  const rows: { y: number; seats: typeof seats }[] = [];
  let curY = -1000, curRow: typeof seats = [];
  seats.forEach(seat => {
    const sy = seat.originalY ?? seat.y;
    if (Math.abs(sy - curY) > 10) {
      if (curRow.length > 0) rows.push({ y: curY, seats: curRow });
      curRow = [seat]; curY = sy;
    } else { curRow.push(seat); }
  });
  if (curRow.length > 0) rows.push({ y: curY, seats: curRow });
  rows.forEach((row, ri) => row.seats.forEach((seat, ci) => { seat.row = ri + 1; seat.place = ci + 1; }));
};

// ─── Delete unified handler ───────────────────────────────────────────────────
const deleteSelection = () => {
  if (activeTool.value === 'background') { removeBackground(); return; }
  if (activeTool.value === 'objects' && selectedObjectId.value) { deleteSelectedObject(); return; }
  if (activeTool.value === 'select' && selectedSeats.value.size > 0) { deleteSeats(); }
};

// ─── Move selection (delegates to object or seat logic) ───────────────────────
const onMoveSelection = (dx: number, dy: number) => {
  if (selectedObjectId.value) {
    moveSelectedObject(dx, dy, moveStep.value);
  } else {
    moveSelection(dx, dy);
  }
};

// ─── Update types from modal ──────────────────────────────────────────────────
const handleTypesUpdate = (types: SeatType[]) => {
  if (venueRef.value) venueRef.value.seatTypes = types;
};

// ─── Computed ─────────────────────────────────────────────────────────────────
const overlappingSeatIds = computed(() => {
  if (!venueRef.value) return new Set<string>();
  const seats = venueRef.value.seats;
  const overlapping = new Set<string>();
  for (let i = 0; i < seats.length; i++) {
    const seatA = seats[i];
    if (!seatA) continue;
    const styleA = getSeatStyle(seatA);
    for (let j = i + 1; j < seats.length; j++) {
      const seatB = seats[j];
      if (!seatB) continue;
      const styleB = getSeatStyle(seatB);
      if (geometry.checkIntersection(
        { x: seatA.x, y: seatA.y, width: parseInt(styleA.width as string), height: parseInt(styleA.height as string), rotation: seatA.rotation },
        { x: seatB.x, y: seatB.y, width: parseInt(styleB.width as string), height: parseInt(styleB.height as string), rotation: seatB.rotation }
      )) {
        overlapping.add(seatA.id);
        overlapping.add(seatB.id);
      }
    }
  }
  return overlapping;
});

const getSeatType = (seat: Seat) =>
  venueRef.value?.seatTypes.find(t => t.id === seat.typeId);

const getSeatStyle = (seat: Seat) => {
  const type = getSeatType(seat);
  const defaultStyle = venueRef.value?.defaultSeatStyle;
  if (!defaultStyle) return {};
  const merged = { ...defaultStyle, ...type?.style };
  return {
    width: merged.width + 'px',
    height: merged.height + 'px',
    backgroundColor: merged.color,
    borderRadius: merged.borderRadius,
    transform: seat.rotation ? `rotate(${seat.rotation}deg)` : undefined,
  };
};

const toolLabel = computed(() => {
  const map: Record<string, string> = {
    pan: 'Pan', select: 'Select', 'add-seat': 'Add Seat',
    background: 'Background', objects: 'Objects', settings: 'Settings',
  };
  return map[activeTool.value] ?? activeTool.value;
});

const canDelete = computed(() =>
  (activeTool.value === 'select' && selectedSeats.value.size > 0) ||
  (activeTool.value === 'objects' && selectedObjectId.value !== null) ||
  (activeTool.value === 'background' && !!venueRef.value?.backgroundImage)
);

// ─── Keyboard Controls ────────────────────────────────────────────────────────
useKeyboardControls({
  enabled: computed(() => selectedSeats.value.size > 0 || selectedObjectId.value !== null),
  onArrowKey: onMoveSelection,
  onDelete: deleteSelection,
  onUndo: undo,
  onRedo: redo,
});

// ─── Clear object selection when leaving objects tool ─────────────────────────
watch(activeTool, (newTool) => {
  if (newTool !== 'objects') deselectObject();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
const handleSave = async () => {
  try {
    await venueStore.saveVenue();
    toast.success('Venue saved successfully!');
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    const msg = err.response?.data?.message || err.message || 'Unknown error';
    toast.error(`Failed to save: ${msg}`);
  }
};

onMounted(async () => {
  const venueId = route.params.id as string;
  if (venueId) {
    await venueStore.loadVenue(venueId);
  } else {
    await venueStore.loadVenues();
  }
  if (venueStore.currentVenue) initHistory();
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
          Save Venue
        </BaseButton>
      </div>
    </div>

    <div v-if="venueRef" class="editor-container" @mousedown.self="handleCanvasMouseDown">
      <!-- Main Toolbar -->
      <ToolBar
        :activeTool="activeTool"
        :canUndo="canUndo"
        :canRedo="canRedo"
        :canDelete="canDelete"
        @update:activeTool="activeTool = $event"
        @undo="undo"
        @redo="redo"
        @delete="deleteSelection"
      />

      <!-- Properties Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>{{ toolLabel }}</h3>
        </div>

        <!-- Per-tool panels -->
        <AdminVenueSettings
          v-if="activeTool === 'settings'"
          :venue="venueRef"
          v-model:showLeftRowLabels="showLeftRowLabels"
          v-model:showRightRowLabels="showRightRowLabels"
          @recalculate-rows="recalculateRows"
          @open-type-modal="showTypeModal = true"
          @open-color-modal="showColorModal = true"
        />

        <AdminSeatSettings
          v-if="activeTool === 'add-seat'"
          @add-seat-block="addSeatBlock"
        />

        <AdminBackgroundSettings
          v-if="activeTool === 'background'"
          :venue="venueRef"
          v-model:moveStep="backgroundMoveStep"
          @remove-background="removeBackground"
          @move-background="moveBackground"
          @rotate-background="rotateBackground"
          @upload-background="handleBackgroundUpload"
        />

        <AdminObjectSettings
          v-if="activeTool === 'objects'"
          :selectedObject="getSelectedObject"
          v-model:moveStep="moveStep"
          @add-object="addObjectFromTemplate"
          @update-property="updateObjectProperty"
          @move-selection="onMoveSelection"
          @delete-object="deleteSelectedObject"
          @deselect="deselectObject"
        />

        <!-- Select tool controls -->
        <template v-if="activeTool === 'select'">
          <div class="sidebar-section">
            <BaseButton variant="light" size="small" outlined fullwidth @click="selectAllSeats">
              Select All Seats
            </BaseButton>
          </div>

          <div v-if="selectedSeats.size === 0" class="tool-help">
            <p class="tool-help-title"><strong>Selection Tool</strong></p>
            <ul class="tool-help-list">
              <li>Click seat to toggle select</li>
              <li>Drag to area select</li>
              <li>Click row/col label to select all</li>
              <li>Use arrows to move</li>
            </ul>
          </div>

          <div v-if="selectedSeats.size > 0" class="sidebar-section movement-section">
            <div class="movement-controls-vertical">
              <div class="arrow-buttons">
                <BaseButton size="small" variant="light" @click="moveSelection(0, -1)">↑</BaseButton>
                <div class="horizontal-arrows">
                  <BaseButton size="small" variant="light" @click="moveSelection(-1, 0)">←</BaseButton>
                  <div class="step-control-compact">
                    <label>Step</label>
                    <input type="number" v-model="moveStep" min="1" class="step-input" />
                  </div>
                  <BaseButton size="small" variant="light" @click="moveSelection(1, 0)">→</BaseButton>
                </div>
                <BaseButton size="small" variant="light" @click="moveSelection(0, 1)">↓</BaseButton>
              </div>

              <div class="rotation-controls">
                <label>Rotate</label>
                <div class="rotation-buttons">
                  <BaseButton size="small" variant="light" @click="rotateCounterClockwise">↶</BaseButton>
                  <BaseButton size="small" variant="light" @click="rotateClockwise">↷</BaseButton>
                </div>
              </div>

              <div class="selection-info-vertical">
                <span class="selected-count">Selected: {{ selectedSeats.size }}</span>
                <BaseButton size="small" variant="danger" outlined fullwidth @click="clearSelection">
                  Clear Selection
                </BaseButton>

                <div v-if="selectedSeats.size > 0" class="settings-group type-edit-section">
                  <div class="settings-subtitle">Seat Type</div>
                  <div v-if="currentType" class="current-type-info">
                    <span class="label">Current:</span>
                    <span class="value">{{ venueRef.seatTypes.find(t => t.id === currentType)?.name }}</span>
                  </div>
                  <select
                    class="settings-input type-select"
                    @change="updateSelectedSeatsType(($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">Change Type...</option>
                    <option v-for="type in venueRef.seatTypes" :key="type.id" :value="type.id">
                      {{ type.name }} ({{ formatPrice(type.priceInCents) }})
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Pan tool help -->
        <div v-if="activeTool === 'pan'" class="tool-help">
          <p class="tool-help-title"><strong>Pan Tool</strong></p>
          <ul class="tool-help-list">
            <li>Drag to move view</li>
            <li>Navigate around the venue</li>
          </ul>
        </div>
      </div>

      <!-- Venue Canvas -->
      <VenueGrid
        :venue="venueRef"
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
          'cursor-default': ['settings', 'background', 'objects'].includes(activeTool),
        }"
        @grid-mousedown="handleCanvasMouseDown"
        @mousemove="handleMouseMoveForPreview"
        @row-click="selectRow"
        @col-click="selectColumn"
        @object-click="(id, e) => selectObject(id)"
        @object-mousedown="startObjectDrag"
        @object-mousemove="handleObjectDragMove"
        @object-mouseup="endObjectDrag"
      >
        <template #overlay>
          <div
            v-if="selectionRectangle"
            class="selection-rectangle"
            :style="{
              left: selectionRectangle.left + 'px',
              top: selectionRectangle.top + 'px',
              width: selectionRectangle.width + 'px',
              height: selectionRectangle.height + 'px',
            }"
          />
          <div
            v-if="previewSeatPos && activeTool === 'add-seat'"
            class="seat preview-seat"
            :style="{ left: previewSeatPos.x + 'px', top: previewSeatPos.y + 'px' }"
          >+</div>
        </template>

        <template #seat="{ seat }">
          <div
            class="seat"
            :class="{
              selected: selectedSeats.has(seat.id),
              transparent: activeTool === 'objects',
              overlapping: overlappingSeatIds.has(seat.id),
            }"
            :style="{
              left: seat.x + 'px',
              top: seat.y + 'px',
              zIndex: 1,
              ...getSeatStyle(seat),
            }"
            :title="`Row: ${seat.row}, Place: ${seat.place} | ${getSeatType(seat)?.name || ''} | ${formatPrice(getSeatType(seat)?.priceInCents || 0)}`"
            @mousedown="(e) => handleSeatClick(seat.id, e)"
          >
            {{ seat.place }}
          </div>
        </template>
      </VenueGrid>
    </div>

    <p v-else>Loading venue...</p>

    <SeatTypeModal v-model="showTypeModal" :venue="venueRef" @save="handleTypesUpdate" />
    <ColorSettingsModal v-model="showColorModal" />
  </div>
</template>

<style scoped lang="scss">
.admin-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-primary);
  flex-shrink: 0;

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}

.editor-container {
  display: flex;
  gap: 1rem;
  align-items: stretch;
  flex: 1;
  overflow: hidden;
  padding: 1rem 1.5rem;
}

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
  overflow-y: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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

.movement-controls-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
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

.step-control-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  label {
    font-size: 0.65rem;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
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
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.rotation-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  label {
    font-size: 0.65rem;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
}

.rotation-buttons {
  display: flex;
  gap: 8px;
}

.selection-info-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  border-top: 1px solid var(--border-subtle);
  padding-top: 0.5rem;
  width: 100%;
}

.selected-count {
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: 600;
}

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
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  margin-bottom: 0.5rem;

  .label { color: var(--text-secondary); }
  .value { color: var(--text-primary); font-weight: 600; }
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  min-width: 0;
}

.settings-input {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.8rem;

  &:focus { border-color: rgb(var(--color-primary)); outline: none; }
}

.type-select {
  width: 100%;
  padding: 6px;
}

.tool-help {
  padding: 10px;
  font-size: 0.75rem;
  color: var(--text-muted);

  .tool-help-title {
    margin: 0 0 8px 0;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .tool-help-list {
    margin: 0;
    padding-left: 20px;
  }

  li { margin-bottom: 4px; }
}

/* Seat styles */
.seat {
  cursor: pointer;
  background: #64748b;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);

  &.selected {
    outline: 2px solid rgb(var(--color-primary));
    outline-offset: 2px;
    z-index: 10;
  }

  &.overlapping {
    outline: 2px solid var(--error) !important;
    outline-offset: 2px;
    z-index: 20 !important;
  }

  &.transparent {
    opacity: 0.3;
    pointer-events: none;
  }
}

.preview-seat {
  opacity: 0.6;
  background: rgb(var(--color-primary)) !important;
  border: 2px dashed white;
  pointer-events: none;
  font-size: 16px;
  color: white;
  border-radius: 4px;
}

.selection-rectangle {
  position: absolute;
  border: 2px dashed rgb(var(--color-primary));
  background: rgba(var(--color-primary), 0.1);
  pointer-events: none;
  z-index: 100;
}

/* Cursor mods */
.cursor-grab :deep(.seats-grid),
.cursor-grab :deep(.seat) { cursor: grab; }
.cursor-grab :deep(.seats-grid):active,
.cursor-grab :deep(.seat):active { cursor: grabbing; }
.cursor-select :deep(.seats-grid) { cursor: crosshair; }
.cursor-select :deep(.seat) { cursor: pointer; }
.cursor-default :deep(.seats-grid),
.cursor-default :deep(.seat) { cursor: default; }
.cursor-add :deep(.seats-grid) { cursor: crosshair; }
</style>
