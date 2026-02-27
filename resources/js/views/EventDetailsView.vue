<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events';

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
    router.push({ path: '/booking', query: { venueId: event.value.venue_id, eventId: eventId } });
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
  <div class="event-details container section">
    <button class="button is-outlined mb-6" @click="goBack">
      <span class="icon is-small">
        <i class="fas fa-arrow-left"></i>
      </span>
      <span>Back to Events</span>
    </button>

    <div v-if="eventsStore.isLoading" class="has-text-centered py-6 has-text-grey">
      Loading...
    </div>

    <div v-else-if="event" class="box is-paddingless" style="overflow: hidden;">
      <div class="columns is-gapless mb-0">
        <div class="column is-5 image-section" style="min-height: 400px; background: #f3f4f6;">
          <img 
            :src="event.image ? `/storage/${event.image}` : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'" 
            :alt="event.title"
            class="event-image is-fullwidth h-100" style="object-fit:cover; height: 100%;"
          />
        </div>

        <div class="column is-7 is-flex is-flex-direction-column py-6 px-6">
          <h1 class="title is-2 mb-5">{{ event.title }}</h1>

          <div class="columns is-multiline mb-5">
            <div class="column is-half">
              <div class="box is-shadowless" style="border: 1px solid #e5e7eb;">
                <div class="is-flex is-align-items-center" style="gap: 1rem;">
                  <span class="icon is-large has-text-primary">
                    <i class="fas fa-calendar-alt fa-lg"></i>
                  </span>
                  <div>
                    <p class="is-size-7 has-text-grey is-uppercase has-text-weight-bold mb-1">Date</p>
                    <p class="is-size-6 has-text-weight-semibold">{{ formatDate(event.date) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="column is-half">
              <div class="box is-shadowless" style="border: 1px solid #e5e7eb;">
                <div class="is-flex is-align-items-center" style="gap: 1rem;">
                  <span class="icon is-large has-text-primary">
                    <i class="fas fa-clock fa-lg"></i>
                  </span>
                  <div>
                    <p class="is-size-7 has-text-grey is-uppercase has-text-weight-bold mb-1">Time</p>
                    <p class="is-size-6 has-text-weight-semibold">{{ event.time }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="column is-half" v-if="event.venue">
              <div class="box is-shadowless" style="border: 1px solid #e5e7eb;">
                <div class="is-flex is-align-items-center" style="gap: 1rem;">
                  <span class="icon is-large has-text-primary">
                    <i class="fas fa-map-marker-alt fa-lg"></i>
                  </span>
                  <div>
                    <p class="is-size-7 has-text-grey is-uppercase has-text-weight-bold mb-1">Venue</p>
                    <p class="is-size-6 has-text-weight-semibold">{{ event.venue.name }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="description-section mb-6 is-flex-grow-1">
            <h3 class="title is-4 mb-3">About Event</h3>
            <p class="has-text-grey-dark" style="line-height: 1.6;">{{ event.description }}</p>
          </div>

          <div class="mt-auto pt-4">
            <button class="button is-primary is-fullwidth is-medium" @click="goToSeatSelection">
              Select Seats
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="has-text-centered py-6 px-4">
      <span class="icon is-large has-text-grey-light mb-4" style="font-size: 3rem;">
        <i class="fas fa-search"></i>
      </span>
      <h2 class="title is-3 mb-2">Event not found</h2>
      <p class="subtitle is-6 has-text-grey mb-5">Unfortunately, the requested event does not exist or has been deleted</p>
      <button class="button is-primary" @click="goBack">
        Back to Home
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.event-details {
  min-height: calc(100vh - 80px);
  background: #f9fafb;
}

@media (max-width: 1024px) {
  .image-section {
    min-height: 350px !important;
  }
}
</style>
