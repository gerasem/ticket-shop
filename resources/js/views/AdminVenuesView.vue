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
  <div class="admin-venues">
    <div class="header">
      <h1>Venues Management</h1>
      <BaseButton variant="primary" @click="showCreateModal = true">
        Create Venue
      </BaseButton>
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
          <BaseButton outlined @click="showCreateModal = false">Cancel</BaseButton>
          <BaseButton variant="primary" @click="handleCreateVenue" :disabled="!newVenueName || venueStore.isLoading">Create</BaseButton>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="venueStore.isLoading" class="empty-state">
      <p>Loading...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="venueStore.venuesList.length === 0" class="empty-state">
      <div class="empty-content">
        <i class="bi bi-building empty-icon"></i>
        <h2>No venues found</h2>
        <p>Create your first venue to start designing seating charts</p>
      </div>
    </div>

    <!-- Venues list -->
    <div v-else class="venues-list">
      <div v-for="venue in venueStore.venuesList" :key="venue.id" class="venue-card">
        <div class="venue-icon-wrapper">
            <i class="bi bi-building venue-icon"></i>
        </div>
        
        <div class="venue-details">
          <h3>{{ venue.name }}</h3>
          <div class="venue-meta">
            <span class="meta-item">
              <span class="label">Size:</span> {{ venue.width }} x {{ venue.height }} px
            </span>
            <span class="meta-item">
              <span class="label">Seats:</span> {{ venue.seats ? venue.seats.length : 0 }}
            </span>
          </div>
        </div>

        <div class="venue-actions">
          <BaseButton 
            outlined 
            size="small" 
            @click="editVenue(venue.id)"
          >
            Editor
          </BaseButton>
          <BaseButton 
            variant="danger" 
            outlined 
            size="small" 
            class="delete-btn" 
            @click="deleteVenue(venue.id)"
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

// Venue list
.venues-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.venue-card {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 1.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
  padding: 1.5rem;
  align-items: center;

  &:hover {
    box-shadow: var(--shadow-sm);
    border-color: var(--border-secondary);
  }
}

.venue-icon-wrapper {
  width: 80px;
  height: 80px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 2rem;
}

.venue-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}

.venue-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);

    .label {
      font-weight: 600;
      color: var(--text-heading);
    }
  }
}

.venue-actions {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .venue-card {
    grid-template-columns: 1fr;
    text-align: center;
    justify-items: center;
  }

  .venue-meta {
    justify-content: center;
  }

  .venue-actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>

