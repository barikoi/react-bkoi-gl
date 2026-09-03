import * as React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MinimapControl, Minimap } from '../../../src/components/minimap-control'
import { MapContext } from '../../../src/components/map'

// Mock maplibre-gl Map
vi.mock('maplibre-gl', () => {
  const createMockMap = () => ({
    addControl: vi.fn(),
    removeControl: vi.fn(),
    hasControl: vi.fn(function () {
      return false
    }),
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
    unproject: vi.fn(point => ({ toArray: () => [point[0], point[1]] })),
    remove: vi.fn(),
    // interaction handler groups — Minimap.disableInteractions() calls .disable()
    // on each handler whose interactions.<name> === false
    scrollZoom: { disable: vi.fn() },
    boxZoom: { disable: vi.fn() },
    dragRotate: { disable: vi.fn() },
    dragPan: { disable: vi.fn() },
    keyboard: { disable: vi.fn() },
    doubleClickZoom: { disable: vi.fn() },
    touchZoomRotate: { disable: vi.fn() },
    touchPitch: { disable: vi.fn() },
  })

  return {
    Map: vi.fn(function () {
      return createMockMap()
    }),
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    FullscreenControl: vi.fn(),
    GeolocateControl: vi.fn(),
    AttributionControl: vi.fn(),
    setWorkerUrl: vi.fn(),
    getWorkerUrl: vi.fn(() => ''),
    getVersion: vi.fn(() => '0.0.0-mock'),
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
      hasControl: vi.fn().mockImplementation(ctrl => addedControls.has(ctrl)),
      addControl: vi.fn().mockImplementation(ctrl => addedControls.add(ctrl)),
      removeControl: vi.fn().mockImplementation(ctrl => addedControls.delete(ctrl)),
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
      unproject: vi.fn(point => ({ toArray: () => [point[0], point[1]] })),
      getMap: vi.fn().mockReturnThis(),
    }

    // Create context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib,
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
        unproject: p => ({ toArray: () => p }),
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
        unproject: p => ({ toArray: () => p }),
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
        unproject: p => ({ toArray: () => p }),
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
        unproject: p => ({ toArray: () => p }),
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
        unproject: p => ({ toArray: () => p }),
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
      const validSVG =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const minimap = new Minimap({
        toggleButton: { icon: validSVG },
      })

      expect(minimap).toBeDefined()
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    test('falls back to default icon for invalid SVG', async () => {
      const invalidSVG = '<div>not an svg</div>'
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const minimap = new Minimap({
        toggleButton: { icon: invalidSVG },
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
        unproject: p => ({ toArray: () => p }),
      }

      minimap.onAdd(parentMap)

      // Wait for async load callback to execute
      await waitFor(
        () => {
          expect(consoleSpy).toHaveBeenCalledWith('Invalid SVG format, using default icon')
        },
        { timeout: 100 }
      )

      consoleSpy.mockRestore()
    })

    test('removes script tags from SVG', async () => {
      const maliciousSVG =
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><circle cx="12" cy="12" r="10"/></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG },
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
        unproject: p => ({ toArray: () => p }),
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
      const maliciousSVG =
        '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(\'xss\')"><circle cx="12" cy="12" r="10"/></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG },
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
        unproject: p => ({ toArray: () => p }),
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
      const maliciousSVG =
        '<svg><foreignObject><body><img src=x onerror=alert(1)></body></foreignObject><path d="M10 10 h 80 v 80 h -80 Z" /></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG },
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
        unproject: p => ({ toArray: () => p }),
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
      const maliciousSVG =
        '<svg><rect width="100" height="100" style="fill:url(http://attacker/x)" /></svg>'

      const minimap = new Minimap({
        toggleButton: { icon: maliciousSVG },
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
        unproject: p => ({ toArray: () => p }),
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
        position: 'bottom-right',
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

  describe('numeric CSS values (React style prop convention)', () => {
    const makeParentMap = () => ({
      getZoom: () => 10,
      getCenter: () => ({ toArray: () => [90, 23] }),
      getBearing: () => 0,
      getPitch: () => 0,
      getStyle: () => ({}),
      on: vi.fn(),
      off: vi.fn(),
      getCanvas: () => ({ width: 800, height: 600 }),
      unproject: p => ({ toArray: () => p }),
    })

    test('treats numeric containerStyle dimensions as pixels instead of crashing', () => {
      const minimap = new Minimap({
        containerStyle: { width: 180, height: 120 },
        collapsedWidth: 40,
        collapsedHeight: 40,
        borderRadius: 8,
      })

      const container = minimap.onAdd(makeParentMap())
      document.body.appendChild(container)

      // Previously threw "value.includes is not a function" inside supportsCSS
      const styleEl = container.querySelector('style')
      expect(styleEl).not.toBeNull()
      expect(styleEl.textContent).toContain('width: 180px')
      expect(styleEl.textContent).toContain('height: 120px')
      expect(styleEl.textContent).toContain('border-radius: 8px')

      minimap.onRemove()
    })

    test('applies numeric collapsed dimensions as px on the inline container style', () => {
      const minimap = new Minimap({
        initialMinimized: true,
        collapsedWidth: 44,
        collapsedHeight: 44,
      })

      const container = minimap.onAdd(makeParentMap())
      document.body.appendChild(container)

      expect(container.style.width).toBe('44px')
      expect(container.style.height).toBe('44px')

      minimap.onRemove()
    })

    test('string values still pass through unchanged', () => {
      const minimap = new Minimap({
        containerStyle: { width: '50%', height: '200px', border: '2px solid red' },
      })

      const container = minimap.onAdd(makeParentMap())
      document.body.appendChild(container)

      const styleEl = container.querySelector('style')
      expect(styleEl.textContent).toContain('width: 50%')
      expect(container.style.border).toContain('2px solid red')

      minimap.onRemove()
    })

    test('falls back to default dimensions when width/height are omitted', () => {
      const minimap = new Minimap({ containerStyle: { border: '2px solid red' } })

      const container = minimap.onAdd(makeParentMap())
      document.body.appendChild(container)

      const styleEl = container.querySelector('style')
      expect(styleEl.textContent).toContain('width: 400px')
      expect(styleEl.textContent).toContain('height: 300px')

      minimap.onRemove()
    })

    test('treats numeric responsive dimensions as pixels', async () => {
      const minimap = new Minimap({
        responsive: true,
        responsiveWidth: 300,
        responsiveHeight: 200,
        minWidth: 100,
        minHeight: 100,
        maxWidth: 500,
        maxHeight: 400,
      })

      const container = minimap.onAdd(makeParentMap())
      document.body.appendChild(container)

      // setupResponsiveSizing runs from the engine's async 'load' event
      await waitFor(() => expect(container.style.width).toBe('300px'))
      expect(container.style.height).toBe('200px')

      minimap.onRemove()
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
        },
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
          fillPaint: { 'fill-color': '#0000ff' },
        },
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
        },
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
        unproject: p => ({ toArray: () => p }),
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
        },
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
        unproject: p => ({ toArray: () => p }),
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

  describe('coverage: options and lifecycle', () => {
    const makeParentMap = (overrides = {}) => ({
      getZoom: vi.fn(() => 10),
      getCenter: vi.fn(() => ({ toArray: () => [90, 23] })),
      getBearing: vi.fn(() => 0),
      getPitch: vi.fn(() => 0),
      getStyle: vi.fn(() => ({})),
      isStyleLoaded: vi.fn(() => true),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      getCanvas: vi.fn(() => ({ width: 800, height: 600 })),
      unproject: vi.fn(p => ({ toArray: () => p })),
      jumpTo: vi.fn(),
      ...overrides,
    })

    const waitForLoad = async minimap => {
      // the mocked engine fires the minimap 'load' event on the next tick
      await waitFor(() => {
        expect(minimap.map).toBeDefined()
        // setupToggleButton runs inside the load handler — the button is the
        // terminal signal that the whole load chain has completed
        expect(minimap.container.querySelector('button')).not.toBeNull()
      })
    }

    test('getRandomUUID falls back to crypto.getRandomValues when randomUUID is missing', () => {
      const original = crypto.randomUUID
      // @ts-expect-error — simulate an environment without randomUUID
      crypto.randomUUID = undefined
      const minimap = new Minimap()
      crypto.randomUUID = original
      expect(minimap.id).toMatch(
        /^minimap-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
    })

    test('lockZoom pins minZoom and maxZoom to the same value', () => {
      const minimap = new Minimap({ lockZoom: 11 })
      expect(minimap.options.minZoom).toBe(11)
      expect(minimap.options.maxZoom).toBe(11)
    })

    test('a custom style skips the parent style snapshot and creates immediately', () => {
      const style = { version: 8, sources: {}, layers: [] }
      const minimap = new Minimap({ style })
      const parentMap = makeParentMap()
      minimap.onAdd(parentMap)
      expect(parentMap.getStyle).not.toHaveBeenCalled()
      expect(minimap.options.style).toBe(style)
      expect(minimap.map).toBeDefined()
      minimap.onRemove()
    })

    test('when the parent style is not loaded, creation re-arms on styledata/load', () => {
      const minimap = new Minimap()
      const parentMap = makeParentMap({
        isStyleLoaded: vi.fn().mockReturnValueOnce(false), // at onAdd
      })
      minimap.onAdd(parentMap)
      expect(minimap.map).toBeUndefined() // not created yet

      const tryCreate = parentMap.on.mock.calls.find(c => c[0] === 'styledata')[1]
      parentMap.isStyleLoaded.mockReturnValue(true)
      tryCreate()

      expect(minimap.map).toBeDefined()
      // the transient listener is removed after it fires
      expect(parentMap.off).toHaveBeenCalledWith('styledata', tryCreate)
      expect(parentMap.off).toHaveBeenCalledWith('load', tryCreate)
      minimap.onRemove()
    })

    test('onRemove while waiting for the parent style detaches the pending listener', () => {
      const minimap = new Minimap()
      const parentMap = makeParentMap({ isStyleLoaded: vi.fn(() => false) })
      minimap.onAdd(parentMap)
      minimap.onRemove()
      const tryCreate = parentMap.on.mock.calls.find(c => c[0] === 'styledata')[1]
      expect(parentMap.off).toHaveBeenCalledWith('styledata', tryCreate)
      expect(parentMap.off).toHaveBeenCalledWith('load', tryCreate)
    })

    test('onRemove detaches the window resize handler and pending transition timeout', async () => {
      const minimap = new Minimap()
      const parentMap = makeParentMap()
      minimap.onAdd(parentMap)
      await waitForLoad(minimap)

      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
      minimap.toggle() // arms transitionTimeout
      minimap.onRemove()
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(clearSpy).toHaveBeenCalled()
      removeSpy.mockRestore()
      clearSpy.mockRestore()
    })

    test('disabled interactions call .disable() on the matching handlers', async () => {
      const minimap = new Minimap({
        interactions: { dragPan: false, scrollZoom: false, boxZoom: false },
      })
      const parentMap = makeParentMap()
      minimap.onAdd(parentMap)
      await waitForLoad(minimap)

      expect(minimap.map.dragPan.disable).toHaveBeenCalled()
      expect(minimap.map.scrollZoom.disable).toHaveBeenCalled()
      expect(minimap.map.boxZoom.disable).toHaveBeenCalled()
      // enabled handlers are left alone
      expect(minimap.map.keyboard.disable).not.toHaveBeenCalled()
      minimap.onRemove()
    })

    test('initialMinimized collapses the container to the configured size', () => {
      const minimap = new Minimap({
        initialMinimized: true,
        collapsedWidth: '40px',
        collapsedHeight: '40px',
      })
      const parentMap = makeParentMap()
      const container = minimap.onAdd(parentMap)
      expect(container.classList.contains('minimized')).toBe(true)
      expect(container.style.width).toBe('40px')
      expect(container.style.height).toBe('40px')
      minimap.onRemove()
    })

    test('containerStyle is applied to the container element', () => {
      const minimap = new Minimap({ containerStyle: { width: '500px', height: '400px' } })
      const parentMap = makeParentMap()
      const container = minimap.onAdd(parentMap)
      expect(container.style.width).toBe('500px')
      expect(container.style.height).toBe('400px')
      minimap.onRemove()
    })

    test('toggleButton.className adds custom classes to the button', async () => {
      const minimap = new Minimap({ toggleButton: { className: 'extra cls' } })
      const parentMap = makeParentMap()
      const container = minimap.onAdd(parentMap)
      await waitForLoad(minimap)
      const button = container.querySelector('button')
      expect(button.classList.contains('extra')).toBe(true)
      expect(button.classList.contains('cls')).toBe(true)
      minimap.onRemove()
    })
  })

  describe('coverage: SVG sanitizer hardening', () => {
    const makeParentMap = () => ({
      getZoom: vi.fn(() => 10),
      getCenter: vi.fn(() => ({ toArray: () => [90, 23] })),
      getBearing: vi.fn(() => 0),
      getPitch: vi.fn(() => 0),
      getStyle: vi.fn(() => ({})),
      isStyleLoaded: vi.fn(() => true),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      getCanvas: vi.fn(() => ({ width: 800, height: 600 })),
      unproject: vi.fn(p => ({ toArray: () => p })),
    })

    const renderIcon = async icon => {
      const minimap = new Minimap({ toggleButton: { icon } })
      const container = minimap.onAdd(makeParentMap())
      await waitFor(() => {
        expect(container.querySelector('button svg')).not.toBeNull()
      })
      return { minimap, svg: container.querySelector('button svg') }
    }

    test('drops javascript: href values but keeps local and http(s) refs', async () => {
      const { svg } = await renderIcon(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
          '<text href="javascript:alert(1)" xlink:href="#ok" data-keep="1">a</text></svg>'
      )
      const text = svg.querySelector('text')
      expect(text.getAttribute('href')).toBeNull()
      // local id reference is safe and preserved
      expect(text.getAttribute('xlink:href')).toBe('#ok')
    })

    test('removes comment nodes and disallowed tags nested inside allowed children', async () => {
      const { svg } = await renderIcon(
        '<svg><g><!-- strip me --><script>alert(1)</script><rect width="1" height="1"/></g></svg>'
      )
      const g = svg.querySelector('g')
      expect(g.querySelector('rect')).not.toBeNull()
      expect(g.querySelector('script')).toBeNull()
      const hasComment = Array.from(g.childNodes).some(n => n.nodeType === 8)
      expect(hasComment).toBe(false)
    })
  })

  describe('coverage: responsive sizing and map sync', () => {
    const makeParentMap = () => ({
      getZoom: vi.fn(() => 10),
      getCenter: vi.fn(() => ({ toArray: () => [90, 23] })),
      getBearing: vi.fn(() => 0),
      getPitch: vi.fn(() => 0),
      getStyle: vi.fn(() => ({})),
      isStyleLoaded: vi.fn(() => true),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      getCanvas: vi.fn(() => ({ width: 800, height: 600 })),
      unproject: vi.fn(p => ({ toArray: () => p })),
      jumpTo: vi.fn(),
    })

    const waitForLoad = async minimap => {
      await waitFor(() => {
        expect(minimap.container.querySelector('button')).not.toBeNull()
      })
    }

    test('updateSize clamps vw-based width between min and max', async () => {
      const minimap = new Minimap() // responsive defaults: 20vw/20vh, 200..400px
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)
      // jsdom viewport 1024x768 → 20vw = 204.8px (within 200..400)
      expect(minimap.container.style.width).toBe('204.8px')
      expect(minimap.container.style.height).toBe('153.6px')
      minimap.onRemove()
    })

    test('supports percentage and pixel responsive dimensions', async () => {
      const minimap = new Minimap({
        responsiveWidth: '50%', // 512 → clamped to maxWidth 400
        responsiveHeight: '100px',
      })
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)
      expect(minimap.container.style.width).toBe('400px')
      expect(minimap.container.style.height).toBe('150px') // minHeight 150 wins
      minimap.onRemove()
    })

    test('responsive dimensions cover the px-width and percent-height branches', async () => {
      const minimap = new Minimap({
        responsiveWidth: '320px',
        responsiveHeight: '90%', // 691.2 → clamped to maxHeight 300
      })
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)
      expect(minimap.container.style.width).toBe('320px')
      expect(minimap.container.style.height).toBe('300px')
      minimap.onRemove()
    })

    test('window resize re-measures after the debounce', async () => {
      const minimap = new Minimap()
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)

      const originalWidth = window.innerWidth
      window.innerWidth = 2048 // 20vw = 409.6 → clamped to 400
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(minimap.container.style.width).toBe('400px')
      })
      window.innerWidth = originalWidth
      minimap.onRemove()
    })

    test('expanding a minimized minimap re-runs the responsive resize', async () => {
      const minimap = new Minimap({ initialMinimized: true })
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)
      expect(minimap.container.classList.contains('minimized')).toBe(true)

      minimap.toggle()
      expect(minimap.container.classList.contains('minimized')).toBe(false)
      await waitFor(() => {
        expect(minimap.container.style.width).toBe('204.8px')
      })
      minimap.onRemove()
    })

    test('a failing CSS.supports falls back to default container styles', () => {
      // this jsdom environment has no CSS global at all; install one that
      // throws so the try/catch inside supportsCSS is exercised
      globalThis.CSS = {
        supports: () => {
          throw new Error('not implemented')
        },
      }

      const minimap = new Minimap({ containerStyle: { width: '500px', height: '400px' } })
      const container = minimap.onAdd(makeParentMap())

      const styleText = container.querySelector('style').textContent
      expect(styleText).toContain('width: 400px') // DEFAULT_WIDTH
      expect(styleText).toContain('height: 300px') // DEFAULT_HEIGHT

      delete globalThis.CSS
      minimap.onRemove()
    })

    test('clicking the toggle button toggles the minimap state', async () => {
      const minimap = new Minimap()
      const container = minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)

      const button = container.querySelector('button')
      button.click()
      expect(minimap.isMinimizedState()).toBe(true)
      button.click()
      expect(minimap.isMinimizedState()).toBe(false)
      minimap.onRemove()
    })

    test('non-responsive minimap restores configured size on expand', async () => {
      const minimap = new Minimap({
        responsive: false,
        containerStyle: { width: '450px', height: '350px' },
      })
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)

      minimap.toggle() // minimize
      minimap.toggle() // expand → falls back to containerStyle size
      expect(minimap.container.classList.contains('minimized')).toBe(false)
      expect(minimap.container.style.width).toBe('450px')
      expect(minimap.container.style.height).toBe('350px')
      minimap.onRemove()
    })

    test('the post-transition timeout resizes the minimap map', async () => {
      const minimap = new Minimap()
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)
      minimap.map.resize.mockClear()

      minimap.toggle()
      await waitFor(
        () => {
          expect(minimap.map.resize).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )
      minimap.onRemove()
    })

    test('rapid resize events coalesce through the debounce', async () => {
      const minimap = new Minimap()
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)

      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(minimap.container.style.width).toBe('204.8px')
      })
      minimap.onRemove()
    })

    test('parent move syncs the minimap camera with zoomAdjust', async () => {
      const minimap = new Minimap({ zoomAdjust: -4 })
      const parentMap = makeParentMap()
      minimap.onAdd(parentMap)
      await waitForLoad(minimap)

      const parentMove = parentMap.on.mock.calls.find(c => c[0] === 'move')[1]
      parentMove()

      expect(minimap.map.jumpTo).toHaveBeenCalledWith({
        center: expect.objectContaining({ toArray: expect.any(Function) }),
        zoom: 6, // parent 10 + zoomAdjust -4
        bearing: 0,
        pitch: 0, // pitchAdjust off → 0
      })
      minimap.onRemove()
    })

    test('minimap move syncs the parent camera in the opposite direction', async () => {
      const minimap = new Minimap({ zoomAdjust: -4 })
      const parentMap = makeParentMap()
      minimap.onAdd(parentMap)
      await waitForLoad(minimap)

      const minimapMove = minimap.map.on.mock.calls.find(c => c[0] === 'move')[1]
      minimapMove()

      expect(parentMap.jumpTo).toHaveBeenCalledWith({
        center: expect.objectContaining({ toArray: expect.any(Function) }),
        zoom: 14, // minimap 10 + zoomAdjust -4 * -1
        bearing: 0,
        pitch: 0,
      })
      minimap.onRemove()
    })

    test('parentRect config adds source, outline and fill layers and pushes bounds', async () => {
      const setData = vi.fn()
      const minimap = new Minimap({
        parentRect: {
          lineLayout: { 'line-cap': 'round' },
          linePaint: { 'line-color': '#f00' },
          fillPaint: { 'fill-color': '#00f' },
        },
      })
      minimap.onAdd(makeParentMap())
      await waitForLoad(minimap)

      expect(minimap.map.addSource).toHaveBeenCalledWith('parentRect', {
        type: 'geojson',
        data: expect.objectContaining({ type: 'Feature' }),
      })
      const outline = minimap.map.addLayer.mock.calls.find(c => c[0].id === 'parentRectOutline')[0]
      expect(outline.layout).toEqual({ 'line-cap': 'round' })
      expect(outline.paint['line-color']).toBe('#f00')
      const fill = minimap.map.addLayer.mock.calls.find(c => c[0].id === 'parentRectFill')[0]
      expect(fill.paint['fill-color']).toBe('#00f')

      // setParentBounds pushes screen-corner coordinates into the source
      minimap.map.getSource.mockImplementation(() => ({ setData }))
      minimap['setParentBounds']()
      expect(setData).toHaveBeenCalledWith(
        expect.objectContaining({
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 600],
                [800, 600],
                [800, 0],
                [0, 0],
                [0, 600],
              ],
            ],
          },
        })
      )
      minimap.onRemove()
    })
  })
})
