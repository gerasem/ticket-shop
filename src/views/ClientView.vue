<script setup lang="ts">
import { onMounted } from 'vue';
import { useVenueStore } from '../stores/venue';
import { useCartStore } from '../stores/cart';
import { usePrice } from '../composables/usePrice';
import VenueGrid from '../components/VenueGrid.vue';

const venueStore = useVenueStore();
const cartStore = useCartStore();
const { formatPrice } = usePrice();

onMounted(() => {
  venueStore.loadVenue();
});

const handleSeatClick = (seatId: string) => {
  if (!venueStore.currentVenue) return;
  const seat = venueStore.currentVenue.seats.find(s => s.id === seatId);
  if (!seat || seat.status === 'booked') return;

  if (seat.status === 'readyToBook') {
    // Deselect
    venueStore.updateSeatStatus(seatId, 'free');
    cartStore.removeSeat(seatId);
  } else {
    // Select
    venueStore.updateSeatStatus(seatId, 'readyToBook');
    cartStore.addSeat(seat);
  }
};

// Remove a single seat from cart
const removeSeat = (seatId: string) => {
  venueStore.updateSeatStatus(seatId, 'free');
  cartStore.removeSeat(seatId);
};

// Clear all seats from cart
const clearCart = () => {
  // Update all selected seats to free
  cartStore.selectedSeats.forEach(seat => {
    venueStore.updateSeatStatus(seat.id, 'free');
  });
  // Clear cart
  cartStore.clearCart();
};

const getSeatType = (seat: any) => {
  return venueStore.currentVenue?.seatTypes.find(t => t.id === seat.typeId);
};

const getSeatTypeClass = (seat: any) => {
  const type = getSeatType(seat);
  return `type-${type?.id || 'unknown'}`;
};


</script>

<template>
  <div class="client-view">
    <div class="header-section">
      <h1>Select Your Seats</h1>
      
      <!-- Compact Price Legend -->
      <div class="price-legend-compact">
        <div class="legend-items">
          <div class="legend-item" v-for="type in venueStore.currentVenue?.seatTypes" :key="type.id">
            <div class="legend-color" :class="`type-${type.id}`"></div>
            <span>{{ type.name }}: {{ formatPrice(type.priceInCents) }}</span>
          </div>
          <div class="legend-separator"></div>
          <div class="legend-item">
            <div class="legend-color booked"></div>
            <span>Booked</span>
          </div>
          <div class="legend-item">
            <div class="legend-color selected"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="venueStore.currentVenue" class="main-container">
      <!-- Left: Venue -->
      <VenueGrid :venue="venueStore.currentVenue">
        <template #seat="{ seat }">
          <div
            class="seat"
            :class="[seat.status, getSeatTypeClass(seat)]"
            :style="{ left: seat.x + 'px', top: seat.y + 'px' }"
            @click="handleSeatClick(seat.id)"
          >
            <span class="seat-number-display">{{ seat.place }}</span>
            <span class="seat-tooltip">
              <span class="row-number">Row {{ seat.row }}</span>
              <span class="seat-separator">·</span>
              <span class="seat-number">Seat {{ seat.place }}</span>
              <br>
              <span class="price-info">{{ formatPrice(getSeatType(seat)?.priceInCents || 0) }}</span>
            </span>
          </div>
        </template>
      </VenueGrid>

      <!-- Right: Shopping Cart -->
      <aside class="shopping-cart">
        <div class="cart-header">
          <h3>Your Cart</h3>
          <button 
            v-if="cartStore.selectedSeats.length > 0"
            class="clear-cart-btn" 
            @click="clearCart"
            title="Clear all selections"
          >
            Clear
          </button>
        </div>
        <div v-if="cartStore.selectedSeats.length === 0" class="empty-cart">
          No seats selected
        </div>
        <div v-else class="cart-items">
          <div 
            v-for="seat in cartStore.selectedSeats" 
            :key="seat.id"
            class="cart-item"
          >
            <div class="cart-seat-info">
              <span class="cart-seat-label">Row {{ seat.row }}, Seat {{ seat.place }}</span>
            </div>
            <div class="cart-item-right">
              <span class="cart-seat-price">{{ formatPrice(getSeatType(seat)?.priceInCents || 0) }}</span>
              <button 
                class="remove-seat-btn" 
                @click="removeSeat(seat.id)"
                title="Remove seat"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <div class="cart-total">
          <strong>Total:</strong>
          <strong class="total-price">{{ formatPrice(cartStore.totalPriceInCents) }}</strong>
        </div>
      </aside>
    </div>
    
    <p v-else>Loading venue...</p>
  </div>
