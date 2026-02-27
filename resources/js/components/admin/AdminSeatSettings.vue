<template>
  <div class="sidebar-section settings-section">
    <div class="settings-subtitle">Add Seat Block</div>
    
    <div class="settings-row">
      <div class="settings-group">
        <label>Rows</label>
        <input 
          type="number" 
          v-model.number="rows" 
          class="settings-input"
          min="1"
          max="50"
        />
      </div>
      
      <div class="settings-group">
        <label>Seats / Row</label>
        <input 
          type="number" 
          v-model.number="seatsPerRow" 
          class="settings-input"
          min="1"
          max="50"
        />
      </div>
    </div>

    <div class="settings-group">
      <BaseButton outlined variant="primary" size="small" fullwidth @click="emitAdd">
        Add Seats
      </BaseButton>
    </div>

    <div class="actions">
        <BaseButton variant="primary" size="small" fullwidth @click="emit('delete-seats')">Delete Seats</BaseButton>
    </div>

    <div class="settings-divider"></div>
    
    <div style="padding: 10px; font-size: 0.75rem; color: var(--text-secondary);">
      <p style="margin: 0 0 8px 0;"><strong>Add Seat Tool</strong></p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Click anywhere to add a single seat</li>
        <li>Use inputs above to add a block</li>
        <li>Seats snap to 10px grid</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Venue, SeatType } from '../../types/venue';
import BaseButton from '../BaseButton.vue';

const rows = ref(1);
const seatsPerRow = ref(1);

const emit = defineEmits<{
  (e: 'add-seat-block', rows: number, seatsPerRow: number): void;
  (e: 'delete-seats'): void;
}>();

const emitAdd = () => {
  emit('add-seat-block', rows.value, seatsPerRow.value);
};
</script>

<style scoped lang="scss">
/* Reusing styles from AdminView/other settings */
.settings-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 0.25rem;
}

.settings-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  min-width: 0;
}

.settings-group label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.settings-input {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.settings-input:focus {
  border-color: rgb(var(--color-primary));
  outline: none;
}

.settings-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.settings-row .settings-group {
  margin-bottom: 0;
}

.action-btn {
  width: 100%;
  padding: 6px;
  border-radius: 4px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.add-btn {
  background: rgb(var(--color-primary-light));
  color: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary));
}

.add-btn:hover {
  background: rgb(var(--color-primary-light));
}

.settings-divider {
  width: 100%;
  height: 1px;
  background: var(--border-subtle);
  margin: 1rem 0;
}
</style>
