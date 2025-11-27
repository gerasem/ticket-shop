import { computed, type Ref } from 'vue';
import type { Venue, Seat } from '../services/mockData';

/**
 * Composable for venue editor utilities
 * Provides helper functions for working with seat coordinates and labels
 */
export function useVenueEditor(venue: Ref<Venue | null>) {
  /**
   * Parse seat label into row and column numbers
   * @param label - Seat label in format "row-col" (e.g., "1-5")
   * @returns Object with row and col numbers, or null if invalid
   */
  const parseSeatLabel = (label: string): { row: number; col: number } | null => {
    const parts = label.split('-');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    
    const row = parseInt(parts[0]);
    const col = parseInt(parts[1]);
    
    if (isNaN(row) || isNaN(col)) return null;
    
    return { row, col };
  };

  /**
   * Get all unique row numbers from venue seats
   */
  const getRows = computed(() => {
    if (!venue.value) return [];
    
    const rows = new Set<number>();
    venue.value.seats.forEach(seat => {
      const parsed = parseSeatLabel(seat.label);
      if (parsed) {
        rows.add(parsed.row);
      }
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
      const parsed = parseSeatLabel(seat.label);
      if (parsed) {
        cols.add(parsed.col);
      }
    });
    
    return Array.from(cols).sort((a, b) => a - b);
  });

  /**
   * Get Y coordinate for a specific row
   */
  const getRowY = (row: number): number => {
    if (!venue.value) return 0;
    const seat = venue.value.seats.find(s => s.label.startsWith(`${row}-`));
    return seat?.y ?? 0;
  };

  /**
   * Get X coordinate for a specific column
   */
  const getColX = (col: number): number => {
    if (!venue.value) return 0;
    const seat = venue.value.seats.find(s => s.label.endsWith(`-${col}`));
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
    parseSeatLabel,
    getRows,
    getColumns,
    getRowY,
    getColX,
    findSeatById,
    getSeatsInArea
  };
}
