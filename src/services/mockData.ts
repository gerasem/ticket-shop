import type { VenueObject } from '../types/venueObjects';

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
  originalX?: number; // Store original position for curvature reset
  originalY?: number;
  rotation?: number; // Rotation angle in degrees (0-360)
  status: 'free' | 'booked' | 'readyToBook';
  row: number; // Row number (1-indexed)
  place: number; // Place/column number (1-indexed)
  typeId: string; // Reference to SeatType.id
}

export interface Venue {
  id: string;
  name: string;
  type: 'cinema' | 'cafe' | 'stadium';
  width: number;
  height: number;
  seats: Seat[];
  seatTypes: SeatType[]; // Available seat types
  curvature: number; // 0-100, percentage of arc curvature towards stage
  defaultSeatStyle: {
    color: string;        // Background color (hex)
    width: number;        // Width in pixels
    height: number;       // Height in pixels
    borderRadius: string; // '8px' for square, '50%' for circle
  };
  backgroundImage?: {
    url: string;          // Image URL or Data URL
    scale: number;        // Scale percentage (e.g., 100 = 100%)
    x: number;            // Horizontal position in pixels
    y: number;            // Vertical position in pixels
    rotation: number;     // Rotation in degrees
  };
  objects?: VenueObject[];
}

export const generateMockVenue = (): Venue => {
  const seats: Seat[] = [];
  const rows = 10;
  const cols = 15;
  const seatSize = 40;
  const gap = 10;
  let seatCounter = 1;

  for (let r = 0; r < rows; r++) {
    // Determine type based on row
    let typeId: string;
    if (r < 2) {
      typeId = 'premium'; // First 2 rows
    } else if (r >= rows - 2) {
      typeId = 'vip'; // Last 2 rows
    } else {
      typeId = 'standard'; // Middle rows (default)
    }

    for (let c = 0; c < cols; c++) {
      seats.push({
        id: `seat-${seatCounter++}`,
        x: c * (seatSize + gap) + 50,
        y: r * (seatSize + gap) + 130,
        status: Math.random() > 0.8 ? 'booked' : 'free',
        row: r + 1,
        place: c + 1,
        typeId: typeId,
        rotation: 0
      });
    }
  }

  return {
    id: 'venue-1',
    name: 'Grand Cinema Hall 1',
    type: 'cinema',
    width: 800,
    height: 600,
    seats,
    seatTypes: [
      {
        id: 'standard',
        name: 'Standard',
        priceInCents: 1000,
        style: undefined  // Uses default venue styles
      },
      {
        id: 'premium',
        name: 'Premium',
        priceInCents: 1500,
        style: {
          color: '#3b82f6'  // Blue
        }
      },
      {
        id: 'vip',
        name: 'VIP',
        priceInCents: 2500,
        style: {
          color: '#f59e0b'  // Gold
        }
      }
    ],
    curvature: 0, // Default: straight rows
    objects: [
      {
        id: 'stage-1',
        type: 'stage',
        x: 100,
        y: 20,
        width: 600,
        height: 40,
        rotation: 0,
        label: 'SCREEN / STAGE'
      }
    ],
    defaultSeatStyle: {
      color: '#4a5568',     // Default gray
      width: 30,
      height: 30,
      borderRadius: '8px'   // Square by default
    }
  };
};
