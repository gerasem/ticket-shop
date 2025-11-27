/**
 * Composable for geometric calculations
 * Provides utilities for working with rectangles and coordinates
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RectangleBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function useGeometry() {
  /**
   * Calculate rectangle bounds from two points
   */
  const calculateRectangleBounds = (start: Point, end: Point): RectangleBounds => {
    return {
      minX: Math.min(start.x, end.x),
      maxX: Math.max(start.x, end.x),
      minY: Math.min(start.y, end.y),
      maxY: Math.max(start.y, end.y)
    };
  };

  /**
   * Convert rectangle bounds to a rectangle object
   */
  const boundsToRectangle = (bounds: RectangleBounds): Rectangle => {
    return {
      left: bounds.minX,
      top: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY
    };
  };

  /**
   * Get element's bounding rectangle relative to viewport
   */
  const getElementRect = (element: HTMLElement): DOMRect => {
    return element.getBoundingClientRect();
  };

  /**
   * Convert mouse event to relative coordinates within an element
   */
  const getRelativeCoordinates = (event: MouseEvent, element: HTMLElement): Point => {
    const rect = getElementRect(element);
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  return {
    calculateRectangleBounds,
    boundsToRectangle,
    getElementRect,
    getRelativeCoordinates
  };
}
