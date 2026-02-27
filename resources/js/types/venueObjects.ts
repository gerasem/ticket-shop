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

export interface ObjectTemplate {
  type: VenueObject['type'];
  defaultWidth: number;
  defaultHeight: number;
  label: string;
  icon: string; // Emoji or icon
  color: string; // Visual color
}

export const OBJECT_TEMPLATES: ObjectTemplate[] = [
  {
    type: 'stage',
    defaultWidth: 300,
    defaultHeight: 100,
    label: 'SCREEN / STAGE',
    icon: 'bi-display',
    color: '#555555'
  },
  {
    type: 'table-round',
    defaultWidth: 80,
    defaultHeight: 80,
    label: 'Table',
    icon: 'bi-circle',
    color: '#8b4513'
  },
  {
    type: 'table-rect',
    defaultWidth: 120,
    defaultHeight: 60,
    label: 'Table',
    icon: 'bi-square',
    color: '#8b4513'
  },
  {
    type: 'wall',
    defaultWidth: 200,
    defaultHeight: 20,
    label: 'Wall',
    icon: 'bi-dash-lg',
    color: '#2c3e50'
  },
  {
    type: 'text',
    defaultWidth: 100,
    defaultHeight: 30,
    label: 'Text',
    icon: 'bi-fonts',
    color: '#000000'
  }
];
