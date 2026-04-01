/**
 * @file coordinateTransform.ts
 * @description Mathematics for transforming points between coordinate frames (e.g., local to world).
 */

import type { Point2D } from '../types/telemetry'

/**
 * Transforms a robot-local coordinate to world coordinates given a specific pose.
 * 
 * Uses a 2D Rigid Transformation (Rotation then Translation):
 * WorldX = PoseX + (LocalX * cos(theta) - LocalY * sin(theta))
 * WorldY = PoseY + (LocalX * sin(theta) + LocalY * cos(theta))
 * 
 * @param local - The [x, y] coordinate in the robot's local frame.
 * @param px - The robot's X position in the world frame.
 * @param py - The robot's Y position in the world frame.
 * @param theta - The robot's heading (rotation) in radians.
 * @returns The transformed [x, y] coordinate in the world frame.
 */
export const transformPoint = (
  local: Point2D,
  px: number,
  py: number,
  theta: number
): Point2D => {
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  return [
    px + local[0] * cos - local[1] * sin,
    py + local[0] * sin + local[1] * cos
  ]
}
