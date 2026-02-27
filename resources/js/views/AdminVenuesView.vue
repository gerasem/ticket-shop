<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVenueStore } from '../stores/venue';
import BaseButton from '../components/BaseButton.vue';
import { useToast } from 'vue-toastification';

const router = useRouter();
const venueStore = useVenueStore();
const toast = useToast();
const showCreateModal = ref(false);

const newVenueName = ref('');
const newVenueWidth = ref(1000);
const newVenueHeight = ref(800);

onMounted(async () => {
  await venueStore.loadVenues();
});

const handleCreateVenue = async () => {
  if (!newVenueName.value) return;
  
  try {
    const newVenue = await venueStore.createVenue({
      name: newVenueName.value,
      width: newVenueWidth.value,
      height: newVenueHeight.value
    });
    
    showCreateModal.value = false;
    newVenueName.value = '';
    
    // Redirect to editor
    if (newVenue && newVenue.id) {
        router.push(`/admin/venues/${newVenue.id}/editor`);
    } else {
        await venueStore.loadVenues();
    }
  } catch (error) {
    console.error('Failed to create venue', error);
  }
};

const deleteVenue = async (id: string) => {
  toast.warning('Are you sure? This venue will be permanently deleted.', {
    timeout: false,
    onClick: async () => {
      await venueStore.deleteVenue(id);
      toast.success('Venue deleted.');
    },
  });
};

const editVenue = (id: string) => {
  router.push(`/admin/venues/${id}/editor`);
};
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="level mb-5">
      <div class="level-left">
        <div class="level-item">
          <h1 class="title is-3">Venues Management</h1>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <BaseButton variant="primary" @click="showCreateModal = true">
            Create Venue
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Create Venue Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Create New Venue</h2>

        <div class="form-group">
          <label>Name</label>
          <input v-model="newVenueName" type="text" class="form-input" placeholder="Main Hall" autofocus>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Width (px)</label>
            <input v-model="newVenueWidth" type="number" class="form-input">
          </div>
          <div class="form-group">
            <label>Height (px)</label>
            <input v-model="newVenueHeight" type="number" class="form-input">
          </div>
        </div>

        <div class="modal-actions">
          <BaseButton variant="light" outlined @click="showCreateModal = false">Cancel</BaseButton>
          <BaseButton variant="primary" @click="handleCreateVenue" :disabled="!newVenueName || venueStore.isLoading">Create</BaseButton>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="venueStore.isLoading" class="has-text-centered py-6 has-text-grey">
      <p>Loading...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="venueStore.venuesList.length === 0" class="has-text-centered py-6">
      <i class="bi bi-building" style="font-size: 3rem; color: var(--border-secondary);"></i>
      <h2 class="title is-4 mt-4">No venues found</h2>
      <p class="has-text-grey">Create your first venue to start designing seating charts</p>
    </div>

    <!-- Venues list -->
    <div v-else class="is-flex is-flex-direction-column" style="gap: 1.5rem;">
      <div v-for="venue in venueStore.venuesList" :key="venue.id" class="box">
        <article class="media is-align-items-center">
          <!-- Icon -->
          <figure class="media-left">
            <p class="image is-64x64 is-flex is-align-items-center is-justify-content-center has-background-light has-text-grey-light" style="border-radius: 8px;">
              <i class="bi bi-building is-size-3"></i>
            </p>
          </figure>

          <!-- Details -->
          <div class="media-content">
            <div class="content">
              <p class="mb-2">
                <strong class="is-size-5">{{ venue.name }}</strong>
              </p>
              <div class="tags mb-0">
                <span class="tag is-light is-info">
                  <span class="has-text-weight-semibold mr-1">Size:</span> {{ venue.width }} x {{ venue.height }} px
                </span>
                <span class="tag is-light is-primary">
                  <span class="has-text-weight-semibold mr-1">Seats:</span> {{ venue.seats ? venue.seats.length : 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="media-right px-3">
            <div class="buttons is-flex-direction-column">
              <BaseButton variant="primary" outlined size="small" class="mb-2 w-100" @click="editVenue(venue.id)">
                Editor
              </BaseButton>
              <BaseButton variant="danger" outlined size="small" class="w-100" @click="deleteVenue(venue.id)">
                Delete
              </BaseButton>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/styles/admin-shared.scss';

// Modal
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }
}

.form-group {
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-heading);
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-secondary);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: var(--bg-primary);
  color: var(--text-primary);

  &:focus {
    outline: none;
    border-color: rgb(var(--color-primary));
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}

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

