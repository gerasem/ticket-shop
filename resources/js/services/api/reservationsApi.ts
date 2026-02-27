import api from './axiosInstance';

export interface Reservation {
  reservation_token: string;
  expires_at: string;
}

export const reservationsApi = {
  reserve: (seatIds: string[], venueId: string) =>
    api.post<Reservation>('/api/reservations', {
      seat_ids: seatIds,
      venue_id: venueId,
    }).then(r => r.data),
};
