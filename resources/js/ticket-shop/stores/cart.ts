import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { type Seat } from '../services/mockData';
import { useVenueStore } from './venue';

export const useCartStore = defineStore('cart', () => {
  const selectedSeats = ref<Seat[]>([]);
  const reservationToken = ref<string | null>(null);
  const reservationExpiresAt = ref<Date | null>(null);
  const currentContextId = ref<string>('default'); // e.g. "event-1" or "venue-123"
  const venueStore = useVenueStore();

  const totalPriceInCents = computed(() => {
    return selectedSeats.value.reduce((sum, seat) => {
      const seatType = venueStore.currentVenue?.seatTypes.find(t => t.id === seat.typeId);
      return sum + (seatType?.priceInCents || 0);
    }, 0);
  });

  const addSeat = (seat: Seat) => {
    if (!selectedSeats.value.find(s => s.id === seat.id)) {
      selectedSeats.value.push(seat);
    }
  };

  const removeSeat = (seatId: string) => {
    selectedSeats.value = selectedSeats.value.filter(s => s.id !== seatId);
  };
  
  const reserveSeats = async () => {
    try {
      if (!venueStore.currentVenue) throw new Error("No venue loaded");
      
      const seatIds = selectedSeats.value.map(s => s.id);
      const response = await axios.post('/api/reservations', { 
          seat_ids: seatIds,
          venue_id: venueStore.currentVenue.id 
      });
      
      reservationToken.value = response.data.reservation_token;
      reservationExpiresAt.value = new Date(response.data.expires_at);
      
      return true;
    } catch (error) {
      console.error('Reservation failed:', error);
      return false;
    }
  };

  const clearCart = () => {
    selectedSeats.value = [];
    reservationToken.value = null;
    reservationExpiresAt.value = null;
    saveCart(); // Sync clearing
  };
  
  const setContext = (contextId: string) => {
    if (currentContextId.value !== contextId) {
       currentContextId.value = contextId;
       loadCart(); // Reload based on new context
    }
  };

  // Persistence
  const loadCart = () => {
    const key = `cart_seats_${currentContextId.value}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
           // migrated from old format
           selectedSeats.value = data;
        } else {
           selectedSeats.value = data.seats || [];
           reservationToken.value = data.token || null;
           reservationExpiresAt.value = data.expires ? new Date(data.expires) : null;
        }
      } catch (e) {
        console.error('Failed to parse cart from LS', e);
      }
    }
  };

  const saveCart = () => {
    const key = `cart_seats_${currentContextId.value}`;
    sessionStorage.setItem(key, JSON.stringify({
      seats: selectedSeats.value,
      token: reservationToken.value,
      expires: reservationExpiresAt.value
    }));
  };

  // Watch for changes
  watch(selectedSeats, () => {
    saveCart();
  }, { deep: true });

  // Initialize
  loadCart();

  return {
    selectedSeats,
    totalPriceInCents,
    addSeat,
    removeSeat,
    clearCart,
    reserveSeats,
    reservationToken,
    reservationExpiresAt,
    setContext
  };
});
