import type { Point2D } from '../types/telemetry'
import { distance } from './euclideanDistance'

/**
 * Menger curvature of 3 consecutive points using the circumscribed circle radius.
 *
 * κ = 4 * TriangleArea / (|ab| * |bc| * |ca|)
 *
 * Returns 0 for collinear points (straight line).
 */
export const mengerCurvature = (a: Point2D, b: Point2D, c: Point2D): number => {
  const ab = distance(a, b)
  const bc = distance(b, c)
  const ca = distance(c, a)

  const denom = ab * bc * ca
  if (denom === 0) return 0

  const crossZ =
    (b[0] - a[0]) * (c[1] - a[1]) -
    (b[1] - a[1]) * (c[0] - a[0])

  const triangleArea = Math.abs(crossZ) / 2
  return (4 * triangleArea) / denom
}

/**
 * Computes the curvature at each path waypoint.
 *
 * - Interior points: Menger curvature with the window [i-1, i, i+1]
 * - Endpoints:       Nearest interior triple (forward/backward)
 */
export const computeCurvatures = (path: Point2D[]): number[] => {
  if (path.length < 2) return path.map(() => 0)
  if (path.length === 2) return [0, 0]

  const curvatures: number[] = new Array(path.length)

  for (let i = 0; i < path.length; i++) {
    let i0: number, i1: number, i2: number

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
