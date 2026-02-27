<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue?: File | null;
  currentImage?: string;
  label?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Image',
  required: false
});

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
}>();

const fileInput = ref<HTMLInputElement>();
const previewUrl = ref<string>('');

watch(() => props.currentImage, (newVal) => {
  if (newVal && !previewUrl.value) {
    previewUrl.value = `/storage/${newVal}`;
  }
}, { immediate: true });

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    emit('update:modelValue', file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

function removeImage() {
  emit('update:modelValue', null);
  previewUrl.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}
</script>

<template>
  <div class="field">
    <label v-if="label" class="label" :for="label">
      {{ label }}
      <span v-if="required" class="has-text-danger">*</span>
    </label>
    
    <div class="control">
      <!-- File Input -->
      <div class="file has-name is-fullwidth mb-3">
        <label class="file-label">
          <input
            ref="fileInput"
            :id="label"
            class="file-input"
            type="file"
            accept="image/*"
            @change="handleFileChange"
            :required="required && !previewUrl"
          />
          <span class="file-cta">
            <span class="file-icon">
              <i class="bi bi-upload"></i>
            </span>
            <span class="file-label">
              Choose a file...
            </span>
          </span>
          <span class="file-name">
            {{ fileInput?.files?.[0]?.name || 'No file selected' }}
          </span>
        </label>
      </div>
      
      <!-- Image Preview -->
      <div v-if="previewUrl" class="box is-paddingless" style="position: relative; max-width: 400px; display: inline-block;">
        <img 
          :src="previewUrl" 
          alt="Preview" 
          style="display: block; width: 100%; border-radius: 6px; aspect-ratio: 16 / 9; object-fit: cover;"
        />
        <button
          type="button"
          @click="removeImage"
          class="delete is-medium"
          style="position: absolute; top: 0.5rem; right: 0.5rem; background-color: rgba(10, 10, 10, 0.7);"
        ></button>
      </div>
      
      <p class="help has-text-grey">
        Image will be automatically resized to a 16:9 ratio (1920x1080)
      </p>
    </div>
  </div>
</template>
