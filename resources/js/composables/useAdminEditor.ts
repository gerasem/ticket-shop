import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import type { Venue, Seat } from '../types/venue';
import { useVenueEditor } from './useVenueEditor';
import { useGeometry, type Point } from './useGeometry';

export type EditorTool = 'select' | 'pan' | 'settings' | 'add-seat' | 'background' | 'objects';

export function useAdminEditor(
  venueRef: Ref<Venue | null>,
  commit: () => void,
  undo: () => void,
  redo: () => void
) {
  const venueEditor = useVenueEditor(venueRef);
  const geometry = useGeometry();

  // ─── Tool State ─────────────────────────────────────────────────────────────
  const activeTool = ref<EditorTool>('pan');
  const moveStep = ref(10);

  // ─── Selection State ─────────────────────────────────────────────────────────
  const selectedSeats = ref<Set<string>>(new Set());

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

  const selectAllSeats = () => {
    if (!venueRef.value) return;
    const allSelected = venueRef.value.seats.every(seat =>
      selectedSeats.value.has(seat.id)
    );
    clearSelection();
    if (!allSelected) {
      venueRef.value.seats.forEach(seat => selectedSeats.value.add(seat.id));
    }
  };

  const selectRow = (rowNumber: number) => {
    if (!venueRef.value) return;
    const rowSeats = venueRef.value.seats.filter(s => s.row === rowNumber);
    const allRowSelected = rowSeats.every(s => selectedSeats.value.has(s.id));
    if (allRowSelected) {
      rowSeats.forEach(s => selectedSeats.value.delete(s.id));
    } else {
      rowSeats.forEach(s => selectedSeats.value.add(s.id));
    }
  };

  const selectColumn = (colNumber: number) => {
    if (!venueRef.value) return;
    const colSeats = venueRef.value.seats.filter(s => s.place === colNumber);
    const allColSelected = colSeats.every(s => selectedSeats.value.has(s.id));
    if (allColSelected) {
      colSeats.forEach(s => selectedSeats.value.delete(s.id));
    } else {
      colSeats.forEach(s => selectedSeats.value.add(s.id));
    }
  };

  // Returns the type if all selected seats share it, otherwise null
  const currentType = computed(() => {
    if (selectedSeats.value.size === 0 || !venueRef.value) return null;
    const seatsArray = Array.from(selectedSeats.value);
    const seats = seatsArray
      .map(id => venueEditor.findSeatById(id))
      .filter((s): s is Seat => s !== undefined);
    if (seats.length === 0) return null;
    const firstTypeId = seats[0]?.typeId;
    return seats.every(s => s.typeId === firstTypeId) ? firstTypeId : null;
  });

  // ─── Movement & Rotation ─────────────────────────────────────────────────────
  const ROTATE_ANGLE = 15;

  const moveSelection = (dx: number, dy: number) => {
    const stepX = dx * moveStep.value;
    const stepY = dy * moveStep.value;

    if (selectedSeats.value.size === 0) return;
    commit();
    selectedSeats.value.forEach(seatId => {
      const seat = venueEditor.findSeatById(seatId);
      if (seat) {
        seat.x += stepX;
        seat.y += stepY;
      }
    });
  };

  const rotateSeats = (angleDeg: number) => {
    if (selectedSeats.value.size === 0) return;
    commit();
    const seats = Array.from(selectedSeats.value)
      .map(id => venueEditor.findSeatById(id))
      .filter((s): s is Seat => s !== undefined);
    if (seats.length === 0) return;
    const centerX = seats.reduce((sum, s) => sum + s.x, 0) / seats.length;
    const centerY = seats.reduce((sum, s) => sum + s.y, 0) / seats.length;
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    seats.forEach(seat => {
      const dx = seat.x - centerX;
      const dy = seat.y - centerY;
      seat.x = centerX + dx * cos - dy * sin;
      seat.y = centerY + dx * sin + dy * cos;
      seat.rotation = ((seat.rotation || 0) + angleDeg + 360) % 360;
    });
  };

  const rotateClockwise = () => rotateSeats(ROTATE_ANGLE);
  const rotateCounterClockwise = () => rotateSeats(-ROTATE_ANGLE);

  // ─── Seat Type Update ─────────────────────────────────────────────────────────
  const updateSelectedSeatsType = (typeId: string) => {
    if (!venueRef.value || selectedSeats.value.size === 0) return;
    commit();
    selectedSeats.value.forEach(seatId => {
      const seat = venueEditor.findSeatById(seatId);
      if (seat) seat.typeId = typeId;
    });
    clearSelection();
  };

  // ─── Delete Selection ─────────────────────────────────────────────────────────
  const deleteSeats = () => {
    if (!venueRef.value || selectedSeats.value.size === 0) return;
    commit();
    venueRef.value.seats = venueRef.value.seats.filter(
      s => !selectedSeats.value.has(s.id)
    );
    clearSelection();
  };

  // ─── Clear selection when switching away from select tool ────────────────────
  watch(activeTool, (newTool, oldTool) => {
    if (oldTool === 'select' && newTool !== 'select') {
      clearSelection();
    }
  });

  return {
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
  };
}
