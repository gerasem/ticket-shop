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
   * Convert mouse event to relative coordinates within an element
   */
  const getRelativeCoordinates = (event: MouseEvent, element: HTMLElement): Point => {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  // Helper: Get corners of a rotated rectangle
  const getRotatedCorners = (rect: { x: number; y: number; width: number; height: number; rotation?: number }): Point[] => {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const rotation = (rect.rotation || 0) * (Math.PI / 180);
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const corners = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height }
    ];

    return corners.map(p => ({
      x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
      y: cy + (p.x - cx) * sin + (p.y - cy) * cos
    }));
  };

  // Helper: Get axes (normals) from corners
  const getAxes = (corners: Point[]): Point[] => {
    const axes: Point[] = [];
    for (let i = 0; i < corners.length; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % corners.length];
      
      if (!p1 || !p2) continue;

      const edge = { x: p1.x - p2.x, y: p1.y - p2.y };
      axes.push({ x: -edge.y, y: edge.x }); // Normal
    }
    return axes;
  };

  // Helper: Project corners onto an axis
  const project = (corners: Point[], axis: Point): { min: number; max: number } => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of corners) {
      const proj = (p.x * axis.x + p.y * axis.y) / (Math.sqrt(axis.x * axis.x + axis.y * axis.y));
      if (proj < min) min = proj;
      if (proj > max) max = proj;
    }
    return { min, max };
  };

  // Helper: Check if projections overlap
  const overlap = (p1: { min: number; max: number }, p2: { min: number; max: number }): boolean => {
    return !(p1.max < p2.min || p2.max < p1.min);
  };

  /**
   * Check if two rotated rectangles intersect using Separating Axis Theorem (SAT)
   */
  const checkIntersection = (
    r1: { x: number; y: number; width: number; height: number; rotation?: number },
    r2: { x: number; y: number; width: number; height: number; rotation?: number }
  ): boolean => {
    const rect1Corners = getRotatedCorners(r1);
    const rect2Corners = getRotatedCorners(r2);

    const axes = [
      ...getAxes(rect1Corners),
      ...getAxes(rect2Corners)
    ];

    for (const axis of axes) {
      const p1 = project(rect1Corners, axis);
      const p2 = project(rect2Corners, axis);

      if (!overlap(p1, p2)) {
        return false;
      }
    }

    return true;
  };

  return {
    calculateRectangleBounds,
    boundsToRectangle,
    getRelativeCoordinates,
    checkIntersection
  };
}
