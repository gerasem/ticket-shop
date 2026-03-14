import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { reservationsApi } from '../services/api/reservationsApi';
import { useVenueStore } from './venue';
import type { Seat } from '../types/venue';

export const useCartStore = defineStore('cart', () => {
  const selectedSeats = ref<Seat[]>([]);
  const reservationToken = ref<string | null>(null);
  const reservationExpiresAt = ref<Date | null>(null);
  const currentContextId = ref<string>('default');
  const venueStore = useVenueStore();

  const totalPriceInCents = computed(() =>
    selectedSeats.value.reduce((sum, seat) => {
      const seatType = venueStore.currentVenue?.seatTypes.find(t => t.id === seat.typeId);
      return sum + (seatType?.priceInCents || 0);
    }, 0)
  );

  const addSeat = (seat: Seat) => {
    if (!selectedSeats.value.find(s => s.id === seat.id)) {
      selectedSeats.value.push(seat);
    }
  };

  const removeSeat = (seatId: string) => {
    selectedSeats.value = selectedSeats.value.filter(s => s.id !== seatId);
  };

  const reserveSeats = async (): Promise<boolean> => {
    try {
      if (!venueStore.currentVenue) throw new Error('No venue loaded');
      const result = await reservationsApi.reserve(
        selectedSeats.value.map(s => s.id),
        venueStore.currentVenue.id
      );
      reservationToken.value = result.reservation_token;
      reservationExpiresAt.value = new Date(result.expires_at);
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
    saveCart();
  };

  const setContext = (contextId: string) => {
    if (currentContextId.value !== contextId) {
      currentContextId.value = contextId;
      loadCart();
    }
  };

  const loadCart = () => {
    const key = `cart_seats_${currentContextId.value}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      if (Array.isArray(data)) {
        selectedSeats.value = data;
      } else {
        selectedSeats.value = data.seats || [];
        reservationToken.value = data.token || null;
        reservationExpiresAt.value = data.expires ? new Date(data.expires) : null;
      }
    } catch {
      console.error('Failed to parse cart from sessionStorage');
    }
  };

  const saveCart = () => {
    const key = `cart_seats_${currentContextId.value}`;
    sessionStorage.setItem(key, JSON.stringify({
      seats: selectedSeats.value,
      token: reservationToken.value,
      expires: reservationExpiresAt.value,
    }));
  };

  watch(selectedSeats, () => saveCart(), { deep: true });
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
    setContext,
  };
});
