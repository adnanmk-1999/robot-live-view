<!--
  Footer.vue — Playback control bar

  Persistent footer rendered across all dashboard views. Contains:
  - Playback controls: Play / Pause / Stop
  - Timeline track: a scrubable progress bar showing traversal position
  - Speed toggle: displays and cycles the playback speed multiplier
-->
<script setup lang="ts">
import IconButton from '../button/IconButton.vue'
import playIcon from '../../assets/icons/play.svg'
import pauseIcon from '../../assets/icons/pause.svg'
import squareIcon from '../../assets/icons/square.svg'
import { liveViewStore } from '../../stores/liveViewStore'

/** Format seconds into MM:SS */
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/** Toggles between 1x, 2x, 4x speed */
const cycleSpeed = () => {
  const speeds = [1, 2, 4]
  const current = liveViewStore.state.playback.speedMultiplier
  const next = speeds[(speeds.indexOf(current) + 1) % speeds.length]
  liveViewStore.setPlaybackSpeed(next)
}

/** Handles timeline scrubbing */
const onScrubInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).valueAsNumber
  liveViewStore.updateProgress(val)
}
</script>

<template>
  <footer class="footer">

    <!-- ── Playback Controls ── -->
    <div class="playback-controls">
      <IconButton 
        v-if="!liveViewStore.state.playback.isPlaying"
        :src="playIcon" 
        :width="18" 
        title="Play" 
        @click="liveViewStore.togglePlayback()"
      />
      <IconButton 
        v-else
        :src="pauseIcon" 
        :width="18" 
        title="Pause" 
        @click="liveViewStore.togglePlayback()"
      />
      <IconButton 
        :src="squareIcon" 
        :width="14" 
        title="Stop" 
        @click="liveViewStore.resetPlayback()"
      />
    </div>

    <!-- ── Timeline Scrubber ── -->
    <div class="timeline-container">
      <div class="time-readout">
        {{ formatTime(liveViewStore.state.playback.currentTime) }}
      </div>
      
      <div class="timeline-track-wrapper">
        <div class="timeline-track">
          <div 
            class="timeline-progress" 
            :style="{ width: liveViewStore.state.playback.progressPercentage + '%' }"
          ></div>
          <div 
            class="timeline-handle" 
            :style="{ left: liveViewStore.state.playback.progressPercentage + '%' }"
          ></div>
        </div>
        
        <!-- Transparent range input on top for scrubbing -->
        <input 
          type="range" 
          class="scrub-input" 
          min="0" 
          :max="liveViewStore.state.metrics.traversalTimeSeconds" 
          step="0.01"
          :value="liveViewStore.state.playback.currentTime"
          @input="onScrubInput"
        />
      </div>

      <div class="time-readout total">
        {{ formatTime(liveViewStore.state.metrics.traversalTimeSeconds) }}
      </div>
    </div>

    <!-- ── Speed Multiplier Toggle ── -->
    <IconButton 
      title="Speed" 
      :text="liveViewStore.state.playback.speedMultiplier + 'x'" 
      variant="primary" 
      @click="cycleSpeed"
    />

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
  min-width: 100px;
}

.timeline-container {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.time-readout {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-muted);
  min-width: 45px;
}

.time-readout.total {
  text-align: right;
}

.timeline-track-wrapper {
  flex-grow: 1;
  position: relative;
  height: 24px; /* Larger hit area */
  display: flex;
  align-items: center;
}

.timeline-track {
  width: 100%;
  height: 6px;
  background-color: var(--surface-dark);
  border-radius: 3px;
  position: relative;
}

.timeline-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--accent-color);
  border-radius: 3px;
  box-shadow: 0 0 10px var(--accent-glow);
}

.timeline-handle {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background-color: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.4);
}

/* Hidden but functional range input */
.scrub-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}
</style>
