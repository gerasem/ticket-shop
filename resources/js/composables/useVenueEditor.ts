import { computed, type Ref } from 'vue';
import type { Venue, Seat } from '../types/venue';

/**
 * Spatial query helpers for a venue:
 * rows, columns, coordinate lookups, and area-based seat selection.
 */
export function useVenueEditor(venue: Ref<Venue | null>) {
  const getRows = computed(() => {
    if (!venue.value) return [];
    return [...new Set(venue.value.seats.map(s => s.row))].sort((a, b) => a - b);
  });

  const getColumns = computed(() => {
    if (!venue.value) return [];
    return [...new Set(venue.value.seats.map(s => s.place))].sort((a, b) => a - b);
  });

  const getRowY = (row: number): number =>
    venue.value?.seats.find(s => s.row === row)?.y ?? 0;

  const getColX = (col: number): number =>
    venue.value?.seats.find(s => s.place === col)?.x ?? 0;

  const findSeatById = (seatId: string): Seat | undefined =>
    venue.value?.seats.find(s => s.id === seatId);

  const getSeatsInArea = (minX: number, maxX: number, minY: number, maxY: number): Seat[] => {
    if (!venue.value) return [];
    return venue.value.seats.filter(seat => {
      const w = venue.value?.seatTypes.find(t => t.id === seat.typeId)?.style?.width
        ?? venue.value?.defaultSeatStyle.width
        ?? 30;
      const h = venue.value?.seatTypes.find(t => t.id === seat.typeId)?.style?.height
        ?? venue.value?.defaultSeatStyle.height
        ?? 30;
      const cx = seat.x + w / 2;
      const cy = seat.y + h / 2;
      return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
    });
  };

  return { getRows, getColumns, getRowY, getColX, findSeatById, getSeatsInArea };
}
