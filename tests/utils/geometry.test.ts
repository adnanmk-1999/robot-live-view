import { describe, it, expect } from 'vitest'
import { transformPoint } from '../../src/utils/coordinateTransform'
import { calculateSweptArea } from '../../src/utils/sweptArea'
import type { Point2D } from '../../src/types/telemetry'

describe('coordinateTransform', () => {
  it('should translate point without rotation', () => {
    const local: Point2D = [1, 1]
    // Translate by [2, 3] with 0 rotation
    const world = transformPoint(local, 2, 3, 0)
    expect(world[0]).toBeCloseTo(3)
    expect(world[1]).toBeCloseTo(4)
  })

  it('should rotate point by 90 degrees (PI/2) without translation', () => {
    const local: Point2D = [1, 0]
    // Rotate counter-clockwise by 90 deg around origin
    const world = transformPoint(local, 0, 0, Math.PI / 2)
    // [1, 0] becomes [0, 1]
    expect(world[0]).toBeCloseTo(0)
    expect(world[1]).toBeCloseTo(1)
  })

  it('should rotate and translate correctly', () => {
    const local: Point2D = [1, 0]
    // Translate [5, 5] and rotate 90 deg
    const world = transformPoint(local, 5, 5, Math.PI / 2)
    expect(world[0]).toBeCloseTo(5)
    expect(world[1]).toBeCloseTo(6)
  })
})

describe('sweptArea', () => {
  it('should return empty result for paths with < 2 points', () => {
    const path: Point2D[] = [[0, 0]]
    const hull: Point2D[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    const pad: Point2D[] = [[-1, 1], [1, 1]]
    
    const result = calculateSweptArea(path, hull, pad)
    expect(result.areaSqMeters).toBe(0)
    expect(result.boundaryRings).toEqual([])
  })

  it('should calculate the swept area of a straight line', () => {
    // Robot moves from x=0 to x=10 along x-axis
    const path: Point2D[] = [[0, 0], [10, 0]]
    // Square hull centered at origin
    const hull: Point2D[] = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
    // Cleaning pad width 1 meter, positioned at the front (x = 0.5 center).
    // The points are in local coordinates relative to the shape center.
    const pad: Point2D[] = [[0.5, -0.5], [0.5, 0.5]] 

    const result = calculateSweptArea(path, hull, pad)
    
    // Sweep pad moves from [0, -0.5]..[0, 0.5] up to [10, -0.5]..[10, 0.5].
    // Path length is 10, robot width is 1. Overlapping polygon is simple rectangle 10x1.
    // The quad vertices should compute to exactly 10 square meters area.
    expect(result.areaSqMeters).toBeGreaterThan(0)
    expect(result.areaSqMeters).toBeCloseTo(10)
    expect(result.boundaryRings.length).toBeGreaterThan(0)
  })
  
  it('should gracefully handle overlapping geometries without throwing', () => {
    // The path zig-zags over itself
    const path: Point2D[] = [[0, 0], [2, 0], [1, 1], [1, -1]]
    const hull: Point2D[] = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
    const pad: Point2D[] = [[0.5, -0.5], [0.5, 0.5]] 
    
    expect(() => calculateSweptArea(path, hull, pad)).not.toThrow()
  })
})
