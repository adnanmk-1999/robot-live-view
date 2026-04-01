import { describe, it, expect, beforeEach } from 'vitest'
import { telemetryStore } from '../../src/stores/telemetryStore'
import type { TelemetryData } from '../../src/types/telemetry'

describe('telemetryStore', () => {

  beforeEach(() => {
    // Reset store before each test
    telemetryStore.clear()
  })

  it('initializes with default empty state', () => {
    expect(telemetryStore.state.isLoaded).toBe(false)
    expect(telemetryStore.state.data).toBeNull()
    expect(telemetryStore.path.value).toEqual([])
    expect(telemetryStore.robot.value).toEqual([])
    expect(telemetryStore.cleaningGadget.value).toEqual([])
  })

  it('loads valid telemetry data correctly', () => {
    const mockData: TelemetryData = {
      path: [[0, 0], [1, 1]],
      robot: [[-1, -1], [1, 1], [-1, 1]],
      cleaning_gadget: [[-2, -2], [2, 2]]
    }

    telemetryStore.load(mockData)

    expect(telemetryStore.state.isLoaded).toBe(true)
    expect(telemetryStore.state.data).toEqual(mockData)
    
    // Check computed refs
    expect(telemetryStore.path.value.length).toBe(2)
    expect(telemetryStore.robot.value.length).toBe(3)
    expect(telemetryStore.cleaningGadget.value.length).toBe(2)
  })

  it('clears data and resets state', () => {
    const mockData: TelemetryData = {
      path: [[0, 0]],
      robot: [[0, 0]],
      cleaning_gadget: [[0, 0]]
    }

    telemetryStore.load(mockData)
    expect(telemetryStore.state.isLoaded).toBe(true)

    telemetryStore.clear()
    
    expect(telemetryStore.state.isLoaded).toBe(false)
    expect(telemetryStore.state.data).toBeNull()
    expect(telemetryStore.path.value).toEqual([]) // Computed falling back to empty
  })

})
