import type { MaplibreProps } from '../maplibre/maplibre'
import type { ViewState } from '../types/common'
import type { TransformLike } from '../types/internal'
import type { PaddingOptions } from 'maplibre-gl'
import { deepEqual } from './deep-equal'

/** Public map camera getters (maplibre-gl v6: `map.transform` is internal) */
type CameraGetters = {
  getCenter(): { lng: number; lat: number }
  getZoom(): number
  getBearing(): number
  getPitch(): number
  getPadding(): PaddingOptions
}

/**
 * Capture the map's current camera state via public getters
 * (maplibre-gl v6 replacement for reading the internal `map.transform`)
 */
export function mapToViewState(map: CameraGetters): ViewState {
  return {
    longitude: map.getCenter().lng,
    latitude: map.getCenter().lat,
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
    padding: map.getPadding(),
  }
}

/**
 * Compute `Map#jumpTo` options that bring the map camera in line with the
 * requested (controlled) view state, comparing against public getters.
 */
export function viewStateChanges(
  map: CameraGetters,
  props: MaplibreProps
): Record<string, unknown> {
  const v: Partial<ViewState> = props.viewState || props
  const changes: Record<string, unknown> = {}
  const center = map.getCenter()

  if (
    'longitude' in v &&
    'latitude' in v &&
    (v.longitude !== center.lng || v.latitude !== center.lat)
  ) {
    changes.center = [v.longitude, v.latitude]
  }
  if ('zoom' in v && v.zoom !== map.getZoom()) {
    changes.zoom = v.zoom
  }
  if ('bearing' in v && v.bearing !== map.getBearing()) {
    changes.bearing = v.bearing
  }
  if ('pitch' in v && v.pitch !== map.getPitch()) {
    changes.pitch = v.pitch
  }
  const padding = map.getPadding()
  if (v.padding && !deepEqual(v.padding, padding)) {
    changes.padding = v.padding
  }
  return changes
}

/**
 * Capture a transform's current state
 * @param transform
 * @returns descriptor of the view state
 */
export function transformToViewState(tr: TransformLike): ViewState {
  return {
    longitude: tr.center.lng,
    latitude: tr.center.lat,
    zoom: tr.zoom,
    pitch: tr.pitch,
    bearing: tr.bearing,
    padding: tr.padding,
  }
}

/**
 * Applies requested view state to a transform
 * @returns an object containing detected changes
 */
export function applyViewStateToTransform(
  /** An object that describes Maplibre's camera state */
  tr: TransformLike,
  /** Props from Map component */
  props: MaplibreProps
): Partial<TransformLike> {
  const v: Partial<ViewState> = props.viewState || props
  const changes: Partial<TransformLike> = {}

  if (
    'longitude' in v &&
    'latitude' in v &&
    (v.longitude !== tr.center.lng || v.latitude !== tr.center.lat)
  ) {
    const LngLat = tr.center.constructor
    // @ts-expect-error we should not import LngLat class from maplibre-gl because we don't know the source of mapLib
    changes.center = new LngLat(v.longitude, v.latitude)
  }
  if ('zoom' in v && v.zoom !== tr.zoom) {
    changes.zoom = v.zoom
  }
  if ('bearing' in v && v.bearing !== tr.bearing) {
    changes.bearing = v.bearing
  }
  if ('pitch' in v && v.pitch !== tr.pitch) {
    changes.pitch = v.pitch
  }
  if (v.padding && tr.padding && !deepEqual(v.padding, tr.padding)) {
    changes.padding = v.padding
  }
  return changes
}
