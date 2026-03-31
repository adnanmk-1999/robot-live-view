import * as turf from '@turf/turf'
import type { Feature, Polygon, MultiPolygon, Position } from 'geojson'
import type { Point2D } from '../types/telemetry'

export interface SweptAreaResult {
  /** Total swept area in m² (overlapping regions counted once) */
  areaSqMeters: number
  /** Outer boundary ring(s) of the unified swept polygon in world coordinates */
  boundaryRings: Point2D[][]
}

/**
 * Computes the heading angle (radians) at each path point.
 * Uses central differences for interior points, forward/backward for endpoints.
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
 * Transforms a robot-local point to world coordinates given pose (px, py, theta).
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
 * Shoelace formula for area of a closed polygon ring in metric coordinates (m²).
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
 * Extracts area and boundary rings from a Polygon or MultiPolygon feature.
 * Each ring is the outer boundary of one polygon region (holes excluded).
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
    // Drop the closing duplicate point from the ring
    boundaryRings.push(
      outerRing.slice(0, -1).map(([x, y]) => [x, y] as Point2D)
    )
  } else if (geom.type === 'MultiPolygon') {
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
 * Calculates the total swept area and boundary polygon(s) of the robot
 * as it traverses the given path. Overlapping regions are counted only once.
 *
 * @param path          - World-frame [x, y] waypoints in metres
 * @param robotPolygon  - Robot hull vertices in local base-link coordinates
 * @returns             Area in m² and the outer boundary ring(s)
 */
export const calculateSweptArea = (
  path: Point2D[],
  robotPolygon: Point2D[]
): SweptAreaResult => {
  const empty: SweptAreaResult = { areaSqMeters: 0, boundaryRings: [] }
  if (path.length < 2 || robotPolygon.length < 3) return empty

  const headings = computeHeadings(path)
  let unionPolygon: Feature<Polygon | MultiPolygon> | null = null

  for (let i = 0; i < path.length; i++) {
    const [px, py] = path[i]
    const theta = headings[i]

    const worldPoints = robotPolygon.map(p => transformPoint(p, px, py, theta))
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

  return unionPolygon ? extractResult(unionPolygon) : empty
}
