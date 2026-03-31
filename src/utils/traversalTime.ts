/**
 * @file traversalTime.ts
 * @description Curvature-based velocity profiling and total traversal time estimation.
 */

import type { Point2D } from '../types/telemetry'
import { distance } from './euclideanDistance'
import { computeCurvatures } from './curvature'

// ── Kinematic constants from the problem specification ───────────────────────

/** Curvature [1/m] above which the robot must begin slowing down. */
const K_CRIT = 0.5;

/** Maximum curvature [1/m] at which minimum speed is reached. */
const K_MAX  = 10.0;

/** Minimum robot speed [m/s] used in sharp turns. */
const V_MIN  = 0.15;

/** Maximum robot speed [m/s] used on straights or flat curves. */
const V_MAX  = 1.1;

/** Pre-calculated slope for the piecewise linear velocity model. */
const SLOPE = (V_MAX - V_MIN) / (K_MAX - K_CRIT);

/**
 * Maps a curvature value κ [1/m] to a robot velocity [m/s].
 * 
 * Logic:
 * - κ < K_CRIT: Use V_MAX (full speed)
 * - K_CRIT <= κ < K_MAX: Linearly interpolate between V_MAX and V_MIN
 * - κ >= K_MAX: Use V_MIN (crawl speed)
 * 
 * @param kappa - Path curvature in 1/m.
 * @returns Computed velocity in m/s.
 */
export const velocityFromCurvature = (kappa: number): number => {
  if (kappa < K_CRIT) return V_MAX
  if (kappa >= K_MAX) return V_MIN
  return V_MAX - SLOPE * (kappa - K_CRIT)
}

/**
 * Encapsulates the results of a time-velocity profile calculation.
 */
export interface TraversalResult {
  /** Aggregated time to complete the entire path in seconds. */
  totalTimeSeconds: number
  /** Velocity computed for each segment [i -> i+1]. Length = path.length - 1. */
  velocityProfile: number[]
  /** Curvature computed for each waypoint. Length = path.length. */
  curvatures: number[]
  /** Cumulative traversal time at each waypoint. Length = path.length. */
  waypointTimestamps: number[]
}

/**
 * Estimates the total traversal time using a piecewise velocity-curvature model.
 *
 * For each sequential path segment:
 * 1. Calculate the average curvature using the segment's endpoints.
 * 2. Determine segment velocity via the velocity-curvature mapping.
 * 3. Segment time = segment_distance / velocity.
 *
 * @param path - Array of robot waypoints [x, y].
 * @returns TraversalResult with timing and velocity details.
 */
export const calculateTraversalTime = (path: Point2D[]): TraversalResult => {
  const empty: TraversalResult = { totalTimeSeconds: 0, velocityProfile: [], curvatures: [], waypointTimestamps: [] }
  if (path.length < 2) return empty

  // Calculate per-point curvatures first
  const curvatures = computeCurvatures(path)
  const velocityProfile: number[] = []
  // Track cumulative time starting at 0s for the first point
  const waypointTimestamps: number[] = [0]
  let totalTimeSeconds = 0

  // Integrate segment times along the path
  for (let i = 0; i < path.length - 1; i++) {
    const segLen = distance(path[i], path[i + 1])
    
    // Use average curvature for the segment to derive velocity
    const kAvg = (curvatures[i] + curvatures[i + 1]) / 2
    const v = velocityFromCurvature(kAvg)

    velocityProfile.push(v)
    
    // Increment total time and store waypoint timestamp
    if (v > 0) {
      totalTimeSeconds += segLen / v
    }
    waypointTimestamps.push(totalTimeSeconds)
  }

  return { totalTimeSeconds, velocityProfile, curvatures, waypointTimestamps }
}
