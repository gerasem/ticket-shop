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
    
    return venue.value.seats.filter(seat => 
      seat.x >= minX && seat.x <= maxX && seat.y >= minY && seat.y <= maxY
    );
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
