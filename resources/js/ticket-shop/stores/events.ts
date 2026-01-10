import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue_id: string;
  image?: string;
  venue?: any;
}

export const useEventsStore = defineStore('events', () => {
  const events = ref<Event[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function loadEvents() {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await axios.get('/api/events');
      events.value = response.data;
    } catch (e) {
      console.error('Failed to load events', e);
      error.value = 'Failed to load events';
    } finally {
      isLoading.value = false;
    }
  }

  async function createEvent(eventData: FormData | Omit<Event, 'id'>) {
    try {
      isLoading.value = true;
      error.value = null;
      
      const config = eventData instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : {};
      
      const response = await axios.post('/api/events', eventData, config);
      events.value.push(response.data);
      return response.data;
    } catch (e) {
      console.error('Failed to create event', e);
      error.value = 'Failed to create event';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateEvent(id: number, eventData: FormData | Partial<Event>) {
    try {
      isLoading.value = true;
      error.value = null;
      
      const config = eventData instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : {};
      
      const response = await axios.put(`/api/events/${id}`, eventData, config);
      const index = events.value.findIndex(e => e.id === id);
      if (index !== -1) {
        events.value[index] = response.data;
      }
      return response.data;
    } catch (e) {
      console.error('Failed to update event', e);
      error.value = 'Failed to update event';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteEvent(id: number) {
    try {
      isLoading.value = true;
      error.value = null;
      await axios.delete(`/api/events/${id}`);
      events.value = events.value.filter(e => e.id !== id);
    } catch (e) {
      console.error('Failed to delete event', e);
      error.value = 'Failed to delete event';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    events,
    isLoading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
});
