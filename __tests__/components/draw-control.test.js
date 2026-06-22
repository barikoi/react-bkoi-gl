import * as React from 'react'
import { render } from '@testing-library/react'
import { DrawControl } from '../../src/components/draw-control'
import { MapContext } from '../../src/components/map'

// Mock maplibre-gl-draw
jest.mock('maplibre-gl-draw', () => {
  return jest.fn().mockImplementation((options) => ({
    options,
    getMode: jest.fn(() => 'simple_select'),
    on: jest.fn(),
    off: jest.fn(),
    getDefaultPosition: jest.fn().mockReturnValue('top-right'),
    _container: document.createElement('div'),
    remove: jest.fn()
  }))
})

describe('DrawControl', () => {
  let mockMap
  let mockMapLib
  let mapContextValue
  let mockDrawControlInstance
  let addedControls

  beforeEach(() => {
    jest.clearAllMocks()

    // Track added controls
    addedControls = new Set()

    // Create mock draw control instance
    mockDrawControlInstance = {
      options: {},
      getMode: jest.fn(() => 'simple_select'),
      on: jest.fn(),
      off: jest.fn(),
      getDefaultPosition: jest.fn().mockReturnValue('top-right'),
      _container: document.createElement('div'),
      remove: jest.fn()
    }

    // Create mock mapLib with MapboxDraw constructor
    mockMapLib = {}

    // Create mock map
    mockMap = {
      hasControl: jest.fn().mockImplementation((ctrl) => addedControls.has(ctrl)),
      addControl: jest.fn().mockImplementation((ctrl) => addedControls.add(ctrl)),
      removeControl: jest.fn().mockImplementation((ctrl) => addedControls.delete(ctrl)),
      on: jest.fn(),
      off: jest.fn(),
      getCanvas: jest.fn(() => ({ style: {} })),
      getZoom: jest.fn(() => 10),
      getCenter: jest.fn(() => ({ lng: 90, lat: 23 })),
      getMap: jest.fn().mockReturnThis()
    }

    // Create context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib
    }

    // Reset the mock implementation to return our instance
    const MapboxDraw = require('maplibre-gl-draw')
    MapboxDraw.mockImplementation((options) => {
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

      const MapboxDraw = require('maplibre-gl-draw')
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

      const MapboxDraw = require('maplibre-gl-draw')
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
        onDrawCreate: jest.fn(),
        onDrawDelete: jest.fn(),
        onDrawUpdate: jest.fn(),
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
      const onDrawCreate = jest.fn()

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
        onDrawCreate: jest.fn(),
        onDrawDelete: jest.fn(),
        onDrawUpdate: jest.fn(),
        onDrawSelectionChange: jest.fn(),
        onDrawModeChange: jest.fn(),
        onDrawCombine: jest.fn(),
        onDrawUncombine: jest.fn(),
        onDrawRender: jest.fn(),
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
        onDrawCreate: jest.fn(),
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
})
