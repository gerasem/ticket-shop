import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import type { Venue } from '../types/venue';
import { useGeometry, type Point } from './useGeometry';
import { useVenueEditor } from './useVenueEditor';

export function useAreaSelection(venueRef: Ref<Venue | null>) {
  const venueEditor = useVenueEditor(venueRef);
  const geometry = useGeometry();

  const isAreaSelecting = ref(false);
  const areaStart = ref<Point>({ x: 0, y: 0 });
  const areaEnd = ref<Point>({ x: 0, y: 0 });

  const selectionRectangle = computed(() => {
    if (!isAreaSelecting.value) return null;
    const bounds = geometry.calculateRectangleBounds(areaStart.value, areaEnd.value);
    return geometry.boundsToRectangle(bounds);
  });

  const startAreaSelection = (event: MouseEvent, container: HTMLElement) => {
    areaStart.value = geometry.getRelativeCoordinates(event, container);
    areaEnd.value = { ...areaStart.value };
    isAreaSelecting.value = true;
  };

  const updateAreaSelection = (event: MouseEvent, container: HTMLElement) => {
    if (!isAreaSelecting.value) return;
    areaEnd.value = geometry.getRelativeCoordinates(event, container);
  };

  /**
   * Finalize selection — returns IDs of seats inside the selected area.
   */
  const finishAreaSelection = (): string[] => {
    if (!isAreaSelecting.value) return [];
    const bounds = geometry.calculateRectangleBounds(areaStart.value, areaEnd.value);
    const seatsInArea = venueEditor.getSeatsInArea(
      bounds.minX,
      bounds.maxX,
      bounds.minY,
      bounds.maxY
    );
    isAreaSelecting.value = false;
    return seatsInArea.map(s => s.id);
  };

  const cancelAreaSelection = () => {
    isAreaSelecting.value = false;
  };

  return {
    isAreaSelecting,
    areaStart,
    areaEnd,
    selectionRectangle,
    startAreaSelection,
    updateAreaSelection,
    finishAreaSelection,
    cancelAreaSelection,
  };
}
