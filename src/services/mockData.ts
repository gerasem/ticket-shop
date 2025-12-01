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
  status: 'free' | 'booked' | 'readyToBook';
  label: string;
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
  stage: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  defaultSeatStyle: {
    color: string;        // Background color (hex)
    width: number;        // Width in pixels
    height: number;       // Height in pixels
    borderRadius: string; // '8px' for square, '50%' for circle
  };
}

export const generateMockVenue = (): Venue => {
  const seats: Seat[] = [];
  const rows = 10;
  const cols = 15;
  const seatSize = 40;
  const gap = 10;

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
        id: `r${r}-c${c}`,
        x: c * (seatSize + gap) + 50,
        y: r * (seatSize + gap) + 130,
        status: Math.random() > 0.8 ? 'booked' : 'free',
        label: `${r + 1}-${c + 1}`,
        typeId: typeId
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
    stage: {
      x: 100,
      y: 20,
      width: 600,
      height: 40
    },
    defaultSeatStyle: {
      color: '#4a5568',     // Default gray
      width: 30,
      height: 30,
      borderRadius: '8px'   // Square by default
    }
  };
};
