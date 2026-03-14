import api from './axiosInstance';
import type { AppEvent } from '../../types/event';

export const eventsApi = {
  list: () =>
    api.get<AppEvent[]>('/api/events').then(r => r.data),
};
