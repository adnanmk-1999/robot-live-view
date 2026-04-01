import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Sidebar from '../../src/components/wireframe/Sidebar.vue'
import { liveViewStore } from '../../src/stores/liveViewStore'
import { telemetryStore } from '../../src/stores/telemetryStore'

describe('Sidebar.vue', () => {

  beforeEach(() => {
    // Reset state before tests
    liveViewStore.clearStore()
    telemetryStore.clear()
  })

  it('renders placeholder strings when no data is loaded', () => {
    const wrapper = mount(Sidebar)
    
    // Check that placeholders exist
    const values = wrapper.findAll('.item-value')
    expect(values[0].text()).toBe('-- m')  // Raw Path Length
    expect(values[1].text()).toBe('-- m')  // Smoothed Length
    expect(values[2].text()).toBe('-- s')  // Traverse Time
    expect(values[3].text()).toBe('-- m²') // Cleaned Area
    expect(values[4].text()).toBe('0')     // Data Points (defaults to empty array length)
  })

  it('renders correct computed metrics when data is available', async () => {
    // Inject mock metric state directly
    liveViewStore.state.metrics.rawPathLengthMeters = 10.5
    liveViewStore.state.metrics.smoothedPathLengthMeters = 9.8
    liveViewStore.state.metrics.traversalTimeSeconds = 15.0
    liveViewStore.state.metrics.cleanedAreaSqMeters = 20.25
    
    // Inject mock telemetry state to test array length computed property
    telemetryStore.load({
      path: [[0, 0], [1, 1], [2, 2]], // Length 3
      robot: [],
      cleaning_gadget: []
    })

    const wrapper = mount(Sidebar)
    
    // Wait for Vue reactivity to flush (though typically synchronous in mount, good practice)
    await wrapper.vm.$nextTick()

    const values = wrapper.findAll('.item-value')
    expect(values[0].text()).toBe('10.50 m')
    expect(values[1].text()).toBe('9.80 m')
    expect(values[2].text()).toBe('15.00 s')
    expect(values[3].text()).toBe('20.25 m²')
    expect(values[4].text()).toBe('3')
  })
})
