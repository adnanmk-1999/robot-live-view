import type { Point2D } from '../types/telemetry'
import { distance } from './euclideanDistance'
import { computeCurvatures } from './curvature'

// ── Kinematic constants from the problem statement ──────────────────────────
const K_CRIT = 0.5   // Critical curvature [1/m]
const K_MAX  = 10.0  // Maximum curvature  [1/m]
const V_MIN  = 0.15  // Minimum speed [m/s]
const V_MAX  = 1.1   // Maximum speed [m/s]

const SLOPE = (V_MAX - V_MIN) / (K_MAX - K_CRIT)

/**
 * Maps a curvature value κ [1/m] to a robot velocity [m/s]
 * using the piecewise linear model from the problem statement.
 */
export const velocityFromCurvature = (kappa: number): number => {
  if (kappa < K_CRIT) return V_MAX
  if (kappa >= K_MAX) return V_MIN
  return V_MAX - SLOPE * (kappa - K_CRIT)
}

export interface TraversalResult {
  /** Total time to traverse the path in seconds */
  totalTimeSeconds: number
  /** Per-segment velocity profile [m/s] — length = path.length - 1 */
  velocityProfile: number[]
  /** Per-point curvatures [1/m] — length = path.length */
  curvatures: number[]
}

/**
 * Computes total traversal time via the curvature-based velocity model.
 *
 * For each segment [i → i+1]:
 *   κ_avg = (κ_i + κ_{i+1}) / 2
 *   v     = v(κ_avg)
 *   t     = segment_length / v
 */
export const calculateTraversalTime = (path: Point2D[]): TraversalResult => {
  const empty: TraversalResult = { totalTimeSeconds: 0, velocityProfile: [], curvatures: [] }
  if (path.length < 2) return empty

  const curvatures = computeCurvatures(path)
  const velocityProfile: number[] = []
  let totalTimeSeconds = 0

  for (let i = 0; i < path.length - 1; i++) {
    const segLen = distance(path[i], path[i + 1])
    const kAvg = (curvatures[i] + curvatures[i + 1]) / 2
    const v = velocityFromCurvature(kAvg)

    velocityProfile.push(v)
    if (v > 0) totalTimeSeconds += segLen / v
  }

  return { totalTimeSeconds, velocityProfile, curvatures }
}
