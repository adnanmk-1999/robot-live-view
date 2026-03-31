<!--
  LiveViewDashboard.vue — Interactive 3D Robot visualization view (route: '/')

  Features:
    - 3D Rotation, Panning, and Zooming (OrbitControls)
    - Curvature-coded trajectory waypoints
    - Translucent Swept Area (cleaned surface)
    - 3D Robot Avatar positioned at the current telemetry pose
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import IconButton from '../components/button/IconButton.vue'
import layersIcon from '../assets/icons/layers.svg'
import maximizeIcon from '../assets/icons/maximize.svg'
import { telemetryStore } from '../stores/telemetryStore'
import { liveViewStore } from '../stores/liveViewStore'
import { toVector3, getPathCenter } from '../utils/threeUtils'

// ── UI State ────────────────────────────────────────────────────────────────

const containerRef = ref<HTMLDivElement | null>(null)
const layers = reactive({
  showArea: true,
  showPath: true,
  showPoints: true,
  showRobot: true,
  showLegend: true
})

// ── Three.js Core Instances ────────────────────────────────────────────────

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationFrameId: number | null = null

// Group holders for dynamic content
let pathGroup = new THREE.Group()
let areaGroup = new THREE.Group()
let pointsGroup = new THREE.Group()
let robotGroup = new THREE.Group()

// ── Rendering Helpers ──────────────────────────────────────────────────────

const getCurvatureColorHSL = (kappa: number): THREE.Color => {
  const K_MAX = 10.0 
  const ratio = Math.min(kappa / K_MAX, 1.0)
  return new THREE.Color().setHSL((120 * (1 - ratio)) / 360, 0.8, 0.5)
}

/** 
 * Computes heading at index based on path.
 */
const calculateHeading = (path: any[], index: number): number => {
  if (path.length < 2) return 0
  let dx: number, dy: number
  if (index === path.length - 1) {
    dx = path[index][0] - path[index - 1][0]
    dy = path[index][1] - path[index - 1][1]
  } else {
    dx = path[index + 1][0] - path[index][0]
    dy = path[index + 1][1] - path[index][1]
  }
  return Math.atan2(dy, dx)
}

/**
 * Creates the 3D robot mesh from hull vertices.
 */
const updateRobotModel = () => {
  robotGroup.clear()
  if (!layers.showRobot || telemetryStore.robot.value.length < 3) return

  const hull = telemetryStore.robot.value
  const gadget = telemetryStore.cleaningGadget.value
  
  // 1. Robot Body (Extruded Hull)
  const shape = new THREE.Shape()
  hull.forEach((p, i) => {
    if (i === 0) shape.moveTo(p[0], p[1])
    else shape.lineTo(p[0], p[1])
  })
  
  const extrudeSettings = { depth: 0.3, bevelEnabled: false }
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  const material = new THREE.MeshPhongMaterial({ color: 0xe67e22, transparent: true, opacity: 0.9 })
  const mesh = new THREE.Mesh(geometry, material)
  
  // Align shape (XY) to world (XZ). Extrude depth becomes height.
  mesh.rotation.x = -Math.PI / 2
  robotGroup.add(mesh)

  // 2. Cleaning Attachment (Decorative)
  if (gadget.length >= 2) {
    const gadgetLineGeom = new THREE.BufferGeometry().setFromPoints(
      gadget.map(p => new THREE.Vector3(p[0], 0.35, -p[1]))
    )
    const gadgetMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
    robotGroup.add(new THREE.Line(gadgetLineGeom, gadgetMat))
  }
}

/** 
 * Updates the robot position/rotation based on the playback state index.
 */
const updateRobotPose = () => {
  const path = telemetryStore.path.value
  if (path.length === 0) return
  
  const index = liveViewStore.state.playback.currentPathIndex
  const pt = path[index]
  const heading = calculateHeading(path, index)
  
  robotGroup.position.copy(toVector3(pt, 0.02)) // Sits slightly above ground
  robotGroup.rotation.y = heading
}

const updateGeometry = () => {
  const path = telemetryStore.path.value
  const metrics = liveViewStore.state.metrics
  
  pathGroup.clear()
  areaGroup.clear()
  pointsGroup.clear()
  
  if (path.length === 0) return

  // Path Line
  if (layers.showPath) {
    const points = path.map(p => toVector3(p, 0.05))
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x444444 }))
    pathGroup.add(line)
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

  // Auto-focus logic
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
  scene.add(new THREE.GridHelper(100, 100, 0x222222, 0x111111))
  scene.add(new THREE.AmbientLight(0xffffff, 1.0))
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)
  
  scene.add(pathGroup, areaGroup, pointsGroup, robotGroup)
  animate()
  updateGeometry()
}

onMounted(() => nextTick(() => { initThree(); window.addEventListener('resize', () => {
  if (!containerRef.value) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}) }))

onUnmounted(() => { if (animationFrameId) cancelAnimationFrame(animationFrameId); renderer?.dispose() })

watch(() => telemetryStore.path.value, () => updateGeometry(), { deep: true })
watch(() => liveViewStore.state.playback.currentPathIndex, () => updateRobotPose())
watch(() => layers, () => updateGeometry(), { deep: true })

</script>

<template>
  <div class="live-view-container" ref="containerRef">

    <!-- ── Overlay Controls ── -->
    <div class="view-overlay-controls top-right">
      <IconButton 
        :src="layersIcon" 
        :width="18" 
        title="Toggle Robot" 
        @click="layers.showRobot = !layers.showRobot"
        :variant="layers.showRobot ? 'primary' : 'secondary'"
      />
      <IconButton 
        :src="maximizeIcon" 
        :width="18" 
        title="Fullscreen" 
        variant="primary" 
      />
    </div>

    <!-- ── Curvature Legend ── -->
    <div v-if="liveViewStore.state.isLoaded && layers.showLegend" class="curvature-legend">
      <div class="legend-header">
        <span>Curvature (3D)</span>
        <button @click="layers.showLegend = false" class="close-legend">×</button>
      </div>
      <div class="gradient-bar"></div>
      <div class="legend-labels">
        <span>Low (Fast)</span>
        <span>High (Slow)</span>
      </div>
    </div>

    <div v-if="liveViewStore.state.isLoaded" class="navigation-hint">
       🖱️ Left: Rotate | Right: Pan | Scroll: Zoom
    </div>

    <div v-if="!liveViewStore.state.isLoaded" class="placeholder-overlay">
      <div class="placeholder-content">
        <h3>[ 3D ENGINE READY ]</h3>
        <p>Upload telemetry file to visualize robot pose.</p>
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
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

.navigation-hint {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.5);
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  font-family: var(--font-mono);
  border: 1px solid rgba(255,255,255,0.1);
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

.close-legend {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
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
  letter-spacing: 1px;
}
</style>
