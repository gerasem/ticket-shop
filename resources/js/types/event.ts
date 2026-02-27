import type { Venue } from './venue';

export interface AppEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue_id: string;
  image?: string;
  venue?: Venue;
}