</template>

<style scoped>

.client-view {
  padding: 2rem;
  background: var(--color-bg-primary);
  min-height: 100vh;
  color: white;
}

/* Header Section with Title and Legend */
.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

/* Compact Horizontal Price Legend */
.price-legend-compact {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.price-legend-compact .legend-items {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: var(--color-bg-panel);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.price-legend-compact .legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-legend-compact .legend-color {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-separator {
  width: 1px;
  height: 20px;
  background: var(--color-border-medium);
  margin: 0 0.25rem;
}

.legend-color.booked {
  background: var(--color-danger); /* Red for booked */
}

.legend-color.selected {
  background: var(--color-accent); /* Green for selected - accent color */
}



.main-container {
  display: flex;
  gap: 2rem;
  width: 100%;
  margin: 0 auto;
}

















.seats-grid {
  position: relative;
  flex: 1;
  height: 600px;
}



/* Type-based colors for FREE seats */
.seat.free.type-standard {
  background: var(--color-seat-standard); /* Gray - default */
}

.seat.free.type-premium {
  background: var(--color-seat-premium); /* Blue */
}

.seat.free.type-vip {
  background: var(--color-seat-vip); /* Gold */
}

/* Legend colors matching seat types */
.legend-color.type-standard {
  background: var(--color-seat-standard);
}

.legend-color.type-premium {
  background: var(--color-seat-premium);
}

.legend-color.type-vip {
  background: var(--color-seat-vip);
}

/* Booked seats - red */
.seat.booked {
  background: #ef4444 !important;
  cursor: not-allowed;
}

/* Selected seats - green accent */
.seat.readyToBook {
  background: #42b983 !important;
  box-shadow: 0 0 15px var(--color-accent);
}

/* Seat number display inside seat */
.seat-number-display {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}


.seat-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 8px 12px;
  background: var(--color-bg-tooltip);
  border-radius: 6px;
  white-space: nowrap;
  font-size: 12px;
  z-index: 1000;
  pointer-events: none;
  box-shadow: var(--shadow-tooltip);
  border: 1px solid var(--color-border-light);
}

.seat:hover .seat-tooltip {
  display: block;
}

.row-number {
  color: var(--color-accent);
  font-weight: bold;
}

.seat-separator {
  margin: 0 6px;
  color: var(--color-text-muted);
}

.seat-number {
  color: var(--color-text-white);
}

.price-info {
  color: var(--color-seat-price);
  font-weight: bold;
  font-size: 13px;
}

/* Shopping Cart */
.shopping-cart {
  width: 250px;
  background: var(--color-bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.shopping-cart h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-accent);
}

.clear-cart-btn {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-tertiary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;
}

.clear-cart-btn:hover {
  background: var(--color-danger-light);
  border-color: var(--color-danger-strong);
  color: var(--color-danger);
}

.empty-cart {
  color: var(--color-text-tertiary);
  font-style: italic;
  text-align: center;
  padding: 2rem 0;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--color-bg-panel);
  border-radius: 6px;
  font-size: 0.9rem;
  gap: 0.5rem;
}

.cart-seat-info {
  flex: 1;
}

.cart-seat-label {
  color: var(--color-accent);
  font-weight: 500;
  display: block;
}

.cart-item-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cart-seat-price {
  color: var(--color-seat-price);
}

.remove-seat-btn {
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.remove-seat-btn:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.cart-total {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 2px solid var(--color-border-light);
  font-size: 1.1rem;
}

.total-price {
  color: var(--color-accent);
  font-size: 1.3rem;
}
</style>
