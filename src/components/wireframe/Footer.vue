<script setup lang="ts">
import IconButton from '../button/IconButton.vue'
import playIcon from '../../assets/icons/play.svg'
import pauseIcon from '../../assets/icons/pause.svg'
import squareIcon from '../../assets/icons/square.svg'
</script>

<template>
  <footer class="footer">
    <div class="playback-controls">
      <IconButton :src="playIcon" :width="18" title="Play" />
      <IconButton :src="pauseIcon" :width="18" title="Pause" />
      <IconButton :src="squareIcon" :width="14" title="Stop" />
    </div>

    <div class="timeline-container">
      <span class="timeline-label">Timeline</span>
      <div class="timeline-track">
        <div class="timeline-progress" style="width: 45%;"></div>
        <div class="timeline-handle" style="left: 45%;"></div>
      </div>
    </div>

    <IconButton title="Speed" text="1x" variant="primary" />

  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 2rem;
  gap: 2rem;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}


.timeline-container {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.timeline-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.timeline-track {
  flex-grow: 1;
  height: 6px;
  background-color: var(--surface-dark);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.timeline-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--accent-color);
  border-radius: 3px;
  box-shadow: 0 0 8px var(--accent-glow);
}

.timeline-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background-color: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.speed-control {
  display: flex;
  align-items: center;
}
</style>
