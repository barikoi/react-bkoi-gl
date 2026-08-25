// Jest-based tests for GlobeControl
import React from 'react'
import { render } from '@testing-library/react'
import { GlobeControl } from '../../src/components/globe-control'
import { MapContext } from '../../src/components/map'
import * as useControlMod from '../../src/components/use-control'

// Mock useControl hook
vi.mock('../../src/components/use-control', () => ({
  useControl: vi.fn(function (createControl, options) {
    const control = createControl()
    return control
  }),
}))

describe('GlobeControl', () => {
  let mockMapInstance
  let mapContextValue

  beforeEach(() => {
    vi.clearAllMocks()

    mockMapInstance = {
      on: vi.fn(),
      off: vi.fn(),
      addControl: vi.fn(),
      removeControl: vi.fn(),
      hasControl: vi.fn(function () { return false }),
      setProjection: vi.fn(),
      getProjection: vi.fn(() => ({ type: 'mercator' })),
    }

    mapContextValue = {
      map: {
        getMap: () => mockMapInstance,
      },
      mapLib: {
        Map: vi.fn(),
      },
    }
  })

  test('creates control with default options', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl />
      </MapContext.Provider>
    )

    expect(useControlMod.useControl).toHaveBeenCalled()
  })

  test('accepts position prop', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl position="top-left" />
      </MapContext.Provider>
    )

    expect(useControlMod.useControl).toHaveBeenCalledWith(
      expect.any(Function),
      { position: 'top-left' }
    )
  })

  test('accepts button customization options', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl
          buttonClassName="custom-class"
          buttonTitle="Toggle Globe"
          buttonStyle={{ background: 'red' }}
        />
      </MapContext.Provider>
    )

    expect(useControlMod.useControl).toHaveBeenCalled()
  })

  test('calls onProjectionChange when projection changes', () => {
    const onProjectionChange = vi.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl onProjectionChange={onProjectionChange} />
      </MapContext.Provider>
    )

    expect(useControlMod.useControl).toHaveBeenCalled()
  })

  test('control has isGlobe method', () => {
    const useControl = useControlMod.useControl
    let capturedControl

    useControl.mockImplementation((createControl, options) => {
      capturedControl = createControl()
      return capturedControl
    })

    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl />
      </MapContext.Provider>
    )

    expect(capturedControl.isGlobe).toBeDefined()
    expect(typeof capturedControl.isGlobe).toBe('function')
  })

  test('control has setGlobe method', () => {
    const useControl = useControlMod.useControl
    let capturedControl

    useControl.mockImplementation((createControl, options) => {
      capturedControl = createControl()
      return capturedControl
    })

    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl />
      </MapContext.Provider>
    )

    expect(capturedControl.setGlobe).toBeDefined()
    expect(typeof capturedControl.setGlobe).toBe('function')
  })

  test('custom button element accessibility hardening', () => {
    const useControl = useControlMod.useControl
    let capturedControl

    useControl.mockImplementation((createControl, options) => {
      capturedControl = createControl()
      return capturedControl
    })

    const customButton = document.createElement('button')
    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl buttonElement={customButton} />
      </MapContext.Provider>
    )

    // Should set type="button" on custom button
    expect(customButton.getAttribute('type')).toBe('button')
    // Should set aria-label and title
    expect(customButton.getAttribute('aria-label')).toBe('Toggle Globe View')
    expect(customButton.getAttribute('title')).toBe('Toggle Globe View')
  })

  test('custom non-button element with role="button" gets tabindex="0"', () => {
    const useControl = useControlMod.useControl
    let capturedControl

    useControl.mockImplementation((createControl, options) => {
      capturedControl = createControl()
      return capturedControl
    })

    const customDiv = document.createElement('div')
    customDiv.setAttribute('role', 'button')

    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl buttonElement={customDiv} />
      </MapContext.Provider>
    )

    expect(customDiv.getAttribute('role')).toBe('button')
    expect(customDiv.getAttribute('tabindex')).toBe('0')
    expect(customDiv.getAttribute('aria-label')).toBe('Toggle Globe View')
  })

  test('invalid custom element is refused and falls back to default button', () => {
    const useControl = useControlMod.useControl
    let capturedControl

    useControl.mockImplementation((createControl, options) => {
      capturedControl = createControl()
      return capturedControl
    })

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const customDiv = document.createElement('div') // no role="button"

    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl buttonElement={customDiv} />
      </MapContext.Provider>
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Refusing non-button custom element')
    )
    expect(capturedControl._button).not.toBe(customDiv)
    expect(capturedControl._button.tagName.toLowerCase()).toBe('button')
    expect(capturedControl._button.getAttribute('type')).toBe('button')

    consoleSpy.mockRestore()
  })

  test('updates aria-label and title dynamically on toggle', () => {
    const useControl = useControlMod.useControl
    let capturedControl

    useControl.mockImplementation((createControl, options) => {
      capturedControl = createControl()
      return capturedControl
    })

    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl />
      </MapContext.Provider>
    )

    // Call onAdd to associate the map
    capturedControl.onAdd(mockMapInstance)

    // Initial state (mercator flat map)
    expect(capturedControl._button.getAttribute('aria-label')).toBe('Switch to Globe View')
    expect(capturedControl._button.getAttribute('title')).toBe('Switch to Globe View')

    // Toggle to Globe
    capturedControl.setGlobe(true)
    expect(capturedControl._button.getAttribute('aria-label')).toBe('Switch to Map View')
    expect(capturedControl._button.getAttribute('title')).toBe('Switch to Map View')

    // Toggle back to Mercator
    capturedControl.setGlobe(false)
    expect(capturedControl._button.getAttribute('aria-label')).toBe('Switch to Globe View')
    expect(capturedControl._button.getAttribute('title')).toBe('Switch to Globe View')
  })
})
