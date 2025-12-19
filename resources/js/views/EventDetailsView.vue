<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mockEvents } from '../services/mockEvents';

const route = useRoute();
const router = useRouter();
const eventId = route.params.id as string;

const event = computed(() => {
  return mockEvents.find(e => e.id === eventId);
});

const goBack = () => {
  router.push('/');
};

const goToSeatSelection = () => {
  if (event.value) {
    router.push({ path: '/client', query: { venueId: event.value.venueId } });
  }
};
</script>

<template>
  <div class="event-details" v-if="event">
    <button class="btn-back" @click="goBack">← Back to Events</button>
    
    <div class="content-wrapper">
      <div class="image-section">
        <img :src="event.image" :alt="event.title" />
      </div>
      
      <div class="info-section">
        <h1>{{ event.title }}</h1>
        
        <div class="meta-info">
          <div class="meta-item">
            <span class="label">Date</span>
            <span class="value">{{ new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
          </div>
          <div class="meta-item">
            <span class="label">Time</span>
            <span class="value">{{ event.time }}</span>
          </div>
          <div class="meta-item">
            <span class="label">Venue</span>
            <span class="value">Main Hall</span>
          </div>
        </div>
        
        <div class="description">
          <h3>About the Event</h3>
          <p>{{ event.description }}</p>
        </div>
        
        <div class="actions">
          <button class="btn-select-seats" @click="goToSeatSelection">Select Seats</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <h2>Event not found</h2>
    <button class="btn-back" @click="goBack">Return to Home</button>
  </div>
</template>

<style scoped>
.event-details {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.btn-back {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 2rem;
  padding: 0;
  transition: color 0.2s;
}

.btn-back:hover {
  color: var(--color-accent);
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  background: var(--color-bg-panel);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.image-section {
  height: 100%;
  min-height: 400px;
}

.image-section img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-section {
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: var(--color-text-white);
  line-height: 1.1;
}

.meta-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border-light);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
}

.value {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--color-text-white);
}

.description {
  margin-bottom: 3rem;
  flex-grow: 1;
}

.description h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--color-text-white);
}

.description p {
  color: var(--color-text-muted);
  line-height: 1.6;
  font-size: 1rem;
}

.actions {
  margin-top: auto;
}

.btn-select-seats {
  width: 100%;
  padding: 1rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-select-seats:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.not-found {
  text-align: center;
  padding: 4rem;
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
  
  .image-section {
    min-height: 250px;
  }
  
  .meta-info {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
