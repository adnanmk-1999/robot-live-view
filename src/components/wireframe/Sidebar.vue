<!--
  Sidebar.vue — Telemetry data panel

  Persistent left-side panel rendered inside DashboardLayout. Displays
  computed metrics read reactively from liveViewStore and raw path data
  from telemetryStore. All values show a '--' placeholder until a JSON
  file has been loaded via UploadDataView.

  Metrics displayed:
    - Euclidean Length  — total path length in metres (liveViewStore)
    - Traverse Time     — curvature-adjusted travel time in seconds (liveViewStore)
    - Cleaned Area      — swept union polygon area in m² (liveViewStore)
    - Data Points       — total waypoint count from the raw path (telemetryStore)
-->
<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../Icons/Icon.vue'
import { liveViewStore } from '../../stores/liveViewStore'
import { telemetryStore } from '../../stores/telemetryStore'
import activityIcon from '../../assets/icons/activity.svg'
import pathIcon from '../../assets/icons/path.svg'
import clockIcon from '../../assets/icons/clock.svg'
import areaChartIcon from '../../assets/icons/area_chart.svg'
import dataPointsIcon from '../../assets/icons/data_points.svg'

/**
 * Formats the cumulative Euclidean path length.
 * Returns '-- m' before data is loaded (value is 0).
 */
const pathLength = computed(() => {
  const val = liveViewStore.state.metrics.euclideanPathLengthMeters
  return val > 0 ? `${val.toFixed(2)} m` : '-- m'
})

/**
 * Formats the curvature-based traversal time.
 * Returns '-- s' before data is loaded.
 */
const traversalTime = computed(() => {
  const val = liveViewStore.state.metrics.traversalTimeSeconds
  return val > 0 ? `${val.toFixed(2)} s` : '-- s'
})

/**
 * Formats the swept union polygon area.
 * Returns '-- m²' before data is loaded.
 */
const cleanedArea = computed(() => {
  const val = liveViewStore.state.metrics.cleanedAreaSqMeters
  return val > 0 ? `${val.toFixed(2)} m²` : '-- m²'
})

/**
 * Raw array of path waypoints from telemetryStore.
 * Used only for its .length (total point count) in the template.
 */
const dataPoints = computed(() => telemetryStore.path.value)
</script>

<template>
  <aside class="sidebar">
    <!-- ── Section header: "TELEMETRY" label with accent activity icon ── -->
    <div class="sidebar-header">
      <Icon :src="activityIcon" :width="24" lineColor="var(--accent-color)" />
      <h2>TELEMETRY</h2>
    </div>

    <!-- ── Metric list ── -->
    <div class="telemetry-list">

      <!-- Euclidean path length — sum of all sequential segment distances -->
      <div class="telemetry-item">
        <div class="item-label">
          <Icon :src="pathIcon" :width="24" />
          <span>Euclidean Length</span>
        </div>
        <div class="item-value">{{ pathLength }}</div>
      </div>

      <!-- Curvature-adjusted traversal time using piecewise velocity model -->
      <div class="telemetry-item">
        <div class="item-label">
          <Icon :src="clockIcon" :width="24" />
          <span>Traverse Time</span>
        </div>
        <div class="item-value">{{ traversalTime }}</div>
      </div>

      <!-- Robot swept area union — non-overlapping cleaned surface -->
      <div class="telemetry-item">
        <div class="item-label">
          <Icon :src="areaChartIcon" :width="24" />
          <span>Cleaned Area</span>
        </div>
        <div class="item-value">{{ cleanedArea }}</div>
      </div>

      <!-- Total number of waypoints in the uploaded path -->
      <div class="telemetry-item">
        <div class="item-label">
          <Icon :src="dataPointsIcon" :width="24" />
          <span>Data Points</span>
        </div>
        <div class="item-value">{{ dataPoints.length }}</div>
      </div>

    </div>
  </aside>
</template>

<style scoped>
/* ── Layout ───────────────────────────────────────────────────────────── */

/* Sidebar panel: vertical flex column sitting in the grid's sidebar cell */
.sidebar {
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Section header ───────────────────────────────────────────────────── */

/* Centred "TELEMETRY" label row */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-header h2 {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
}

/* ── Metric list ──────────────────────────────────────────────────────── */

/* Vertical stack of metric items */
.telemetry-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Each metric item: label row above value row */
.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Icon + label text on the same row */
.item-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

/* Slightly dimmed icon inside the label */
.item-label .custom-icon {
  opacity: 0.7;
}

/* Large numeric value with monospace font and accent glow */
.item-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums; /* Prevents layout shift as digits change */
  font-family: var(--font-mono);
  text-shadow: 0 0 10px var(--accent-glow);
  text-align: right;
}

/* ── Unused legacy styles (kept for potential future data-point list) ──── */
.data-points-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0; /* Required for overflow-y to work inside a flex parent */
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Badge showing total data point count */
.point-count {
  margin-left: auto;
  background: var(--surface-light);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--accent-color);
}

/* Scrollable list container for individual data point rows */
.data-points-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

/* Individual coordinate row */
.data-point-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  transition: background 0.15s;
}
.data-point-row:hover {
  background: var(--surface-hover);
}

/* Zero-indexed point number displayed in accent colour */
.point-index {
  color: var(--accent-color);
  min-width: 24px;
  text-align: right;
  opacity: 0.8;
}

.point-coords {
  color: var(--text-muted);
  flex: 1;
}

/* Empty state shown when no data has been loaded */
.data-points-empty {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
  padding: 1rem;
  opacity: 0.6;
}
</style>
