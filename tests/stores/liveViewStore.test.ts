import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLiveViewStore } from '../../src/stores/liveViewStore'
import { telemetryStore } from '../../src/stores/telemetryStore'
import type { TelemetryData } from '../../src/types/telemetry'

// Mock requestAnimationFrame to avoid real browser loops in tests
global.requestAnimationFrame = vi.fn((cb) => setTimeout(() => cb(Date.now()), 16) as unknown as number)
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id as unknown as number))

describe('liveViewStore', () => {
  let liveStore: ReturnType<typeof useLiveViewStore>

  const mockTelemetry: TelemetryData = {
    path: [[0, 0], [1, 0], [2, 0]], // Straight line 2 meters
    robot: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
    cleaning_gadget: [[0.5, -0.5], [0.5, 0.5]]
  }

  beforeEach(() => {
    telemetryStore.clear()
    liveStore = useLiveViewStore()
    liveStore.clearStore()
  })

  it('should initialize empty', () => {
    expect(liveStore.state.isLoaded).toBe(false)
    expect(liveStore.state.metrics.smoothedPathLengthMeters).toBe(0)
    expect(liveStore.state.playback.isPlaying).toBe(false)
  })

  it('should ingest telemetry and calculate metrics', () => {
    liveStore.loadTelemetry(mockTelemetry)

    expect(liveStore.state.isLoaded).toBe(true)
    
    // Telemetry path is [0, 0], [1, 0], [2, 0]. Length should be ~2 meters
    expect(liveStore.state.metrics.rawPathLengthMeters).toBeCloseTo(2)
    // Smoothing with window=3 on a 3-point path pulls endpoints in, resulting in length 1.333
    expect(liveStore.state.metrics.smoothedPathLengthMeters).toBeGreaterThan(1.2)
    
    // Time to traverse (Assuming 1 m/s max speed given no curves, ~2 seconds)
    expect(liveStore.state.metrics.traversalTimeSeconds).toBeGreaterThan(0)
    
    // Pre-computed robot profiles should be available
    expect(liveStore.state.metrics.robotProfile.length).toBeGreaterThan(0)
  })

  it('should toggle playback state', () => {
    liveStore.loadTelemetry(mockTelemetry)
    
    expect(liveStore.state.playback.isPlaying).toBe(false)
    
    liveStore.togglePlayback()
    expect(liveStore.state.playback.isPlaying).toBe(true)
    
    liveStore.togglePlayback()
    expect(liveStore.state.playback.isPlaying).toBe(false)
  })

  it('updateProgress should clamp time and sync path index', () => {
    liveStore.loadTelemetry(mockTelemetry)
    
    const maxTime = liveStore.state.metrics.traversalTimeSeconds
    
    // Set progress to mid-way
    liveStore.updateProgress(maxTime / 2)
    expect(liveStore.state.playback.currentTime).toBeCloseTo(maxTime / 2)
    expect(liveStore.state.playback.progressPercentage).toBeCloseTo(50)

    // Overflow time should clamp at maxTime
    liveStore.updateProgress(maxTime + 10)
    expect(liveStore.state.playback.currentTime).toBe(maxTime)
    expect(liveStore.state.playback.progressPercentage).toBe(100)
    expect(liveStore.state.playback.isPlaying).toBe(false) // Auto-stops at end
  })

  it('resetPlayback should cancel animations and reset metrics', () => {
    liveStore.loadTelemetry(mockTelemetry)
    
    liveStore.togglePlayback()
    liveStore.updateProgress(1.5)
    
    liveStore.resetPlayback()
    
    expect(liveStore.state.playback.isPlaying).toBe(false)
    expect(liveStore.state.playback.currentTime).toBe(0)
    expect(liveStore.state.playback.progressPercentage).toBe(0)
    expect(liveStore.state.playback.currentPathIndex).toBe(0)
  })
})
