<script setup lang="ts">
import Icon from '../Icons/Icon.vue'
import activityIcon from '../../assets/icons/activity.svg'
import pathIcon from '../../assets/icons/path.svg'
import clockIcon from '../../assets/icons/clock.svg'
import areaChartIcon from '../../assets/icons/area_chart.svg'
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
          <span>Path Length</span>
        </div>
        <div class="item-value">54.20 m</div>
      </div>

      <div class="telemetry-item">
        <div class="item-label">
          <Icon :src="clockIcon" :width="24" />
          <span>Trav. Time</span>
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
}
</style>
