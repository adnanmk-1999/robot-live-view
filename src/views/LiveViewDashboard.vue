<!--
  LiveViewDashboard.vue — Interactive 3D Robot visualization view (route: '/')

  Features:
    - 3D Rotation, Panning, and Zooming (OrbitControls)
    - Layer Toggles: Area, Path, Points, Robot, Grid
    - Curvature-coded trajectory waypoints
    - Translucent Swept Area (cleaned surface)
    - 3D Robot Avatar with decorative cleaning gadget
    - Real-time Hover Coordinate Tracking (Raycasting)
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import IconButton from '../components/button/IconButton.vue'

// Icons
import layersIcon from '../assets/icons/layers.svg'
import areaChartIcon from '../assets/icons/area_chart.svg'
import pathIcon from '../assets/icons/path.svg'
import dataPointsIcon from '../assets/icons/data_points.svg'
import robotIcon from '../assets/logo.png'
import maximizeIcon from '../assets/icons/maximize.svg'
import collapseIcon from '../assets/icons/collapse.svg'
import closeIcon from '../assets/icons/close.svg'

import { telemetryStore } from '../stores/telemetryStore'
import { liveViewStore } from '../stores/liveViewStore'
import { toVector3, getPathCenter, lerpPoint } from '../utils/threeUtils'
import { calculateHeadingAtIndex } from '../utils/heading'

// ── UI State ────────────────────────────────────────────────────────────────

const containerRef = ref<HTMLDivElement | null>(null)
const isFullscreen = ref(false)
const layers = reactive({
  showArea: true,
  showPath: true,
  showPoints: true,
  showRobot: true,
  showHeading: true,
  showGrid: true,
  showLegend: true
})

const hoverCoords = reactive({
  x: 0,
  y: 0,
  active: false
})

const robotPose = reactive({
  x: 0,
  y: 0,
  heading: 0
})

// ── Three.js Core Instances ────────────────────────────────────────────────

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let gridHelper: THREE.GridHelper
let animationFrameId: number | null = null

// Raycasting utilities
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const groundPoint = new THREE.Vector3()

// Group holders for dynamic content
let pathGroup = new THREE.Group()
let areaGroup = new THREE.Group()
let pointsGroup = new THREE.Group()
let robotGroup = new THREE.Group()

// ── Event Handlers ─────────────────────────────────────────────────────────

const onMouseMove = (event: MouseEvent) => {
  if (!containerRef.value || !camera) return

  // Calculate mouse position in normalized device coordinates (-1 to +1)
  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // Project ray from camera
  raycaster.setFromCamera(mouse, camera)

  // Intersection with ground plane (Y=0)
  if (raycaster.ray.intersectPlane(groundPlane, groundPoint)) {
    hoverCoords.x = groundPoint.x
    hoverCoords.y = -groundPoint.z // Invert Z to match Telemetry Y
    hoverCoords.active = true
  } else {
    hoverCoords.active = false
  }
}

// ── Rendering Helpers ──────────────────────────────────────────────────────

const getCurvatureColorHSL = (kappa: number): THREE.Color => {
  const K_MAX = 10.0
  const ratio = Math.min(kappa / K_MAX, 1.0)
  return new THREE.Color().setHSL((120 * (1 - ratio)) / 360, 0.8, 0.5)
}



/**
 * Shortest-path angle interpolation to prevent 'spinning' when wrapping around +/- PI.
 */
const lerpAngle = (start: number, end: number, t: number): number => {
  let diff = end - start
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return start + diff * t
}

