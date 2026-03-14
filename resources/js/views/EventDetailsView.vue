<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events';
import { formatDate } from '../utils/formatDate';
import BaseButton from '../components/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();
const eventId = route.params.id as string;

onMounted(async () => {
  if (eventsStore.events.length === 0) {
    await eventsStore.loadEvents();
  }
});

const event = computed(() =>
  eventsStore.events.find(e => e.id === parseInt(eventId))
);

const goBack = () => router.push('/');

const goToSeatSelection = () => {
  if (event.value?.venue_id) {
    router.push({ path: '/booking', query: { venueId: event.value.venue_id, eventId } });
  }
};
</script>

<template>
  <!-- Loading -->
  <div v-if="eventsStore.isLoading" class="has-text-centered py-6 has-text-grey">
    <p>Loading...</p>
  </div>

  <!-- Not found -->
  <div v-else-if="!event" class="has-text-centered py-6">
    <i class="bi bi-search" style="font-size: 3rem; color: var(--border-secondary);"></i>
    <h2 class="title is-3 mt-4">Event not found</h2>
    <p class="has-text-grey mb-5">The requested event does not exist or has been removed.</p>
    <BaseButton variant="primary" @click="goBack">Return to Home</BaseButton>
  </div>

  <!-- Event Detail -->
  <div v-else>
    <!-- Back link -->
    <div class="mb-5">
      <BaseButton variant="primary" outlined @click="goBack">
        ← Back to Events
      </BaseButton>
    </div>

    <!-- Hero image -->
    <div class="event-hero mb-5">
      <img
        :src="event.image ? `/storage/${event.image}` : '/images/default-event.jpg'"
        :alt="event.title"
        class="event-hero-img"
      />
      <div class="event-hero-overlay">
        <h1 class="title is-2 has-text-white mb-2">{{ event.title }}</h1>
      </div>
    </div>

    <!-- Info grid + CTA -->
    <div class="columns is-desktop">
      <!-- Left: details -->
      <div class="column">
        <!-- Info tags row -->
        <div class="tags are-medium mb-5">
          <span class="tag is-primary is-light">
            <i class="bi bi-calendar-event mr-2"></i>
            {{ formatDate(event.date) }}
          </span>
          <span class="tag is-info is-light">
            <i class="bi bi-clock mr-2"></i>
            {{ event.time }}
          </span>
          <span v-if="event.venue" class="tag is-success is-light">
            <i class="bi bi-geo-alt mr-2"></i>
            {{ event.venue.name }}
          </span>
        </div>

        <!-- Description -->
        <div class="content">
          <h2 class="title is-4">About the Event</h2>
          <p class="has-text-grey-dark" style="line-height: 1.7">{{ event.description }}</p>
        </div>
      </div>

      <!-- Right: CTA card -->
      <div class="column is-4-desktop">
        <div class="card">
          <div class="card-content">
            <p class="title is-5 mb-2">Ready to attend?</p>
            <p class="has-text-grey mb-4">Choose your seats and book your tickets now.</p>

            <table class="table is-fullwidth is-narrow mb-4">
              <tbody>
                <tr>
                  <td class="has-text-grey">Date</td>
                  <td class="has-text-weight-semibold">{{ formatDate(event.date) }}</td>
                </tr>
                <tr>
                  <td class="has-text-grey">Time</td>
                  <td class="has-text-weight-semibold">{{ event.time }}</td>
                </tr>
                <tr v-if="event.venue">
                  <td class="has-text-grey">Venue</td>
                  <td class="has-text-weight-semibold">{{ event.venue.name }}</td>
                </tr>
              </tbody>
            </table>

            <BaseButton variant="primary" fullwidth @click="goToSeatSelection">
              Buy Tickets
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.event-hero {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  height: 320px;

  &-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 50%);
    display: flex;
    align-items: flex-end;
    padding: 2rem;
  }
}
</style>
