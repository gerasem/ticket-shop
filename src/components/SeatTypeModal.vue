<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Venue, SeatType } from '../services/mockData';

const props = defineProps<{
  modelValue: boolean;
  venue: Venue | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'save': [types: SeatType[]];
}>();

// Local copy of types for editing
const editingTypes = ref<SeatType[]>([]);

// Initialize editing types when modal opens
const initializeTypes = () => {
  if (props.venue) {
    editingTypes.value = JSON.parse(JSON.stringify(props.venue.seatTypes));
  }
};

// Watch for modal opening
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Initialize when opened
const handleOpen = () => {
  if (isOpen.value) {
    initializeTypes();
  }
};

// Close modal
const closeModal = () => {
  isOpen.value = false;
};

// Save changes
const saveChanges = () => {
  emit('save', editingTypes.value);
  closeModal();
};

// Add new type
const addNewType = () => {
  const newType: SeatType = {
    id: `custom-${Date.now()}`,
    name: 'New Type',
    priceInCents: 1000,
    style: {
      color: '#6366f1' // Indigo
    }
  };
  editingTypes.value.push(newType);
};

// Delete type
const deleteType = (typeId: string) => {
  // Check if type is in use
  const seatsUsingType = props.venue?.seats.filter(s => s.typeId === typeId).length || 0;
  
  if (seatsUsingType > 0) {
    alert(`Cannot delete this type. ${seatsUsingType} seat(s) are using it.`);
    return;
  }
  
  // Prevent deleting last type
  if (editingTypes.value.length <= 1) {
    alert('Cannot delete the last seat type.');
    return;
  }
  
  if (confirm('Are you sure you want to delete this type?')) {
    editingTypes.value = editingTypes.value.filter(t => t.id !== typeId);
  }
};

// Convert price to euros for display
const getPriceInEuros = (priceInCents: number) => {
  return (priceInCents / 100).toFixed(2);
};

// Update price from euros input
const updatePrice = (type: SeatType, value: string) => {
  const euros = parseFloat(value);
  if (!isNaN(euros) && euros > 0) {
    type.priceInCents = Math.round(euros * 100);
  }
};

// Handle backdrop click
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal();
  }
};

// Watch for modal opening
if (isOpen.value) {
  handleOpen();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="isOpen" 
        class="modal-overlay"
        @click="handleBackdropClick"
      >
        <div class="modal-container" @click.stop>
          <!-- Header -->
          <div class="modal-header">
            <h2>Manage Seat Types</h2>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>
          
          <!-- Content -->
          <div class="modal-content">
            <div class="types-list">
              <div 
                v-for="type in editingTypes" 
                :key="type.id"
                class="type-card"
              >
                <!-- Type Name -->
                <div class="type-field">
                  <label>Type Name</label>
                  <input 
                    v-model="type.name" 
                    type="text" 
                    class="type-input"
                    placeholder="e.g. VIP, Premium"
                  />
                </div>
                
                <!-- Price -->
                <div class="type-field">
                  <label>Price (€)</label>
                  <input 
                    :value="getPriceInEuros(type.priceInCents)"
                    @input="updatePrice(type, ($event.target as HTMLInputElement).value)"
                    type="number" 
                    class="type-input"
                    step="0.01"
                    min="0.01"
                  />
                </div>
                
                <!-- Color -->
                <div class="type-field">
                  <label>Color</label>
                  <div class="color-input-wrapper">
                    <input 
                      v-model="type.style!.color"
                      type="color" 
                      class="color-picker"
                    />
                    <input 
                      v-model="type.style!.color"
                      type="text" 
                      class="color-text"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                
                <!-- Width & Height -->
                <div class="type-field-row">
                  <div class="type-field">
                    <label>Width (px)</label>
                    <input 
                      v-model.number="type.style!.width"
                      type="number" 
                      class="type-input"
                      min="10"
                      max="100"
                    />
                  </div>
                  <div class="type-field">
                    <label>Height (px)</label>
                    <input 
                      v-model.number="type.style!.height"
                      type="number" 
                      class="type-input"
                      min="10"
                      max="100"
                    />
                  </div>
                </div>
                
                <!-- Shape -->
                <div class="type-field">
                  <label>Shape</label>
                  <select v-model="type.style!.borderRadius" class="type-input">
                    <option value="8px">Square</option>
                    <option value="50%">Circle</option>
                  </select>
                </div>
                
                <!-- Delete Button -->
                <button 
                  class="delete-type-btn"
                  @click="deleteType(type.id)"
                  :disabled="editingTypes.length <= 1"
                >
                  Delete Type
                </button>
              </div>
            </div>
            
            <!-- Add New Type Button -->
            <button class="add-type-btn" @click="addNewType">
              + Add New Type
            </button>
          </div>
          
          <!-- Footer -->
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeModal">Cancel</button>
            <button class="save-btn" @click="saveChanges">Save Changes</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: #2a2a2a;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #42b983;
}

.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.types-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.type-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.type-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.type-field label {
  font-size: 0.75rem;
  color: #aaa;
  text-transform: uppercase;
  font-weight: 500;
}

.type-input {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.type-input:focus {
  outline: none;
  border-color: #42b983;
}

.type-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.color-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker {
  width: 50px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.color-text {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: monospace;
}

.delete-type-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.5);
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  transition: all 0.2s;
}

.delete-type-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
}

.delete-type-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-type-btn {
  width: 100%;
  background: rgba(66, 185, 131, 0.2);
  color: #42b983;
  border: 1px dashed rgba(66, 185, 131, 0.5);
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
}

.add-type-btn:hover {
  background: rgba(66, 185, 131, 0.3);
  border-style: solid;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.save-btn {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #38a171;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>
