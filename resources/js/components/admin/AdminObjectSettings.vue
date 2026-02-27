<template>
  <div class="sidebar-section objects-section">
    <!-- Object Templates (show only when nothing is selected) -->
    <div v-if="!selectedObject" class="objects-templates">
      <div class="settings-subtitle">Add Object</div>
      <div 
        v-for="template in objectTemplates" 
        :key="template.type"
        class="object-template-item"
        @click="$emit('add-object', template.type)"
      >
        <span class="object-icon" :style="{ color: template.color }"><i :class="'bi ' + template.icon" style="font-size: 24px;"></i></span>
        <span class="object-label">{{ template.label }}</span>
      </div>
    </div>

    <!-- Selected Object Settings (show only when object is selected) -->
    <div v-else class="object-settings">
      <div class="settings-subtitle">Object Settings</div>
      
      <!-- Label -->
      <div class="settings-group">
        <label>Label</label>
        <input 
          type="text" 
          :value="selectedObject.label"
          @input="$emit('update-property', 'label', ($event.target as HTMLInputElement).value)"
          class="settings-input"
        />
      </div>

      <!-- Width & Height -->
      <div class="settings-row" v-if="selectedObject.type !== 'text'">
        <div class="settings-group">
          <label>Width (px)</label>
          <input 
            type="number" 
            :value="selectedObject.width"
            @input="$emit('update-property', 'width', Number(($event.target as HTMLInputElement).value))"
            class="settings-input"
            min="20"
            max="500"
          />
        </div>
        
        <div class="settings-group">
          <label>Height (px)</label>
          <input 
            type="number" 
            :value="selectedObject.height"
            @input="$emit('update-property', 'height', Number(($event.target as HTMLInputElement).value))"
            class="settings-input"
            min="20"
            max="500"
          />
        </div>
      </div>

      <!-- Rotation -->
      <div class="settings-group">
        <label>Rotation (°)</label>
        <div class="curvature-controls">
          <BaseButton variant="light" @click="$emit('update-property', 'rotation', ((selectedObject.rotation || 0) - 15 + 360) % 360)"><i class="bi bi-arrow-counterclockwise" style="font-size: 20px;"></i></BaseButton>
          <span class="curvature-value">{{ selectedObject.rotation || 0 }}°</span>
          <BaseButton variant="light" @click="$emit('update-property', 'rotation', ((selectedObject.rotation || 0) + 15) % 360)"><i class="bi bi-arrow-clockwise" style="font-size: 20px;"></i></BaseButton>
        </div>
      </div>

      <!-- Text Specific Settings -->
      <div v-if="selectedObject.type === 'text'" class="text-settings">
        <div class="settings-group">
          <label>Font Size (px)</label>
          <input 
            type="number" 
            :value="selectedObject.fontSize || 16"
            @input="$emit('update-property', 'fontSize', Number(($event.target as HTMLInputElement).value))"
            class="settings-input"
            min="8"
            max="72"
          />
        </div>
        
        <div class="settings-group">
          <label>Color</label>
          <input 
            type="color" 
            :value="selectedObject.color || '#000000'"
            @input="$emit('update-property', 'color', ($event.target as HTMLInputElement).value)"
            class="settings-input color-input"
          />
        </div>
      </div>

      <!-- Movement Controls -->
      <div class="settings-group">
        <label>Movement</label>
        <div class="movement-controls">
          <div class="arrow-grid">
            <BaseButton variant="light" size="small" @click="$emit('move-selection', 0, -1)"><i class="bi bi-arrow-up-short" style="font-size: 18px;"></i></BaseButton>
            <div class="arrow-row">
              <BaseButton variant="light" size="small" @click="$emit('move-selection', -1, 0)"><i class="bi bi-arrow-left-short" style="font-size: 18px;"></i></BaseButton>
              <div class="step-control">
                <label>STEP</label>
                <input 
                  type="number" 
                  :value="moveStep"
                  @input="$emit('update:moveStep', Number(($event.target as HTMLInputElement).value))"
                  class="step-input"
                  min="1"
                  max="100"
                />
              </div>
              <BaseButton variant="light" size="small" @click="$emit('move-selection', 1, 0)"><i class="bi bi-arrow-right-short" style="font-size: 18px;"></i></BaseButton>
            </div>
            <BaseButton variant="light" size="small" @click="$emit('move-selection', 0, 1)"><i class="bi bi-arrow-down-short" style="font-size: 18px;"></i></BaseButton>
          </div>
        </div>
      </div>

      <!-- Delete and Deselect Buttons -->
      <div class="object-actions">
        <BaseButton 
          variant="danger" 
          size="small" 
          fullwidth 
          @click="emit('delete-object', props.selectedObject.id)"
        >
          Delete Object
        </BaseButton>
        <BaseButton variant="light" size="small" outlined fullwidth class="mt-2" @click="$emit('deselect')">
          Deselect
        </BaseButton>
      </div>
    </div>

    <!-- Help Text (show only when nothing is selected) -->
    <div v-if="!selectedObject" class="settings-divider"></div>
    <div v-if="!selectedObject" style="padding: 10px; font-size: 0.75rem; color: var(--text-secondary);">
      <p style="margin: 0 0 8px 0;"><strong>Objects Tool</strong></p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Click template to add object</li>
        <li>Click object to select & edit</li>
        <li>Click empty space to deselect</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VenueObject } from '../../types/venueObjects';
import { OBJECT_TEMPLATES } from '../../types/venueObjects';
import BaseButton from '../BaseButton.vue';

const props = defineProps<{
  selectedObject: VenueObject | null;
  moveStep: number;
}>();

const emit = defineEmits<{
  (e: 'add-object', type: VenueObject['type']): void;
  (e: 'update-property', property: keyof VenueObject, value: any): void;
  (e: 'move-selection', dx: number, dy: number): void;
  (e: 'update:moveStep', value: number): void;
  (e: 'delete-object', id: string): void;
  (e: 'deselect'): void;
}>();

const objectTemplates = OBJECT_TEMPLATES;
</script>

<style scoped lang="scss">
/* Reusing styles from AdminView to ensure consistency */

.objects-section {
  width: 100%;
  padding: 0 0.25rem;
}

.objects-templates {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.object-template-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.object-template-item:hover {
  background: var(--bg-tertiary);
  border-color: rgb(var(--color-primary));
}

.object-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.object-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.object-settings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
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

.color-input {
  height: 25px;
  width: 100%;
  padding: 2px;
  cursor: pointer;
}

/* Movement Controls */
.movement-controls {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.arrow-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.arrow-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.step-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 50px;
}

.step-control label {
  font-size: 0.6rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  line-height: 1;
}

.step-input {
  width: 48px;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
  padding: 4px 2px;
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

.settings-divider {
  width: 100%;
  height: 1px;
  background: var(--border-subtle);
  margin: 1rem 0;
}
</style>
