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

  update: (id: number, data: UpdateEventData) => {
    // Laravel cannot parse multipart/form-data via PUT request natively.
    // We must send a POST request and spoof the PUT method.
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post<Event>(`/api/events/${id}`, data, getConfig(data)).then(r => r.data);
    }
    return api.put<Event>(`/api/events/${id}`, data, getConfig(data)).then(r => r.data);
  },

  delete: (id: number) =>
    api.delete(`/api/events/${id}`),
};
