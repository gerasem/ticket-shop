<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVenueStore } from '../stores/venue';

const router = useRouter();
const venueStore = useVenueStore();
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
  if (confirm('Are you sure you want to delete this venue? This cannot be undone.')) {
    await venueStore.deleteVenue(id);
  }
};

const editVenue = (id: string) => {
  router.push(`/admin/venues/${id}/editor`);
};
</script>

<template>
  <div class="admin-venues">
    <div class="header">
      <h1>Venues Management</h1>
      <button class="button is-primary" @click="showCreateModal = true">
        Create Venue
      </button>
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
          <button class="button is-outlined" @click="showCreateModal = false">Cancel</button>
          <button class="button is-primary" @click="handleCreateVenue" :disabled="!newVenueName || venueStore.isLoading">Create</button>
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
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h2>No venues found</h2>
        <p>Create your first venue to start designing seating charts</p>
      </div>
    </div>

    <!-- Venues list -->
    <div v-else class="venues-list">
      <div v-for="venue in venueStore.venuesList" :key="venue.id" class="venue-card">
        <div class="venue-icon-wrapper">
            <svg class="venue-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
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
          <button 
            class="button is-outlined is-small" 
            @click="editVenue(venue.id)"
          >
            Editor
          </button>
          <button 
            class="button is-danger is-outlined is-small delete-btn" 
            @click="deleteVenue(venue.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-venues {
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

/* Modal Styles */
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
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    color: #111827;
}

.form-group {
    margin-bottom: 1rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.form-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 2rem;
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

.venues-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.venue-card {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
  padding: 1.5rem; /* Different from events, padding everywhere */
  align-items: center;
}

.venue-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
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
}

.venue-icon {
    width: 40px;
    height: 40px;
}

.venue-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.venue-details h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.venue-meta {
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

.meta-item .label {
    font-weight: 600;
    color: #4b5563;
}

.venue-actions {
  display: flex;
  gap: 0.75rem;
  /* Horizontal actions unlike events vertical */
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
