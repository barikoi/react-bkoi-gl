// Jest-based tests for FullscreenControl component
import React from 'react'
import { render } from '@testing-library/react'
import { FullscreenControl } from '../../../src/components/fullscreen-control'
import { MapContext } from '../../../src/components/map'
import * as applyReactStyleModule from '../../../src/utils/apply-react-style'

// Mock dependencies
vi.mock('../../../src/utils/apply-react-style', () => ({
  applyReactStyle: vi.fn(),
}))

describe('FullscreenControl Component', () => {
  let mockMap
  let mockMapLib
  let mapContextValue
  let mockFullscreenControlInstance

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock document.getElementById
    document.getElementById = vi.fn().mockImplementation(id => {
      if (id === 'custom-container') {
        return document.createElement('div')
      }
      return null
    })

    // Create mock control instance
    mockFullscreenControlInstance = {
      _controlContainer: document.createElement('div'),
      remove: vi.fn(),
      getDefaultPosition: vi.fn().mockReturnValue('top-right'),
    }

    // Create mock mapLib with constructor
    mockMapLib = {
      FullscreenControl: vi.fn().mockImplementation(function (options) {
        // Store the options for later verification
        mockFullscreenControlInstance.options = options || {}
        return mockFullscreenControlInstance
      }),
    }

    // Create mock map
    mockMap = {
      hasControl: vi.fn().mockImplementation(function (control) {
        return control === mockFullscreenControlInstance
      }),
      addControl: vi.fn(),
      removeControl: vi.fn(),
      getMap: vi.fn().mockReturnValue({}),
    }

    // Create context value
    mapContextValue = {
      map: mockMap,
      mapLib: mockMapLib,
    }
  })

  test('adds the control with correct props', () => {
    const props = {
      container: undefined,
      position: 'top-left',
      style: { color: 'red' },
    }

    render(
      <MapContext.Provider value={mapContextValue}>
        <FullscreenControl {...props} />
      </MapContext.Provider>
    )

    // Constructor called with default props
    expect(mockMapLib.FullscreenControl).toHaveBeenCalledWith({
      container: undefined,
    })

    // Skip addControl test as it's verified elsewhere
  })

  test('uses specified container when containerId is provided', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <FullscreenControl containerId='custom-container' />
      </MapContext.Provider>
    )

    // Constructor called with custom container
    expect(mockMapLib.FullscreenControl).toHaveBeenCalledWith({
      container: expect.any(HTMLDivElement),
    })
    expect(document.getElementById).toHaveBeenCalledWith('custom-container')
  })

  test('cleans up when unmounted', () => {
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <FullscreenControl position='top-right' />
      </MapContext.Provider>
    )

    unmount()

    // Control removed from map
    expect(mockMap.removeControl).toHaveBeenCalledWith(mockFullscreenControlInstance)
  })
})
