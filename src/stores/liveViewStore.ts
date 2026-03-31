import { reactive } from 'vue'
import type { TelemetryData, TelemetryMetrics, PlaybackState } from '../types/telemetry'
import { calculatePathLength } from '../utils/euclideanDistance'
import { calculateSweptArea } from '../utils/sweptArea'
import { calculateTraversalTime } from '../utils/traversalTime'
import { telemetryStore } from './telemetryStore'

interface LiveViewState {
  isLoaded: boolean;
  metrics: TelemetryMetrics;
  playback: PlaybackState;
}

const state = reactive<LiveViewState>({
  isLoaded: false,
  metrics: {
    euclideanPathLengthMeters: 0,
    pathLengthMeters: 0,
    cleanedAreaSqMeters: 0,
    traversalTimeSeconds: 0,
    sweptBoundaryRings: [],
    velocityProfile: [],
    curvatures: []
  },
  playback: {
    isPlaying: false,
    speedMultiplier: 1,
    currentTime: 0,
    progressPercentage: 0,
    currentPathIndex: 0
  }
})

export const useLiveViewStore = () => {
  const loadTelemetry = (jsonData: TelemetryData) => {
    // Delegate raw data to telemetryStore
    telemetryStore.load(jsonData)

    state.isLoaded = true
    state.playback.currentTime = 0
    state.playback.currentPathIndex = 0
    state.playback.progressPercentage = 0
    state.playback.isPlaying = false

    // Compute path length from telemetryStore's typed accessor
    state.metrics.euclideanPathLengthMeters = calculatePathLength(telemetryStore.path.value)
    console.log(`Path length: ${state.metrics.euclideanPathLengthMeters.toFixed(3)} m`)

    // Compute swept area and extract boundary rings
    const sweptResult = calculateSweptArea(
      telemetryStore.path.value,
      telemetryStore.robot.value
    )
    state.metrics.cleanedAreaSqMeters = sweptResult.areaSqMeters
    state.metrics.sweptBoundaryRings = sweptResult.boundaryRings
    console.log(`Swept area: ${sweptResult.areaSqMeters.toFixed(4)} m², rings: ${sweptResult.boundaryRings.length}`)

    // Compute traversal time with curvature-based velocity model
    const traversalResult = calculateTraversalTime(telemetryStore.path.value)
    state.metrics.traversalTimeSeconds = traversalResult.totalTimeSeconds
    state.metrics.velocityProfile = traversalResult.velocityProfile
    state.metrics.curvatures = traversalResult.curvatures
    console.log(`Traversal time: ${traversalResult.totalTimeSeconds.toFixed(2)} s`)
  }

  const setMetrics = (length: number, area: number, time: number) => {
    state.metrics.euclideanPathLengthMeters = length
    state.metrics.pathLengthMeters = length
    state.metrics.cleanedAreaSqMeters = area
    state.metrics.traversalTimeSeconds = time
  }

  const togglePlayback = () => {
    if (!state.isLoaded) return
    state.playback.isPlaying = !state.playback.isPlaying
  }

  const setPlaybackSpeed = (multiplier: number) => {
    state.playback.speedMultiplier = multiplier
  }

  const updateProgress = (timeSec: number) => {
    if (!state.isLoaded || state.metrics.traversalTimeSeconds === 0) return

    // Clamp to valid range
    const clampedTime = Math.max(0, Math.min(timeSec, state.metrics.traversalTimeSeconds))
    state.playback.currentTime = clampedTime
    state.playback.progressPercentage = (clampedTime / state.metrics.traversalTimeSeconds) * 100

    // Auto-pause at end
    if (clampedTime >= state.metrics.traversalTimeSeconds && state.playback.isPlaying) {
      state.playback.isPlaying = false
    }
  }

  const resetPlayback = () => {
    state.playback.currentTime = 0
    state.playback.progressPercentage = 0
    state.playback.currentPathIndex = 0
    state.playback.isPlaying = false
  }

  return {
    state,
    loadTelemetry,
    setMetrics,
    togglePlayback,
    setPlaybackSpeed,
    updateProgress,
    resetPlayback
  }
}

// Singleton — same instance shared across all components
export const liveViewStore = useLiveViewStore()
