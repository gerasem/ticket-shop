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

  const createEvent = async (eventData: Parameters<typeof eventsApi.create>[0]) => {
    try {
      isLoading.value = true;
      error.value = null;
      const created = await eventsApi.create(eventData);
      events.value.push(created);
      return created;
    } catch (e) {
      console.error('Failed to create event', e);
      error.value = 'Failed to create event';
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const updateEvent = async (id: number, eventData: Parameters<typeof eventsApi.update>[1]) => {
    try {
      isLoading.value = true;
      error.value = null;
      const updated = await eventsApi.update(id, eventData);
      const index = events.value.findIndex(e => e.id === id);
      if (index !== -1) events.value[index] = updated;
      return updated;
    } catch (e) {
      console.error('Failed to update event', e);
      error.value = 'Failed to update event';
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      isLoading.value = true;
      error.value = null;
      await eventsApi.delete(id);
      events.value = events.value.filter(e => e.id !== id);
    } catch (e) {
      console.error('Failed to delete event', e);
      error.value = 'Failed to delete event';
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return { events, isLoading, error, loadEvents, createEvent, updateEvent, deleteEvent };
});
