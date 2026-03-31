import { reactive } from 'vue'
import type { TelemetryData, TelemetryMetrics, PlaybackState } from '../types/telemetry'

interface LiveViewState {
  isLoaded: boolean;
  data: TelemetryData | null;
  metrics: TelemetryMetrics;
  playback: PlaybackState;
}

const state = reactive<LiveViewState>({
  isLoaded: false,
  data: null,
  metrics: {
    pathLengthMeters: 0,
    cleanedAreaSqMeters: 0,
    traversalTimeSeconds: 0
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
    state.data = jsonData
    state.isLoaded = true
    state.playback.currentTime = 0
    state.playback.currentPathIndex = 0
    state.playback.progressPercentage = 0
    state.playback.isPlaying = false
  }

  const setMetrics = (length: number, area: number, time: number) => {
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
