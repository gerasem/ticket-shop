/**
 * Constants for the venue editor
 */

export const EDITOR_CONSTANTS = {
  // Seat dimensions
  SEAT_SIZE: 30,
  
  // Grid and layout
  ROW_LABEL_WIDTH: 40,
  COLUMN_LABEL_HEIGHT: 30,
  GRID_HEIGHT: 600,
  
  // Spacing
  SEATING_AREA_GAP: 20,
  SEATING_AREA_PADDING: 20,
  
  // Z-index layers
  Z_INDEX: {
    SEAT: 1,
    SELECTED_SEAT: 10,
    SELECTION_RECTANGLE: 5
  }
} as const;

export type EditMode = 'select' | 'area';
