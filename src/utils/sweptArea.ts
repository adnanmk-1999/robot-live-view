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

  for (let i = 0; i < path.length; i++) {
    let dx: number, dy: number

    if (i === 0) {
      // Forward difference for start point
      dx = path[1][0] - path[0][0]
      dy = path[1][1] - path[0][1]
    } else if (i === path.length - 1) {
      // Backward difference for end point
      dx = path[i][0] - path[i - 1][0]
      dy = path[i][1] - path[i - 1][1]
    } else {
      // Central difference for interior points to reduce noise influence
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
 * @param local - Point in robot's local coordinate system [x, y]
 * @param px - Robot's world X position
 * @param py - Robot's world Y position
 * @param theta - Robot's rotation (heading) in radians
 * @returns Transformed world coordinate [x, y]
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
 * Calculates the signed area of a closed polygon ring using the Shoelace formula.
 * Used for metric (x, y) coordinates where Turf.js's WGS84 area calculation is inappropriate.
 * 
 * @param ring - Array of positions forming a closed ring (last point must equal first).
 * @returns Area in square meters.
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
 * Extracts the metric area and coordinate rings from a GeoJSON Feature.
 * 
 * @param feature - A Turf/GeoJSON Polygon or MultiPolygon.
 * @returns SweptAreaResult containing total area and perimeter paths.
 */
const extractResult = (
  feature: Feature<Polygon | MultiPolygon>
): SweptAreaResult => {
  const geom = feature.geometry
  const boundaryRings: Point2D[][] = []
  let areaSqMeters = 0

  if (geom.type === 'Polygon') {
    const outerRing = geom.coordinates[0]
    areaSqMeters = shoelaceArea(outerRing)
    // Map GeoJSON Position back to our typed Point2D, dropping the duplicated end-point
    boundaryRings.push(
      outerRing.slice(0, -1).map(([x, y]) => [x, y] as Point2D)
    )
  } else if (geom.type === 'MultiPolygon') {
    // Accumulate area and rings from all sub-polygons
    for (const poly of geom.coordinates) {
      const outerRing = poly[0]
      areaSqMeters += shoelaceArea(outerRing)
      boundaryRings.push(
        outerRing.slice(0, -1).map(([x, y]) => [x, y] as Point2D)
      )
    }
  }

  return { areaSqMeters, boundaryRings }
}

/**
 * Calculates the total area covered by the robot's footprint as it follows the path.
 * 
 * Algorithm:
 * 1. Interpolate headings at each waypoint.
 * 2. At each waypoint, transform the robot polygon into world frame.
 * 3. Use Turf.js union to merge overlapping footprints into a single geometry.
 * 4. Compute metric area using shoelace formula on the resulting union.
 * 
 * @param path - World-frame [x, y] waypoints in metres.
 * @param robotPolygon - Robot hull vertices in local base-link coordinates.
 * @returns Area in m² and the outer boundary rings.
 */
export const calculateSweptArea = (
  path: Point2D[],
  robotPolygon: Point2D[]
): SweptAreaResult => {
  const empty: SweptAreaResult = { areaSqMeters: 0, boundaryRings: [] }
  if (path.length < 2 || robotPolygon.length < 3) return empty

  const headings = computeHeadings(path)
  let unionPolygon: Feature<Polygon | MultiPolygon> | null = null

  // Calculate Centroid of robot hull to align it with the path as COM
  let cx = 0, cy = 0
  robotPolygon.forEach(p => { cx += p[0]; cy += p[1] })
  cx /= robotPolygon.length; cy /= robotPolygon.length
  
  // Create an offset-adjusted hull
  const centeredHull = robotPolygon.map(p => [p[0] - cx, p[1] - cy] as Point2D)

  // Iterate through waypoints and accumulate the footprint union
  for (let i = 0; i < path.length; i++) {
    const [px, py] = path[i]
    const theta = headings[i]

    // Rotate and translate centered hull to this pose
    const worldPoints = centeredHull.map(p => transformPoint(p, px, py, theta))
    
    // Turf requires the first and last points of a ring to be identical
    const closedRing: Position[] = [...worldPoints, worldPoints[0]].map(
      ([x, y]) => [x, y] as Position
    )

    const footprint = turf.polygon([closedRing])

    if (unionPolygon === null) {
      unionPolygon = footprint
    } else {
      // Boolean Union operation to merge current footprint into the total swept surface
      const merged = turf.union(
        turf.featureCollection([unionPolygon, footprint])
      ) as Feature<Polygon | MultiPolygon> | null
      if (merged) unionPolygon = merged
    }
  }

  return unionPolygon ? extractResult(unionPolygon) : empty
}
