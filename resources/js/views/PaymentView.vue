<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import BaseButton from '../components/BaseButton.vue';
import { usePrice } from '../composables/usePrice';
import { useToast } from 'vue-toastification';

const router = useRouter();
const cartStore = useCartStore();
const { formatPrice } = usePrice();
const toast = useToast();

// Formatting countdown
const timeLeft = ref('15:00');
let timerInterval: number | null = null;

const form = ref({
  name: '',
  email: '',
  cardNumber: '',
  expiry: '',
  cvv: ''
});

const isProcessing = ref(false);

const startTimer = () => {
  const expiresAt = cartStore.reservationExpiresAt;
  if (!expiresAt) {
    toast.warning('No active reservation found.');
    router.push('/');
    return;
  }

  const updateTimer = () => {
    const now = new Date().getTime();
    const distance = new Date(expiresAt).getTime() - now;

    if (distance < 0) {
      if (timerInterval) clearInterval(timerInterval);
      timeLeft.value = '00:00';
      toast.error('Reservation expired!');
      cartStore.clearCart();
      router.push('/booking'); 
      return;
    }

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    timeLeft.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  updateTimer(); // Run once immediately
  timerInterval = window.setInterval(updateTimer, 1000);
};

onMounted(() => {
  if (cartStore.selectedSeats.length === 0) {
    router.push('/booking');
    return;
  }
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const handlePayment = async () => {
  isProcessing.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  toast.success('Payment Successful! Tickets will be sent to your email.');
  cartStore.clearCart();
  router.push('/');
  isProcessing.value = false;
};
</script>

<template>
  <div class="container section">
    <div class="columns is-desktop is-centered">
      <div class="column is-8">
        <h1 class="title is-2 mb-6">Checkout</h1>
        
        <div class="columns is-variable is-5">
          <!-- Left: Payment Form -->
          <div class="column is-7">
            <div class="box">
              <h3 class="title is-4 mb-2">Payment Details</h3>
              <p class="subtitle is-6 has-text-grey mb-5">Enter your payment information to complete the purchase.</p>
              
              <div class="field">
                <label class="label" for="name">Full Name</label>
                <div class="control">
                  <input id="name" v-model="form.name" class="input" type="text" placeholder="John Doe" required />
                </div>
              </div>
              
              <div class="field">
                <label class="label" for="email">Email Address</label>
                <div class="control">
                  <input id="email" v-model="form.email" class="input" type="email" placeholder="john@example.com" required />
                </div>
              </div>
              
              <div class="field">
                <label class="label" for="card">Card Number</label>
                <div class="control">
                  <input id="card" v-model="form.cardNumber" class="input" type="text" placeholder="0000 0000 0000 0000" />
                </div>
              </div>
              
              <div class="columns">
                <div class="column">
                  <div class="field">
                    <label class="label" for="expiry">Expiry Date</label>
                    <div class="control">
                      <input id="expiry" v-model="form.expiry" class="input" type="text" placeholder="MM/YY" />
                    </div>
                  </div>
                </div>
                <div class="column">
                  <div class="field">
                    <label class="label" for="cvv">CVV</label>
                    <div class="control">
                      <input id="cvv" v-model="form.cvv" class="input" type="text" placeholder="123" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-5">
                <BaseButton 
                  variant="primary" 
                  fullwidth 
                  size="medium" 
                  :loading="isProcessing" 
                  @click="handlePayment"
                >
                  Pay {{ formatPrice(cartStore.totalPriceInCents) }}
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- Right: Summary & Timer -->
          <div class="column is-5">
            <div class="box has-background-primary-light mb-5">
              <h4 class="title is-5 has-text-primary mb-2">Time Remaining</h4>
              <div class="is-size-2 has-text-weight-bold has-text-primary font-mono">{{ timeLeft }}</div>
              <p class="is-size-7 has-text-grey mt-2">Your tickets are reserved for 15 minutes.</p>
            </div>

            <div class="box">
              <h4 class="title is-5 mb-4">Order Summary</h4>
              
              <div class="content">
                <div v-for="seat in cartStore.selectedSeats" :key="seat.id" class="is-flex is-justify-content-space-between mb-2 is-size-6">
                  <span>Row {{ seat.row }}, Seat {{ seat.place }}</span>
                  <span class="has-text-weight-medium">Ticket</span> 
                </div>
                
                <hr class="my-4">
                
                <div class="is-flex is-justify-content-space-between has-text-weight-bold is-size-5">
                  <span>Total</span>
                  <span>{{ formatPrice(cartStore.totalPriceInCents) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.font-mono {
  font-family: monospace;
}
</style>
