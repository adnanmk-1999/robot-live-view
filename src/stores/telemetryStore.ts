/**
 * @file telemetryStore.ts
 * @description Simple reactive store for raw telemetry data (the "Source of Truth").
 */

import { reactive, readonly, computed } from 'vue'
import type { TelemetryData, Point2D } from '../types/telemetry'

/** Internal state for the store. */
interface TelemetryStoreState {
  /** True once a valid JSON has been successfully loaded. */
  isLoaded: boolean
  /** Raw JSON structure holding path and robot hull. */
  data: TelemetryData | null
}

/** Private reactive state. */
const state = reactive<TelemetryStoreState>({
  isLoaded: false,
  data: null
})

/**
 * Action: Loads raw telemetry data into the store and marks it as loaded.
 * @param raw - Validated TelemetryData object.
 */
const load = (raw: TelemetryData): void => {
  state.data = raw
  state.isLoaded = true
}

/**
 * Action: Resets the store to its initial empty state.
 */
const clear = (): void => {
  state.data = null
  state.isLoaded = false
}

// ── Typed Computed Accessors ────────────────────────────────────────────────
// These provide safe access to inner data, falling back to empty arrays if null.

/** Computed ref for the robot's target path waypoints. */
const path = computed<Point2D[]>(() => state.data?.path ?? [])

/** Computed ref for the robot's local hull vertices. */
const robot = computed<Point2D[]>(() => state.data?.robot ?? [])

/** Computed ref for the cleaning attachment vertices. */
const cleaningGadget = computed<Point2D[]>(() => state.data?.cleaning_gadget ?? [])

/**
 * Public Telemetry Store instance.
 * Exposes readonly state and actions to ensure single-direction data flow.
 */
export const telemetryStore = {
  /** Read-only access to loading status and raw data. */
  state: readonly(state),
  
  /** Method to ingest new telemetry data. */
  load,
  
  /** Method to purge current data. */
  clear,
  
  // Expose computed accessors directly for convenience in templates/other stores
  path,
  robot,
  cleaningGadget
}
