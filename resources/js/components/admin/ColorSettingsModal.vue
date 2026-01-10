<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import IconImage from '../ui/IconImage.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Color categories and their variables
interface ColorVariable {
  name: string;
  variable: string;
  value: string;
}

const colorCategories = ref<{ category: string; colors: ColorVariable[] }[]>([]);

// Initialize colors from CSS variables
const initializeColors = () => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  colorCategories.value = [
    {
      category: 'Background Colors',
      colors: [
        { name: 'Primary', variable: '--color-bg-primary', value: computedStyle.getPropertyValue('--color-bg-primary').trim() },
        { name: 'Secondary', variable: '--color-bg-secondary', value: computedStyle.getPropertyValue('--color-bg-secondary').trim() },
        { name: 'Tertiary', variable: '--color-bg-tertiary', value: computedStyle.getPropertyValue('--color-bg-tertiary').trim() },
        { name: 'Modal', variable: '--color-bg-modal', value: computedStyle.getPropertyValue('--color-bg-modal').trim() }
      ]
    },
    {
      category: 'Text Colors',
      colors: [
        { name: 'Primary', variable: '--color-text-primary', value: computedStyle.getPropertyValue('--color-text-primary').trim() },
        { name: 'Secondary', variable: '--color-text-secondary', value: computedStyle.getPropertyValue('--color-text-secondary').trim() },
        { name: 'Tertiary', variable: '--color-text-tertiary', value: computedStyle.getPropertyValue('--color-text-tertiary').trim() },
        { name: 'Muted', variable: '--color-text-muted', value: computedStyle.getPropertyValue('--color-text-muted').trim() }
      ]
    },
    {
      category: 'Accent Colors',
      colors: [
        { name: 'Accent', variable: '--color-accent', value: computedStyle.getPropertyValue('--color-accent').trim() },
        { name: 'Accent Hover', variable: '--color-accent-hover', value: computedStyle.getPropertyValue('--color-accent-hover').trim() }
      ]
    },
    {
      category: 'Danger Colors',
      colors: [
        { name: 'Danger', variable: '--color-danger', value: computedStyle.getPropertyValue('--color-danger').trim() },
        { name: 'Danger Hover', variable: '--color-danger-hover', value: computedStyle.getPropertyValue('--color-danger-hover').trim() }
      ]
    },
    {
      category: 'Border Colors',
      colors: [
        { name: 'Border', variable: '--color-border', value: computedStyle.getPropertyValue('--color-border').trim() },
        { name: 'Border Focus', variable: '--color-border-focus', value: computedStyle.getPropertyValue('--color-border-focus').trim() }
      ]
    }
  ];
};

// Modal state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Close modal
const closeModal = () => {
  isOpen.value = false;
};

// Update color variable
const updateColor = (colorVar: ColorVariable, newValue: string) => {
  colorVar.value = newValue;
  document.documentElement.style.setProperty(colorVar.variable, newValue);
};

// Reset to defaults
const resetToDefaults = () => {
  if (confirm('Reset all colors to default values?')) {
    // Remove all custom properties to revert to CSS defaults
    colorCategories.value.forEach(category => {
      category.colors.forEach(color => {
        document.documentElement.style.removeProperty(color.variable);
      });
    });
    // Reinitialize
    initializeColors();
  }
};

// Handle backdrop click
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal();
  }
};

// Initialize when modal opens
onMounted(() => {
  initializeColors();
});
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
            <h2>Manage Colors</h2>
            <button class="close-btn" @click="closeModal"><IconImage name="x" size="20px" /></button>
          </div>
          
          <!-- Content -->
          <div class="modal-content">
            <div 
              v-for="categoryGroup in colorCategories" 
              :key="categoryGroup.category"
              class="category-section"
            >
              <h3 class="category-title">{{ categoryGroup.category }}</h3>
              <div class="colors-grid">
                <div 
                  v-for="color in categoryGroup.colors" 
                  :key="color.variable"
                  class="color-field"
                >
                  <label>{{ color.name }}</label>
                  <div class="color-input-wrapper">
                    <input 
                      :value="color.value"
                      @input="updateColor(color, ($event.target as HTMLInputElement).value)"
                      type="color" 
                      class="color-picker"
                    />
                    <input 
                      :value="color.value"
                      @input="updateColor(color, ($event.target as HTMLInputElement).value)"
                      type="text" 
                      class="color-text"
                      :placeholder="color.variable"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="modal-footer">
            <button class="reset-btn" @click="resetToDefaults">Reset to Defaults</button>
            <button class="close-footer-btn" @click="closeModal">Close</button>
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
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-secondary);
  width: 90%;
  max-width: 700px;
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
  border-bottom: 1px solid var(--border-secondary);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
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
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.category-section {
  margin-bottom: 2rem;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 600;
  margin: 0 0 1rem 0;
  letter-spacing: 0.5px;
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.color-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.color-field label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 500;
}

.color-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker {
  width: 50px;
  height: 38px;
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.color-text {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-family: monospace;
}

.color-text:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-secondary);
}

.reset-btn {
  background: var(--error-light);
  color: var(--error);
  border: 1px solid var(--error-border);
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #fee2e2;
}

.close-footer-btn {
  background: rgb(var(--color-primary));
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.close-footer-btn:hover {
  background: rgb(var(--color-primary-hover));
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
