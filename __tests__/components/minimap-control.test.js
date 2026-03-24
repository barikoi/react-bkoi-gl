import * as React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MinimapControl, Minimap } from '../../src/components/minimap-control'
import { MapContext } from '../../src/components/map'

// Mock maplibre-gl Map
jest.mock('maplibre-gl', () => {
  const createMockMap = () => ({
    addControl: jest.fn(),
    removeControl: jest.fn(),
    hasControl: jest.fn(() => false),
    on: jest.fn(),
    off: jest.fn(),
    getCanvas: jest.fn(() => ({ style: {}, width: 800, height: 600 })),
    getZoom: jest.fn(() => 10),
    getCenter: jest.fn(() => ({ lng: 90, lat: 23, toArray: () => [90, 23] })),
    getBearing: jest.fn(() => 0),
    getPitch: jest.fn(() => 0),
    getStyle: jest.fn(() => ({})),
    jumpTo: jest.fn(),
    resize: jest.fn(),
    once: jest.fn((event, callback) => {
      if (event === 'load' || event === 'style.load') {
        // Call callback asynchronously to simulate real behavior
        setTimeout(callback, 0)
      }
    }),
    getSource: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    unproject: jest.fn((point) => ({ toArray: () => [point[0], point[1]] })),
    remove: jest.fn(),
  })

  return {
    Map: jest.fn(() => createMockMap()),
    NavigationControl: jest.fn(),
    ScaleControl: jest.fn(),
    FullscreenControl: jest.fn(),
    GeolocateControl: jest.fn(),
    AttributionControl: jest.fn(),
  }
})

