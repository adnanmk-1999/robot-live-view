/**
 * @file liveViewStore.ts
 * @description Central reactive hub for derived metrics and interactive playback state.
 */

import { reactive } from 'vue'
import type { TelemetryData, TelemetryMetrics, RobotProfile } from '../types/telemetry'
import type { PlaybackState } from '../types/playback'
import { calculatePathLength } from '../utils/euclideanDistance'
import { calculateSweptArea } from '../utils/sweptArea'
import { calculateTraversalTime } from '../utils/traversalTime'
import { telemetryStore } from './telemetryStore'
import { smoothPathMetric, deduplicatePath } from '../utils/pathSmoothing'
import { calculateHeadingAtIndex } from '../utils/heading'

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
    smoothedPath: [],
    rawPathLengthMeters: 0,
    smoothedPathLengthMeters: 0,
    cleanedAreaSqMeters: 0,
    traversalTimeSeconds: 0,
    sweptPolygons: [],
    robotProfile: []
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
    const profile = state.metrics.robotProfile
    if (!profile.length) return 0
    for (let i = profile.length - 1; i >= 0; i--) {
      if (profile[i].timestampSec <= timeSec) return i
    }
    return 0
  }

  /**
   * Action: Primary ingestion pipeline.
   */
  const loadTelemetry = (jsonData: TelemetryData) => {
    // 1. Core Ingestion
    telemetryStore.load(jsonData)

    // 2. Pre-process: Path Smoothing using a weighted moving average.
    // A window of 3 averages each point with its immediate neighbors to remove high-frequency noise.
    const dedupedPath = deduplicatePath(telemetryStore.path.value, 0.005)
    const smoothedPath = smoothPathMetric(dedupedPath, 3)

    state.metrics.smoothedPath = smoothedPath

    state.isLoaded = true
    state.playback.currentTime = 0
    state.playback.currentPathIndex = 0
    state.playback.progressPercentage = 0
    state.playback.isPlaying = false

    // 3. Metric Computation (using Smooth Data)
    state.metrics.rawPathLengthMeters = calculatePathLength(telemetryStore.path.value)
    state.metrics.smoothedPathLengthMeters = calculatePathLength(smoothedPath)

    const sweptResult = calculateSweptArea(
      smoothedPath,
      telemetryStore.robot.value,
      telemetryStore.cleaningGadget.value
    )
    state.metrics.cleanedAreaSqMeters = sweptResult.areaSqMeters
    state.metrics.sweptPolygons = sweptResult.polygons

    const traversalResult = calculateTraversalTime(smoothedPath)
    state.metrics.traversalTimeSeconds = traversalResult.totalTimeSeconds

    // Build the pre-computed RobotProfile: one entry per waypoint
    const robotProfile: RobotProfile = smoothedPath.map((position, i) => ({
      position,
      headingRad: calculateHeadingAtIndex(smoothedPath, i),
      velocityMs: traversalResult.velocityProfile[i] ?? traversalResult.velocityProfile[traversalResult.velocityProfile.length - 1] ?? 0,
      curvature: traversalResult.curvatures[i] ?? 0,
      timestampSec: traversalResult.waypointTimestamps[i] ?? 0
    }))
    state.metrics.robotProfile = robotProfile
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

  /** Action: Fully purges the store state. */
  const clearStore = () => {
    resetPlayback()
    state.isLoaded = false
    
    // Reset Metrics
    state.metrics.smoothedPath = []
    state.metrics.rawPathLengthMeters = 0
    state.metrics.smoothedPathLengthMeters = 0
    state.metrics.cleanedAreaSqMeters = 0
    state.metrics.traversalTimeSeconds = 0
    state.metrics.sweptPolygons = []
    state.metrics.robotProfile = []
  }

  return {
    state,
    loadTelemetry,
    togglePlayback,
    setPlaybackSpeed,
    updateProgress,
    resetPlayback,
    clearStore
  }
}

export const liveViewStore = useLiveViewStore()
