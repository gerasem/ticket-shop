<script setup lang="ts">
import { onMounted } from 'vue';
import { useVenueStore } from '../stores/venue';
import { useCartStore } from '../stores/cart';
import { usePrice } from '../composables/usePrice';

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

const getPriceClass = (priceInCents: number) => {
  if (priceInCents === 1500) return 'price-front';
  if (priceInCents === 1800) return 'price-back';
  return 'price-middle';
};

const getRows = () => {
  if (!venueStore.currentVenue) return [];
  const rows = new Set<number>();
  venueStore.currentVenue.seats.forEach(seat => {
    const parts = seat.label.split('-');
    if (parts[0]) {
      const row = parseInt(parts[0]);
      rows.add(row);
    }
  });
  return Array.from(rows).sort((a, b) => a - b);
};

const getRowY = (row: number) => {
  if (!venueStore.currentVenue) return 0;
  const seat = venueStore.currentVenue.seats.find(s => s.label.startsWith(`${row}-`));
  return seat ? seat.y : 0;
};

const getColumns = () => {
  if (!venueStore.currentVenue) return [];
  const cols = new Set<number>();
  venueStore.currentVenue.seats.forEach(seat => {
    const parts = seat.label.split('-');
    if (parts[1]) {
      const col = parseInt(parts[1]);
      cols.add(col);
    }
  });
  return Array.from(cols).sort((a, b) => a - b);
};

const getColX = (col: number) => {
  if (!venueStore.currentVenue) return 0;
  const seat = venueStore.currentVenue.seats.find(s => s.label.endsWith(`-${col}`));
  return seat ? seat.x : 0;
};
</script>

