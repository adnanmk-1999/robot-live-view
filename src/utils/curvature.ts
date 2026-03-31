/**
 * @file curvature.ts
 * @description Utilities for calculating path curvature using the Menger Curvature method.
 */

import type { Point2D } from '../types/telemetry'
import { distance } from './euclideanDistance'

/**
 * Menger curvature of 3 consecutive points using the circumscribed circle radius.
 *
 * Formula: κ = 4 * TriangleArea / (|ab| * |bc| * |ca|)
 *
 * This represents how "sharp" a turn is at point 'b' given context from 'a' and 'c'.
 *
 * @param a - Previous waypoint
 * @param b - Current waypoint (where curvature is evaluated)
 * @param c - Next waypoint
 * @returns Curvature (κ) in 1/m. Returns 0 for collinear points (perfectly straight).
 */
export const mengerCurvature = (a: Point2D, b: Point2D, c: Point2D): number => {
  const ab = distance(a, b)
  const bc = distance(b, c)
  const ca = distance(c, a)

  // Avoid division by zero for overlapping points
  const denom = ab * bc * ca
  if (denom === 0) return 0

  // Calculate the magnitude of the 2D cross product to find 2 * Area
  // Cross product: (b.x-a.x)*(c.y-a.y) - (b.y-a.y)*(c.x-a.x)
  const crossZ =
    (b[0] - a[0]) * (c[1] - a[1]) -
    (b[1] - a[1]) * (c[0] - a[0])

  const triangleArea = Math.abs(crossZ) / 2
  return (4 * triangleArea) / denom
}

/**
 * Computes the curvature at each waypoint in a path.
 *
 * - Interior points: Uses a 3-point sliding window [i-1, i, i+1]
 * - Endpoints: Curvature is clamped to the nearest valid interior calculation.
 *
 * @param path - Array of robot waypoints [x, y]
 * @returns Array of curvature values, one for each point in the input path.
 */
export const computeCurvatures = (path: Point2D[]): number[] => {
  // Edge cases for very short paths
  if (path.length < 2) return path.map(() => 0)
  if (path.length === 2) return [0, 0]

  const curvatures: number[] = new Array(path.length)

  for (let i = 0; i < path.length; i++) {
    let i0: number, i1: number, i2: number

    // Boundary handling: apply the curvature of the first/last accessible trio to the edges
    if (i === 0) {
      [i0, i1, i2] = [0, 1, 2]
    } else if (i === path.length - 1) {
      [i0, i1, i2] = [path.length - 3, path.length - 2, path.length - 1]
    } else {
      [i0, i1, i2] = [i - 1, i, i + 1]
    }

    curvatures[i] = mengerCurvature(path[i0], path[i1], path[i2])
  }

  return curvatures
}
