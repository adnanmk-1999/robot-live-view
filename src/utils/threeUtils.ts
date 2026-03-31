/**
 * @file threeUtils.ts
 * @description Helper utilities for mapping 2D telemetry coordinates to 3D Three.js space.
 */

import * as THREE from 'three'
import type { Point2D } from '../types/telemetry'

/**
 * Converts a 2D telemetry point [x, y] to a 3D Three.js Vector3.
 * 
 * Mapping:
 * - Telemetry X (Forward/Horizontal) -> Three.js X
 * - Telemetry Y (Sideways/Vertical) -> Three.js -Z (to keep right-handed Y-up orientation)
 * - Resulting Y (Height) -> constant height parameter (default 0).
 * 
 * @param pt - The [x, y] point in meters.
 * @param height - The Y-height in 3D space (meters).
 * @returns Three.js Vector3
 */
export const toVector3 = (pt: Point2D, height: number = 0): THREE.Vector3 => {
  return new THREE.Vector3(pt[0], height, -pt[1])
}

/**
 * Calculates a bounding box center for a set of 2D points in 3D space.
 * 
 * @param points - Array of [x, y] points.
 * @returns Average center point as a Vector3.
 */
export const getPathCenter = (points: Point2D[]): THREE.Vector3 => {
  if (points.length === 0) return new THREE.Vector3(0, 0, 0)
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  points.forEach(([x, y]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  })
  
  return new THREE.Vector3(
    (minX + maxX) / 2,
    0,
    -((minY + maxY) / 2) // Flip Y to Z
  )
}
