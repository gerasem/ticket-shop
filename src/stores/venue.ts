import { defineStore } from 'pinia';
import { ref } from 'vue';
import { type Venue, generateMockVenue, getVenueById } from '../services/mockData';

export const useVenueStore = defineStore('venue', () => {
  const currentVenue = ref<Venue | null>(null);

  const loadVenue = async (venueId?: string) => {
    // In a real app, this would fetch from API
    // For now, we generate mock data
    if (!currentVenue.value || venueId) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use the new getVenueById if an ID is provided, otherwise default
      if (venueId) {
        currentVenue.value = getVenueById(venueId);
      } else {
        // Try to load default from JSON first, fallback to mock
        try {
          await loadVenueFromJSON('default-venue.json');
        } catch (e) {
          currentVenue.value = generateMockVenue();
        }
      }
      
      if (currentVenue.value) {
        // Load saved seats from local storage if any
        const saved = localStorage.getItem(`venue_seats_${currentVenue.value.id}`);
        if (saved) {
          const savedSeats = JSON.parse(saved);
          // Merge saved status
          currentVenue.value.seats = currentVenue.value.seats.map(s => {
            const savedS = savedSeats.find((ss: any) => ss.id === s.id);
            return savedS ? { ...s, status: savedS.status } : s;
          });
        }
      }
    }
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
  let seatCounter = 1;

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
        id: `seat-${seatCounter++}`,
        x: c * (seatSize + gap) + 50,
        y: r * (seatSize + gap) + 130,
        status: Math.random() > 0.8 ? 'booked' : 'free',
        row: r + 1,
        place: c + 1,
        typeId: typeId,
        rotation: 0
      });
    }
  }

  return seats;
}
