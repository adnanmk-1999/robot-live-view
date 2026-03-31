import { reactive, readonly, computed } from 'vue'
import type { TelemetryData, Point2D } from '../types/telemetry'

interface TelemetryStoreState {
  isLoaded: boolean
  data: TelemetryData | null
}

const state = reactive<TelemetryStoreState>({
  isLoaded: false,
  data: null
})

const load = (raw: TelemetryData): void => {
  state.data = raw
  state.isLoaded = true
}

const clear = (): void => {
  state.data = null
  state.isLoaded = false
}

// Typed accessors — only available when data is loaded
const path = computed<Point2D[]>(() => state.data?.path ?? [])
const robot = computed<Point2D[]>(() => state.data?.robot ?? [])
const cleaningGadget = computed<Point2D[]>(() => state.data?.cleaning_gadget ?? [])

export const telemetryStore = {
  // Expose state as readonly to prevent direct mutation outside actions
  state: readonly(state),
  load,
  clear,
  // Computed accessors
  path,
  robot,
  cleaningGadget
}
