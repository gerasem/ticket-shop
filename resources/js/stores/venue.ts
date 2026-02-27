import { defineStore } from 'pinia';
import { ref } from 'vue';
import { venueApi } from '../services/api/venueApi';
import type { Venue } from '../types/venue';

export const useVenueStore = defineStore('venue', () => {
  const currentVenue = ref<Venue | null>(null);
  const venuesList = ref<Venue[]>([]);
  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);
  const currentVenueId = ref<string | null>(null);

  const loadVenues = async () => {
    try {
      isLoading.value = true;
      errorMsg.value = null;
      venuesList.value = await venueApi.list();
      if (!currentVenue.value && venuesList.value.length > 0) {
        await loadVenue(venuesList.value[0].id);
      }
    } catch (error) {
      console.error('Failed to load venues list', error);
      errorMsg.value = 'Failed to load venues list';
    } finally {
      isLoading.value = false;
    }
  };

  const loadVenue = async (venueId: string) => {
    try {
      isLoading.value = true;
      errorMsg.value = null;
      currentVenueId.value = venueId;
      currentVenue.value = await venueApi.get(venueId);
    } catch (error) {
      console.error(`Failed to load venue ${venueId}`, error);
      errorMsg.value = `Failed to load venue ${venueId}`;
    } finally {
      isLoading.value = false;
    }
  };

  const updateSeatStatus = (seatId: string, status: Venue['seats'][0]['status']) => {
    if (!currentVenue.value) return;
    const seat = currentVenue.value.seats.find(s => s.id === seatId);
    if (seat) seat.status = status;
  };

  const createVenue = async (data: { name: string; width: number; height: number }) => {
    const created = await venueApi.create(data);
    await loadVenues();
    return created;
  };

  const saveVenue = async () => {
    if (!currentVenue.value || !currentVenueId.value) return;
    try {
      isLoading.value = true;
      await venueApi.save(currentVenueId.value, currentVenue.value);
    } catch (error) {
      console.error('Failed to save venue', error);
      errorMsg.value = 'Failed to save venue';
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteVenue = async (id: string) => {
    await venueApi.delete(id);
    await loadVenues();
    if (currentVenueId.value === id) {
      currentVenueId.value = null;
      currentVenue.value = null;
    }
  };

  return {
    currentVenue,
    venuesList,
    isLoading,
    errorMsg,
    currentVenueId,
    loadVenue,
    loadVenues,
    updateSeatStatus,
    createVenue,
    saveVenue,
    deleteVenue,
  };
});
