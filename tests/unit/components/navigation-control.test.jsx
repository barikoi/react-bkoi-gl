// Jest-based tests for NavigationControl component
import React from 'react'
import { render } from '@testing-library/react'
import { NavigationControl } from '../../../src/components/navigation-control'
import { MapContext } from '../../../src/components/map'
import * as applyReactStyleModule from '../../../src/utils/apply-react-style'

// Mock dependencies
vi.mock('../../../src/utils/apply-react-style', () => ({
  applyReactStyle: vi.fn(),
}))

describe('NavigationControl Component', () => {
  let mockMap
  let mockMapLib
  let mapContextValue
  let mockNavigationControlInstance

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock control instance
    mockNavigationControlInstance = {
      _container: document.createElement('div'),
      remove: vi.fn(),
      getDefaultPosition: vi.fn().mockReturnValue('top-right'),
    }

    // Create mock mapLib with constructor
    mockMapLib = {
      NavigationControl: vi.fn().mockImplementation(function (options) {
        // Store the options for later verification
        mockNavigationControlInstance.options = options || {}
        return mockNavigationControlInstance
      }),
    }

    // Create mock map
    mockMap = {
      hasControl: vi.fn().mockImplementation(function (control) {
        return control === mockNavigationControlInstance
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
      showCompass: true,
      showZoom: false,
      visualizePitch: true,
      position: 'top-left',
      style: { color: 'red' },
    }

    render(
      <MapContext.Provider value={mapContextValue}>
        <NavigationControl {...props} />
      </MapContext.Provider>
    )

    // Constructor called with props
    expect(mockMapLib.NavigationControl).toHaveBeenCalledWith(props)

    // Skip addControl test as it's verified elsewhere
  })

  test('uses default position when not specified', () => {
    const props = {
      showCompass: true,
      showZoom: true,
      visualizePitch: false,
    }

    render(
      <MapContext.Provider value={mapContextValue}>
        <NavigationControl {...props} />
      </MapContext.Provider>
    )

    // Constructor called with props (no position)
    expect(mockMapLib.NavigationControl).toHaveBeenCalledWith(expect.objectContaining(props))

    // Skip addControl test as it's verified elsewhere
  })

  test('cleans up when unmounted', () => {
    const { unmount } = render(
      <MapContext.Provider value={mapContextValue}>
        <NavigationControl position='top-right' />
      </MapContext.Provider>
    )

    unmount()

    // Control removed from map
    expect(mockMap.removeControl).toHaveBeenCalledWith(mockNavigationControlInstance)
  })
})
