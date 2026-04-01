/**
 * @file headingUtils.ts
 * @description Mathematics and search logic for calculating robot headings from waypoint paths.
 */

import type { Point2D } from '../types/telemetry'

/** 
 * Minimum distance between waypoints to consider the segment 'meaningful' for heading calculation.
 * Prevents rapid spinning or 'jitter' when waypoints are extremely close due to floating point noise.
 */
const MIN_SEGMENT_LENGTH = 0.005; // 5mm

/**
 * Calculates the heading at a specific index in a path by looking forward (ahead) 
 * for a meaningful movement, falling back to a backward search if at the end of the path.
 * 
 * @param path - Array of waypoints [x, y] in world coordinates.
 * @param index - The waypoint index to calculate the heading for.
 * @returns Heading angle in radians (-PI to PI).
 */
export const calculateHeadingAtIndex = (path: Point2D[], index: number): number => {
  if (path.length < 2) return 0
  
  // Ensure we stay within bounds
  const i = Math.max(0, Math.min(index, path.length - 1))

  // 1. SEARCH FORWARD: Walk from 'i' towards the end
  for (let k = i; k < path.length - 1; k++) {
    const dx = path[k + 1][0] - path[k][0]
    const dy = path[k + 1][1] - path[k][1]
    
    // Check if segment is longer than threshold
    if (Math.sqrt(dx * dx + dy * dy) >= MIN_SEGMENT_LENGTH) {
      return Math.atan2(dy, dx)
    }
  }

  // 2. SEARCH BACKWARD: If no forward segment is long enough, search towards the start
  for (let k = i; k > 0; k--) {
    const dx = path[k][0] - path[k - 1][0]
    const dy = path[k][1] - path[k - 1][1]
    
    if (Math.sqrt(dx * dx + dy * dy) >= MIN_SEGMENT_LENGTH) {
      return Math.atan2(dy, dx)
    }
  }

  // 3. DEFAULT: If the path has no segments >= MIN_SEGMENT_LENGTH
  return 0
}

/**
 * Batch computes headings for an entire trajectory. 
 * Effectively maps the path into an array of heading angles.
 * 
 * @param path - Array of waypoints [x, y].
 * @returns Array of heading angles in radians corresponding 1:1 with waypoints.
 */
export const computePathHeadings = (path: Point2D[]): number[] => {
  if (path.length === 0) return []
  return path.map((_, i) => calculateHeadingAtIndex(path, i))
}
