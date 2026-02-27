<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useVenueStore } from '../stores/venue';

interface VenueOption {
  id: string;
  name: string;
  file: string;
}

const venueStore = useVenueStore();
const venues = ref<VenueOption[]>([]);
const selectedVenue = ref('default-venue');

onMounted(async () => {
  // Load available venues list
  try {
    const response = await fetch('/venues/venues-index.json');
    const data = await response.json();
    venues.value = data.venues;
  } catch (error) {
    console.error('Failed to load venues list:', error);
  }
});

const onVenueChange = async (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const venueId = select.value;
  
  const venue = venues.value.find(v => v.id === venueId);
  if (venue) {
    await venueStore.loadVenueFromJSON(venue.file);
    selectedVenue.value = venueId;
  }
};
</script>

<template>
  <div class="venue-selector">
    <select 
      v-model="selectedVenue" 
      @change="onVenueChange"
      class="venue-select"
    >
      <option 
        v-for="venue in venues" 
        :key="venue.id" 
        :value="venue.id"
      >
        {{ venue.name }}
      </option>
    </select>
  </div>
</template>

<style scoped lang="scss">
.venue-selector {
  display: inline-block;
}

.venue-select {
  background: var(--color-bg-panel);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  min-width: 120px;
}

.venue-select:hover {
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.venue-select:focus {
  border-color: var(--color-accent);
}
</style>