<template>
  <div class="client-view">
    <h1>Select Your Seats</h1>
    
    <div v-if="venueStore.currentVenue" class="main-container">
      <!-- Left: Price Legend -->
      <aside class="price-legend">
        <h3>Price Legend</h3>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color price-front"></div>
            <span>Front Rows (1-2): {{ formatPrice(1500) }}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color price-middle"></div>
            <span>Middle Rows (3-8): {{ formatPrice(1200) }}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color price-back"></div>
            <span>Back Rows (9-10): {{ formatPrice(1800) }}</span>
          </div>
          <div class="legend-item">
            <div class="legend-color booked"></div>
            <span>Booked</span>
          </div>
          <div class="legend-item">
            <div class="legend-color selected"></div>
            <span>Your Selection</span>
          </div>
        </div>
      </aside>

      <!-- Center: Venue -->
      <div class="venue-container">
        <h2>{{ venueStore.currentVenue.name }}</h2>
        <div class="stage">SCREEN / STAGE</div>
        
        <!-- Top column labels -->
        <div class="column-labels-container">
          <div class="column-spacer"></div>
          <div class="column-labels">
            <div 
              v-for="col in getColumns()" 
              :key="'top-' + col"
              class="column-label"
              :style="{ left: getColX(col) + 'px' }"
            >
              {{ col }}
            </div>
          </div>
        </div>

        <div class="seating-area">
          <!-- Left row labels -->
          <div class="row-labels row-labels-left">
            <div 
              v-for="row in getRows()" 
              :key="'left-' + row"
              class="row-label"
              :style="{ top: getRowY(row) + 'px' }"
            >
              {{ row }}
            </div>
          </div>

          <!-- Seats grid -->
          <div class="seats-grid">
            <div
              v-for="seat in venueStore.currentVenue.seats"
              :key="seat.id"
              class="seat"
              :class="[seat.status, getPriceClass(seat.priceInCents)]"
              :style="{ left: seat.x + 'px', top: seat.y + 'px' }"
              @click="handleSeatClick(seat.id)"
            >
              <span class="seat-tooltip">
                <span class="row-number">Row {{ seat.label.split('-')[0] }}</span>
                <span class="seat-separator">·</span>
                <span class="seat-number">Seat {{ seat.label.split('-')[1] }}</span>
                <br>
                <span class="price-info">{{ formatPrice(seat.priceInCents) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Shopping Cart -->
      <aside class="shopping-cart">
        <h3>Your Cart</h3>
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
              <span class="cart-seat-label">Row {{ seat.label.split('-')[0] }}, Seat {{ seat.label.split('-')[1] }}</span>
            </div>
            <span class="cart-seat-price">{{ formatPrice(seat.priceInCents) }}</span>
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
  background: #1a1a1a;
  min-height: 100vh;
  color: white;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.main-container {
  display: flex;
  gap: 2rem;
  width: 100%;
  margin: 0 auto;
}

/* Price Legend */
.price-legend {
  width: 200px;
  background: #2a2a2a;
  padding: 1.5rem;
  border-radius: 12px;
  height: fit-content;
}

.price-legend h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #42b983;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
}

.legend-color.price-front {
  background: #3498db; /* Blue for front rows */
}

.legend-color.price-middle {
  background: #9b59b6; /* Purple for middle rows */
}

.legend-color.price-back {
  background: #f39c12; /* Orange/Gold for back rows */
}

.legend-color.booked {
  background: #e74c3c; /* Red for booked */
}

.legend-color.selected {
  background: #42b983; /* Green for selected */
}

/* Venue Container */
.venue-container {
  flex: 1;
  background: #222;
  border-radius: 12px;
  padding: 1.5rem;
  overflow: auto;
}

.venue-container h2 {
  text-align: center;
  margin: 0 0 1rem 0;
}

.stage {
  width: 80%;
  height: 30px;
  background: #555;
  margin: 10px auto;
  text-align: center;
  line-height: 30px;
  border-radius: 0 0 20px 20px;
}

.column-labels-container {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.column-spacer {
  width: 40px;
  flex-shrink: 0;
}

.column-labels {
  position: relative;
  flex: 1;
  height: 30px;
}

.column-label {
  position: absolute;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  color: #888;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.seating-area {
  position: relative;
  display: flex;
  gap: 20px;
  padding: 20px 0;
}

.row-labels {
  position: relative;
  width: 40px;
  flex-shrink: 0;
}

.row-label {
  position: absolute;
  width: 40px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  color: #888;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.row-labels-left {
  text-align: right;
}

.seats-grid {
  position: relative;
  flex: 1;
  height: 600px;
}

.seat {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  overflow: visible;
  border: 2px solid transparent;
}

/* Price-based colors for FREE seats */
.seat.free.price-front {
  background: #3498db;
}

.seat.free.price-middle {
  background: #9b59b6;
}

.seat.free.price-back {
  background: #f39c12;
}

/* Booked seats - always red */
.seat.booked {
  background: #e74c3c !important;
  cursor: not-allowed;
}

/* Selected seats - always green */
.seat.readyToBook {
  background: #42b983 !important;
  box-shadow: 0 0 15px #42b983;
}

.seat:hover:not(.booked) {
  transform: scale(1.15);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
}

.seat-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.95);
  border-radius: 6px;
  white-space: nowrap;
  font-size: 12px;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.seat:hover .seat-tooltip {
  display: block;
}

.row-number {
  color: #42b983;
  font-weight: bold;
}

.seat-separator {
  margin: 0 6px;
  color: #666;
}

.seat-number {
  color: #fff;
}

.price-info {
  color: #f39c12;
  font-weight: bold;
  font-size: 13px;
}

/* Shopping Cart */
.shopping-cart {
  width: 250px;
  background: #2a2a2a;
  padding: 1.5rem;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.shopping-cart h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #42b983;
}

.empty-cart {
  color: #888;
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.9rem;
  gap: 0.5rem;
}

.cart-seat-info {
  flex: 1;
}

.cart-seat-label {
  color: #42b983;
  font-weight: 500;
  display: block;
}

.cart-seat-price {
  color: #f39c12;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  font-size: 1.1rem;
}

.total-price {
  color: #42b983;
  font-size: 1.3rem;
}
</style>
