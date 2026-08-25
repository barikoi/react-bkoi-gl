import * as React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MinimapControl, Minimap } from '../../src/components/minimap-control'
import { MapContext } from '../../src/components/map'

// Mock maplibre-gl Map
vi.mock('maplibre-gl', () => {
  const createMockMap = () => ({
    addControl: vi.fn(),
    removeControl: vi.fn(),
    hasControl: vi.fn(function () { return false }),
    on: vi.fn(),
    off: vi.fn(),
    getCanvas: vi.fn(() => ({ style: {}, width: 800, height: 600 })),
    getZoom: vi.fn(() => 10),
    getCenter: vi.fn(() => ({ lng: 90, lat: 23, toArray: () => [90, 23] })),
    getBearing: vi.fn(() => 0),
    getPitch: vi.fn(() => 0),
    getStyle: vi.fn(() => ({})),
    jumpTo: vi.fn(),
    resize: vi.fn(),
    once: vi.fn((event, callback) => {
      if (event === 'load' || event === 'style.load') {
        // Call callback asynchronously to simulate real behavior
        setTimeout(callback, 0)
      }
    }),
    getSource: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    unproject: vi.fn((point) => ({ toArray: () => [point[0], point[1]] })),
    remove: vi.fn(),
  })

  return {
    Map: vi.fn(function () { return createMockMap() }),
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    FullscreenControl: vi.fn(),
    GeolocateControl: vi.fn(),
    AttributionControl: vi.fn(),
  }
})

