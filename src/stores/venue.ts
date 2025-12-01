import { defineStore } from 'pinia';
import { ref } from 'vue';
import { type Venue, generateMockVenue } from '../services/mockData';

export const useVenueStore = defineStore('venue', () => {
  const currentVenue = ref<Venue | null>(null);

  const loadVenue = async () => {
    // Default: load from default JSON or generate mock
    await loadVenueFromJSON('default-venue.json');
  };

  const loadVenueFromJSON = async (filename: string) => {
    try {
      const response = await fetch(`/venues/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load venue: ${response.statusText}`);
      }
      const data = await response.json();
      
      // If seats array is empty, generate them (for template files)
      if (!data.seats || data.seats.length === 0) {
        data.seats = generateSeatsForVenue(data);
      }
      
      currentVenue.value = data;
    } catch (error) {
      console.error('Error loading venue from JSON:', error);
      // Fallback to mock data
      currentVenue.value = generateMockVenue();
    }
  };

  const exportVenueAsJSON = (): string => {
    if (!currentVenue.value) return '';
    return JSON.stringify(currentVenue.value, null, 2);
  };

  const copyVenueJSON = async () => {
    const json = exportVenueAsJSON();
    try {
      await navigator.clipboard.writeText(json);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  const updateSeatStatus = async (seatId: string, status: Venue['seats'][0]['status']) => {
    if (!currentVenue.value) return;
    
    const seat = currentVenue.value.seats.find(s => s.id === seatId);
    if (seat) {
      seat.status = status;
    }
  };

  return {
    currentVenue,
    loadVenue,
    loadVenueFromJSON,
    exportVenueAsJSON,
    copyVenueJSON,
    updateSeatStatus
  };
});

// Helper function to generate seats for a venue template
function generateSeatsForVenue(venue: Partial<Venue>) {
  const seats = [];
  const rows = 10;
  const cols = 15;
  const seatSize = venue.defaultSeatStyle?.width || 30;
  const gap = 10;

  for (let r = 0; r < rows; r++) {
    let typeId: string;
    if (r < 2) {
      typeId = 'premium';
    } else if (r >= rows - 2) {
      typeId = 'vip';
    } else {
      typeId = 'standard';
    }

    for (let c = 0; c < cols; c++) {
      seats.push({
        id: `r${r}-c${c}`,
        x: c * (seatSize + gap) + 50,
        y: r * (seatSize + gap) + 130,
        status: Math.random() > 0.8 ? 'booked' : 'free',
        label: `${r + 1}-${c + 1}`,
        typeId: typeId
      });
    }
  }

  return seats;
}
