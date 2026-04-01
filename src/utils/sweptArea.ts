/**
 * @file sweptArea.ts
 * @description Coordinate transformation and geometric union logic to calculate total cleaned area.
 */

import * as turf from '@turf/turf'
import type { Feature, Polygon, MultiPolygon, Position } from 'geojson'
import type { Point2D } from '../types/telemetry'

/**
 * Result of the swept area calculation.
 */
export interface SweptAreaResult {
  /** Total swept area in m² (overlapping regions counted once). */
  areaSqMeters: number
  /** Outer boundary ring(s) of the unified swept polygon in world coordinates. */
  boundaryRings: Point2D[][]
}

/**
 * Computes the heading angle (radians) at each path point based on the next/previous waypoint.
 * Uses central differences for interior points, forward/backward for endpoints.
 * 
 * @param path - Array of waypoints [x, y]
 * @returns Array of heading angles in radians.
 */
const computeHeadings = (path: Point2D[]): number[] => {
  const headings: number[] = []
  if (path.length < 2) return path.map(() => 0)

  for (let i = 0; i < path.length; i++) {
    let dx: number, dy: number

    if (i === 0) {
      dx = path[1][0] - path[0][0]
      dy = path[1][1] - path[0][1]
    } else if (i === path.length - 1) {
      dx = path[i][0] - path[i - 1][0]
      dy = path[i][1] - path[i - 1][1]
    } else {
      dx = path[i + 1][0] - path[i - 1][0]
      dy = path[i + 1][1] - path[i - 1][1]
    }

    headings.push(Math.atan2(dy, dx))
  }

  return headings
}

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
const transformPoint = (
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

/**
 * Calculates the metric area of a closed polygon ring using the Shoelace formula.
 */
const shoelaceArea = (ring: Position[]): number => {
  let area = 0
  const n = ring.length
  for (let i = 0; i < n - 1; i++) {
    area += ring[i][0] * ring[i + 1][1]
    area -= ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(area) / 2
}

/**
 * Extracts result metrics from a GeoJSON feature collection.
 */
const extractResult = (
  feature: Feature<Polygon | MultiPolygon>
): SweptAreaResult => {
  const geom = feature.geometry
  const boundaryRings: Point2D[][] = []
  let totalArea = 0

  if (geom.type === 'Polygon') {
    const outerRing = geom.coordinates[0]
    totalArea = shoelaceArea(outerRing)
    boundaryRings.push(outerRing.slice(0, -1).map(([x, y]) => [x, y] as Point2D))
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      const outerRing = poly[0]
      totalArea += shoelaceArea(outerRing)
      boundaryRings.push(outerRing.slice(0, -1).map(([x, y]) => [x, y] as Point2D))
    }
  }

  return { areaSqMeters: totalArea, boundaryRings }
}

/**
 * Calculates the total area swept by the robot's CLEANING PAD as it moves along the path.
 * 
 * Algorithm:
 * 1. Center the cleaning pad on the robot's centroid (COM).
 * 2. Connect the pad's endpoints at consecutive poses to form a quadrilateral.
 * 3. Union all quadrilaterals into a single swept area geometry.
 * 
 * @param path - World-frame [x, y] waypoints.
 * @param robotHull - Robot hull vertices for centroid calculation.
 * @param cleaningPad - Pair of points defining the tool's width in local coordinates.
 */
export const calculateSweptArea = (
  path: Point2D[],
  robotHull: Point2D[],
  cleaningPad: Point2D[]
): SweptAreaResult => {
  const empty: SweptAreaResult = { areaSqMeters: 0, boundaryRings: [] }
  if (path.length < 2 || cleaningPad.length < 2) return empty

  const headings = computeHeadings(path)
  let unionPolygon: Feature<Polygon | MultiPolygon> | null = null

  // 1. Calculate Centroid (COM) relative offset
  let cx = 0, cy = 0
  robotHull.forEach(p => { cx += p[0]; cy += p[1] })
  cx /= (robotHull.length || 1); cy /= (robotHull.length || 1)
  
  const centeredPad = cleaningPad.map(p => [p[0] - cx, p[1] - cy] as Point2D)

  // 2. Iterate path and capture the sweep of the pad between steps
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i]
    const [x2, y2] = path[i + 1]
    const theta1 = headings[i]
    const theta2 = headings[i + 1]

    // Pad endpoints at start pose
    const p1 = transformPoint(centeredPad[0], x1, y1, theta1)
    const p2 = transformPoint(centeredPad[1], x1, y1, theta1)
    // Pad endpoints at end pose
    const p3 = transformPoint(centeredPad[1], x2, y2, theta2)
    const p4 = transformPoint(centeredPad[0], x2, y2, theta2)

    // Form a quad of this segment's swept ribbon
    const quad: Position[] = [
      [p1[0], p1[1]], [p2[0], p2[1]], [p3[0], p3[1]], [p4[0], p4[1]], [p1[0], p1[1]]
    ]

    try {
      const segmentPoly = turf.polygon([quad])
      if (!unionPolygon) {
        unionPolygon = segmentPoly
      } else {
        const merged = turf.union(turf.featureCollection([unionPolygon, segmentPoly])) as Feature<Polygon | MultiPolygon> | null
        if (merged) unionPolygon = merged
      }
    } catch (e) {
      // Skip degenerate polygons or invalid quads
      console.warn("Swept Area: Degenerate segment encountered. Skipping...", e)
    }
  }

  return unionPolygon ? extractResult(unionPolygon) : empty
}
