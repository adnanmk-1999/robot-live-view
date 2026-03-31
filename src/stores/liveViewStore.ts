/**
 * @file liveViewStore.ts
 * @description Central reactive hub for derived metrics and interactive playback state.
 */

import { reactive } from 'vue'
import type { TelemetryData, TelemetryMetrics, PlaybackState } from '../types/telemetry'
import { calculatePathLength } from '../utils/euclideanDistance'
import { calculateSweptArea } from '../utils/sweptArea'
import { calculateTraversalTime } from '../utils/traversalTime'
import { telemetryStore } from './telemetryStore'

/** Internal state definition for derived telemetry analysis. */
interface LiveViewState {
  /** True once telemetry is loaded and initial metrics are computed. */
  isLoaded: boolean;
  /** Analytical metrics (length, time, area) derived from path data. */
  metrics: TelemetryMetrics;
  /** Current UI playback state (play/pause, progress, speed). */
  playback: PlaybackState;
}

/** Private reactive state instance. */
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

/**
 * Store logic wrapper. Provides methods to manipulate analytical and playback state.
 */
export const useLiveViewStore = () => {
  
  /**
   * Action: Primary ingestion pipeline.
   * 1. Loads raw data into the telemetryStore.
   * 2. Resets playback state.
   * 3. Triggers synchronous computation of all derived metrics (Length, Area, Time).
   */
  const loadTelemetry = (jsonData: TelemetryData) => {
    // Delegate source-of-truth storage to telemetryStore
    telemetryStore.load(jsonData)

    // Reset playback to start
    state.isLoaded = true
    state.playback.currentTime = 0
    state.playback.currentPathIndex = 0
    state.playback.progressPercentage = 0
    state.playback.isPlaying = false

    // ── Metric Computation Pipeline ─────────────────────────────────────────

    // Calculate Euclidean Path Length
    state.metrics.euclideanPathLengthMeters = calculatePathLength(telemetryStore.path.value)
    console.log(`Path length: ${state.metrics.euclideanPathLengthMeters.toFixed(3)} m`)

    // Calculate Swept Area (includes Boolean Union of all footprints)
    const sweptResult = calculateSweptArea(
      telemetryStore.path.value,
      telemetryStore.robot.value
    )
    state.metrics.cleanedAreaSqMeters = sweptResult.areaSqMeters
    state.metrics.sweptBoundaryRings = sweptResult.boundaryRings
    console.log(`Swept area: ${sweptResult.areaSqMeters.toFixed(4)} m², rings: ${sweptResult.boundaryRings.length}`)

    // Calculate Traversal Time using the piecewise velocity model
    const traversalResult = calculateTraversalTime(telemetryStore.path.value)
    state.metrics.traversalTimeSeconds = traversalResult.totalTimeSeconds
    state.metrics.velocityProfile = traversalResult.velocityProfile
    state.metrics.curvatures = traversalResult.curvatures
    console.log(`Traversal time: ${traversalResult.totalTimeSeconds.toFixed(2)} s`)
  }

  /** action: Legacy manual metric override (kept for debugging). */
  const setMetrics = (length: number, area: number, time: number) => {
    state.metrics.euclideanPathLengthMeters = length
    state.metrics.pathLengthMeters = length
    state.metrics.cleanedAreaSqMeters = area
    state.metrics.traversalTimeSeconds = time
  }

  /** Action: Toggles playback between playing and paused. */
  const togglePlayback = () => {
    if (!state.isLoaded) return
    state.playback.isPlaying = !state.playback.isPlaying
  }

  /** Action: Sets the playback speed factor (e.g., 0.5, 1.0, 2.0). */
  const setPlaybackSpeed = (multiplier: number) => {
    state.playback.speedMultiplier = multiplier
  }

  /**
   * Action: Updates current playback time and calculates corresponding percentage.
   * Should be called from a requestAnimationFrame loop or timeline scrubber.
   * 
   * @param timeSec - The new virtual time in seconds.
   */
  const updateProgress = (timeSec: number) => {
    if (!state.isLoaded || state.metrics.traversalTimeSeconds === 0) return

    // Clamp time to [0, totalDuration]
    const clampedTime = Math.max(0, Math.min(timeSec, state.metrics.traversalTimeSeconds))
    state.playback.currentTime = clampedTime
    state.playback.progressPercentage = (clampedTime / state.metrics.traversalTimeSeconds) * 100

    // Force stop if we reach the end
    if (clampedTime >= state.metrics.traversalTimeSeconds && state.playback.isPlaying) {
      state.playback.isPlaying = false
    }
  }

  /** Action: Resets playback to zero without purging the telemetry data. */
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

/**
 * Live View Store Singleton Export.
 * Ensures all components share the same reactive instance for metrics and playback.
 */
export const liveViewStore = useLiveViewStore()
