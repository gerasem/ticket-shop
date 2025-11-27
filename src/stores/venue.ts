import { defineStore } from 'pinia';
import { ref } from 'vue';
import { type Venue, generateMockVenue } from '../services/mockData';

export const useVenueStore = defineStore('venue', () => {
  const currentVenue = ref<Venue | null>(null);

  const loadVenue = async () => {
    try {
      const response = await fetch('/api/venue');
      if (!response.ok) throw new Error('Failed to fetch venue');
      const data = await response.json();
      currentVenue.value = data;
    } catch (error) {
      console.error('Error loading venue:', error);
    }
  };

  // Removed saveVenue as we now save to DB via API

  const updateSeatStatus = async (seatId: string, status: Venue['seats'][0]['status']) => {
    if (!currentVenue.value) return;
    
    // Optimistic update
    const seat = currentVenue.value.seats.find(s => s.id === seatId);
    if (seat) {
      const originalStatus = seat.status;
      seat.status = status;

      try {
        const response = await fetch(`/api/venue/seat/${seatId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          // Revert on failure
          seat.status = originalStatus;
          console.error('Failed to update seat status');
        }
      } catch (error) {
        seat.status = originalStatus;
        console.error('Error updating seat:', error);
      }
    }
  };

  return {
    currentVenue,
    loadVenue,
    updateSeatStatus
  };
});
