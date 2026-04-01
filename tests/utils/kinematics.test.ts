import { describe, it, expect } from 'vitest'
import { targetVelocityFromCurvature } from '../../src/utils/targetVelocity'
import { mengerCurvature, computeCurvatures } from '../../src/utils/curvature'
import { ROBOT_CONFIG } from '../../src/config/robotConfig'

describe('targetVelocityFromCurvature', () => {
  it('should return V_MAX for straight lines (curvature < K_CRIT)', () => {
    const v = targetVelocityFromCurvature(0)
    expect(v).toBe(ROBOT_CONFIG.V_MAX)

    const v2 = targetVelocityFromCurvature(ROBOT_CONFIG.K_CRIT - 0.1)
    expect(v2).toBe(ROBOT_CONFIG.V_MAX)
  })

  it('should decelerate linearly between K_CRIT and K_MAX', () => {
    const midKappa = (ROBOT_CONFIG.K_CRIT + ROBOT_CONFIG.K_MAX) / 2
    const v = targetVelocityFromCurvature(midKappa)
    expect(v).toBeLessThan(ROBOT_CONFIG.V_MAX)
    expect(v).toBeGreaterThan(ROBOT_CONFIG.V_MIN)
  })

  it('should cap at V_MIN for sharp turns (curvature >= K_MAX)', () => {
    const v = targetVelocityFromCurvature(ROBOT_CONFIG.K_MAX)
    expect(targetVelocityFromCurvature(ROBOT_CONFIG.K_MAX + 5)).toBe(v) // Check cap
  })

  it('should respect the physical angular constraint (v * kappa <= omega_max)', () => {
    const highKappa = 20
    const v = targetVelocityFromCurvature(highKappa)
    const expected = Math.max(ROBOT_CONFIG.V_MIN, ROBOT_CONFIG.OMEGA_MAX / highKappa)
    expect(v).toBeCloseTo(expected)
  })
})

describe('curvature', () => {
  it('mengerCurvature should return 0 for a straight line', () => {
    const a: [number, number] = [0, 0]
    const b: [number, number] = [1, 1]
    const c: [number, number] = [2, 2]
    expect(mengerCurvature(a, b, c)).toBe(0)
  })

  it('mengerCurvature should return > 0 for a curve', () => {
    const a: [number, number] = [0, 0]
    const b: [number, number] = [1, 1]
    const c: [number, number] = [2, 0]
    expect(mengerCurvature(a, b, c)).toBeGreaterThan(0)
  })

  it('computeCurvatures should process a path and return array of same length', () => {
    const path: [number, number][] = [
      [0, 0], [1, 0], [1, 1], [0, 1]
    ]
    const curvatures = computeCurvatures(path)
    expect(curvatures.length).toBe(path.length)

    // A right angle at index 1 and 2 should have high curvature
    expect(curvatures[1]).toBeGreaterThan(0)
  })

  it('computeCurvatures handles edge cases correctly (short paths)', () => {
    expect(computeCurvatures([[0, 0]])).toEqual([0])
    expect(computeCurvatures([[0, 0], [1, 1]])).toEqual([0, 0])
  })
})
