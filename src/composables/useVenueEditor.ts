import { computed, ref, type Ref } from 'vue';
import type { Venue, Seat } from '../services/mockData';

/**
 * Composable for venue editor utilities
 * Provides helper functions for working with seat coordinates and labels
 */
export function useVenueEditor(venue: Ref<Venue | null>) {
  /**
   * Get all unique row numbers from venue seats
   */
  const getRows = computed(() => {
    if (!venue.value) return [];
    
    const rows = new Set<number>();
    venue.value.seats.forEach(seat => {
      rows.add(seat.row);
    });
    
    return Array.from(rows).sort((a, b) => a - b);
  });

  /**
   * Get all unique column numbers from venue seats
   */
  const getColumns = computed(() => {
    if (!venue.value) return [];
    
    const cols = new Set<number>();
    venue.value.seats.forEach(seat => {
      cols.add(seat.place);
    });
    
    return Array.from(cols).sort((a, b) => a - b);
  });

  /**
   * Get Y coordinate for a specific row
   */
  const getRowY = (row: number): number => {
    if (!venue.value) return 0;
    const seat = venue.value.seats.find(s => s.row === row);
    return seat?.y ?? 0;
  };

  /**
   * Get X coordinate for a specific column
   */
  const getColX = (col: number): number => {
    if (!venue.value) return 0;
    const seat = venue.value.seats.find(s => s.place === col);
    return seat?.x ?? 0;
  };

  /**
   * Find a seat by its ID
   */
  const findSeatById = (seatId: string): Seat | undefined => {
    return venue.value?.seats.find(s => s.id === seatId);
  };

  /**
   * Get seats within a rectangular area
   */
  const getSeatsInArea = (minX: number, maxX: number, minY: number, maxY: number): Seat[] => {
    if (!venue.value) return [];
    
    return venue.value.seats.filter(seat => {
      // Determine seat dimensions
      let width = venue.value?.defaultSeatStyle.width || 30;
      let height = venue.value?.defaultSeatStyle.height || 30;
      
      // Check if seat has a specific type with custom dimensions
      if (seat.typeId && venue.value?.seatTypes) {
        const type = venue.value.seatTypes.find(t => t.id === seat.typeId);
        if (type?.style?.width) width = type.style.width;
        if (type?.style?.height) height = type.style.height;
      }
      
      // Calculate center point
      const centerX = seat.x + width / 2;
      const centerY = seat.y + height / 2;
      
      // Check if center is within bounds
      return centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY;
    });
  };

  // History state
  const history = ref<string[]>([]);
  const historyIndex = ref(-1);

  /**
   * Initialize history with current state
   */
  const initHistory = () => {
    if (!venue.value) return;
    // Save minimal state needed for undo/redo
    const state = {
      seats: venue.value.seats,
      objects: venue.value.objects,
      backgroundImage: venue.value.backgroundImage
    };
    history.value = [JSON.stringify(state)];
    historyIndex.value = 0;
  };

  /**
   * Commit current state to history
   * Should be called AFTER a change is made
   */
  const commit = () => {
    if (!venue.value) return;
    
    // Remove any future history if we were in the middle
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    
    const state = {
      seats: venue.value.seats,
      objects: venue.value.objects,
      backgroundImage: venue.value.backgroundImage
    };
    
    history.value.push(JSON.stringify(state));
    historyIndex.value++;
  };

  /**
   * Undo last change
   */
  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      const jsonState = history.value[historyIndex.value];
      if (jsonState && venue.value) {
        const state = JSON.parse(jsonState);
        venue.value.seats = state.seats || [];
        venue.value.objects = state.objects || [];
        venue.value.backgroundImage = state.backgroundImage;
      }
    }
  };

  /**
   * Redo last undone change
   */
  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      const jsonState = history.value[historyIndex.value];
      if (jsonState && venue.value) {
        const state = JSON.parse(jsonState);
        venue.value.seats = state.seats || [];
        venue.value.objects = state.objects || [];
        venue.value.backgroundImage = state.backgroundImage;
      }
    }
  };

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  return {
    getRows,
    getColumns,
    getRowY,
    getColX,
    findSeatById,
    getSeatsInArea,
    // History
    initHistory,
    commit,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
