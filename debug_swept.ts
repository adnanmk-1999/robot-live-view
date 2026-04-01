import * as turf from '@turf/turf'
import { calculateSweptArea } from './src/utils/sweptArea'

const path: [[number, number]] = [
  [0, 0], [10, 0], [10, 10], [0, 10], [0, 0]
]
const robotHull: [[number, number]] = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
const cleaningPad: [[number, number]] = [[0, -1], [0, 1]]

const result = calculateSweptArea(path, robotHull, cleaningPad)

console.log('--- DEBUG SWEEP ---')
console.log('Total Area:', result.areaSqMeters)
console.log('Polygons:', result.polygons.length)

result.polygons.forEach((poly, i) => {
  console.log(`Polygon ${i}:`)
  console.log(`  Outer points: ${poly.outer.length}`)
  
  // Calculate outer area manually to see what it is
  let area = 0
  const ring = [...poly.outer, poly.outer[0]]
  for (let k = 0; k < ring.length - 1; k++) {
    area += ring[k][0] * ring[k + 1][1]
    area -= ring[k + 1][0] * ring[k][1]
  }
  console.log(`  Outer Area (Unsigned): ${area / 2}`)
  
  poly.holes.forEach((hole, j) => {
    console.log(`  Hole ${j} points: ${hole.length}`)
    let hArea = 0
    const hRing = [...hole, hole[0]]
    for (let k = 0; k < hRing.length - 1; k++) {
      hArea += hRing[k][0] * hRing[k + 1][1]
      hArea -= hRing[k + 1][0] * hRing[k][1]
    }
    console.log(`  Hole Area (Unsigned): ${hArea / 2}`)
  })
})
