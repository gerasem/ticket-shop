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
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
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
    <!-- Header -->
    <div class="level mb-5">
      <div class="level-left">
        <div class="level-item">
          <h1 class="title is-3">Event Management</h1>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <button class="button is-primary" @click="router.push({ name: 'admin-events-create' })">
            <span class="icon is-small">
              <i class="fas fa-plus"></i>
            </span>
            <span>Create Event</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="eventsStore.error" class="notification is-danger is-light">
      {{ eventsStore.error }}
    </div>

    <!-- Loading State -->
    <div v-if="eventsStore.isLoading" class="has-text-centered py-6">
      <div class="loader-wrapper">

         <p class="mt-2 text-grey">Loading events...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="eventsStore.events.length === 0" class="has-text-centered py-6 box">

      <h3 class="subtitle is-5 has-text-grey">No events found</h3>
      <p class="mb-4">Create your first event to get started.</p>
    </div>

    <!-- Events Table -->
    <div v-else class="box p-0" style="overflow: hidden;">
      <div class="table-container mb-0">
        <table class="table is-striped is-hoverable is-fullwidth mb-0">
          <thead>
            <tr>
              <th style="width: 80px;">Image</th>
              <th>Title</th>
              <th>Date</th>
              <th>Time</th>
              <th>Venue</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in eventsStore.events" :key="event.id">
              <td class="is-vcentered">
                 <figure class="image is-48x48">
                    <img 
                      class="is-rounded" 
                      style="object-fit: cover; height: 100%;"
                      :src="event.image ? `/storage/${event.image}` : 'https://placehold.co/48x48?text=No+Img'" 
                      :alt="event.title"
                    />
                 </figure>
              </td>
              <td class="is-vcentered">
                <strong>{{ event.title }}</strong>
                <p class="is-size-7 has-text-grey text-truncate" style="max-width: 200px;">
                    {{ event.description }}
                </p>
              </td>
              <td class="is-vcentered">{{ formatDate(event.date) }}</td>
              <td class="is-vcentered">{{ event.time }}</td>
              <td class="is-vcentered">
                 <span v-if="event.venue_id" class="tag is-info is-light">
                    {{ event.venue_id }}
                 </span>
                 <span v-else class="tag is-warning is-light">No Venue</span>
              </td>
              <td class="is-vcentered has-text-right">
                <div class="buttons is-right are-small">
                  <button 
                    class="button is-info is-light" 
                    @click="router.push({ name: 'admin-events-edit', params: { id: event.id } })"
                  >
                    <span class="icon is-small">
                      <i class="fas fa-edit"></i>
                    </span>
                  </button>
                  <button 
                    class="button is-danger is-light" 
                    @click="deleteEvent(event.id)"
                  >
                    <span class="icon is-small">
                      <i class="fas fa-trash"></i>
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader-wrapper .icon {
    display: inline-block;
}
</style>
