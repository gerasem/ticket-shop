<script setup lang="ts">
import { onMounted } from 'vue';
import { useEventsStore } from '../stores/events';
import { useRouter } from 'vue-router';

const eventsStore = useEventsStore();
const router = useRouter();

onMounted(() => {
  eventsStore.loadEvents();
});

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const deleteEvent = async (id: number) => {
  if (confirm('Are you sure you want to delete this event?')) {
    await eventsStore.deleteEvent(id);
  }
};
</script>

<template>
  <div class="admin-events">
    <div class="header">
      <h1>Event Management</h1>
      <button class="button is-primary" @click="router.push('/admin/events/create')">
        Create Event
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="eventsStore.isLoading" class="empty-state">
      <p>Loading...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="eventsStore.events.length === 0" class="empty-state">
      <div class="empty-content">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2>No events found</h2>
        <p>Create your first event to start selling tickets</p>
      </div>
    </div>

    <!-- Events list -->
    <div v-else class="events-list">
      <div v-for="event in eventsStore.events" :key="event.id" class="event-card">
        <div class="event-image">
          <img 
            :src="event.image ? `/storage/${event.image}` : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400'" 
            :alt="event.title"
          />
        </div>
        <div class="event-details">
          <h3>{{ event.title }}</h3>
          <div class="event-meta">
            <span class="meta-item">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ formatDate(event.date) }}
            </span>
            <span class="meta-item">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ event.time }}
            </span>
          </div>
          <p class="event-description">{{ event.description }}</p>
        </div>
        <div class="event-actions">
          <button 
            class="button is-outlined is-small" 
            @click="router.push(`/admin/events/${event.id}/edit`)"
          >
            Edit
          </button>
          <button 
            class="button is-danger is-outlined is-small delete-btn" 
            @click="deleteEvent(event.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-events {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.empty-content {
  max-width: 400px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #d1d5db;
  margin: 0 auto 1rem;
}

.empty-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-content p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.event-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.event-image {
  width: 200px;
  height: 150px;
  overflow: hidden;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-details {
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.event-details h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.event-meta {
  display: flex;
  gap: 1.5rem;
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
}

.event-description {
  color: #4b5563;
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  border-left: 1px solid #f3f4f6;
  align-items: stretch;
}

@media (max-width: 768px) {
  .event-card {
    grid-template-columns: 1fr;
  }

  .event-image {
    width: 100%;
    height: 200px;
  }

  .event-actions {
    border-left: none;
    border-top: 1px solid #f3f4f6;
    flex-direction: row;
  }
}
</style>
