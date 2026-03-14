<script setup lang="ts">
import BaseButton from '../components/BaseButton.vue';
import { onMounted } from 'vue';
import { useVenueStore } from '../stores/venue';
import { useCartStore } from '../stores/cart';
import { usePrice } from '../composables/usePrice';
import VenueGrid from '../components/VenueGrid.vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import type { Seat } from '../types/venue';

const venueStore = useVenueStore();
const cartStore = useCartStore();
const { formatPrice } = usePrice();
const route = useRoute();
const router = useRouter();
const toast = useToast();

onMounted(() => {
  const venueId = route.query.venueId as string;
  const eventId = route.query.eventId as string;
  
  // Set cart context to isolate carts per event (or venue if no event)
  const contextId = eventId ? `event-${eventId}` : `venue-${venueId}`;
  cartStore.setContext(contextId);
  
  venueStore.loadVenue(venueId);
});

const handleSeatClick = (seatId: string) => {
  if (!venueStore.currentVenue) return;
  const seat = venueStore.currentVenue.seats.find(s => s.id === seatId);
  if (!seat || seat.status === 'booked' || seat.status === 'reserved') return;

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

const handleCheckout = async () => {
  if (cartStore.selectedSeats.length === 0) return;
  
  const success = await cartStore.reserveSeats();
  if (success) {
    router.push('/payment');
  } else {
    toast.error('Some seats are no longer available. Please try again.');
    venueStore.loadVenue(route.query.venueId as string);
  }
};

const getSeatType = (seat: Seat) => {
  return venueStore.currentVenue?.seatTypes.find(t => t.id === seat.typeId);
};

const getSeatStyle = (seat: Seat) => {
  const type = getSeatType(seat);
  const defaultStyle = venueStore.currentVenue?.defaultSeatStyle;
  if (!defaultStyle) return {};
  const merged = { ...defaultStyle, ...type?.style };
  return {
    width: merged.width + 'px',
    height: merged.height + 'px',
    backgroundColor: merged.color,
    borderRadius: merged.borderRadius,
    transform: seat.rotation ? `rotate(${seat.rotation}deg)` : undefined,
  };
};
</script>

<template>
  <div class="client-view">
    <div class="header-section">
      <h1 class="title is-2">Select Your Seats</h1>
      
      <!-- Compact Price Legend -->
      <div class="price-legend-compact">
        <div class="legend-items box py-2 px-4 is-flex is-align-items-center" >
          <div class="legend-item" v-for="type in venueStore.currentVenue?.seatTypes" :key="type.id">
            <div class="legend-color" :style="{ backgroundColor: type.style?.color || venueStore.currentVenue?.defaultSeatStyle?.color }"></div>
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
            :class="[seat.status]"
            :style="{ 
              left: seat.x + 'px', 
              top: seat.y + 'px',
              ...(seat.status === 'free' ? getSeatStyle(seat) : {})
            }"
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
      <aside class="shopping-cart box">
        <div class="cart-header is-flex is-justify-content-space-between is-align-items-center mb-4">
          <h3 class="title is-4 mb-0">Your Cart</h3>
          <div class="buttons is-right are-small">
            <BaseButton 
              v-if="cartStore.selectedSeats.length > 0"
              variant="danger"
              outlined
              size="small" 
              @click="clearCart"
            >
              Clear
            </BaseButton>
            <BaseButton 
              v-if="cartStore.selectedSeats.length > 0"
              variant="primary"
              size="small"
              @click="handleCheckout"
            >
              Checkout
            </BaseButton>
          </div>
        </div>
        <div v-if="cartStore.selectedSeats.length === 0" class="empty-cart has-text-grey is-italic has-text-centered py-6">
          No seats selected
        </div>
        <div v-else class="cart-items">
          <div 
            v-for="seat in cartStore.selectedSeats" 
            :key="seat.id"
            class="cart-item box is-shadowless p-3 mb-2 is-flex is-justify-content-space-between is-align-items-center"
            :style="{ borderLeft: `4px solid ${getSeatType(seat)?.style?.color || 'var(--border-primary)'}`, borderTop: '1px solid var(--border-primary)', borderRight: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }"
          >
            <div class="cart-seat-info">
              <span class="cart-seat-label has-text-weight-semibold">Row {{ seat.row }}, Seat {{ seat.place }}</span>
            </div>
            <div class="cart-item-right is-flex is-align-items-center" style="gap: 0.5rem;">
              <span class="cart-seat-price has-text-primary has-text-weight-semibold">{{ formatPrice(getSeatType(seat)?.priceInCents || 0) }}</span>
              <BaseButton 
                variant="danger"
                outlined
                size="small" 
                class="ml-3" 
                @click="removeSeat(seat.id)"
                title="Remove seat"
              >
                <i class="bi bi-trash"></i>
              </BaseButton>
            </div>
          </div>
        </div>
        <div class="cart-total is-flex is-justify-content-space-between pt-4 mt-2" style="border-top: 2px solid var(--border-primary);">
          <strong class="total-label has-text-grey">Total:</strong>
          <strong class="total-price has-text-primary is-size-4">{{ formatPrice(cartStore.totalPriceInCents) }}</strong>
        </div>
      </aside>
    </div>
    
    <p v-else>Loading venue...</p>
  </div>
</template>

<style scoped lang="scss">

.client-view {
  padding: 2rem;
  background: var(--bg-secondary);
  min-height: 100vh;
  color: var(--text-primary);
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
  font-size: 0.85rem;
  color: var(--text-subtle);
  border: 1px solid var(--border-primary);
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

/* Booked/Reserved seats - red */
.seat.booked,
.seat.reserved {
  background: var(--color-danger) !important;
  cursor: not-allowed;
}

/* Selected seats - green accent */
.seat.readyToBook {
  background: var(--color-seat-selected) !important;
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
  width: 300px;
  height: fit-content;
  position: sticky;
  top: 2rem;
  border: 1px solid var(--border-primary);
}

.cart-items {
  display: flex;
  flex-direction: column;
  max-height: 400px;
  overflow-y: auto;
}

</style>
