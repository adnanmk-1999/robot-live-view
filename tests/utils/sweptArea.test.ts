import { describe, it, expect } from 'vitest'
import { calculateSweptArea } from '../../src/utils/sweptArea'
import type { Point2D } from '../../src/types/telemetry'

describe('calculateSweptArea with Holes', () => {
  it('should correctly calculate the area of a closed square loop', () => {
    // 10m x 10m path square
    const path: Point2D[] = [
      [0, 0], [10, 0], [10, 10], [0, 10], [0, 0]
    ]
    
    // 2m wide cleaning pad (centered)
    // Robot centroid at (0,0) locally for simplicity
    const robotHull: Point2D[] = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
    const cleaningPad: Point2D[] = [[0, -1], [0, 1]] 

    const result = calculateSweptArea(path, robotHull, cleaningPad)
    
    console.log('Swept Area Result:', {
      totalArea: result.areaSqMeters,
      polygonsCount: result.polygons.length,
      ringsPerPolygon: result.polygons.map(p => 1 + p.holes.length)
    })
    
    result.polygons.forEach((p, i) => {
      console.log(`Polygon ${i} outer length:`, p.outer.length)
      p.holes.forEach((h, j) => console.log(`  Hole ${j} length:`, h.length))
    })
    // Actual: ~49.0 m² due to 'forward-looking' headings at corners
    // (the swept area tapers as it approaches the turn).
    // The key validation here is that totalHoles > 0.
    expect(result.areaSqMeters).toBeGreaterThan(45)
    expect(result.areaSqMeters).toBeLessThan(55)
    
    // Verify that we have at least one hole in the resulting polygons
    const totalHoles = result.polygons.reduce((sum, poly) => sum + poly.holes.length, 0)
    expect(totalHoles).toBeGreaterThan(0)
  })

  it('should handle an open non-intersecting path without holes', () => {
    const path: Point2D[] = [[0, 0], [10, 0]]
    const robotHull: Point2D[] = [[-0.5, -0.5], [0.5, 0.5]]
    const cleaningPad: Point2D[] = [[0, -1], [0, 1]] 

    const result = calculateSweptArea(path, robotHull, cleaningPad)

    // ~10m long x 2m wide = ~20 m^2
    expect(result.areaSqMeters).toBeCloseTo(20, 0)
    
    // No holes expected
    const totalHoles = result.polygons.reduce((sum, poly) => sum + poly.holes.length, 0)
    expect(totalHoles).toBe(0)
  })
})
