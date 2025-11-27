import { defineStore } from 'pinia';
import { ref } from 'vue';
import { type Venue, generateMockVenue } from '../services/mockData';

export const useVenueStore = defineStore('venue', () => {
  const currentVenue = ref<Venue | null>(null);

  const loadVenue = () => {
    // In a real app, this would fetch from API
    // For now, check local storage or generate mock
    const stored = localStorage.getItem('venue_data');
    if (stored) {
      const parsedVenue = JSON.parse(stored);
      // Check if the stored data has the new priceInCents field
      const hasValidPrices = parsedVenue.seats && parsedVenue.seats.length > 0 && 
                             parsedVenue.seats[0].priceInCents !== undefined;
      
      if (hasValidPrices) {
        currentVenue.value = parsedVenue;
      } else {
        // Old data format, regenerate
        console.log('Regenerating venue data with prices...');
        currentVenue.value = generateMockVenue();
        saveVenue();
      }
    } else {
      currentVenue.value = generateMockVenue();
      saveVenue();
    }
  };

  const saveVenue = () => {
    if (currentVenue.value) {
      localStorage.setItem('venue_data', JSON.stringify(currentVenue.value));
    }
  };

  const updateSeatStatus = (seatId: string, status: Venue['seats'][0]['status']) => {
    if (!currentVenue.value) return;
    const seat = currentVenue.value.seats.find(s => s.id === seatId);
    if (seat) {
      // Prevent changing booked seats
      if (seat.status === 'booked') return;
      
      seat.status = status;
      saveVenue();
    }
  };

  return {
    currentVenue,
    loadVenue,
    saveVenue,
    updateSeatStatus
  };
});
