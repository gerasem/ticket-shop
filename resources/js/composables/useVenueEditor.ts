import { computed, type Ref } from 'vue';
import type { Venue } from '../types/venue';

/**
 * Spatial query helpers for rendering a venue in the client storefront.
 */
export function useVenueEditor(venue: Ref<Venue | null>) {
  const getRows = computed(() => {
    if (!venue.value) return [];
    return [...new Set(venue.value.seats.map(s => s.row))].sort((a, b) => a - b);
  });

  const getRowY = (row: number): number =>
    venue.value?.seats.find(s => s.row === row)?.y ?? 0;

  return { getRows, getRowY };
}
