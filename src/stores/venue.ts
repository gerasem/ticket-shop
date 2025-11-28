import { defineStore } from 'pinia';
import { ref } from 'vue';
import { type Venue, generateMockVenue } from '../services/mockData';

export const useVenueStore = defineStore('venue', () => {
  const currentVenue = ref<Venue | null>(null);

  const loadVenue = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    currentVenue.value = generateMockVenue();
  };

  // Removed saveVenue as we now save to DB via API

  const updateSeatStatus = async (seatId: string, status: Venue['seats'][0]['status']) => {
    if (!currentVenue.value) return;
    
    const seat = currentVenue.value.seats.find(s => s.id === seatId);
    if (seat) {
      seat.status = status;
      // No API call needed for mock mode
    }
  };

  return {
    currentVenue,
    loadVenue,
    updateSeatStatus
  };
});
