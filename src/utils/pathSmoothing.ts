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

    // Apply a simple symmetric window
    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = i + j
      if (idx >= 0 && idx < path.length) {
        sumX += path[idx][0]
        sumY += path[idx][1]
        count++
      }
    }

    smoothed.push([sumX / count, sumY / count])
  }

  return smoothed
}

/**
 * Optional: B-Spline based path interpolation (simplified).
 */
export const bSplinePath = (path: Point2D[]): Point2D[] => {
   if (path.length < 3) return path
   // Chaikin's Algorithm for corner cutting / smoothing
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
