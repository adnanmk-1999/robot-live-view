import type { Point2D } from '../types/telemetry'

/**
 * Calculates the Euclidean distance between two 2D points.
 */
export const distance = (a: Point2D, b: Point2D): number => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculates the total path length by accumulating Euclidean
 * distances between consecutive waypoints.
 * @returns Total length in meters (same unit as the input coordinates)
 */
export const calculatePathLength = (path: Point2D[]): number => {
  if (path.length < 2) return 0

  let total = 0
  for (let i = 1; i < path.length; i++) {
    total += distance(path[i - 1], path[i])
  }
  return total
}
