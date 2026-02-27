import api from './axiosInstance';
import type { Event } from '../../types/event';

type CreateEventData = FormData | Omit<Event, 'id'>;
type UpdateEventData = FormData | Partial<Event>;

const getConfig = (data: CreateEventData | UpdateEventData) =>
  data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

export const eventsApi = {
  list: () =>
    api.get<Event[]>('/api/events').then(r => r.data),

  create: (data: CreateEventData) =>
    api.post<Event>('/api/events', data, getConfig(data)).then(r => r.data),

  update: (id: number, data: UpdateEventData) =>
    api.put<Event>(`/api/events/${id}`, data, getConfig(data)).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/events/${id}`),
};
