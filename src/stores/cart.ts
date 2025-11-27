import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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

  return {
    selectedSeats,
    totalPriceInCents,
    addSeat,
    removeSeat,
    clearCart
  };
});
