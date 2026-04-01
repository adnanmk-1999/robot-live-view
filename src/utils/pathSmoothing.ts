/**
 * @file pathSmoothing.ts
 * @description Path geometry smoothing to remove high-frequency noise from telemetry data.
 */

import type { Point2D } from '../types/telemetry'

/**
 * Applies a weighted moving average filter to a 2D path.
 * This is effective at removing "stair-stepping" or "jagged" noise from telemetry sensors.
 *
 * @param path - Original array of waypoints [x, y].
 * @param windowSize - Number of neighboring points to consider (odd integer recommended).
 * @returns Smoothed path.
 */
export const smoothPathMetric = (path: Point2D[], windowSize: number = 3): Point2D[] => {
  if (path.length < windowSize) return [...path]

  const smoothed: Point2D[] = []
  const halfWindow = Math.floor(windowSize / 2)

  for (let i = 0; i < path.length; i++) {
    let sumX = 0
    let sumY = 0
    let count = 0

    // Boundary Handling: Use clamping (padding) instead of skipping
    // This prevents the 'pulling' effect towards the interior at boundaries
    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = Math.max(0, Math.min(path.length - 1, i + j))
      sumX += path[idx][0]
      sumY += path[idx][1]
      count++
    }

    smoothed.push([sumX / count, sumY / count])
  }

  return smoothed
}

/**
 * Applies Chaikin's Corner-Cutting Algorithm to smooth a path toward a B-Spline curve.
 * 
 * Each iteration replaces every edge (P0 → P1) with two new points:
 *   Q = (3/4)*P0 + (1/4)*P1  — 75% of the way toward P1
 *   R = (1/4)*P0 + (3/4)*P1  — 25% of the way toward P1
 * 
 * This doubles the number of points per pass, so limit to 1–2 iterations to control
 * point-count growth. The algorithm converges to a uniform cubic B-Spline.
 * 
 * @param path - Original array of waypoints [x, y].
 * @returns Smoothed path with approximately 2× the input point count.
 */
export const bSplinePath = (path: Point2D[]): Point2D[] => {
   if (path.length < 3) return path
   const smoothed: Point2D[] = []
   smoothed.push(path[0])
   for (let i = 0; i < path.length - 1; i++) {
      const p0 = path[i]
      const p1 = path[i+1]
      // Q = 3/4*P0 + 1/4*P1
      // R = 1/4*P0 + 3/4*P1
      smoothed.push([0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]])
      smoothed.push([0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]])
   }
   smoothed.push(path[path.length - 1])
   return smoothed
}

/**
 * Removes consecutive duplicate/near-duplicate points that cause
 * undefined heading angles during animation.
 */
export const deduplicatePath = (path: Point2D[], minDist: number = 0.005): Point2D[] => {
  if (path.length === 0) return []
  const result: Point2D[] = [path[0]]
  for (let i = 1; i < path.length; i++) {
    const prev = result[result.length - 1]
    const dx = path[i][0] - prev[0]
    const dy = path[i][1] - prev[1]
    if (Math.sqrt(dx * dx + dy * dy) >= minDist) {
      result.push(path[i])
    }
  }
  return result
}
