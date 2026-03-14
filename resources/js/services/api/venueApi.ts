import api from './axiosInstance';
import type { Venue } from '../../types/venue';

export const venueApi = {
  list: () =>
    api.get<Venue[]>('/api/venues').then(r => r.data),

  get: (id: string) =>
    api.get<Venue>(`/api/venues/${id}`).then(r => r.data),
};
