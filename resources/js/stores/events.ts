import { defineStore } from 'pinia';
import { ref } from 'vue';
import { eventsApi } from '../services/api/eventsApi';
import type { AppEvent } from '../types/event';

export type { AppEvent };

export const useEventsStore = defineStore('events', () => {
  const events = ref<AppEvent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const loadEvents = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      events.value = await eventsApi.list();
    } catch (e) {
      console.error('Failed to load events', e);
      error.value = 'Failed to load events';
    } finally {
      isLoading.value = false;
    }
  };

  return { events, isLoading, error, loadEvents };
});
