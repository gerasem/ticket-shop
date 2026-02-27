<script setup lang="ts">
import { onMounted } from 'vue';
import { useEventsStore } from '../stores/events';
import { useRouter } from 'vue-router';
import BaseButton from '../components/BaseButton.vue';

const eventsStore = useEventsStore();
const router = useRouter();

onMounted(() => {
  eventsStore.loadEvents();
});

const goToEvent = (eventId: number) => {
  router.push(`/event/${eventId}`);
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
  <div class="home">
    <div class="hero">
      <h1>Upcoming Events</h1>
      <p>Discover the best events and book your tickets</p>
    </div>

    <!-- Loading state -->
    <div v-if="eventsStore.isLoading" class="empty-state">
      <p>Loading...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="eventsStore.events.length === 0" class="empty-state">
      <i class="bi bi-calendar-event empty-icon"></i>
      <h2>Events coming soon</h2>
      <p>Stay tuned - interesting events will be here soon!</p>
    </div>

    <!-- Events grid -->
    <div v-else class="events-grid">
      <div v-for="event in eventsStore.events" :key="event.id" class="event-card" @click="goToEvent(event.id)">
        <div class="event-image">
          <img 
            :src="event.image ? `/storage/${event.image}` : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'" 
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
</template>

<style scoped lang="scss">
.home {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
  padding: 3rem 1rem;
}

.hero h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #111827;
}

.hero p {
  color: #6b7280;
  font-size: 1.25rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #d1d5db;
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.event-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-color: rgb(var(--color-primary));
}

.event-image {
  height: 220px;
  position: relative;
  overflow: hidden;
  background: #f3f4f6;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.event-card:hover .event-image img {
  transform: scale(1.08);
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
}

.event-date-badge .month {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: rgb(var(--color-primary));
  font-weight: 700;
  letter-spacing: 0.5px;
}

.event-date-badge .day {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.event-content {
  padding: 1.5rem;
}

.event-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.description {
  color: #4b5563;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .hero p {
    font-size: 1rem;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
