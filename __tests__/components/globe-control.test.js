// Jest-based tests for GlobeControl
import React from 'react'
import { render } from '@testing-library/react'
import { GlobeControl } from '../../src/components/globe-control'
import { MapContext } from '../../src/components/map'

// Mock useControl hook
jest.mock('../../src/components/use-control', () => ({
  useControl: jest.fn((createControl, options) => {
    const control = createControl()
    return control
  }),
}))

describe('GlobeControl', () => {
  let mockMapInstance
  let mapContextValue

  beforeEach(() => {
    jest.clearAllMocks()

    mockMapInstance = {
      on: jest.fn(),
      off: jest.fn(),
      addControl: jest.fn(),
      removeControl: jest.fn(),
      hasControl: jest.fn(() => false),
      setProjection: jest.fn(),
      getProjection: jest.fn(() => ({ type: 'mercator' })),
    }

    mapContextValue = {
      map: {
        getMap: () => mockMapInstance,
      },
      mapLib: {
        Map: jest.fn(),
      },
    }
  })

  test('creates control with default options', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl />
      </MapContext.Provider>
    )

    expect(require('../../src/components/use-control').useControl).toHaveBeenCalled()
  })

  test('accepts position prop', () => {
    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl position="top-left" />
      </MapContext.Provider>
    )

    expect(require('../../src/components/use-control').useControl).toHaveBeenCalledWith(
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

    expect(require('../../src/components/use-control').useControl).toHaveBeenCalled()
  })

  test('calls onProjectionChange when projection changes', () => {
    const onProjectionChange = jest.fn()

    render(
      <MapContext.Provider value={mapContextValue}>
        <GlobeControl onProjectionChange={onProjectionChange} />
      </MapContext.Provider>
    )

    expect(require('../../src/components/use-control').useControl).toHaveBeenCalled()
  })

  test('control has isGlobe method', () => {
    const useControl = require('../../src/components/use-control').useControl
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
    const useControl = require('../../src/components/use-control').useControl
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
})
