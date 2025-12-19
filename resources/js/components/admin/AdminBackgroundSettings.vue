<template>
  <div class="sidebar-section settings-section">
    <!-- Upload Background -->
    <div class="settings-group">
      <label>Background Image</label>
      <label for="background-upload" class="upload-button">
        <span class="upload-icon"><IconImage name="upload" size="18px" /></span>
        <span class="upload-text">Choose Image</span>
      </label>
      <input 
        id="background-upload"
        type="file" 
        accept="image/*"
        @change="handleBackgroundUpload"
        style="display: none;"
      />
    </div>

    <div v-if="venue.backgroundImage" class="settings-group">
      <button class="action-btn select-all-btn" @click="$emit('remove-background')">
        Remove Background
      </button>
    </div>

    <!-- Scale Control -->
    <div v-if="venue.backgroundImage" class="settings-group">
      <label>Scale (%)</label>
      <input 
        type="number" 
        v-model.number="venue.backgroundImage.scale" 
        class="settings-input"
        min="10"
        max="200"
        step="5"
        style="width: 100%; margin-bottom: 8px;"
      />
      <input 
        type="range" 
        v-model.number="venue.backgroundImage.scale" 
        min="10"
        max="200"
        step="5"
        style="width: 100%;"
      />
    </div>

    <!-- Position Controls -->
    <div v-if="venue.backgroundImage" class="settings-group">
      <label>Position</label>
      <div class="arrow-buttons">
        <button class="arrow-btn up" @click="$emit('move-background', 0, -1)"><IconImage name="arrow-up" size="18px" /></button>
        <div class="horizontal-arrows">
          <button class="arrow-btn left" @click="$emit('move-background', -1, 0)"><IconImage name="arrow-left" size="18px" /></button>
          <div class="step-control-compact">
            <label>Step</label>
            <input 
              type="number" 
              :value="moveStep"
              @input="$emit('update:moveStep', Number(($event.target as HTMLInputElement).value))"
              min="1" 
              class="step-input" 
            />
          </div>
          <button class="arrow-btn right" @click="$emit('move-background', 1, 0)"><IconImage name="arrow-right" size="18px" /></button>
        </div>
        <button class="arrow-btn down" @click="$emit('move-background', 0, 1)"><IconImage name="arrow-down" size="18px" /></button>
      </div>
    </div>

    <!-- Rotation Control -->
    <div v-if="venue.backgroundImage" class="settings-group">
      <label>Rotation</label>
      <div class="curvature-controls">
        <button class="curvature-btn" @click="$emit('rotate-background', -5)"><IconImage name="rotate-ccw" size="20px" /></button>
        <span class="curvature-value">{{ venue.backgroundImage.rotation }}°</span>
        <button class="curvature-btn" @click="$emit('rotate-background', 5)"><IconImage name="rotate-cw" size="20px" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Venue } from '../../services/mockData';
import IconImage from '../ui/IconImage.vue';

const props = defineProps<{
  venue: Venue;
  moveStep: number;
}>();

const emit = defineEmits<{
  (e: 'update:moveStep', value: number): void;
  (e: 'remove-background'): void;
  (e: 'move-background', dx: number, dy: number): void;
  (e: 'rotate-background', angle: number): void;
  (e: 'upload-background', event: Event): void;
}>();

const handleBackgroundUpload = (event: Event) => {
  emit('upload-background', event);
};
</script>

<style scoped>
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
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

.settings-input {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-white);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.settings-input:focus {
  border-color: var(--color-accent);
  outline: none;
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
  background: var(--color-accent-light);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-strong);
}

.select-all-btn:hover {
  background: var(--color-accent-medium);
}

/* Upload Button */
.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 8px 12px;
  background: var(--color-accent-light);
  border: 1px solid var(--color-accent-strong);
  border-radius: 6px;
  color: var(--color-accent);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.25rem;
}

.upload-button:hover {
  background: var(--color-accent-medium);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-accent-medium);
}

.upload-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px var(--color-accent-light);
}

.upload-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.upload-text {
  line-height: 1;
}

/* Arrow Controls */
.arrow-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.horizontal-arrows {
  display: flex;
  gap: 4px;
  align-items: center;
}

.step-control-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.step-control-compact label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  line-height: 1;
}

.step-input {
  width: 36px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-white);
  padding: 2px 0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.8rem;
  -moz-appearance: textfield;
}

.step-input::-webkit-outer-spin-button,
.step-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.arrow-btn {
  width: 30px;
  height: 30px;
  background: var(--color-accent);
  border: none;
  border-radius: 4px;
  color: var(--color-text-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: background 0.2s;
}

.arrow-btn:hover {
  background: var(--color-accent-hover);
}

.arrow-btn:active {
  transform: scale(0.95);
}

/* Curvature/Rotation Controls */
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
  border: 1px solid var(--color-border-medium);
  background: var(--color-border-light);
  color: var(--color-text-white);
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
  background: var(--color-accent-strong);
  border-color: var(--color-accent);
}

.curvature-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.curvature-value {
  font-size: 1rem;
  color: var(--color-accent);
  min-width: 45px;
  text-align: center;
  font-weight: 600;
}
</style>
