<!--
  Footer.vue — Playback control bar

  Persistent footer rendered across all dashboard views. Contains:
  - Playback controls: Play / Pause / Stop (IconButton, icon-only)
  - Timeline track: a scrubable progress bar showing traversal position
  - Speed toggle: displays and cycles the playback speed multiplier

  TODO: wire playback controls and timeline progress to liveViewStore.playback.
-->
<script setup lang="ts">
import IconButton from '../button/IconButton.vue'
import playIcon from '../../assets/icons/play.svg'
import pauseIcon from '../../assets/icons/pause.svg'
import squareIcon from '../../assets/icons/square.svg'
</script>

<template>
  <footer class="footer">

    <!-- ── Playback controls: Play / Pause / Stop ─────────────────────── -->
    <div class="playback-controls">
      <IconButton :src="playIcon"   :width="18" title="Play" />
      <IconButton :src="pauseIcon"  :width="18" title="Pause" />
      <IconButton :src="squareIcon" :width="14" title="Stop" />
    </div>

    <!-- ── Timeline scrubber: shows playback progress ──────────────────── -->
    <div class="timeline-container">
      <span class="timeline-label">Timeline</span>
      <div class="timeline-track">
        <!-- Progress fill: width reflects liveViewStore.playback.progressPercentage -->
        <div class="timeline-progress" style="width: 45%;"></div>
        <!-- Draggable handle positioned at the current progress point -->
        <div class="timeline-handle" style="left: 45%;"></div>
      </div>
    </div>

    <!-- ── Speed multiplier toggle ──────────────────────────────────────── -->
    <IconButton title="Speed" text="1x" variant="primary" />

  </footer>
</template>

<style scoped>
/* Horizontal flex bar spanning the full footer grid area */
.footer {
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 2rem;
  gap: 2rem;
}

/* Grouped icon buttons for play / pause / stop */
.playback-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Timeline takes up remaining space between controls and speed button */
.timeline-container {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Small ALL-CAPS label to the left of the track */
.timeline-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Thin coloured track bar */
.timeline-track {
  flex-grow: 1;
  height: 6px;
  background-color: var(--surface-dark);
  border-radius: 3px;
  position: relative; /* Anchor for absolute progress fill and handle */
  cursor: pointer;
}

/* Accent-coloured fill indicating elapsed progress */
.timeline-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--accent-color);
  border-radius: 3px;
  box-shadow: 0 0 8px var(--accent-glow); /* Subtle glow on the progress band */
}

/* Circular scrub handle centred on the current progress point */
.timeline-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background-color: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%); /* Centre the circle over its left anchor */
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.speed-control {
  display: flex;
  align-items: center;
}
</style>
