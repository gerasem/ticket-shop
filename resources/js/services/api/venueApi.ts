import api from './axiosInstance';
import type { Venue } from '../../types/venue';

export const venueApi = {
  list: () =>
    api.get<Venue[]>('/api/venues').then(r => r.data),

  get: (id: string) =>
    api.get<Venue>(`/api/venues/${id}`).then(r => r.data),

  create: (data: { name: string; width: number; height: number }) =>
    api.post<Venue>('/api/venues', data).then(r => r.data),

  save: (id: string, data: Venue) =>
    api.put<Venue>(`/api/venues/${id}`, data).then(r => r.data),

  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{url: string}>(`/api/venues/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data.url);
  },

  delete: (id: string) =>
    api.delete(`/api/venues/${id}`),
};
