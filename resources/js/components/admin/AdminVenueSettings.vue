<template>
  <div class="sidebar-section settings-section">
    <div class="settings-group">
      <label>Name</label>
      <input 
        type="text" 
        v-model="venue.name" 
        class="settings-input"
      />
    </div>
    
    <div class="settings-row">
      <div class="settings-group">
        <label>Width (px)</label>
        <input 
          type="number" 
          v-model.number="venue.width" 
          class="settings-input"
          step="10"
        />
      </div>
      
      <div class="settings-group">
        <label>Height (px)</label>
        <input 
          type="number" 
          v-model.number="venue.height" 
          class="settings-input"
          step="10"
        />
      </div>
    </div>

    <div class="settings-group">
      <button class="action-btn select-all-btn" @click="$emit('recalculate-rows')">
        Recalculate Rows
      </button>
    </div>

    <!-- Seat Styling Settings -->
    <div class="settings-divider"></div>
    <div class="settings-subtitle">Default Seat Style</div>

    <!-- Color and Shape in a row -->
    <div class="settings-row">
      <div class="settings-group">
        <label>Color</label>
        <input 
          type="color" 
          v-model="venue.defaultSeatStyle.color" 
          class="settings-input color-input"
        />
      </div>
      
      <div class="settings-group">
        <label>Shape</label>
        <select 
          v-model="venue.defaultSeatStyle.borderRadius" 
          class="settings-input"
        >
          <option value="8px">Square</option>
          <option value="50%">Circle</option>
        </select>
      </div>
    </div>

    <!-- Width and Height in a row -->
    <div class="settings-row">
      <div class="settings-group">
        <label>Width (px)</label>
        <input 
          type="number" 
          v-model.number="venue.defaultSeatStyle.width" 
          class="settings-input"
          min="10"
          max="100"
        />
      </div>
      
      <div class="settings-group">
        <label>Height (px)</label>
        <input 
          type="number" 
          v-model.number="venue.defaultSeatStyle.height" 
          class="settings-input"
          min="10"
          max="100"
        />
      </div>
    </div>
    
    
    <!-- Focal Point Curvature -->
    <div class="settings-divider"></div>
    <div class="settings-subtitle">Focal Point Curvature</div>
    
    <div class="settings-group">
      <label>Row Arc Towards Stage</label>
      <div class="curvature-controls">
        <button 
          class="curvature-btn" 
          @click="decreaseCurvature"
          :disabled="venue.curvature === -100"
        ><IconImage name="rotate-ccw" size="20px" /></button>
        <span class="curvature-value">{{ venue.curvature }}%</span>
        <button 
          class="curvature-btn" 
          @click="increaseCurvature"
          :disabled="venue.curvature === 100"
        ><IconImage name="rotate-cw" size="20px" /></button>
      </div>
    </div>
    
    <!-- Row Labels Visibility -->
    <div class="settings-divider"></div>
    <div class="settings-subtitle">Row Labels</div>
    
    <div class="settings-row">
      <div class="settings-group checkbox-group">
        <label>
          <input 
            type="checkbox" 
            :checked="showLeftRowLabels"
            @change="$emit('update:showLeftRowLabels', ($event.target as HTMLInputElement).checked)"
          >
          Left Labels
        </label>
      </div>
      
      <div class="settings-group checkbox-group">
        <label>
          <input 
            type="checkbox" 
            :checked="showRightRowLabels"
            @change="$emit('update:showRightRowLabels', ($event.target as HTMLInputElement).checked)"
          >
          Right Labels
        </label>
      </div>
    </div>
    
    <!-- Manage Seat Types Button -->
    <div class="settings-divider"></div>
    <div class="settings-group">
      <button class="action-btn manage-types-btn" @click="$emit('open-type-modal')">
        Manage Seat Types
      </button>
    </div>
    
    <!-- Manage Colors Button -->
    <div class="settings-group">
      <button class="action-btn manage-colors-btn" @click="$emit('open-color-modal')">
        Manage Colors
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Venue } from '../../services/mockData';
import IconImage from '../IconImage.vue';

const props = defineProps<{
  venue: Venue;
  showLeftRowLabels: boolean;
  showRightRowLabels: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:showLeftRowLabels', value: boolean): void;
  (e: 'update:showRightRowLabels', value: boolean): void;
  (e: 'recalculate-rows'): void;
  (e: 'open-type-modal'): void;
  (e: 'open-color-modal'): void;
}>();

// Curvature controls
const increaseCurvature = () => {
  if (!props.venue) return;
  const newCurvature = Math.min(props.venue.curvature + 10, 100);
  props.venue.curvature = newCurvature;
  applyCurvature();
};

const decreaseCurvature = () => {
  if (!props.venue) return;
  const newCurvature = Math.max(props.venue.curvature - 10, -100);
  props.venue.curvature = newCurvature;
  applyCurvature();
};

const applyCurvature = () => {
  if (!props.venue) return;
  
  const venue = props.venue;
  const curvature = venue.curvature / 100; // -1 to 1
  
  // Calculate the actual horizontal center of all seats for symmetry
  const allSeatsX = venue.seats.map(s => s.originalX ?? s.x);
  const minX = Math.min(...allSeatsX);
  const maxX = Math.max(...allSeatsX);
  const seatsCenter = (minX + maxX) / 2;
  const seatsWidth = maxX - minX;
  
  venue.seats.forEach(seat => {
    if (seat.originalX === undefined || seat.originalY === undefined) {
      seat.originalX = seat.x;
      seat.originalY = seat.y;
    }
    
    // Calculate distance from seats center (for symmetry)
    const offsetX = seat.originalX - seatsCenter;
    
    // Normalized offset from center: -1 (left edge) to 1 (right edge)
    const normalizedOffset = offsetX / (seatsWidth / 2);
    
    // Parabolic curve - same for all rows
    const arcOffset = normalizedOffset * normalizedOffset * curvature * 150;
    
    // Rotation towards stage - increased from 8 to 20 for more visibility
    // Left seats rotate inward (right), right seats rotate inward (left)
    const rotationAmount = normalizedOffset * curvature * 20; // degrees
    
    // Apply transformation
    seat.x = seat.originalX;
    seat.y = seat.originalY + arcOffset;
    seat.rotation = rotationAmount;
  });
};

</script>

<style scoped lang="scss">
/* Reusing styles from AdminView to ensure consistency */

.settings-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 0.25rem;
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

.settings-divider {
  width: 100%;
  height: 1px;
  background: var(--border-subtle);
  margin: 1rem 0;
}

.settings-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
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

.select-all-btn {
  background: rgb(var(--color-primary-light));
  color: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary));
}

.select-all-btn:hover {
  background: rgb(var(--color-primary-light));
}

.manage-types-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-secondary);
}

.manage-types-btn:hover {
  background: var(--bg-secondary);
  border-color: rgb(var(--color-primary));
}

.manage-colors-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-secondary);
}

.manage-colors-btn:hover {
  background: var(--bg-secondary);
  border-color: rgb(var(--color-primary));
}

.curvature-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.curvature-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-secondary);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 1.6rem;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.curvature-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: rgb(var(--color-primary));
}

.curvature-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.curvature-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.curvature-value {
  font-size: 1rem;
  color: var(--text-primary);
  min-width: 45px;
  text-align: center;
  font-weight: 600;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex-direction: row;
  font-size: 0.8rem;
  color: var(--text-primary);
}

.color-input {
  height: 25px;
  width: 100%;
  padding: 2px;
  cursor: pointer;
}
</style>
