import { computed, type Ref } from 'vue';
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

  return {
    getRows,
    getColumns,
    getRowY,
    getColX,
    findSeatById,
    getSeatsInArea
  };
}
