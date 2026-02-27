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
        <span class="object-icon" :style="{ color: template.color }"><IconImage :name="template.icon" size="24px" /></span>
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
          <button class="curvature-btn" @click="$emit('update-property', 'rotation', ((selectedObject.rotation || 0) - 15 + 360) % 360)"><IconImage name="rotate-ccw" size="20px" /></button>
          <span class="curvature-value">{{ selectedObject.rotation || 0 }}°</span>
          <button class="curvature-btn" @click="$emit('update-property', 'rotation', ((selectedObject.rotation || 0) + 15) % 360)"><IconImage name="rotate-cw" size="20px" /></button>
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
            <button class="arrow-btn" @click="$emit('move-selection', 0, -1)"><IconImage name="arrow-up" size="18px" /></button>
            <div class="arrow-row">
              <button class="arrow-btn" @click="$emit('move-selection', -1, 0)"><IconImage name="arrow-left" size="18px" /></button>
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
              <button class="arrow-btn" @click="$emit('move-selection', 1, 0)"><IconImage name="arrow-right" size="18px" /></button>
            </div>
            <button class="arrow-btn" @click="$emit('move-selection', 0, 1)"><IconImage name="arrow-down" size="18px" /></button>
          </div>
        </div>
      </div>

      <!-- Delete and Deselect Buttons -->
      <div class="settings-group">
        <!-- <button class="action-btn delete-btn" @click="$emit('delete-object')">
          Delete Object
        </button> -->
        <button class="clear-btn" @click="$emit('deselect')" style="margin-top: 0.5rem;">
          Deselect
        </button>
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
import IconImage from '../IconImage.vue';

const props = defineProps<{
  selectedObject: VenueObject | null;
  moveStep: number;
}>();

const emit = defineEmits<{
  (e: 'add-object', type: VenueObject['type']): void;
  (e: 'update-property', property: keyof VenueObject, value: any): void;
  (e: 'move-selection', dx: number, dy: number): void;
  (e: 'update:moveStep', value: number): void;
  (e: 'delete-object'): void;
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

.arrow-btn {
  width: 30px;
  height: 30px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.2s;
}

.arrow-btn:hover {
  background: var(--bg-secondary);
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
}

.arrow-btn:active {
  transform: scale(0.95);
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

.delete-btn {
  background: var(--error-light);
  color: var(--error);
  border: 1px solid var(--error-border);
  margin-top: 0.5rem;
}

.clear-btn {
  background: transparent;
  border: 1px solid var(--border-secondary);
  color: var(--text-muted);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  width: 100%;
  text-align: center;
}

.clear-btn:hover {
  border-color: var(--error);
  color: var(--error);
}

.settings-divider {
  width: 100%;
  height: 1px;
  background: var(--border-subtle);
  margin: 1rem 0;
}
</style>
