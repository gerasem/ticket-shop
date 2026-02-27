<script setup lang="ts">
import { onMounted } from 'vue';
import { useEventsStore } from '../stores/events';
import { useRouter } from 'vue-router';
import BaseButton from '../components/BaseButton.vue';
import { useToast } from 'vue-toastification';
import AdminPageLayout from '../components/admin/AdminPageLayout.vue';

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
  <AdminPageLayout
    title="Event Management"
    :is-loading="eventsStore.isLoading"
    :is-empty="eventsStore.events.length === 0"
    empty-icon="bi-calendar-event"
    empty-title="No events found"
    empty-subtitle="Create your first event to start selling tickets"
  >
    <template #header-actions>
      <BaseButton variant="primary" @click="router.push('/admin/events/create')">
        Create Event
      </BaseButton>
    </template>

    <!-- Events list -->
      <div v-for="event in eventsStore.events" :key="event.id" class="box">
        <article class="media is-align-items-center">
          <!-- Thumbnail -->
          <figure class="media-left">
            <p class="image is-128x128">
              <img
                :src="event.image ? `/storage/${event.image}` : '/images/default-event.jpg'"
                :alt="event.title"
                style="object-fit: cover; height: 100%; border-radius: 8px;"
              />
            </p>
          </figure>

          <!-- Details -->
          <div class="media-content">
            <div class="content">
              <p class="mb-2">
                <strong class="is-size-5">{{ event.title }}</strong>
              </p>
              <div class="tags mb-2">
                <span class="tag is-light is-primary">
                  <i class="bi bi-calendar-event mr-2"></i>
                  {{ formatDate(event.date) }}
                </span>
                <span class="tag is-light is-info">
                  <i class="bi bi-clock mr-2"></i>
                  {{ event.time }}
                </span>
              </div>
              <p class="has-text-grey" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">
                {{ event.description }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="media-right px-3">
            <div class="buttons is-flex-direction-column">
              <BaseButton variant="primary" outlined size="small" class="mb-2 w-100" @click="router.push(`/admin/events/${event.id}/edit`)">
                Edit
              </BaseButton>
              <BaseButton variant="danger" outlined size="small" class="w-100" @click="deleteEvent(event.id)">
                Delete
              </BaseButton>
            </div>
          </div>
        </article>
      </div>
    <!-- End List -->
  </AdminPageLayout>
</template>


<style scoped lang="scss">
@use '../assets/styles/admin-shared.scss';

.w-100 {
  width: 100%;
}

@media (max-width: 768px) {
  .media {
    flex-direction: column;
    align-items: flex-start !important;
  }
  .media-left {
    margin-right: 0;
    margin-bottom: 1rem;
    width: 100%;
    
    .image {
      width: 100% !important;
      height: 200px !important;
    }
  }
  .media-right {
    margin-left: 0;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    
    .buttons {
      flex-direction: row !important;
      width: 100%;
      
      .button {
        flex: 1;
        margin-bottom: 0 !important;
        margin-right: 0.5rem;
      }
    }
  }
}
</style>
