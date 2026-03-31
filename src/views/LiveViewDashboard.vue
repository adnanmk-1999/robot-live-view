<script setup lang="ts">
import { Maximize2, Layers } from 'lucide-vue-next'
</script>

<template>
  <div class="live-view-container">
    <div class="view-overlay-controls top-right">
      <button class="overlay-btn" title="Toggle Layers">
        <Layers :size="18" />
      </button>
      <button class="overlay-btn" title="Fullscreen">
        <Maximize2 :size="18" />
      </button>
    </div>
    
    <div class="canvas-placeholder">
      <div class="placeholder-content">
        <h3>[ THE LIVE VIEW ]</h3>
        <p>(Canvas / WebGL)</p>
        <div class="grid-overlay"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live-view-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-overlay-controls {
  position: absolute;
  z-index: 10;
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
}

.top-right {
  top: 0;
  right: 0;
}

.overlay-btn {
  background-color: rgba(11, 14, 20, 0.7);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.overlay-btn:hover {
  background-color: rgba(21, 27, 40, 0.9);
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.canvas-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #1b2130 0%, #0b0e14 100%);
  position: relative;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.placeholder-content {
  text-align: center;
  color: var(--text-muted);
  font-family: var(--font-mono);
  z-index: 1;
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