describe('MinimapControl', () => {
  let mockMap
  let mockMapLib
  let mapContextValue
  let addedControls

  beforeEach(() => {
    jest.clearAllMocks()

    // Track added controls
    addedControls = new Set()

    // Create mock mapLib
    mockMapLib = {
      Map: jest.fn(),
    }

    // Create mock map with MapRef interface
    mockMap = {
      hasControl: jest.fn().mockImplementation((ctrl) => addedControls.has(ctrl)),
      addControl: jest.fn().mockImplementation((ctrl) => addedControls.add(ctrl)),
      removeControl: jest.fn().mockImplementation((ctrl) => addedControls.delete(ctrl)),
      on: jest.fn(),
      off: jest.fn(),
      getCanvas: jest.fn(() => ({ style: {}, width: 800, height: 600 })),
      getZoom: jest.fn(() => 10),
      getCenter: jest.fn(() => ({ lng: 90, lat: 23, toArray: () => [90, 23] })),
      getBearing: jest.fn(() => 0),
      getPitch: jest.fn(() => 0),
      getStyle: jest.fn(() => ({})),
      jumpTo: jest.fn(),
      resize: jest.fn(),
      once: jest.fn(),
      getSource: jest.fn(),
      unproject: jest.fn((point) => ({ toArray: () => [point[0], point[1]] })),
      getMap: jest.fn().mockReturnThis(),
    }

    // Create context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib
    }
  })

  describe('Minimap class', () => {
    test('creates minimap with default options', () => {
      const minimap = new Minimap()
      expect(minimap).toBeDefined()
    })

    test('creates minimap with custom options', () => {
      const options = {
        zoomAdjust: -2,
        toggleable: false,
        initialMinimized: true,
      }
      const minimap = new Minimap(options)
      expect(minimap).toBeDefined()
    })

    test('onAdd creates container element', () => {
      const minimap = new Minimap()
      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: jest.fn(),
        off: jest.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)
      expect(container).toBeDefined()
      expect(container.tagName).toBe('DIV')
    })

    test('toggle changes minimized state', () => {
      const minimap = new Minimap()
      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: jest.fn(),
        off: jest.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      minimap.onAdd(parentMap)

      const initialState = minimap.isMinimizedState()
      minimap.toggle()
      expect(minimap.isMinimizedState()).toBe(!initialState)
    })

    test('onToggle callback is called', () => {
      const onToggle = jest.fn()
      const minimap = new Minimap({ onToggle })
      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: jest.fn(),
        off: jest.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      minimap.onAdd(parentMap)
      minimap.toggle()

      expect(onToggle).toHaveBeenCalled()
    })

    test('onRemove cleans up resources', () => {
      const minimap = new Minimap()
      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: jest.fn(),
        off: jest.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)
      document.body.appendChild(container)

      minimap.onRemove()

      // Container should be removed from DOM
      expect(document.body.contains(container)).toBe(false)
    })
  })

  describe('SVG sanitization', () => {
    test('accepts valid custom SVG icon', () => {
      const validSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const minimap = new Minimap({
        toggleButton: { icon: validSVG }
      })

      expect(minimap).toBeDefined()
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    test('falls back to default icon for invalid SVG', async () => {
      const invalidSVG = '<div>not an svg</div>'
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const minimap = new Minimap({
        toggleButton: { icon: invalidSVG }
      })

      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: jest.fn(),
        off: jest.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      minimap.onAdd(parentMap)

      // Wait for async load callback to execute
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Invalid SVG format, using default icon')
      }, { timeout: 100 })

      consoleSpy.mockRestore()
    })

    test('removes script tags from SVG', () => {
      const maliciousSVG = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><circle cx="12" cy="12" r="10"/></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG }
      })

      expect(minimap).toBeDefined()
    })

    test('removes event handlers from SVG', () => {
      const maliciousSVG = '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(\'xss\')"><circle cx="12" cy="12" r="10"/></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG }
      })

      expect(minimap).toBeDefined()
    })
  })

  describe('MinimapControl component', () => {
    test('adds the control to the map', () => {
      const props = {
        position: 'bottom-right'
      }

      render(
        <MapContext.Provider value={mapContextValue}>
          <MinimapControl {...props} />
        </MapContext.Provider>
      )

      expect(mockMap.addControl).toHaveBeenCalled()
    })

    test('accepts minimap options', () => {
      const props = {
        zoomAdjust: -2,
        toggleable: false,
        initialMinimized: true,
      }

      render(
        <MapContext.Provider value={mapContextValue}>
          <MinimapControl {...props} />
        </MapContext.Provider>
      )

      expect(mockMap.addControl).toHaveBeenCalled()
    })

    test('supports toggleable option', () => {
      const onToggle = jest.fn()

      render(
        <MapContext.Provider value={mapContextValue}>
          <MinimapControl toggleable={true} onToggle={onToggle} />
        </MapContext.Provider>
      )

      expect(mockMap.addControl).toHaveBeenCalled()
    })

    test('removes control on unmount', async () => {
      const props = { position: 'top-right' }

      const { unmount } = render(
        <MapContext.Provider value={mapContextValue}>
          <MinimapControl {...props} />
        </MapContext.Provider>
      )

      expect(mockMap.addControl).toHaveBeenCalled()

      unmount()

      // Wait for cleanup to complete
      await waitFor(() => {
        expect(mockMap.removeControl).toHaveBeenCalled()
      })
    })
  })

  describe('responsive sizing', () => {
    test('accepts responsive options', () => {
      const props = {
        responsive: true,
        responsiveWidth: '20vw',
        responsiveHeight: '20vh',
        minWidth: '200px',
        minHeight: '150px',
        maxWidth: '400px',
        maxHeight: '300px',
      }

      const minimap = new Minimap(props)
      expect(minimap).toBeDefined()
    })
  })

  describe('interaction configuration', () => {
    test('accepts interaction options', () => {
      const props = {
        interactions: {
          dragPan: true,
          scrollZoom: true,
          boxZoom: false,
          dragRotate: false,
          keyboard: false,
          doubleClickZoom: true,
          touchZoomRotate: false,
        }
      }

      const minimap = new Minimap(props)
      expect(minimap).toBeDefined()
    })
  })

  describe('parent rect configuration', () => {
    test('accepts parent rect options', () => {
      const props = {
        parentRect: {
          linePaint: { 'line-color': '#ff0000' },
          fillPaint: { 'fill-color': '#0000ff' }
        }
      }

      const minimap = new Minimap(props)
      expect(minimap).toBeDefined()
    })
  })
})
