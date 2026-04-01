/**
 * @file sweptArea.ts
 * @description Coordinate transformation and geometric union logic to calculate total cleaned area.
 */

import * as turf from '@turf/turf'
import type { Feature, Polygon, MultiPolygon, Position } from 'geojson'
import type { Point2D } from '../types/telemetry'
import { computePathHeadings } from './heading'
import { transformPoint } from './coordinateTransform'

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
 * Calculates the metric area of a closed polygon ring using the Shoelace formula (https://en.wikipedia.org/wiki/Shoelace_formula).
 * 
 * Formula: Area = 0.5 * |sum(x_i * y_{i+1} - x_{i+1} * y_i)|
 * 
 * @param ring - Array of positions [x, y] representing a CLOSED polygon ring.
 * @returns The calculated area in square meters.
 */
const shoelaceArea = (ring: Position[]): number => {
  let area = 0
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1]
    area -= ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(area) / 2
}

/**
 * Extracts and flattens result metrics from a GeoJSON feature (Polygon or MultiPolygon).
 * 
 * This function handles the conversion from GeoJSON nested coordinate structures 
 * to a flat array of boundary rings and calculates the total cumulative area.
 * 
 * Implementation Details:
 * 1. For each polygon, only the first coordinate ring (the outer boundary) is extracted.
 * 2. GeoJSON 'closed' rings (where the last point equals the first) are transformed into 
 *    vertex arrays by slicing off the redundant last coordinate.
 * 3. Total area is the sum of all individual polygon areas using the Shoelace formula.
 * 
 * @param feature - A GeoJSON feature containing calculated swept area geometry.
 * @returns A SweptAreaResult containing total area and normalized boundary rings.
 */
const extractResult = (
  feature: Feature<Polygon | MultiPolygon>
): SweptAreaResult => {
  const geom = feature.geometry
  const boundaryRings: Point2D[][] = []
  let totalArea = 0

  if (geom.type === 'Polygon') {
    const outerRing = geom.coordinates[0] // first ring is the outer boundary
    totalArea = shoelaceArea(outerRing)
    boundaryRings.push(outerRing.slice(0, -1).map(([x, y]) => [x, y] as Point2D)) // remove last point to avoid duplication
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      const outerRing = poly[0] // first ring is the outer boundary
      totalArea += shoelaceArea(outerRing)
      boundaryRings.push(outerRing.slice(0, -1).map(([x, y]) => [x, y] as Point2D)) // remove last point to avoid duplication
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

  const headings = computePathHeadings(path)
  let unionPolygon: Feature<Polygon | MultiPolygon> | null = null

  // 1. Calculate Centroid (COM) relative offset
  let cx = 0, cy = 0 // Initialize centroid coordinates
  robotHull.forEach(p => { cx += p[0]; cy += p[1] })  // Sum up all coordinates
  cx /= (robotHull.length || 1); cy /= (robotHull.length || 1) // Divide by the number of vertices to get the average
  
  const centeredPad = cleaningPad.map(p => [p[0] - cx, p[1] - cy] as Point2D)

  // 2. Iterate path and capture the sweep of the pad between steps
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i] // Start pose
    const [x2, y2] = path[i + 1] // End pose
    const theta1 = headings[i] // Start heading
    const theta2 = headings[i + 1] // End heading

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
      const segmentPoly = turf.polygon([quad]) // Create a polygon from the quad
      if (!unionPolygon) {
        unionPolygon = segmentPoly // Initialize the union polygon
      } else {
        const merged = turf.union(turf.featureCollection([unionPolygon, segmentPoly])) as Feature<Polygon | MultiPolygon> | null // Merge the segment polygon with the union polygon
        if (merged) unionPolygon = merged // Merge the segment polygon with the union polygon
      }
    } catch (e) {
      // Skip degenerate polygons or invalid quads
      console.warn("Swept Area: Degenerate segment encountered. Skipping...", e)
    }
  }

  return unionPolygon ? extractResult(unionPolygon) : empty
}
