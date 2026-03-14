export interface VenueObject {
  id: string;
  type: 'stage' | 'table-round' | 'table-rect' | 'wall' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  label?: string;
  color?: string;
  fontSize?: number;
  attachedSeatIds?: string[]; // For future seat binding
}
