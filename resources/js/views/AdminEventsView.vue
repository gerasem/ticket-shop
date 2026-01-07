<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useEventsStore } from '../stores/events';
import { useVenueStore } from '../stores/venue';

const eventsStore = useEventsStore();
const venueStore = useVenueStore();

const showForm = ref(false);
const editingEvent = ref<any>(null);
const formData = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  venue_id: '',
  image: ''
});

onMounted(async () => {
  await Promise.all([
    eventsStore.loadEvents(),
    venueStore.loadVenues()
  ]);
});

function openCreateForm() {
  editingEvent.value = null;
  formData.value = {
    title: '',
    description: '',
    date: '',
    time: '',
    venue_id: '',
    image: ''
  };
  showForm.value = true;
}

function openEditForm(event: any) {
  editingEvent.value = event;
  formData.value = {
    title: event.title,
    description: event.description,
   date: event.date,
    time: event.time,
    venue_id: event.venue_id,
    image: event.image || ''
  };
  showForm.value = true;
}

async function saveEvent() {
  try {
    if (editingEvent.value) {
      await eventsStore.updateEvent(editingEvent.value.id, formData.value);
    } else {
      await eventsStore.createEvent(formData.value);
    }
    showForm.value = false;
  } catch (error) {
    alert('Failed to save event');
  }
}

async function deleteEvent(id: number) {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      await eventsStore.deleteEvent(id);
    } catch (error) {
      alert('Failed to delete event');
    }
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU');
}
</script>

<template>
  <div class="admin-events">
    <div class="header">
      <h1>Управление мероприятиями</h1>
      <button @click="openCreateForm" class="btn-primary">Создать мероприятие</button>
    </div>

    <!-- Empty state -->
    <div v-if="!eventsStore.isLoading && eventsStore.events.length === 0" class="empty-state">
      <p>Мероприятий пока нет</p>
      <button @click="openCreateForm" class="btn-primary">Создать мероприятие</button>
    </div>

    <!-- Events list -->
    <div v-else class="events-list">
      <div v-for="event in eventsStore.events" :key="event.id" class="event-item">
        <div class="event-info">
          <h3>{{ event.title }}</h3>
          <p class="meta">📅 {{ formatDate(event.date) }} | 🕒 {{ event.time }}</p>
          <p class="description">{{ event.description }}</p>
        </div>
        <div class="event-actions">
          <button @click="openEditForm(event)" class="btn-edit">Редактировать</button>
          <button @click="deleteEvent(event.id)" class="btn-delete">Удалить</button>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h2>{{ editingEvent ? 'Редактировать' : 'Создать' }} мероприятие</h2>
        <form @submit.prevent="saveEvent">
          <div class="form-group">
            <label>Название</label>
            <input v-model="formData.title" required />
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="formData.description" required rows="4"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Дата</label>
              <input v-model="formData.date" type="date" required />
            </div>
            <div class="form-group">
              <label>Время</label>
              <input v-model="formData.time" type="time" required />
            </div>
          </div>
          <div class="form-group">
            <label>Venue</label>
            <select v-model="formData.venue_id" required>
              <option value="">Выберите venue</option>
              <option v-for="venue in venueStore.venuesList" :key="venue.id" :value="venue.id">
                {{ venue.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>URL изображения (опционально)</label>
            <input v-model="formData.image" type="url" placeholder="https://..." />
          </div>
          <div class="form-actions">
            <button type="button" @click="showForm = false" class="btn-cancel">Отмена</button>
            <button type="submit" class="btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-events {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: var(--color-text-white);
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state p {
  color: var(--color-text-muted);
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  background: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-white);
}

.event-info .meta {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.event-info .description {
  color: var(--color-text-tertiary);
  margin: 0.5rem 0 0 0;
  max-width: 600px;
}

.event-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}

.btn-edit {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-edit:hover {
  background: #2563eb;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete:hover {
  background: #dc2626;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-white);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-white);
  font-family: inherit;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-cancel {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel:hover {
  border-color: var(--color-text-muted);
}
</style>
