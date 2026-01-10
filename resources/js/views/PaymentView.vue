<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { usePrice } from '../composables/usePrice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const router = useRouter();
const cartStore = useCartStore();
const { formatPrice } = usePrice();

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
    // If no reservation found, redirect back
    alert('No active reservation found.');
    router.push('/');
    return;
  }

  const updateTimer = () => {
    const now = new Date().getTime();
    const distance = new Date(expiresAt).getTime() - now;

    if (distance < 0) {
      if (timerInterval) clearInterval(timerInterval);
      timeLeft.value = '00:00';
      alert('Reservation expired!');
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
  
  alert('Payment Successful! Tickets sent to email.');
  cartStore.clearCart();
  router.push('/');
  isProcessing.value = false;
};
</script>

<template>
  <div class="payment-view container mx-auto p-6 max-w-4xl">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left: Payment Form -->
      <div class="md:col-span-2 space-y-6">
        <h1 class="text-3xl font-bold mb-6">Checkout</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Enter your payment information to complete the purchase.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2 col-span-2">
                <Label for="name">Full Name</Label>
                <Input id="name" v-model="form.name" placeholder="John Doe" required />
              </div>
              <div class="space-y-2 col-span-2">
                <Label for="email">Email Address</Label>
                <Input id="email" type="email" v-model="form.email" placeholder="john@example.com" required />
              </div>
              <div class="space-y-2 col-span-2">
                <Label for="card">Card Number</Label>
                <Input id="card" v-model="form.cardNumber" placeholder="0000 0000 0000 0000" />
              </div>
              <div class="space-y-2">
                <Label for="expiry">Expiry Date</Label>
                <Input id="expiry" v-model="form.expiry" placeholder="MM/YY" />
              </div>
              <div class="space-y-2">
                <Label for="cvv">CVV</Label>
                <Input id="cvv" v-model="form.cvv" placeholder="123" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button class="w-full" size="lg" @click="handlePayment" :disabled="isProcessing">
              {{ isProcessing ? 'Processing...' : `Pay ${formatPrice(cartStore.totalPriceInCents)}` }}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <!-- Right: Summary & Timer -->
      <div class="space-y-6">
        <!-- Timer Card -->
        <Card class="bg-primary/5 border-primary/20">
          <CardHeader class="pb-2">
            <CardTitle class="text-lg font-medium text-primary">Time Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-4xl font-mono font-bold text-primary">{{ timeLeft }}</div>
            <p class="text-sm text-muted-foreground mt-2">Your tickets are reserved for 15 minutes.</p>
          </CardContent>
        </Card>

        <!-- Order Summary -->
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="seat in cartStore.selectedSeats" :key="seat.id" class="flex justify-between text-sm">
                <span>Row {{ seat.row }}, Seat {{ seat.place }}</span>
                <!-- Assuming we have type info in cart or can fetch. For now just price -->
                <!-- Ideally cartStore should populate this fully -->
                <span class="font-medium">Ticket</span> 
              </div>
              <div class="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{{ formatPrice(cartStore.totalPriceInCents) }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional specific styles if needed */
</style>
