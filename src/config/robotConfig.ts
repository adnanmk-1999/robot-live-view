/**
 * @file robotConfig.ts
 * @description Centralized kinematic parameters for the robot.
 * Tune these values to match specific machine hardware limits.
 */

export const ROBOT_CONFIG = {
  /** Maximum Linear Velocity [m/s] */
  V_MAX: 1.1,
  
  /** Minimum Linear Velocity [m/s] (crawl speed in sharp turns) */
  V_MIN: 0.15,
  
  /** Maximum Linear Acceleration/Deceleration [m/s²] */
  A_MAX: 0.5,
  
  /** Maximum Angular Velocity [rad/s] */
  OMEGA_MAX: 1.2,
  
  /** Maximum Angular Acceleration [rad/s²] */
  ALPHA_MAX: 1.6,
  
  /** Curvature [1/m] threshold where slow-down begins */
  K_CRIT: 0.5,
  
  /** Curvature [1/m] where minimum speed is reached */
  K_MAX: 10.0
} as const
