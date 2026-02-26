import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { type Venue, generateMockVenue, getVenueById } from '../../services/mockData';

export const useVenueStore = defineStore('venue', () => {
  const currentVenue = ref<Venue | null>(null);
  const venuesList = ref<Venue[]>([]);
  const isLoading = ref(false);
  const errorMsg = ref<string | null>(null);
  const currentVenueId = ref<string | null>(null);

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
      currentVenueId.value = data?.id ?? null; // Update currentVenueId when loading from JSON
    } catch (error) {
      console.error('Error loading venue from JSON:', error);
      // Fallback to mock data
      currentVenue.value = generateMockVenue();
      currentVenueId.value = currentVenue.value?.id ?? null; // Update currentVenueId for mock data
    }
  };

  async function loadVenues() {
    try {
        isLoading.value = true;
        errorMsg.value = null; // Clear previous errors
        const response = await axios.get('/api/venues');
        venuesList.value = response.data;
        
        // Auto load first venue if current is empty
        if (!currentVenue.value && venuesList.value.length > 0) {
             await loadVenue(venuesList.value[0].id);
        }
    } catch (error) {
        console.error('Failed to load venues list', error);
        errorMsg.value = 'Failed to load venues list';
    } finally {
        isLoading.value = false;
    }
  }

  async function loadVenue(venueId: string) {
    try {
        isLoading.value = true;
        errorMsg.value = null; // Clear previous errors
        currentVenueId.value = venueId;
        
        const response = await axios.get(`/api/venues/${venueId}`);
        const venueData = response.data;

        // Transform if needed, but Controller should send correct format
        currentVenue.value = venueData;

        // Load saved seats from local storage if any (retained from original loadVenue logic)
        if (currentVenue.value) {
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


    } catch (error) {
        console.error(`Failed to load venue ${venueId}`, error);
        errorMsg.value = `Failed to load venue ${venueId}`;
    } finally {
        isLoading.value = false;
    }
  }


  const updateSeatStatus = async (seatId: string, status: Venue['seats'][0]['status']) => {
    if (!currentVenue.value) return;
    
    const seat = currentVenue.value.seats.find(s => s.id === seatId);
    if (seat) {
      seat.status = status;
    }
  };

  async function createVenue(data: { name: string, width: number, height: number }) {
      try {
          await axios.get('/sanctum/csrf-cookie');
          const response = await axios.post('/api/venues', data);
          await loadVenues(); // Refresh list
          return response.data;
      } catch (error) {
          console.error('Failed to create venue', error);
          throw error;
      }
  }

  async function saveVenue() {
    if (!currentVenue.value || !currentVenueId.value) return;
    
    try {
      isLoading.value = true;

      // Ensure CSRF token is fresh before saving
      await axios.get('/sanctum/csrf-cookie');

      // Ensure we send the correct structure expected by the backend
      const venueData = {
        ...currentVenue.value,
      };
      
      await axios.put(`/api/venues/${currentVenueId.value}`, venueData);
      
      console.log('Venue saved successfully');
    } catch (error) {
      console.error('Failed to save venue', error);
      errorMsg.value = 'Failed to save venue';
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteVenue(id: string) {
      try {
          await axios.delete(`/api/venues/${id}`);
          await loadVenues(); // Refresh list
          if (currentVenueId.value === id) {
              currentVenueId.value = null;
              currentVenue.value = null;
          }
      } catch (error) {
          console.error('Failed to delete venue', error);
          throw error;
      }
  }

  return {
    currentVenue,
    venuesList,
    isLoading,
    errorMsg,
    currentVenueId,
    loadVenue,
    loadVenues,
    loadVenueFromJSON,
    updateSeatStatus,
    createVenue,
    saveVenue,
    deleteVenue
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
