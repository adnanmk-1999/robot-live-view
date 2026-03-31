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

const pathLength = computed(() => {
  const val = liveViewStore.state.metrics.euclideanPathLengthMeters
  return val > 0 ? `${val.toFixed(2)} m` : '-- m'
})

const dataPoints = computed(() => telemetryStore.path.value)
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <Icon :src="activityIcon" :width="24" lineColor="var(--accent-color)" />
      <h2>TELEMETRY</h2>
    </div>

    <div class="telemetry-list">
      <div class="telemetry-item">
        <div class="item-label">
          <Icon :src="pathIcon" :width="24" />
          <span>Euclidean Length</span>
        </div>
        <div class="item-value">{{ pathLength }}</div>
      </div>

      <div class="telemetry-item">
        <div class="item-label">
          <Icon :src="clockIcon" :width="24" />
          <span>Traverse Time</span>
        </div>
        <div class="item-value">120.5 s</div>
      </div>

      <div class="telemetry-item">
        <div class="item-label">
          <Icon :src="areaChartIcon" :width="24" />
          <span>Cleaned Area</span>
        </div>
        <div class="item-value">15.3 m²</div>
      </div>
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
.sidebar {
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

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

.telemetry-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.item-label .custom-icon {
  opacity: 0.7;
}

.item-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
  text-shadow: 0 0 10px var(--accent-glow);
  text-align: right;
}

.data-points-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
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

.data-points-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

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

.data-points-empty {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
  padding: 1rem;
  opacity: 0.6;
}
</style>
