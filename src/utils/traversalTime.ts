/**
 * @file traversalTime.ts
 * @description Advanced Kinematic Velocity Profiling with Acceleration Look-ahead.
 * Handles high-speed straights and smooth deceleration for sharp curves.
 */

import type { Point2D } from '../types/telemetry'
import { distance } from './euclideanDistance'
import { computeCurvatures } from './curvature'
import { targetVelocityFromCurvature } from './targetVelocity'

import { ROBOT_CONFIG } from '../config/robotConfig'


/**
 * Encapsulates the results of a time-velocity profile calculation.
 */
export interface TraversalResult {
  totalTimeSeconds: number
  velocityProfile: number[]
  curvatures: number[]
  waypointTimestamps: number[]
}

/**
 * Estimates total traversal time using a TWO-PASS Kinematic Optimizer.
 * Respects linear acceleration, angular velocity, and angular acceleration limits.
 * 
 * Algorithm:
 * 1. Compute target velocities based on local curvature.
 * 2. Forward Pass: Clamp velocity v[i+1] such that a < A_MAX AND alpha < ALPHA_MAX relative to v[i].
 * 3. Backward Pass: Clamp velocity v[i] similarly to ensure safely reaching v[i+1].
 *
 * @param path - Smoothed waypoints [x, y].
 * @returns Kinematically smoothed performance profile.
 */
export const calculateTraversalTime = (path: Point2D[]): TraversalResult => {
  const empty: TraversalResult = { totalTimeSeconds: 0, velocityProfile: [], curvatures: [], waypointTimestamps: [] }
  if (path.length < 2) return empty

  const n = path.length
  const curvatures = computeCurvatures(path)
  
  // Distances between waypoints
  const s: number[] = []
  for (let i = 0; i < n - 1; i++) {
    s.push(distance(path[i], path[i + 1]))
  }

  // ── PASS 0: Raw Target Velocities ───────────────────────────────────────
  const vTarget = curvatures.map(k => targetVelocityFromCurvature(k))

  // ── PASS 1: Forward Pass (Acceleration + Alpha Constraint) ──────────────
  const vFwd = new Array(n).fill(ROBOT_CONFIG.V_MIN)
  vFwd[0] = ROBOT_CONFIG.V_MIN
  for (let i = 0; i < n - 1; i++) {
    const s_i = s[i] || 1e-6
    const k_curr = curvatures[i]
    const k_next = curvatures[i+1]

    // (A) Linear Accel Limit: v_next^2 = v_curr^2 + 2 * a * s
    const vMaxByLinear = Math.sqrt(vFwd[i] ** 2 + 2 * ROBOT_CONFIG.A_MAX * s_i)

    // (B) Angular Accel Limit: |omega_next - omega_curr| / dt < alpha_max
    const omega_curr = vFwd[i] * k_curr
    const max_omega_next = omega_curr + (ROBOT_CONFIG.ALPHA_MAX * s_i / (vFwd[i] || 1e-6))
    const vMaxByAlpha = k_next > 0 ? max_omega_next / k_next : ROBOT_CONFIG.V_MAX

    vFwd[i + 1] = Math.min(vTarget[i + 1], vMaxByLinear, vMaxByAlpha)
  }

  // ── PASS 2: Backward Pass (Deceleration + Alpha Constraint) ────────────
  const vFinal = [...vFwd]
  vFinal[n - 1] = ROBOT_CONFIG.V_MIN
  for (let i = n - 2; i >= 0; i--) {
    const s_i = s[i] || 1e-6
    const k_curr = curvatures[i]
    const k_next = curvatures[i+1]

    const vMaxByLinear = Math.sqrt(vFinal[i + 1] ** 2 + 2 * ROBOT_CONFIG.A_MAX * s_i)

    const omega_next = vFinal[i + 1] * k_next
    const max_omega_curr = omega_next + (ROBOT_CONFIG.ALPHA_MAX * s_i / (vFinal[i + 1] || 1e-6))
    const vMaxByAlpha = k_curr > 0 ? max_omega_curr / k_curr : ROBOT_CONFIG.V_MAX

    vFinal[i] = Math.min(vFinal[i], vMaxByLinear, vMaxByAlpha)
  }

  // ── PASS 3: Time Integration ─────────────────────────────────────────────
  const waypointTimestamps: number[] = [0]
  const velocityProfile: number[] = [] 
  let totalTime = 0

  for (let i = 0; i < n - 1; i++) {
    // Use average velocity for the segment
    const vAvg = (vFinal[i] + vFinal[i + 1]) / 2
    const dt = s[i] / (vAvg || ROBOT_CONFIG.V_MIN)
    
    totalTime += dt
    waypointTimestamps.push(totalTime)
    velocityProfile.push(vAvg)
  }

  return { 
    totalTimeSeconds: totalTime, 
    velocityProfile, 
    curvatures, 
    waypointTimestamps 
  }
}
