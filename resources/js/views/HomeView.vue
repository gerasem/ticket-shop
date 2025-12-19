<script setup lang="ts">
import { mockEvents } from '../services/mockEvents';
import { useRouter } from 'vue-router';

const router = useRouter();

const goToEvent = (eventId: string) => {
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
      <p>Discover and book tickets for the best events in town.</p>
    </div>

    <div class="events-grid">
      <div v-for="event in mockEvents" :key="event.id" class="event-card" @click="goToEvent(event.id)">
        <div class="event-image">
          <img :src="event.image" :alt="event.title" />
          <div class="event-date-badge">
            <span class="month">{{ new Date(event.date).toLocaleString('default', { month: 'short' }) }}</span>
            <span class="day">{{ new Date(event.date).getDate() }}</span>
          </div>
        </div>
        <div class="event-content">
          <h3>{{ event.title }}</h3>
          <div class="event-meta">
            <span class="date">📅 {{ formatDate(event.date) }}</span>
            <span class="time">🕒 {{ event.time }}</span>
          </div>
          <p class="description">{{ event.description }}</p>
          <button class="btn-book">Get Tickets</button>
        </div>
      </div>
    </div>
    
    <div class="admin-link">
      <RouterLink to="/admin" class="btn-secondary">Admin Dashboard</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-white);
}

.hero p {
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.event-card {
  background: var(--color-bg-panel);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid var(--color-border);
}

.event-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border-color: var(--color-accent);
}

.event-image {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.event-card:hover .event-image img {
  transform: scale(1.05);
}

.event-date-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
  border: 1px solid var(--color-accent);
}

.event-date-badge .month {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-accent);
  font-weight: bold;
}

.event-date-badge .day {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
}

.event-content {
  padding: 1.5rem;
}

.event-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: var(--color-text-white);
}

.event-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.description {
  color: var(--color-text-tertiary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.btn-book {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-book:hover {
  background: var(--color-accent-hover);
}

.admin-link {
  text-align: center;
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
}

.btn-secondary {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.btn-secondary:hover {
  color: var(--color-text-white);
}
</style>
