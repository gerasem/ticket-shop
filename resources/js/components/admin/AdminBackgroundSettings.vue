<template>
  <div class="sidebar-section settings-section">
    <!-- Upload Background -->
    <div class="settings-group">
      <label>Background Image</label>
      <label for="background-upload" class="upload-button">
        <span class="upload-icon"><i class="bi bi-upload" style="font-size: 18px;"></i></span>
        <span class="upload-text">Choose Image</span>
      </label>
      <input 
        id="background-upload"
        type="file" 
        accept="image/*"
        @change="handleBackgroundUpload"
        style="display: none;"
      />
      <div class="background-actions" v-if="venue.backgroundImage">
        <BaseButton 
          variant="primary" 
          size="small" 
          outlined 
          fullwidth
          @click="$emit('reset-transform')"
          :disabled="!venue.backgroundImage"
        >
          <span class="icon is-small">
            <i class="bi bi-arrow-counterclockwise"></i>
          </span>
          <span>Reset Transform</span>
        </BaseButton>
        <BaseButton 
          variant="danger" 
          size="small" 
          fullwidth
          class="mt-2"
          @click="$emit('remove-background')"
          :disabled="!venue.backgroundImage"
        >
          Remove Background
        </BaseButton>
      </div>
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
        <BaseButton variant="light" size="small" @click="$emit('move-background', 0, -1)"><i class="bi bi-arrow-down-short" style="transform: rotate(180deg); font-size: 18px;"></i></BaseButton>
        <div class="horizontal-arrows">
          <BaseButton variant="light" size="small" @click="$emit('move-background', -1, 0)"><i class="bi bi-arrow-left-short" style="font-size: 18px;"></i></BaseButton>
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
          <BaseButton variant="light" size="small" @click="$emit('move-background', 1, 0)"><i class="bi bi-arrow-right-short" style="font-size: 18px;"></i></BaseButton>
        </div>
        <BaseButton variant="light" size="small" @click="$emit('move-background', 0, 1)"><i class="bi bi-arrow-down-short" style="font-size: 18px;"></i></BaseButton>
      </div>
    </div>

    <!-- Rotation Control -->
    <div v-if="venue.backgroundImage" class="settings-group">
      <label>Rotation</label>
      <div class="curvature-controls">
        <BaseButton variant="light" @click="$emit('rotate-background', -5)"><i class="bi bi-arrow-counterclockwise" style="font-size: 20px;"></i></BaseButton>
        <span class="curvature-value">{{ venue.backgroundImage.rotation }}°</span>
        <BaseButton variant="light" @click="$emit('rotate-background', 5)"><i class="bi bi-arrow-clockwise" style="font-size: 20px;"></i></BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Venue } from '../../types/venue';
import BaseButton from '../BaseButton.vue';

const props = defineProps<{
  venue: Venue;
  moveStep: number;
}>();

const emit = defineEmits<{
  (e: 'update:venue', venue: Venue): void;
  (e: 'update:moveStep', value: number): void;
  (e: 'remove-background'): void;
  (e: 'move-background', dx: number, dy: number): void;
  (e: 'reset-transform'): void;
  (e: 'rotate-background', angle: number): void;
  (e: 'upload-background', event: Event): void;
}>();

const handleBackgroundUpload = (event: Event) => {
  emit('upload-background', event);
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

/* Upload Button */
.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 8px 12px;
  background: rgb(var(--color-primary-light));
  border: 1px solid rgb(var(--color-primary));
  border-radius: 6px;
  color: rgb(var(--color-primary));
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.25rem;
}

.upload-button:hover {
  background: rgb(var(--color-primary-light));
  border-color: rgb(var(--color-primary));
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.upload-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
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
  color: var(--text-secondary);
  text-transform: uppercase;
  line-height: 1;
}

.step-input {
  width: 36px;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
  padding: 2px 0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.8rem;
  -moz-appearance: textfield;
  appearance: textfield;
}

.step-input::-webkit-outer-spin-button,
.step-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Curvature/Rotation Controls */
.curvature-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.curvature-value {
  font-size: 1rem;
  color: var(--text-primary);
  min-width: 45px;
  text-align: center;
  font-weight: 600;
}
</style>