const updateRobotModel = () => {
  robotGroup.clear()
  if (!layers.showRobot || telemetryStore.robot.value.length < 3) return

  const hull = telemetryStore.robot.value

  // 1. Calculate Centroid (Geometric Center)
  let cx = 0, cy = 0
  hull.forEach(p => { cx += p[0]; cy += p[1] })
  cx /= hull.length; cy /= hull.length

  // 2. Robot Body (Extruded hull, recentered on Centroid)
  const shape = new THREE.Shape()
  hull.forEach((p, i) => {
    // Subtract centroid to anchor the center of mass at (0, 0, 0)
    const rx = p[0] - cx
    const ry = p[1] - cy
    if (i === 0) shape.moveTo(rx, ry)
    else shape.lineTo(rx, ry)
  })

  const extrudeSettings = { depth: 0.25, bevelEnabled: false }
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, extrudeSettings),
    new THREE.MeshPhongMaterial({ color: 0xe67e22, transparent: true, opacity: 0.4 })
  )
  mesh.rotation.x = -Math.PI / 2
  robotGroup.add(mesh)

  // 3. Cleaning Gadget (Thick Bar under the robot)
  const gadget = telemetryStore.cleaningGadget.value
  if (gadget.length >= 2) {
    const p1 = gadget[0]
    const p2 = gadget[1]
    const dx = p2[0] - p1[0]
    const dy = p2[1] - p1[1]
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    const barGeom = new THREE.PlaneGeometry(length, 0.08)
    const barMesh = new THREE.Mesh(barGeom, new THREE.MeshPhongMaterial({
      color: 0xfbc02d,  // Safety Yellow
      emissive: 0xfbc02d,
      emissiveIntensity: 0.2
    }))

    const midX = (p1[0] + p2[0]) / 2 - cx
    const midY = (p1[1] + p2[1]) / 2 - cy
    barMesh.position.set(midX, 0.08, -midY) // Raised to 0.08m
    barMesh.rotation.x = -Math.PI / 2
    barMesh.rotation.z = angle
    robotGroup.add(barMesh)
  }

  // 4. Facing Arrow (Originating from COM)
  if (layers.showHeading) {
    const dir = new THREE.Vector3(1, 0, 0)
    const origin = new THREE.Vector3(0, 0.3, 0)
    const length = 0.5
    robotGroup.add(new THREE.ArrowHelper(dir, origin, length, 0xffffff, 0.15, 0.1))
  }
}

const updateRobotPose = () => {
  const path = liveViewStore.state.metrics.smoothedPath
  const ts = liveViewStore.state.metrics.waypointTimestamps
  if (path.length < 2 || ts.length < 2) return

  const time = liveViewStore.state.playback.currentTime
  const index = liveViewStore.state.playback.currentPathIndex

  // 1. Calculate interpolation factor 't' between waypoints
  let t = 0
  const nextIndex = Math.min(index + 1, path.length - 1)
  if (index < path.length - 1) {
    const t0 = ts[index]
    const t1 = ts[nextIndex]
    const dt = t1 - t0
    if (dt > 1e-6) {
      t = Math.max(0, Math.min(1, (time - t0) / dt))
    }
  }

  // 2. Interpolate Position
  const p1 = path[index]
  const p2 = path[nextIndex]
  const interpPt = lerpPoint(p1, p2, t)
  robotGroup.position.copy(toVector3(interpPt, 0.02))

  // 3. Interpolate Rotation (Angle Lerp)
  const h1 = calculateHeadingAtIndex(path, index)
  const h2 = calculateHeadingAtIndex(path, nextIndex)
  const finalHeading = lerpAngle(h1, h2, t)
  robotGroup.rotation.y = finalHeading

  // 4. Update UI State
  robotPose.x = interpPt[0]
  robotPose.y = interpPt[1]
  robotPose.heading = (finalHeading * 180) / Math.PI
}

