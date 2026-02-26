// Define basic object types for the venue editor
export interface VenueObject {
  id: string;
  type: 'stage' | 'wall' | 'door' | 'text' | 'decor' | string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
  style?: Record<string, any>;
}
