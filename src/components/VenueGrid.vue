<script setup lang="ts">
import { toRef } from 'vue';
import { type Venue } from '../services/mockData';
import { useVenueEditor } from '../composables/useVenueEditor';

const props = defineProps<{
  venue: Venue;
}>();

const emit = defineEmits<{
  (e: 'grid-mousedown', event: MouseEvent): void;
  (e: 'stage-mousedown', event: MouseEvent): void;
  (e: 'row-click', row: number): void;
  (e: 'col-click', col: number): void;
}>();

const venueEditor = useVenueEditor(toRef(props, 'venue'));
</script>

<template>
  <div class="venue-container">
    <h2>{{ venue.name }}</h2>
    <div 
      v-if="venue.stage"
      class="stage"
      :style="{
        left: venue.stage.x + 'px',
        top: venue.stage.y + 'px',
        width: venue.stage.width + 'px',
        height: venue.stage.height + 'px'
      }"
      @mousedown.stop="emit('stage-mousedown', $event)"
    >SCREEN / STAGE</div>
    
    <!-- Top column labels -->
    <div class="column-labels-container">
      <div class="column-spacer"></div>
      <div class="column-labels">
        <div 
          v-for="col in venueEditor.getColumns.value" 
          :key="'top-' + col"
          class="column-label"
          :style="{ left: venueEditor.getColX(col) + 'px' }"
          @click="emit('col-click', col)"
        >
          {{ col }}
        </div>
      </div>
    </div>

    <div class="seating-area">
      <!-- Left row labels -->
      <div class="row-labels row-labels-left">
        <div 
          v-for="row in venueEditor.getRows.value" 
          :key="'left-' + row"
          class="row-label"
          :style="{ top: venueEditor.getRowY(row) + 'px' }"
          @click="emit('row-click', row)"
        >
          {{ row }}
        </div>
      </div>

      <!-- Seats grid -->
      <div 
        class="seats-grid"
        @mousedown="emit('grid-mousedown', $event)"
      >
        <!-- Overlay Slot (for selection rectangle) -->
        <slot name="overlay"></slot>

        <!-- Seats -->
        <template v-for="seat in venue.seats" :key="seat.id">
          <slot name="seat" :seat="seat"></slot>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../assets/venue.css';
</style>
