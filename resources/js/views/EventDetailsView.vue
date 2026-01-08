<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();
const eventId = route.params.id as string;

onMounted(async () => {
  if (eventsStore.events.length === 0) {
    await eventsStore.loadEvents();
  }
});

const event = computed(() => {
  return eventsStore.events.find(e => e.id === parseInt(eventId));
});

const goBack = () => {
  router.push('/');
};

const goToSeatSelection = () => {
  if (event.value?.venue_id) {
    router.push({ path: '/client', query: { venueId: event.value.venue_id } });
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<template>
  <div class="event-details">
    <div class="container">
      <Button variant="secondary-outline" @click="goBack" class="mb-6">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Events
      </Button>

      <div v-if="eventsStore.isLoading" class="text-center py-12 text-gray-600">
        Loading...
      </div>

      <div v-else-if="event" class="content-wrapper">
        <div class="image-section">
          <img 
            :src="event.image ? `/storage/${event.image}` : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'" 
            :alt="event.title"
            class="event-image"
          />
        </div>

        <div class="info-section">
          <h1>{{ event.title }}</h1>

          <div class="meta-grid">
            <Card>
              <CardContent class="p-4">
                <div class="meta-item">
                  <svg class="icon text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span class="label">Date</span>
                    <span class="value">{{ formatDate(event.date) }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="p-4">
                <div class="meta-item">
                  <svg class="icon text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span class="label">Time</span>
                    <span class="value">{{ event.time }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card v-if="event.venue">
              <CardContent class="p-4">
                <div class="meta-item">
                  <svg class="icon text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span class="label">Venue</span>
                    <span class="value">{{ event.venue.name }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div class="description-section">
            <h3>About Event</h3>
            <p>{{ event.description }}</p>
          </div>

          <div class="actions">
            <Button variant="primary" @click="goToSeatSelection" class="w-full text-lg py-6">
              Select Seats
            </Button>
          </div>
        </div>
      </div>

      <div v-else class="not-found">
        <svg class="icon-large" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2>Event not found</h2>
        <p>Unfortunately, the requested event does not exist or has been deleted</p>
        <Button variant="primary" @click="goBack" class="mt-4">
          Back to Home
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-details {
  min-height: calc(100vh - 80px);
  background: #f9fafb;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.image-section {
  height: 100%;
  min-height: 500px;
  background: #f3f4f6;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-section {
  padding: 3rem;
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 2rem;
  color: #111827;
  line-height: 1.2;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.text-primary {
  color: rgb(var(--color-primary));
}

.meta-item > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #9ca3af;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.description-section {
  margin-bottom: 2.5rem;
  flex-grow: 1;
}

.description-section h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #111827;
}

.description-section p {
  color: #4b5563;
  line-height: 1.7;
  font-size: 1.0625rem;
}

.actions {
  margin-top: auto;
}

.not-found {
  text-align: center;
  padding: 6rem 2rem;
  max-width: 500px;
  margin: 0 auto;
}

.icon-large {
  width: 80px;
  height: 80px;
  color: #d1d5db;
  margin: 0 auto 1.5rem;
}

.not-found h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.not-found p {
  color: #6b7280;
  font-size: 1.0625rem;
  margin: 0;
}

@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .image-section {
    min-height: 350px;
  }

  .info-section {
    padding: 2rem;
  }

  h1 {
    font-size: 2rem;
  }
}

@media (max-width: 640px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .info-section {
    padding: 1.5rem;
  }
}
</style>