const updateGeometry = () => {
  const path = liveViewStore.state.metrics.smoothedPath
  const metrics = liveViewStore.state.metrics

  pathGroup.clear()
  areaGroup.clear()
  pointsGroup.clear()
  robotGroup.clear()

  if (path.length === 0) {
    robotPose.x = 0
    robotPose.y = 0
    robotPose.heading = 0
    return
  }

  // Grid visibility
  if (gridHelper) gridHelper.visible = layers.showGrid

  // Path Line
  if (layers.showPath) {
    const points = path.map(p => toVector3(p, 0.05))
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    pathGroup.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x444444 })))
  }

  // Waypoints (Spheres)
  if (layers.showPoints) {
    const sphereGeom = new THREE.SphereGeometry(0.04, 8, 8)
    path.forEach((pt, i) => {
      const kappa = metrics.curvatures[i] || 0
      const mesh = new THREE.Mesh(sphereGeom, new THREE.MeshBasicMaterial({ color: getCurvatureColorHSL(kappa) }))
      mesh.position.copy(toVector3(pt, 0.05))
      pointsGroup.add(mesh)
    })
  }

  // Swept Area
  if (layers.showArea) {
    const material = new THREE.MeshBasicMaterial({ color: 0x00c8ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    metrics.sweptBoundaryRings.forEach(ring => {
      const shape = new THREE.Shape()
      ring.forEach((p, i) => { if (i === 0) shape.moveTo(p[0], p[1]); else shape.lineTo(p[0], p[1]) })
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.y = 0.01
      areaGroup.add(mesh)
    })
  }

  updateRobotModel()
  updateRobotPose()

  const center = getPathCenter(path)
  controls.target.copy(center)
  if (camera.position.length() < 2) camera.position.set(center.x, 10, center.z + 8)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

const initThree = () => {
  if (!containerRef.value) return
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b0e14)
  camera = new THREE.PerspectiveCamera(50, containerRef.value.clientWidth / containerRef.value.clientHeight, 0.1, 1000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  containerRef.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  gridHelper = new THREE.GridHelper(100, 100, 0x222222, 0x111111)
  scene.add(gridHelper)

  scene.add(new THREE.AmbientLight(0xffffff, 1.0))
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  scene.add(pathGroup, areaGroup, pointsGroup, robotGroup)
  animate()
  updateGeometry()
}

const toggleFullscreen = async () => {
  if (!containerRef.value) return
  try {
    if (!document.fullscreenElement) {
      await containerRef.value.requestFullscreen()
    } else if (document.exitFullscreen) {
      await document.exitFullscreen()
    }
  } catch (err) {
    console.error('Error toggling fullscreen:', err)
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => nextTick(() => {
  initThree();
  window.addEventListener('resize', () => {
    if (!containerRef.value) return
    camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  })
  document.addEventListener('fullscreenchange', handleFullscreenChange)
}))

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  renderer?.dispose()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

watch(() => liveViewStore.state.metrics.smoothedPath, () => updateGeometry(), { deep: true })
watch(() => liveViewStore.state.playback.currentPathIndex, () => updateRobotPose())
watch(() => [layers.showArea, layers.showPath, layers.showPoints, layers.showGrid], () => updateGeometry())
watch(() => [layers.showRobot, layers.showHeading], () => updateRobotModel())
watch(() => layers.showLegend, () => updateGeometry())

</script>

<template>
  <div class="live-view-container" ref="containerRef" @mousemove="onMouseMove">

    <!-- ── Overlay Controls (Menu) ── -->
    <div v-if="liveViewStore.state.isLoaded" class="view-overlay-controls top-right" style="align-items: center;">
      <IconButton :src="isFullscreen ? collapseIcon : maximizeIcon" :width="18"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'" @click="toggleFullscreen" variant="primary" />
      <div class="button-group-vertical" style="align-items: center;">
        <div class="controls-label">Toggle Controls</div>
        <IconButton :src="areaChartIcon" :width="18" title="Sweep Area" @click="layers.showArea = !layers.showArea"
          :variant="layers.showArea ? 'primary' : 'secondary'" />
        <IconButton :src="pathIcon" :width="18" title="Smooth Path" @click="layers.showPath = !layers.showPath"
          :variant="layers.showPath ? 'primary' : 'secondary'" />
        <IconButton :src="dataPointsIcon" :width="18" title="Waypoints" @click="layers.showPoints = !layers.showPoints"
          :variant="layers.showPoints ? 'primary' : 'secondary'" />
        <IconButton :src="robotIcon" :width="18" title="Robot" @click="layers.showRobot = !layers.showRobot"
          :variant="layers.showRobot ? 'primary' : 'secondary'" />
        <IconButton :src="layersIcon" :width="18" title="Grid" @click="layers.showGrid = !layers.showGrid"
          :variant="layers.showGrid ? 'primary' : 'secondary'" />
      </div>
    </div>

    <!-- ── Coordinate Meters (HUDs) ── -->
    <div class="hud-layer">
      <!-- Cursor Position -->
      <div v-if="hoverCoords.active && liveViewStore.state.isLoaded" class="coordinate-meter cursor-meter">
        <div class="meter-item">
          <span class="meter-label">Pointer X</span>
          <span class="meter-value">{{ hoverCoords.x.toFixed(2) }}<small>m</small></span>
        </div>
        <div class="meter-divider"></div>
        <div class="meter-item">
          <span class="meter-label">Pointer Y</span>
          <span class="meter-value">{{ hoverCoords.y.toFixed(2) }}<small>m</small></span>
        </div>
      </div>

      <!-- Robot Pose -->
      <div v-if="liveViewStore.state.isLoaded" class="coordinate-meter robot-meter">
        <div class="meter-item">
          <span class="meter-label">Robot X</span>
          <span class="meter-value">{{ robotPose.x.toFixed(2) }}<small>m</small></span>
        </div>
        <div class="meter-divider"></div>
        <div class="meter-item">
          <span class="meter-label">Robot Y</span>
          <span class="meter-value">{{ robotPose.y.toFixed(2) }}<small>m</small></span>
        </div>
        <div class="meter-divider"></div>
        <div class="meter-item">
          <span class="meter-label">Heading</span>
          <span class="meter-value">{{ robotPose.heading.toFixed(1) }}<small>°</small></span>
        </div>
      </div>
    </div>

    <!-- ── Visual Legend (Layers) ── -->
    <div v-if="liveViewStore.state.isLoaded" class="visual-legend">
      <div class="legend-header">Layers</div>
      <div class="legend-item"><span class="color-swatch robot"></span> Robot Model</div>
      <div class="legend-item"><span class="color-swatch path"></span> Trajectory Path</div>
      <div class="legend-item"><span class="color-swatch area"></span> Swept Area</div>
      <div class="legend-item"><span class="color-swatch tool"></span> Cleaning Tool</div>
    </div>

    <!-- ── Curvature Legend ── -->
    <div v-if="liveViewStore.state.isLoaded && layers.showLegend" class="curvature-legend">
      <div class="legend-header">
        <span>Curvature (3D)</span>
        <IconButton :src="closeIcon" :width="16" title="Close" @click="layers.showLegend = false" variant="primary" />
      </div>
      <div class="gradient-bar"></div>
      <div class="legend-labels">
        <span>Low (Fast)</span>
        <span>High (Slow)</span>
      </div>
    </div>

    <!-- ── Contextual HUD ── -->
    <div v-if="liveViewStore.state.isLoaded" class="navigation-hint">
      <div><strong>Left:</strong> Rotate</div>
      <div><strong>Right:</strong> Pan</div>
      <div><strong>Scroll:</strong> Zoom</div>
    </div>

    <!-- Empty State Overlay -->
    <div v-if="!liveViewStore.state.isLoaded" class="placeholder-overlay">
      <div class="placeholder-content">
        <h3>[ 3D ENGINE READY ]</h3>
        <p>Telemetry required for interactive visualization.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live-view-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #0b0e14;
  overflow: hidden;
}

.view-overlay-controls {
  position: absolute;
  z-index: 10;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.controls-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 600;
  margin-right: 0.25rem;
  pointer-events: none;
}

.button-group-vertical {
  background: rgba(11, 14, 20, 0.6);
  backdrop-filter: blur(8px);
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hud-layer {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 100;
  pointer-events: none;
}

.coordinate-meter {
  background: rgba(11, 14, 20, 0.7);
  backdrop-filter: blur(10px);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: var(--font-mono);
  box-shadow: var(--shadow-lg);
}

.cursor-meter {
  background: rgba(0, 200, 255, 0.1);
  border-color: rgba(0, 200, 255, 0.2);
}

.robot-meter {
  background: rgba(230, 126, 34, 0.1);
  border-color: rgba(230, 126, 34, 0.2);
}

.meter-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.meter-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.meter-value {
  font-size: 1rem;
  color: #fff;
  font-weight: 600;
}

.meter-value small {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-left: 2px;
}

.meter-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
}

.navigation-hint {
  position: absolute;
  bottom: 14rem;
  /* Stacked above the curvature legend */
  right: 2rem;
  background: rgba(0, 0, 0, 0.6);
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 0.5rem 1.2rem;
  border-radius: 30px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  font-family: var(--font-mono);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.visual-legend {
  position: absolute;
  bottom: 2rem;
  left: 1.5rem;
  background: rgba(11, 14, 20, 0.7);
  backdrop-filter: blur(10px);
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 10;
  box-shadow: var(--shadow-lg);
  font-family: var(--font-secondary);
}

.visual-legend .legend-header {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.2rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.8rem;
  color: #fff;
  font-weight: 500;
}

.color-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.color-swatch.robot {
  background-color: #e67e22;
}

.color-swatch.path {
  background-color: #444444;
}

.color-swatch.area {
  background-color: rgba(0, 200, 255, 0.5);
  border: 1px solid #00c8ff;
}

.color-swatch.tool {
  background-color: #fbc02d;
}

.curvature-legend {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  background-color: var(--surface-light);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  width: 220px;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
  z-index: 5;
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.gradient-bar {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #4caf50 0%, #fbc02d 50%, #f44336 100%);
  margin: 0.75rem 0;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.placeholder-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.placeholder-content {
  text-align: center;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.placeholder-content h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}
</style>
