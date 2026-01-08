<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEventsStore } from '../stores/events';
import { useVenueStore } from '../stores/venue';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import ImageUpload from '../components/ImageUpload.vue';

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
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || 'Error updating event';
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  router.push('/admin/events');
};
</script>

<template>
  <div class="container">
    <div class="max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p class="text-gray-600 mt-2">Modify event information</p>
      </div>

      <div v-if="isDataLoading" class="text-center py-8 text-gray-600">
        Loading...
      </div>

      <Card v-else>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
          <CardDescription>Update necessary fields</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="space-y-2">
              <Label for="title">Title</Label>
              <Input
                id="title"
                v-model="form.title"
                placeholder="Enter event title"
                required
                :disabled="isLoading"
              />
            </div>

            <div class="space-y-2">
              <Label for="description">Description</Label>
              <textarea
                id="description"
                v-model="form.description"
                class="flex min-h-[120px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                placeholder="Enter event description"
                required
                :disabled="isLoading"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="date">Date</Label>
                <Input
                  id="date"
                  v-model="form.date"
                  type="date"
                  required
                  :disabled="isLoading"
                />
              </div>

              <div class="space-y-2">
                <Label for="time">Time</Label>
                <Input
                  id="time"
                  v-model="form.time"
                  type="time"
                  required
                  :disabled="isLoading"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="venue_id">Venue</Label>
              <select
                id="venue_id"
                v-model="form.venue_id"
                class="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                required
                :disabled="isLoading"
              >
                <option value="">Select Venue</option>
                <option v-for="venue in venueStore.venuesList" :key="venue.id" :value="venue.id">
                  {{ venue.name }}
                </option>
              </select>
            </div>

            <ImageUpload
              v-model="imageFile"
              :currentImage="currentImageUrl"
              label="Event Image"
            />

            <div v-if="errorMsg" class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-800">{{ errorMsg }}</p>
            </div>

            <div class="flex gap-3 pt-4">
              <Button type="submit" variant="primary" :disabled="isLoading" class="flex-1">
                {{ isLoading ? 'Saving...' : 'Save Changes' }}
              </Button>
              <Button type="button" variant="secondary-outline" @click="handleCancel" :disabled="isLoading">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 2rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