describe('MinimapControl', () => {
  let mockMap
  let mockMapLib
  let mapContextValue
  let addedControls

  beforeEach(() => {
    vi.clearAllMocks()

    // Track added controls
    addedControls = new Set()

    // Create mock mapLib
    mockMapLib = {
      Map: vi.fn(),
    }

    // Create mock map with MapRef interface
    mockMap = {
      hasControl: vi.fn().mockImplementation((ctrl) => addedControls.has(ctrl)),
      addControl: vi.fn().mockImplementation((ctrl) => addedControls.add(ctrl)),
      removeControl: vi.fn().mockImplementation((ctrl) => addedControls.delete(ctrl)),
      on: vi.fn(),
      off: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {}, width: 800, height: 600 })),
      getZoom: vi.fn(() => 10),
      getCenter: vi.fn(() => ({ lng: 90, lat: 23, toArray: () => [90, 23] })),
      getBearing: vi.fn(() => 0),
      getPitch: vi.fn(() => 0),
      getStyle: vi.fn(() => ({})),
      jumpTo: vi.fn(),
      resize: vi.fn(),
      once: vi.fn(),
      getSource: vi.fn(),
      unproject: vi.fn((point) => ({ toArray: () => [point[0], point[1]] })),
      getMap: vi.fn().mockReturnThis(),
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
        on: vi.fn(),
        off: vi.fn(),
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
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      minimap.onAdd(parentMap)

      const initialState = minimap.isMinimizedState()
      minimap.toggle()
      expect(minimap.isMinimizedState()).toBe(!initialState)
    })

    test('onToggle callback is called', () => {
      const onToggle = vi.fn()
      const minimap = new Minimap({ onToggle })
      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      minimap.onAdd(parentMap)
      minimap.toggle()

      expect(onToggle).toHaveBeenCalled()
    })

    test('manages aria-live status node to announce minimize/expand', async () => {
      const minimap = new Minimap()
      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)

      // Wait for the toggle button and live region to be created asynchronously
      await waitFor(() => {
        expect(container.querySelector('button')).not.toBeNull()
      })

      // Locate the live region
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).not.toBeNull()
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true')

      // Initial value should be empty
      expect(liveRegion.textContent).toBe('')

      // Toggle to minimize
      minimap.toggle()
      expect(liveRegion.textContent).toBe('Minimap collapsed')

      // Toggle back to expanded
      minimap.toggle()
      expect(liveRegion.textContent).toBe('Minimap expanded')

      // Cleanup removes the live region
      minimap.onRemove()
      expect(container.querySelector('[aria-live="polite"]')).toBeNull()
    })

    test('onRemove cleans up resources', () => {
      const minimap = new Minimap()
      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
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
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const minimap = new Minimap({
        toggleButton: { icon: validSVG }
      })

      expect(minimap).toBeDefined()
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    test('falls back to default icon for invalid SVG', async () => {
      const invalidSVG = '<div>not an svg</div>'
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const minimap = new Minimap({
        toggleButton: { icon: invalidSVG }
      })

      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
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

    test('removes script tags from SVG', async () => {
      const maliciousSVG = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><circle cx="12" cy="12" r="10"/></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG }
      })

      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)

      await waitFor(() => {
        expect(container.querySelector('button')).not.toBeNull()
      })

      const button = container.querySelector('button')
      const svg = button.querySelector('svg')

      expect(svg).toBeDefined()
      expect(svg.querySelector('script')).toBeNull()
      expect(svg.querySelector('circle')).not.toBeNull()
    })

    test('removes event handlers from SVG', async () => {
      const maliciousSVG = '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(\'xss\')"><circle cx="12" cy="12" r="10"/></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG }
      })

      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)

      await waitFor(() => {
        expect(container.querySelector('button')).not.toBeNull()
      })

      const button = container.querySelector('button')
      const svg = button.querySelector('svg')

      expect(svg).toBeDefined()
      expect(svg.getAttribute('onclick')).toBeNull()
    })

    test('removes foreignObject and other unsafe tags from SVG', async () => {
      const maliciousSVG = '<svg><foreignObject><body><img src=x onerror=alert(1)></body></foreignObject><path d="M10 10 h 80 v 80 h -80 Z" /></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG }
      })

      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)

      await waitFor(() => {
        expect(container.querySelector('button')).not.toBeNull()
      })

      const button = container.querySelector('button')
      const svg = button.querySelector('svg')

      expect(svg).toBeDefined()
      expect(svg.querySelector('foreignObject')).toBeNull()
      expect(svg.querySelector('body')).toBeNull()
      expect(svg.querySelector('img')).toBeNull()
      expect(svg.querySelector('path')).not.toBeNull()
    })

    test('removes style attributes from SVG elements', async () => {
      const maliciousSVG = '<svg><rect width="100" height="100" style="fill:url(http://attacker/x)" /></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG }
      })

      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)

      await waitFor(() => {
        expect(container.querySelector('button')).not.toBeNull()
      })

      const button = container.querySelector('button')
      const svg = button.querySelector('svg')

      expect(svg).toBeDefined()
      const rect = svg.querySelector('rect')
      expect(rect).not.toBeNull()
      expect(rect.getAttribute('style')).toBeNull()
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
      const onToggle = vi.fn()

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

  describe('security and style sanitization', () => {
    test('neutralizes </style> payload via textContent to prevent markup breakout', () => {
      const maliciousPayload = '</style><script id="malicious-script">console.log("xss")</script>'
      const minimap = new Minimap({
        borderRadius: maliciousPayload,
        collapsedWidth: maliciousPayload,
        collapsedHeight: maliciousPayload,
        containerStyle: {
          width: maliciousPayload,
          height: maliciousPayload,
        },
        toggleButton: {
          iconBackgroundColor: maliciousPayload,
          hoverColor: maliciousPayload,
        }
      })

      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)
      document.body.appendChild(container)

      // Verify that no script tag from the payload was created in the document or container
      const scriptElement = document.getElementById('malicious-script')
      expect(scriptElement).toBeNull()
      expect(container.querySelector('script')).toBeNull()

      // Clean up
      minimap.onRemove()
    })

    test('neutralizes semicolon and url() injection payloads by reverting to default styles', () => {
      const maliciousPayload = '100px; background: url(http://attacker.com/exfil)'
      const minimap = new Minimap({
        borderRadius: maliciousPayload,
        collapsedWidth: maliciousPayload,
        collapsedHeight: maliciousPayload,
        containerStyle: {
          width: maliciousPayload,
          height: maliciousPayload,
        },
        toggleButton: {
          iconBackgroundColor: maliciousPayload,
          hoverColor: maliciousPayload,
        }
      })

      const parentMap = {
        getZoom: () => 10,
        getCenter: () => ({ toArray: () => [90, 23] }),
        getBearing: () => 0,
        getPitch: () => 0,
        getStyle: () => ({}),
        on: vi.fn(),
        off: vi.fn(),
        getCanvas: () => ({ width: 800, height: 600 }),
        unproject: (p) => ({ toArray: () => p }),
      }

      const container = minimap.onAdd(parentMap)

      // The style element textContent should not contain the malicious payload
      const styleEl = container.querySelector('style')
      expect(styleEl).not.toBeNull()

      const styleText = styleEl.textContent
      expect(styleText).not.toContain(maliciousPayload)

      // It should fall back to defaults
      expect(styleText).toContain('width: 400px') // DEFAULT_WIDTH
      expect(styleText).toContain('height: 300px') // DEFAULT_HEIGHT
      expect(styleText).toContain('width: 29px') // DEFAULT_COLLAPSED_SIZE
      expect(styleText).toContain('height: 29px') // DEFAULT_COLLAPSED_SIZE
      expect(styleText).toContain('border-radius: 3px') // DEFAULT_BORDER_RADIUS

      // Clean up
      minimap.onRemove()
    })
  })
})
