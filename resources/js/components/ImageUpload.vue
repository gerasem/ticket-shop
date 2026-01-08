<script setup lang="ts">
import { ref, watch } from 'vue';
import { Label } from './ui/label';

interface Props {
  modelValue?: File | null;
  currentImage?: string;
  label?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Изображение',
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
  <div class="space-y-2">
    <Label :for="label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </Label>
    
    <div class="space-y-3">
      <!-- File Input -->
      <input
        ref="fileInput"
        :id="label"
        type="file"
        accept="image/*"
        @change="handleFileChange"
        :required="required && !previewUrl"
        class="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
      />
      
      <!-- Image Preview -->
      <div v-if="previewUrl" class="relative">
        <img 
          :src="previewUrl" 
          alt="Preview" 
          class="w-full max-w-md rounded-lg border border-zinc-200 object-cover"
          style="aspect-ratio: 16 / 9;"
        />
        <button
          type="button"
          @click="removeImage"
          class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <p class="text-xs text-zinc-500">
        Изображение будет автоматически изменено до соотношения 16:9 (1920x1080)
      </p>
    </div>
  </div>
</template>
