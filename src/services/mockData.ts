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

export const getVenueById = (id: string): Venue => {
  // Default to cinema if not found or generic
  if (id.includes('stadium')) {
    return generateStadium(id);
  } else if (id.includes('cafe')) {
    return generateCafe(id);
  } else {
    return generateCinema(id);
  }
};

const generateCinema = (id: string): Venue => {
  const seats: Seat[] = [];
  const rows = 8;
  const cols = 12;
  const seatSize = 40;
  const gap = 10;
  let seatCounter = 1;

  for (let r = 0; r < rows; r++) {
    let typeId = 'standard';
    if (r >= rows - 2) typeId = 'vip';

    for (let c = 0; c < cols; c++) {
      seats.push({
        id: `${id}-seat-${seatCounter++}`,
        x: c * (seatSize + gap) + 100,
        y: r * (seatSize + gap) + 150,
        status: Math.random() > 0.8 ? 'booked' : 'free',
        row: r + 1,
        place: c + 1,
        typeId: typeId,
        rotation: 0
      });
    }
  }

  return {
    id,
    name: 'Cinema Hall',
    type: 'cinema',
    width: 800,
    height: 600,
    seats,
    seatTypes: [
      { id: 'standard', name: 'Standard', priceInCents: 1200, style: { color: '#4a5568' } },
      { id: 'vip', name: 'VIP', priceInCents: 2000, style: { color: '#f59e0b' } }
    ],
    curvature: 15,
    objects: [
      { id: `${id}-screen`, type: 'stage', x: 100, y: 20, width: 600, height: 40, rotation: 0, label: 'SCREEN' }
    ],
    defaultSeatStyle: { color: '#4a5568', width: 30, height: 30, borderRadius: '8px' }
  };
};

const generateStadium = (id: string): Venue => {
  const seats: Seat[] = [];
  const rows = 12;
  const cols = 20;
  const seatSize = 30;
  const gap = 5;
  let seatCounter = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Create a curve
      const yOffset = Math.pow(c - cols / 2, 2) / 2;
      
      seats.push({
        id: `${id}-seat-${seatCounter++}`,
        x: c * (seatSize + gap) + 50,
        y: r * (seatSize + gap) + 150 + yOffset,
        status: Math.random() > 0.9 ? 'booked' : 'free',
        row: r + 1,
        place: c + 1,
        typeId: 'standard',
        rotation: (c - cols / 2) * 2 // Rotate towards center
      });
    }
  }

  return {
    id,
    name: 'Grand Stadium',
    type: 'stadium',
    width: 1000,
    height: 800,
    seats,
    seatTypes: [
      { id: 'standard', name: 'General Admission', priceInCents: 5000, style: { color: '#3b82f6' } }
    ],
    curvature: 0,
    objects: [
      { id: `${id}-stage`, type: 'stage', x: 200, y: 50, width: 600, height: 80, rotation: 0, label: 'MAIN STAGE' }
    ],
    defaultSeatStyle: { color: '#3b82f6', width: 25, height: 25, borderRadius: '4px' }
  };
};

const generateCafe = (id: string): Venue => {
  const seats: Seat[] = [];
  const tables = 8;
  
  for (let t = 0; t < tables; t++) {
    const tx = (t % 4) * 180 + 100;
    const ty = Math.floor(t / 4) * 180 + 150;
    
    // 4 seats around a table
    seats.push({ id: `${id}-s-${t}-1`, x: tx, y: ty - 40, status: 'free', row: t + 1, place: 1, typeId: 'standard', rotation: 0 });
    seats.push({ id: `${id}-s-${t}-2`, x: tx, y: ty + 40, status: 'free', row: t + 1, place: 2, typeId: 'standard', rotation: 180 });
    seats.push({ id: `${id}-s-${t}-3`, x: tx - 40, y: ty, status: 'free', row: t + 1, place: 3, typeId: 'standard', rotation: -90 });
    seats.push({ id: `${id}-s-${t}-4`, x: tx + 40, y: ty, status: 'free', row: t + 1, place: 4, typeId: 'standard', rotation: 90 });
  }

  return {
    id,
    name: 'Jazz Cafe',
    type: 'cafe',
    width: 800,
    height: 600,
    seats,
    seatTypes: [
      { id: 'standard', name: 'Table Seat', priceInCents: 500, style: { color: '#10b981' } }
    ],
    curvature: 0,
    objects: [
      { id: `${id}-stage`, type: 'stage', x: 300, y: 20, width: 200, height: 60, rotation: 0, label: 'BAND' }
    ],
    defaultSeatStyle: { color: '#10b981', width: 35, height: 35, borderRadius: '50%' }
  };
};

// Keep generateMockVenue for backward compatibility if needed, but alias it
export const generateMockVenue = () => getVenueById('default');
