<script setup lang="ts">
import { onMounted } from 'vue';
import { useEventsStore } from '../stores/events';
import { useRouter } from 'vue-router';
import { formatDate } from '../utils/formatDate';
import BaseButton from '../components/BaseButton.vue';

const eventsStore = useEventsStore();
const router = useRouter();

onMounted(() => {
  eventsStore.loadEvents();
});

const goToEvent = (eventId: number) => {
  router.push(`/event/${eventId}`);
};
</script>

<template>
  <div>
    <!-- Hero -->
    <div class="hero-section has-text-centered py-6 mb-6">
      <h1 class="title is-1 mb-3">Upcoming Events</h1>
      <p class="subtitle is-5 has-text-grey">Discover the best events and book your tickets</p>
    </div>

    <!-- Loading -->
    <div v-if="eventsStore.isLoading" class="has-text-centered py-6 has-text-grey">
      <p>Loading...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="eventsStore.events.length === 0" class="has-text-centered py-6">
      <i class="bi bi-calendar-event" style="font-size: 3rem; color: var(--border-secondary);"></i>
      <h2 class="title is-4 mt-4">Events coming soon</h2>
      <p class="has-text-grey">Stay tuned - interesting events will be here soon!</p>
    </div>

    <!-- Events grid using Bulma columns -->
    <div v-else class="columns is-multiline">
      <div
        v-for="event in eventsStore.events"
        :key="event.id"
        class="column is-4-desktop is-6-tablet is-12-mobile"
      >
        <div class="event-card" @click="goToEvent(event.id)">
          <div class="event-image">
            <img
              :src="event.image ? `/storage/${event.image}` : '/images/default-event.jpg'"
              :alt="event.title"
            />
            <div class="event-date-badge">
              <span class="month">{{ new Date(event.date).toLocaleString('en-US', { month: 'short' }) }}</span>
              <span class="day">{{ new Date(event.date).getDate() }}</span>
            </div>
          </div>

          <div class="event-content">
            <h3>{{ event.title }}</h3>

            <div class="event-meta">
              <span class="meta-item">
                <i class="bi bi-calendar-event icon"></i>
                {{ formatDate(event.date) }}
              </span>
              <span class="meta-item">
                <i class="bi bi-clock icon"></i>
                {{ event.time }}
              </span>
            </div>

            <p class="description">{{ event.description }}</p>

            <BaseButton variant="primary" fullwidth>
              Buy Tickets
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Hero
.hero-section {
  h1 { color: var(--text-primary); }
  p   { color: var(--text-secondary); }
}

// Card
.event-card {
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: rgb(var(--color-primary));

    .event-image img {
      transform: scale(1.08);
    }
  }
}

.event-image {
  height: 220px;
  position: relative;
  overflow: hidden;
  background: var(--bg-tertiary);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s;
  }
}

.event-date-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  padding: 0.75rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .month {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: rgb(var(--color-primary));
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .day {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }
}

.event-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  h3 {
    margin: 0 0 1rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.3;
  }
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
  }
}

.description {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin-bottom: auto;
  padding-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
