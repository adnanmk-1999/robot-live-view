/**
 * @file targetVelocity.ts
 * @description Constant-time velocity modeling based on path geometry and physical constraints.
 */

import { ROBOT_CONFIG } from '../config/robotConfig'

/** 
 * Pre-calculated slope for the piecewise linear velocity model. 
 * Represents the deceleration rate relative to curvature increase between K_CRIT and K_MAX.
 */
const SLOPE = (ROBOT_CONFIG.V_MAX - ROBOT_CONFIG.V_MIN) / (ROBOT_CONFIG.K_MAX - ROBOT_CONFIG.K_CRIT)

/**
 * Maps path curvature κ to a baseline target velocity based on road/track geometry 
 * and physical angular velocity limits.
 * 
 * The target velocity is the minimum of two constraints:
 * 1. Piecewise Linear Model: A simple heuristic that slows down linearly as curvature increases.
 * 2. Physical Angular Constraint: Ensures v * kappa <= omega_max (centripetal limit).
 * 
 * @param kappa - Path curvature (1/radius) at the current point.
 * @returns The ideal target velocity in m/s.
 */
export const targetVelocityFromCurvature = (kappa: number): number => {
  // 1. Piecewise Linear Model (Heuristic)
  let v: number = ROBOT_CONFIG.V_MAX
  if (kappa >= ROBOT_CONFIG.K_MAX) {
    v = ROBOT_CONFIG.V_MIN
  } else if (kappa >= ROBOT_CONFIG.K_CRIT) {
    v = ROBOT_CONFIG.V_MAX - SLOPE * (kappa - ROBOT_CONFIG.K_CRIT)
  }
  
  // 2. Physical Angular Constraint: v <= omega_max / kappa
  // Prevents the robot from exceeding its maximum turning speed.
  // Uses a small epsilon (1e-6) to avoid division by zero on straight lines.
  const vOmega = Math.max(ROBOT_CONFIG.V_MIN, ROBOT_CONFIG.OMEGA_MAX / (kappa || 1e-6))
  
  // Return the most restrictive (minimum) velocity
  return Math.min(v, vOmega)
}
