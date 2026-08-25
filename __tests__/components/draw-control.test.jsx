import * as React from 'react'
import { render, act } from '@testing-library/react'
import { DrawControl } from '../../src/components/draw-control'
import MapboxDrawMock from 'maplibre-gl-draw'
import { MapContext } from '../../src/components/map'

// Mock maplibre-gl-draw (default-exported class)
vi.mock('maplibre-gl-draw', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(function (options) {
    return {
      options,
      getMode: vi.fn(() => 'simple_select'),
      on: vi.fn(),
      off: vi.fn(),
      getDefaultPosition: vi.fn().mockReturnValue('top-right'),
      _container: document.createElement('div'),
      remove: vi.fn()
    }
  })
}))

describe('DrawControl', () => {
  let mockMap
  let mockMapLib
  let mapContextValue
  let mockDrawControlInstance
  let addedControls

  beforeEach(() => {
    vi.clearAllMocks()

    // Track added controls
    addedControls = new Set()

    // Create mock draw control instance
    mockDrawControlInstance = {
      options: {},
      getMode: vi.fn(() => 'simple_select'),
      on: vi.fn(),
      off: vi.fn(),
      getDefaultPosition: vi.fn().mockReturnValue('top-right'),
      _container: document.createElement('div'),
      remove: vi.fn()
    }

    // Create mock mapLib with MapboxDraw constructor
    mockMapLib = {}

    // Create mock map
    mockMap = {
      hasControl: vi.fn().mockImplementation((ctrl) => addedControls.has(ctrl)),
      addControl: vi.fn().mockImplementation((ctrl) => addedControls.add(ctrl)),
      removeControl: vi.fn().mockImplementation((ctrl) => addedControls.delete(ctrl)),
      on: vi.fn(),
      off: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {} })),
      getZoom: vi.fn(() => 10),
      getCenter: vi.fn(() => ({ lng: 90, lat: 23 })),
      getMap: vi.fn().mockReturnThis()
    }

    // Create context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib
    }

    // Reset the mock implementation to return our instance (regular function:
    // `new` on a vi.fn delegates construction to the implementation)
    const MapboxDraw = MapboxDrawMock
    MapboxDraw.mockImplementation(function (options) {
      mockDrawControlInstance.options = options
      return mockDrawControlInstance
    })
  })

  describe('rendering', () => {
    test('adds the control to the map', () => {
      const props = {
        position: 'top-left'
      }

      render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl {...props} />
        </MapContext.Provider>
      )

      expect(mockMap.addControl).toHaveBeenCalledWith(
        mockDrawControlInstance,
        'top-left'
      )
    })

    test('accepts draw options', () => {
      const props = {
        displayControlsDefault: true,
        controls: {
          polygon: true,
          trash: false,
        },
      }

      render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl {...props} />
        </MapContext.Provider>
      )

      const MapboxDraw = MapboxDrawMock
      expect(MapboxDraw).toHaveBeenCalledWith(
        expect.objectContaining({
          displayControlsDefault: true,
          controls: {
            polygon: true,
            trash: false,
          },
        })
      )
    })

    test('merges options with defaults (deep merge for controls)', () => {
      const props = {
        controls: {
          point: true,
        },
      }

      render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl {...props} />
        </MapContext.Provider>
      )

      const MapboxDraw = MapboxDrawMock
      // Deep merge: user controls are merged with default controls
      expect(MapboxDraw).toHaveBeenCalledWith(
        expect.objectContaining({
          displayControlsDefault: false,
          controls: {
            polygon: true, // from defaults
            trash: true, // from defaults
            point: true, // from user
          },
        })
      )
    })
  })

  describe('event handlers', () => {
    test('registers event handlers when provided', () => {
      const props = {
        onDrawCreate: vi.fn(),
        onDrawDelete: vi.fn(),
        onDrawUpdate: vi.fn(),
      }

      render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl {...props} />
        </MapContext.Provider>
      )

      // Verify event listeners were registered
      expect(mockMap.on).toHaveBeenCalledWith('draw.create', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.delete', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.update', expect.any(Function))
    })

    test('calls onDrawCreate when draw.create event fires', () => {
      const onDrawCreate = vi.fn()

      let drawCreateHandler
      mockMap.on.mockImplementation((event, handler) => {
        if (event === 'draw.create') {
          drawCreateHandler = handler
        }
      })

      render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl onDrawCreate={onDrawCreate} />
        </MapContext.Provider>
      )

      // Simulate draw.create event
      const mockEvent = { type: 'draw.create', features: [] }
      if (drawCreateHandler) {
        drawCreateHandler(mockEvent)
      }

      expect(onDrawCreate).toHaveBeenCalledWith(mockEvent)
    })

    test('registers all event types', () => {
      const props = {
        onDrawCreate: vi.fn(),
        onDrawDelete: vi.fn(),
        onDrawUpdate: vi.fn(),
        onDrawSelectionChange: vi.fn(),
        onDrawModeChange: vi.fn(),
        onDrawCombine: vi.fn(),
        onDrawUncombine: vi.fn(),
        onDrawRender: vi.fn(),
      }

      render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl {...props} />
        </MapContext.Provider>
      )

      expect(mockMap.on).toHaveBeenCalledWith('draw.create', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.update', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.delete', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.selectionchange', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.modechange', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.combine', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.uncombine', expect.any(Function))
      expect(mockMap.on).toHaveBeenCalledWith('draw.render', expect.any(Function))
    })
  })

  describe('cleanup', () => {
    test('removes control on unmount', () => {
      const props = { position: 'top-right' }

      const { unmount } = render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl {...props} />
        </MapContext.Provider>
      )

      expect(mockMap.addControl).toHaveBeenCalled()

      unmount()

      // Verify removeControl was called with any control instance
      expect(mockMap.removeControl).toHaveBeenCalled()
    })

    test('removes event listeners on unmount', () => {
      const props = {
        onDrawCreate: vi.fn(),
      }

      const { unmount } = render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl {...props} />
        </MapContext.Provider>
      )

      unmount()

      expect(mockMap.off).toHaveBeenCalled()
    })
  })

  describe('draw event handlers', () => {
    const drawEvents = [
      ['draw.create', 'onDrawCreate'],
      ['draw.update', 'onDrawUpdate'],
      ['draw.delete', 'onDrawDelete'],
      ['draw.selectionchange', 'onDrawSelectionChange'],
      ['draw.modechange', 'onDrawModeChange'],
      ['draw.combine', 'onDrawCombine'],
      ['draw.uncombine', 'onDrawUncombine'],
      ['draw.render', 'onDrawRender'],
    ]

    const getRegisteredHandlers = () =>
      Object.fromEntries(mockMap.on.mock.calls.map(([event, handler]) => [event, handler]))

    test.each(drawEvents)('wires %s to the %s callback', (event, callbackName) => {
      const callbacks = { [callbackName]: vi.fn() }

      render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl position="top-right" {...callbacks} />
        </MapContext.Provider>
      )

      const handlers = getRegisteredHandlers()
      expect(handlers[event]).toBeInstanceOf(Function)

      act(() => {
        handlers[event]({ type: event })
      })

      expect(callbacks[callbackName]).toHaveBeenCalledTimes(1)
      expect(callbacks[callbackName]).toHaveBeenCalledWith(
        expect.objectContaining({ type: event })
      )
    })

    test('resets the canvas cursor after geometry-affecting events in simple_select mode', () => {
      // Pin a stable canvas — getCanvas() returns a fresh object per call otherwise
      const canvas = { style: { cursor: 'crosshair' } }
      mockMap.getCanvas.mockReturnValue(canvas)

      render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl position="top-right" onDrawCreate={vi.fn()} />
        </MapContext.Provider>
      )

      const handlers = getRegisteredHandlers()
      act(() => {
        handlers['draw.create']({ type: 'draw.create' })
      })

      // getMode() -> 'simple_select' -> cursor reset to ''
      expect(mockDrawControlInstance.getMode).toHaveBeenCalled()
      expect(canvas.style.cursor).toBe('')
    })

    test('unsubscribes every draw event with the registered handler on unmount', () => {
      const { unmount } = render(
        <MapContext.Provider value={mapContextValue}>
          <DrawControl position="top-right" />
        </MapContext.Provider>
      )

      const registered = getRegisteredHandlers()
      expect(Object.keys(registered)).toHaveLength(drawEvents.length)

      unmount()

      for (const [event] of drawEvents) {
        expect(mockMap.off).toHaveBeenCalledWith(event, registered[event])
      }
      expect(mockMap.off).toHaveBeenCalledTimes(drawEvents.length)
    })
  })

  describe('context guard', () => {
    test('throws when rendered outside a Map', () => {
      // Silence React's error boundary logging for the expected throw
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<DrawControl position="top-right" />)
      }).toThrow('DrawControl must be used within a Map component')

      spy.mockRestore()
    })
  })
})
