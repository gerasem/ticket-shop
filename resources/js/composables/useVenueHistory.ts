import { computed, ref, type Ref } from 'vue';
import type { Venue } from '../types/venue';

/**
 * Manages undo/redo history for venue editor state.
 * Tracks changes to seats, objects, and backgroundImage.
 */

interface VenueSnapshot {
  seats: Venue['seats'];
  objects: Venue['objects'];
  backgroundImage: Venue['backgroundImage'];
}

export function useVenueHistory(venue: Ref<Venue | null>) {
  const history = ref<string[]>([]);
  const historyIndex = ref(-1);

  const snapshot = (): VenueSnapshot | null => {
    if (!venue.value) return null;
    return {
      seats: JSON.parse(JSON.stringify(venue.value.seats)),
      objects: JSON.parse(JSON.stringify(venue.value.objects ?? [])),
      backgroundImage: venue.value.backgroundImage
        ? JSON.parse(JSON.stringify(venue.value.backgroundImage))
        : undefined,
    };
  };

  /** Call once after the venue is loaded to set the initial undo baseline. */
  const initHistory = () => {
    const state = snapshot();
    if (!state) return;
    history.value = [JSON.stringify(state)];
    historyIndex.value = 0;
  };

  /** Call AFTER mutating the venue to save the new state. */
  const commit = () => {
    const state = snapshot();
    if (!state) return;
    const json = JSON.stringify(state);

    // Trim any future history when making a new change after undo
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    // Skip duplicates
    if (history.value[history.value.length - 1] === json) return;

    history.value.push(json);
    historyIndex.value++;

    // Cap at 50 entries
    if (history.value.length > 50) {
      history.value.shift();
      historyIndex.value--;
    }
  };

  const restore = (json: string) => {
    if (!venue.value) return;
    const state: VenueSnapshot = JSON.parse(json);
    venue.value.seats = state.seats ?? [];
    venue.value.objects = state.objects ?? [];
    venue.value.backgroundImage = state.backgroundImage;
  };

  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      const json = history.value[historyIndex.value];
      if (json) restore(json);
    }
  };

  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      const json = history.value[historyIndex.value];
      if (json) restore(json);
    }
  };

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  return { initHistory, commit, undo, redo, canUndo, canRedo };
}
