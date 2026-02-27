import type { VenueObject } from './venueObjects';

export interface SeatType {
  id: string;
  name: string;
  priceInCents: number;
  style?: {
    color?: string;
    width?: number;
    height?: number;
    borderRadius?: string;
  };
}

export interface Seat {
  id: string;
  x: number;
  y: number;
  originalX?: number;
  originalY?: number;
  rotation?: number;
  status: 'free' | 'booked' | 'readyToBook';
  row: number;
  place: number;
  typeId: string;
}

export interface Venue {
  id: string;
  name: string;
  type: 'cinema' | 'cafe' | 'stadium';
  width: number;
  height: number;
  seats: Seat[];
  seatTypes: SeatType[];
  curvature: number;
  defaultSeatStyle: {
    color: string;
    width: number;
    height: number;
    borderRadius: string;
  };
  backgroundImage?: {
    url: string;
    scale: number;
    x: number;
    y: number;
    rotation: number;
  };
  objects?: VenueObject[];
}
