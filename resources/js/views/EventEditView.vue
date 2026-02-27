<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events';
import { useVenueStore } from '../stores/venue';
import ImageUpload from '../components/ImageUpload.vue';
import BaseButton from '../components/BaseButton.vue';

const router = useRouter();
const route = useRoute();
const eventsStore = useEventsStore();
const venueStore = useVenueStore();

const eventId = ref(route.params.id as string);
const form = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  venue_id: ''
});

const imageFile = ref<File | null>(null);
const currentImageUrl = ref<string>('');

const isLoading = ref(false);
const errorMsg = ref('');
const isDataLoading = ref(true);

onMounted(async () => {
  await venueStore.loadVenues();
  
  const event = eventsStore.events.find(e => e.id === parseInt(eventId.value));
  if (event) {
    form.value = {
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      venue_id: event.venue_id
    };
    currentImageUrl.value = event.image || '';
  } else {
    // Load event if not in store
    await eventsStore.loadEvents();
    const loadedEvent = eventsStore.events.find(e => e.id === parseInt(eventId.value));
    if (loadedEvent) {
      form.value = {
        title: loadedEvent.title,
        description: loadedEvent.description,
        date: loadedEvent.date,
        time: loadedEvent.time,
        venue_id: loadedEvent.venue_id
      };
      currentImageUrl.value = loadedEvent.image || '';
    }
  }
  isDataLoading.value = false;
});

const handleSubmit = async () => {
  errorMsg.value = '';
  isLoading.value = true;

  try {
    const formData = new FormData();
    formData.append('title', form.value.title);
    formData.append('description', form.value.description);
    formData.append('date', form.value.date);
    formData.append('time', form.value.time);
    formData.append('venue_id', form.value.venue_id);
    
    if (imageFile.value) {
      formData.append('image', imageFile.value);
    }

    await eventsStore.updateEvent(parseInt(eventId.value), formData);
    router.push('/admin/events');
  } catch (error: unknown) {
    const e = error as { response?: { data?: { message?: string } } };
    errorMsg.value = e.response?.data?.message || 'Error updating event';
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  router.push('/admin/events');
};
</script>

<template>
  <div class="container section">
    <div class="columns is-centered">
      <div class="column is-8">
        <div class="mb-5">
          <h1 class="title is-3">Edit Event</h1>
          <p class="subtitle is-6 has-text-grey mt-2">Modify event information</p>
        </div>

        <div v-if="isDataLoading" class="has-text-centered py-6 has-text-grey">
          Loading...
        </div>

        <div v-else class="box">
          <h3 class="title is-4 mb-2">Event Information</h3>
          <p class="subtitle is-6 has-text-grey mb-5">Update necessary fields</p>
          
          <form @submit.prevent="handleSubmit">
            <div class="field">
              <label class="label" for="title">Title</label>
              <div class="control">
                <input
                  id="title"
                  v-model="form.title"
                  class="input"
                  type="text"
                  placeholder="Enter event title"
                  required
                  :disabled="isLoading"
                />
              </div>
            </div>

            <div class="field">
              <label class="label" for="description">Description</label>
              <div class="control">
                <textarea
                  id="description"
                  v-model="form.description"
                  class="textarea"
                  placeholder="Enter event description"
                  rows="4"
                  required
                  :disabled="isLoading"
                ></textarea>
              </div>
            </div>

            <div class="columns">
              <div class="column">
                <div class="field">
                  <label class="label" for="date">Date</label>
                  <div class="control">
                    <input
                      id="date"
                      v-model="form.date"
                      class="input"
                      type="date"
                      required
                      :disabled="isLoading"
                    />
                  </div>
                </div>
              </div>

              <div class="column">
                <div class="field">
                  <label class="label" for="time">Time</label>
                  <div class="control">
                    <input
                      id="time"
                      v-model="form.time"
                      class="input"
                      type="time"
                      required
                      :disabled="isLoading"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label" for="venue_id">Venue</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select
                    id="venue_id"
                    v-model="form.venue_id"
                    required
                    :disabled="isLoading"
                  >
                    <option value="">Select Venue</option>
                    <option v-for="venue in venueStore.venuesList" :key="venue.id" :value="venue.id">
                      {{ venue.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">Event Image</label>
              <div class="control">
                <ImageUpload
                  v-model="imageFile"
                  :currentImage="currentImageUrl"
                />
              </div>
            </div>

            <div v-if="errorMsg" class="notification is-danger is-light mt-4">
              {{ errorMsg }}
            </div>

            <div class="field is-grouped is-grouped-right mt-6">
              <div class="control">
                <BaseButton type="button" variant="light" outlined @click="handleCancel" :disabled="isLoading">
                  Cancel
                </BaseButton>
              </div>
              <div class="control">
                <BaseButton type="submit" variant="primary" :loading="isLoading">
                  Save Changes
                </BaseButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Custom styles if needed, falling back to Bulma structure
</style>
