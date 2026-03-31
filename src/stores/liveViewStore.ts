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
import { smoothPathMetric } from '../utils/pathSmoothing'

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
    curvatures: [],
    waypointTimestamps: []
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
  
  let animationFrameId: number | null = null
  let lastTickTime = 0

  /**
   * Internal find function: Maps current time to the path index.
   * Finds the highest index i such that timestamps[i] <= time.
   */
  const findPathIndex = (timeSec: number): number => {
    const ts = state.metrics.waypointTimestamps
    if (!ts.length) return 0
    
    // Simple linear scan for now; small enough datasets (100-1000 pts)
    for (let i = ts.length - 1; i >= 0; i--) {
      if (ts[i] <= timeSec) return i
    }
    return 0
  }

  /**
   * Action: Primary ingestion pipeline.
   */
  const loadTelemetry = (jsonData: TelemetryData) => {
    // 1. Core Ingestion
    telemetryStore.load(jsonData)

    // 2. Pre-process: Path Smoothing to remove high-frequency noise
    // Using a window of 3 to remove jagged edges while preserving shape
    const smoothedPath = smoothPathMetric(telemetryStore.path.value, 3)

    state.isLoaded = true
    state.playback.currentTime = 0
    state.playback.currentPathIndex = 0
    state.playback.progressPercentage = 0
    state.playback.isPlaying = false

    // 3. Metric Computation (using Smooth Data)
    state.metrics.euclideanPathLengthMeters = calculatePathLength(telemetryStore.path.value)

    const sweptResult = calculateSweptArea(
      smoothedPath,
      telemetryStore.robot.value,
      telemetryStore.cleaningGadget.value
    )
    state.metrics.cleanedAreaSqMeters = sweptResult.areaSqMeters
    state.metrics.sweptBoundaryRings = sweptResult.boundaryRings

    const traversalResult = calculateTraversalTime(smoothedPath)
    state.metrics.traversalTimeSeconds = traversalResult.totalTimeSeconds
    state.metrics.velocityProfile = traversalResult.velocityProfile
    state.metrics.curvatures = traversalResult.curvatures
    state.metrics.waypointTimestamps = traversalResult.waypointTimestamps
  }

  /**
   * Core Animation Loop.
   */
  const tick = (now: number) => {
    if (!state.playback.isPlaying) {
      lastTickTime = 0
      return
    }

    if (!lastTickTime) {
      lastTickTime = now
      animationFrameId = requestAnimationFrame(tick)
      return
    }

    const delta = (now - lastTickTime) / 1000 // ms to s
    lastTickTime = now

    const newTime = state.playback.currentTime + delta * state.playback.speedMultiplier
    updateProgress(newTime)

    if (state.playback.isPlaying) {
      animationFrameId = requestAnimationFrame(tick)
    }
  }

  /** Action: Toggles playback between playing and paused. */
  const togglePlayback = () => {
    if (!state.isLoaded) return
    state.playback.isPlaying = !state.playback.isPlaying
    
    if (state.playback.isPlaying) {
      // If we are at the end, restart
      if (state.playback.currentTime >= state.metrics.traversalTimeSeconds) {
        state.playback.currentTime = 0
      }
      lastTickTime = 0
      animationFrameId = requestAnimationFrame(tick)
    } else {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }

  /** Action: Sets the playback speed factor. */
  const setPlaybackSpeed = (multiplier: number) => {
    state.playback.speedMultiplier = multiplier
  }

  /**
   * Action: Updates current playback time, percentage, and currentPathIndex.
   * 
   * @param timeSec - The new virtual time in seconds.
   */
  const updateProgress = (timeSec: number) => {
    if (!state.isLoaded || state.metrics.traversalTimeSeconds === 0) return

    const clampedTime = Math.max(0, Math.min(timeSec, state.metrics.traversalTimeSeconds))
    state.playback.currentTime = clampedTime
    state.playback.progressPercentage = (clampedTime / state.metrics.traversalTimeSeconds) * 100
    
    // Sync the path index for visualization
    state.playback.currentPathIndex = findPathIndex(clampedTime)

    // Force stop if we reach the end
    if (clampedTime >= state.metrics.traversalTimeSeconds && state.playback.isPlaying) {
      state.playback.isPlaying = false
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }

  /** Action: Resets playback to zero. */
  const resetPlayback = () => {
    state.playback.isPlaying = false
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    state.playback.currentTime = 0
    state.playback.progressPercentage = 0
    state.playback.currentPathIndex = 0
  }

  return {
    state,
    loadTelemetry,
    togglePlayback,
    setPlaybackSpeed,
    updateProgress,
    resetPlayback
  }
}

export const liveViewStore = useLiveViewStore()
