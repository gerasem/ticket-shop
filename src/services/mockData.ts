export interface Seat {
  id: string;
  x: number;
  y: number;
  status: 'free' | 'booked' | 'readyToBook';
  label: string;
  priceInCents: number; // Price in euro cents
}

export interface Venue {
  id: string;
  name: string;
  type: 'cinema' | 'cafe' | 'stadium';
  width: number;
  height: number;
  seats: Seat[];
  stage: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const generateMockVenue = (): Venue => {
  const seats: Seat[] = [];
  const rows = 10;
  const cols = 15;
  const seatSize = 40;
  const gap = 10;

  // Price tiers in euro cents
  const PRICE_FRONT = 1500;  // 15.00€ - First 2 rows (premium)
  const PRICE_MIDDLE = 1200; // 12.00€ - Middle rows
  const PRICE_BACK = 1800;   // 18.00€ - Last 2 rows (VIP)

  for (let r = 0; r < rows; r++) {
    // Determine price based on row
    let price: number;
    if (r < 2) {
      price = PRICE_FRONT; // First 2 rows
    } else if (r >= rows - 2) {
      price = PRICE_BACK; // Last 2 rows
    } else {
      price = PRICE_MIDDLE; // Middle rows
    }

    for (let c = 0; c < cols; c++) {
      seats.push({
        id: `r${r}-c${c}`,
        x: c * (seatSize + gap) + 50,
        y: r * (seatSize + gap) + 50,
        status: Math.random() > 0.8 ? 'booked' : 'free',
        label: `${r + 1}-${c + 1}`,
        priceInCents: price
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
    stage: {
      x: 100,
      y: 20,
      width: 600,
      height: 40
    }
  };
};
