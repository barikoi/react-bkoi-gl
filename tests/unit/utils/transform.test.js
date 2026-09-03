// Jest-based tests for transform utility
import {
  transformToViewState,
  applyViewStateToTransform,
  mapToViewState,
  viewStateChanges,
} from '../../../src/utils/transform'

describe('transform', () => {
  describe('transformToViewState', () => {
    test('converts transform to view state', () => {
      const transform = {
        center: {
          lng: 10,
          lat: 20,
        },
        zoom: 5,
        bearing: 45,
        pitch: 30,
      }

      const viewState = transformToViewState(transform)

      expect(viewState).toEqual({
        longitude: 10,
        latitude: 20,
        zoom: 5,
        bearing: 45,
        pitch: 30,
        padding: undefined,
      })
    })

    test('handles padding', () => {
      const transform = {
        center: {
          lng: 10,
          lat: 20,
        },
        zoom: 5,
        bearing: 45,
        pitch: 30,
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
      }

      const viewState = transformToViewState(transform)

      expect(viewState).toEqual({
        longitude: 10,
        latitude: 20,
        zoom: 5,
        bearing: 45,
        pitch: 30,
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
      })
    })
  })

  describe('viewStateChanges', () => {
    const makeMap = (overrides = {}) => ({
      getCenter: () => ({ lng: 0, lat: 0 }),
      getZoom: () => 8,
      getBearing: () => 0,
      getPitch: () => 0,
      getPadding: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
      ...overrides,
    })

    test('flags padding when it differs from the map transform', () => {
      const padding = { top: 10, bottom: 10, left: 5, right: 5 }
      const changes = viewStateChanges(makeMap(), { viewState: { padding } })
      expect(changes.padding).toEqual(padding)
    })

    test('skips padding when it matches the map transform', () => {
      const padding = { top: 0, bottom: 0, left: 0, right: 0 }
      const changes = viewStateChanges(makeMap(), { viewState: { padding } })
      expect(changes.padding).toBeUndefined()
    })
  })

  describe('applyViewStateToTransform', () => {
    test('returns changes based on viewState prop', () => {
      const transform = {
        center: {
          lng: 0,
          lat: 0,
          constructor: function LngLat(lng, lat) {
            return { lng, lat }
          },
        },
        zoom: 0,
        bearing: 0,
        pitch: 0,
      }

      const props = {
        viewState: {
          longitude: 10,
          latitude: 20,
          zoom: 5,
          bearing: 45,
          pitch: 30,
        },
      }

      const changes = applyViewStateToTransform(transform, props)

      expect(changes).toEqual({
        center: { lng: 10, lat: 20 },
        zoom: 5,
        bearing: 45,
        pitch: 30,
      })
    })

    test('returns changes based on direct props', () => {
      const transform = {
        center: {
          lng: 0,
          lat: 0,
          constructor: function LngLat(lng, lat) {
            return { lng, lat }
          },
        },
        zoom: 0,
        bearing: 0,
        pitch: 0,
      }

      const props = {
        longitude: 10,
        latitude: 20,
        zoom: 5,
        bearing: 45,
        pitch: 30,
      }

      const changes = applyViewStateToTransform(transform, props)

      expect(changes).toEqual({
        center: { lng: 10, lat: 20 },
        zoom: 5,
        bearing: 45,
        pitch: 30,
      })
    })

    test('only returns changed properties', () => {
      const transform = {
        center: {
          lng: 10,
          lat: 20,
          constructor: function LngLat(lng, lat) {
            return { lng, lat }
          },
        },
        zoom: 5,
        bearing: 0,
        pitch: 0,
      }

      const props = {
        longitude: 10,
        latitude: 20,
        bearing: 45,
        pitch: 30,
      }

      const changes = applyViewStateToTransform(transform, props)

      expect(changes).toEqual({
        bearing: 45,
        pitch: 30,
      })
    })

    test('handles padding changes', () => {
      const transform = {
        center: {
          lng: 10,
          lat: 20,
          constructor: function LngLat(lng, lat) {
            return { lng, lat }
          },
        },
        zoom: 5,
        bearing: 0,
        pitch: 0,
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
      }

      const props = {
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
      }

      const changes = applyViewStateToTransform(transform, props)

      expect(changes).toEqual({
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
      })
    })
  })
})
describe('mapToViewState', () => {
  test('captures the camera state via public getters', () => {
    const map = {
      getCenter: () => ({ lng: 90.4, lat: 23.8 }),
      getZoom: () => 11.5,
      getBearing: () => -30,
      getPitch: () => 45,
      getPadding: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    }

    const viewState = mapToViewState(map)

    expect(viewState).toEqual({
      longitude: 90.4,
      latitude: 23.8,
      zoom: 11.5,
      bearing: -30,
      pitch: 45,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    })
  })
})

describe('applyViewStateToTransform padding', () => {
  test('reports padding changes when the requested padding differs', () => {
    const transform = {
      center: {
        lng: 0,
        lat: 0,
        constructor: function LngLat(lng, lat) {
          return { lng, lat }
        },
      },
      zoom: 0,
      bearing: 0,
      pitch: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      getCenter: () => ({ lng: 0, lat: 0 }),
      getZoom: () => 0,
      getBearing: () => 0,
      getPitch: () => 0,
      getPadding: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    }

    const padding = { top: 10, bottom: 10, left: 5, right: 5 }
    const changes = applyViewStateToTransform(transform, { viewState: { padding } })

    expect(changes.padding).toEqual(padding)
  })
})
