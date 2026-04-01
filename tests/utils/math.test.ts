import { describe, it, expect } from 'vitest'
import { distance, calculatePathLength } from '../../src/utils/euclideanDistance'
import { calculateHeadingAtIndex, computePathHeadings } from '../../src/utils/heading'
import type { Point2D } from '../../src/types/telemetry'

describe('euclideanDistance', () => {
  it('distance should calculate exact distance between two points', () => {
    const a: Point2D = [0, 0]
    const b: Point2D = [3, 4] // 3-4-5 triangle
    expect(distance(a, b)).toBe(5)
  })

  it('calculatePathLength should return 0 for short paths', () => {
    expect(calculatePathLength([])).toBe(0)
    expect(calculatePathLength([[1, 1]])).toBe(0)
  })

  it('calculatePathLength should sum up segment lengths', () => {
    const path: Point2D[] = [[0, 0], [0, 2], [2, 2]] // Length 2 + 2 = 4
    expect(calculatePathLength(path)).toBe(4)
  })
})

describe('heading', () => {
  it('calculateHeadingAtIndex should look forward to find heading', () => {
    const path: Point2D[] = [[0, 0], [1, 0]] // facing right -> 0 radians
    expect(calculateHeadingAtIndex(path, 0)).toBeCloseTo(0)
    
    const pathUp: Point2D[] = [[0, 0], [0, 1]] // facing up -> PI/2 radians
    expect(calculateHeadingAtIndex(pathUp, 0)).toBeCloseTo(Math.PI / 2)
  })

  it('calculateHeadingAtIndex should look backward if at the end of the path', () => {
    const path: Point2D[] = [[0, 0], [0, 1]] // facing up
    // At index 1, there is no forward segment, so it looks back to [0, 0] and should know heading is up
    expect(calculateHeadingAtIndex(path, 1)).toBeCloseTo(Math.PI / 2)
  })

  it('calculateHeadingAtIndex ignores segments shorter than MIN_SEGMENT_LENGTH', () => {
    const path: Point2D[] = [
      [0, 0], 
      [0.001, 0.001], // Too short, should skip to the next
      [1, 0] // Meaningful segment to the right (0 rads)
    ]
    expect(calculateHeadingAtIndex(path, 0)).toBeCloseTo(0)
  })

  it('computePathHeadings processes full arrays mapping 1:1', () => {
    const path: Point2D[] = [[0, 0], [1, 0], [1, 1]]
    const headings = computePathHeadings(path)
    expect(headings.length).toBe(path.length)
    expect(headings[0]).toBeCloseTo(0) // Start facing right
    expect(headings[headings.length - 1]).toBeCloseTo(Math.PI / 2) // Ends facing up
  })
})
