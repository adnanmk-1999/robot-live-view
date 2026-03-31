<!--
  LiveViewDashboard.vue — Robot trajectory visualisation view (route: '/')

  The primary view mounted inside DashboardLayout's <main> slot.
  Currently renders a styled placeholder indicating where the Canvas/WebGL
  renderer will be integrated.

  Overlay controls (top-right):
    - Toggle Layers  — will switch between map/path/gadget layer visibility
    - Fullscreen     — will expand the canvas to fill the viewport

  TODO:
    - Replace .canvas-placeholder with an HTML5 <canvas> element
    - Implement a requestAnimationFrame render loop driven by liveViewStore.playback
    - Draw: path trace, swept area polygon, animated robot hull at currentPathIndex
-->
<script setup lang="ts">
import IconButton from '../components/button/IconButton.vue'
import layersIcon from '../assets/icons/layers.svg'
import maximizeIcon from '../assets/icons/maximize.svg'
</script>

<template>
  <!-- Full-size container relative to the grid's main cell -->
  <div class="live-view-container">

    <!-- Overlay controls anchored to the top-right corner of the canvas -->
    <div class="view-overlay-controls top-right">
      <!-- Layer visibility toggle (future: show/hide path, area, gadget layers) -->
      <IconButton :src="layersIcon"   :width="18" title="Toggle Layers" variant="primary" />
      <!-- Fullscreen expansion (future: expand canvas to full viewport) -->
      <IconButton :src="maximizeIcon" :width="18" title="Fullscreen"     variant="primary" />
    </div>

    <!-- Placeholder: replaced by <canvas> in the next implementation phase -->
    <div class="canvas-placeholder">
      <div class="placeholder-content">
        <h3>[ THE LIVE VIEW ]</h3>
        <p>(Canvas / WebGL)</p>
        <!-- Decorative CSS grid overlay — pointer-events: none so it doesn't block interaction -->
        <div class="grid-overlay"></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Fills the full grid main cell; position: relative anchors overlay controls */
.live-view-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Floating control group; positioned absolutely over the canvas */
.view-overlay-controls {
  position: absolute;
  z-index: 10; /* Above the canvas content */
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
}

/* Named position modifier — additional modifiers (top-left, bottom-right) can be added */
.top-right {
  top: 0;
  right: 0;
}

/* Placeholder canvas: radial dark gradient simulates a depth-of-field background */
.canvas-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #1b2130 0%, #0b0e14 100%);
  position: relative;
}

/* Subtle dot/line grid drawn purely in CSS — replaces the canvas during development */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none; /* Passes clicks through to elements behind the overlay */
}

/* Centred text label inside the placeholder */
.placeholder-content {
  text-align: center;
  color: var(--text-muted);
  font-family: var(--font-mono);
  z-index: 1; /* Above the grid-overlay */
}

.placeholder-content h3 {
  font-size: 1.5rem;
  letter-spacing: 2px;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  text-shadow: 0 0 20px rgba(0,0,0,0.8);
}

.placeholder-content p {
  margin: 0;
  opacity: 0.6;
}
</style>
