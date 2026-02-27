<script setup lang="ts">
import { onMounted } from 'vue';
import { useEventsStore } from '../stores/events';
import { useRouter } from 'vue-router';
import BaseButton from '../components/BaseButton.vue';
import { useToast } from 'vue-toastification';

const eventsStore = useEventsStore();
const router = useRouter();
const toast = useToast();

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
  toast.warning('Delete this event? This cannot be undone.', {
    timeout: false,
    onClick: async () => {
      await eventsStore.deleteEvent(id);
      toast.success('Event deleted.');
    },
  });
};
</script>

<template>
  <div class="admin-events">
    <div class="header">
      <h1>Event Management</h1>
      <BaseButton variant="primary" @click="router.push('/admin/events/create')">
        Create Event
      </BaseButton>
    </div>

    <!-- Loading state -->
    <div v-if="eventsStore.isLoading" class="empty-state">
      <p>Loading...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="eventsStore.events.length === 0" class="empty-state">
      <div class="empty-content">
        <i class="bi bi-calendar-event empty-icon"></i>
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
              <i class="bi bi-calendar-event icon"></i>
              {{ formatDate(event.date) }}
            </span>
            <span class="meta-item">
              <i class="bi bi-clock icon"></i>
              {{ event.time }}
            </span>
          </div>
          <p class="event-description">{{ event.description }}</p>
        </div>
        <div class="event-actions">
          <BaseButton 
            outlined 
            size="small" 
            @click="router.push(`/admin/events/${event.id}/edit`)"
          >
            Edit
          </BaseButton>
          <BaseButton 
            variant="danger" 
            outlined 
            size="small" 
            class="delete-btn" 
            @click="deleteEvent(event.id)"
          >
            Delete
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/styles/admin-shared.scss';

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 1.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: var(--shadow-sm);
    border-color: var(--border-secondary);
  }
}

.event-image {
  width: 200px;
  height: 150px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.event-details {
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}

.event-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
  }
}

.event-description {
  color: var(--text-secondary);
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
  border-left: 1px solid var(--border-subtle);
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
    border-top: 1px solid var(--border-subtle);
    flex-direction: row;
  }
}
</style>
