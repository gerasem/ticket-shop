import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { type Seat } from '../services/mockData';

export const useCartStore = defineStore('cart', () => {
  const selectedSeats = ref<Seat[]>([]);

  const totalPriceInCents = computed(() => {
    return selectedSeats.value.reduce((sum, seat) => sum + seat.priceInCents, 0);
  });

  const addSeat = (seat: Seat) => {
    if (!selectedSeats.value.find(s => s.id === seat.id)) {
      selectedSeats.value.push(seat);
    }
  };

  const removeSeat = (seatId: string) => {
    selectedSeats.value = selectedSeats.value.filter(s => s.id !== seatId);
  };

  const clearCart = () => {
    selectedSeats.value = [];
  };

  // Persistence
  const loadCart = () => {
    const stored = sessionStorage.getItem('cart_seats');
    if (stored) {
      try {
        selectedSeats.value = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse cart from LS', e);
      }
    }
  };

  const saveCart = () => {
    sessionStorage.setItem('cart_seats', JSON.stringify(selectedSeats.value));
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
    clearCart
  };
});
