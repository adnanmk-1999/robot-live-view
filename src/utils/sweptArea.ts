import * as turf from '@turf/turf'
import type { Feature, Polygon, MultiPolygon, Position } from 'geojson'
import type { Point2D } from '../types/telemetry'

/**
 * Computes the heading angle (radians) at each path point.
 * - Forward difference at index 0
 * - Backward difference at the last index
 * - Central difference for all intermediate points
 */
const computeHeadings = (path: Point2D[]): number[] => {
  const headings: number[] = []

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
 * Transforms a robot-local point to world coordinates
 * given the robot pose (px, py, theta).
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
 * Shoelace formula for the signed area of a closed polygon ring.
 * Coordinates must be in metric units — result is in m².
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
 * Computes area of a GeoJSON Polygon or MultiPolygon feature
 * using the shoelace formula on metric (x, y) coordinates.
 */
const computeAreaMetric = (
  feature: Feature<Polygon | MultiPolygon>
): number => {
  const geom = feature.geometry

  if (geom.type === 'Polygon') {
    return shoelaceArea(geom.coordinates[0])
  }

  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.reduce((total: number, poly: Position[][]) => {
      return total + shoelaceArea(poly[0])
    }, 0)
  }

  return 0
}

/**
 * Calculates the total swept area covered by the robot polygon
 * as it follows the given path. Overlapping regions are counted only once.
 *
 * @param path          - Array of [x, y] waypoints in metres
 * @param robotPolygon  - Robot hull vertices in local base-link coordinates
 * @returns             Total swept area in m²
 */
export const calculateSweptArea = (
  path: Point2D[],
  robotPolygon: Point2D[]
): number => {
  if (path.length < 2 || robotPolygon.length < 3) return 0

  const headings = computeHeadings(path)
  let unionPolygon: Feature<Polygon | MultiPolygon> | null = null

  for (let i = 0; i < path.length; i++) {
    const [px, py] = path[i]
    const theta = headings[i]

    // Transform robot polygon to world frame at this pose
    const worldPoints = robotPolygon.map(p => transformPoint(p, px, py, theta))

    // Close the ring (GeoJSON requirement: first === last)
    const closedRing: Position[] = [...worldPoints, worldPoints[0]].map(
      ([x, y]) => [x, y] as Position
    )

    const footprint = turf.polygon([closedRing])

    if (unionPolygon === null) {
      unionPolygon = footprint
    } else {
      const merged = turf.union(
        turf.featureCollection([unionPolygon, footprint])
      ) as Feature<Polygon | MultiPolygon> | null
      if (merged) unionPolygon = merged
    }
  }

  return unionPolygon ? computeAreaMetric(unionPolygon) : 0
}
