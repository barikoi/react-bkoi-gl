/**
 * @fileoverview Source component for adding data sources to a MapLibre GL map.
 *
 * Sources define the data that layers can render. This component supports all
 * MapLibre GL source types including GeoJSON, vector tiles, raster tiles. image. and video.
 *
 * @module components/source
 * @see {@link https://maplibre.org/maplibre-gl-js/docs/sources/}
 */

import * as React from 'react'
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  cloneElement,
  memo,
  useId,
  useImperativeHandle,
} from 'react'
import { MapContext } from './map'
import assert from '../utils/assert'
import { deepEqual } from '../utils/deep-equal'
import { emitWarning } from '../utils/warn'

import type {
  GeoJSONSourceImplementation,
  ImageSourceImplementation,
  AnySourceImplementation,
  MapInternalProperties,
  SourceWithOptionalMethods,
  LayerWithSource,
} from '../types/internal'
import type { SourceSpecification } from '../types/style-spec'
import type { Map as MapInstance } from '../types/lib'
import type { ErrorEvent } from '../types/events'

/**
 * Props for the Source component.
 *
 * @typedef {Object} SourceProps
 * @property {string} [id] - Unique identifier for the source. If not provided. one will be generated automatically.
 * @property {React.ReactNode} [children] - Child Layer components that will use this source.
 * @extends {SourceSpecification}
 *
 * @example
 * ```tsx
 * // GeoJSON source with a layer
 * <Source id="my-data" type="geojson" data={geojsonData}>
 *   <Layer id="points-layer" type="circle" paint={{ 'circle-radius': 8 }} />
 * </Source>
 *
 * // Vector tile source
 * <Source id="streets" type="vector" url="mapbox://streets-v11" />
 *
 * // Raster source
 * <Source id="satellite" type="raster" tiles={['https://example.com/tiles/{z}/{x}/{y}.png']} tileSize={256} />
 * ```
 */
export type SourceProps = SourceSpecification & {
  /** Unique identifier for the source. If not provided. one will be generated automatically. */
  id?: string

  /** Child Layer components that will use this source. */
  children?: any
}

/**
 * Creates a new source on the map.
 *
 * @param {MapInstance} map - The MapLibre GL map instance
 * @param {string} id - Unique identifier for the source
 * @param {SourceProps} props - Source properties
 * @returns {AnySourceImplementation | null} The created source or null if style not loaded
 * @private
 */
function createSource(
  map: MapInstance,
  id: string,
  props: SourceProps
): AnySourceImplementation | null {
  const mapInternal = map as unknown as MapInternalProperties
  if (mapInternal.style && mapInternal.style._loaded) {
    const options = { ...props }
    delete options.id
    delete options.children
    map.addSource(id, options as SourceSpecification)
    return map.getSource(id)
  }
  return null
}

/**
 * Updates an existing source with new properties.
 *
 * Handles updates for different source types:
 * - GeoJSON sources: updates data via setData()
 * - Image sources: updates via updateImage()
 * - Other sources: uses optional setCoordinates. setUrl. or setTiles methods
 *
 * @param {AnySourceImplementation} source - The source to update
 * @param {SourceProps} props - New properties
 * @param {SourceProps} prevProps - Previous properties
 * @throws {Error} If source id or type changes
 * @private
 */
function updateSource(
  source: AnySourceImplementation,
  props: SourceProps,
  prevProps: SourceProps,
  onWarning?: (e: ErrorEvent) => void
): void {
  assert(props.id === prevProps.id, 'source id changed')
  assert(props.type === prevProps.type, 'source type changed')

  let changedKey = ''
  let changedKeyCount = 0

  for (const key in props) {
    if (
      key !== 'children' &&
      key !== 'id' &&
      Object.prototype.hasOwnProperty.call(props, key) &&
      !deepEqual(prevProps[key], props[key])
    ) {
      changedKey = key
      changedKeyCount++
    }
  }

  if (!changedKeyCount) {
    return
  }

  const type = props.type

  if (type === 'geojson') {
    ;(source as GeoJSONSourceImplementation).setData(props.data)
  } else if (type === 'image') {
    ;(source as ImageSourceImplementation).updateImage({
      url: props.url,
      coordinates: props.coordinates,
    })
  } else {
    const sourceWithMethods = source as unknown as SourceWithOptionalMethods
    const propsWithOptional = props as Record<string, unknown>
    switch (changedKey) {
      case 'coordinates':
        sourceWithMethods.setCoordinates?.(propsWithOptional.coordinates)
        break
      case 'url':
        sourceWithMethods.setUrl?.(propsWithOptional.url as string)
        break
      case 'tiles':
        sourceWithMethods.setTiles?.(propsWithOptional.tiles as string[])
        break
      default:
        emitWarning(onWarning, new Error(`Unable to update <Source> prop: ${changedKey}`))
    }
  }
}

/**
 * Source component for adding data sources to a MapLibre GL map.
 *
 * Sources define the data that layers render. Supports all MapLibre GL source
 * types including GeoJSON. vector tiles. raster tiles. image. and video.
 *
 * @component
 * @example
 * ```tsx
 * // GeoJSON source with a layer
 * <Source id="my-data" type="geojson" data={geojsonData}>
 *   <Layer id="points-layer" type="circle" paint={{ 'circle-radius': 8 }} />
 * </Source>
 *
 * // Vector tile source
 * <Source id="streets" type="vector" url="mapbox://streets-v11" />
 *
 * // Raster source
 * <Source id="satellite" type="raster" tiles={['https://example.com/tiles/{z}/{x}/{y}.png']} tileSize={256} />
 *
 * // With ref forwarding
 * const sourceRef = useRef(null);
 * <Source ref={sourceRef} id="my-data" type="geojson" data={data}>
 *   <Layer type="circle" />
 * </Source>
 *
 * // Access source methods
 * useEffect(() => {
 *   if (sourceRef.current) {
 *     sourceRef.current.setData(newData);
 *   }
 * }, [newData]);
 * ```
 */
function _Source(props: SourceProps, ref: React.Ref<AnySourceImplementation | null>) {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('<Source> must be used within a Map component')
  }
  const map = context.map.getMap()
  const propsRef = useRef(props)
  const sourceRef = useRef<AnySourceImplementation | null>(null)
  const [, setStyleLoaded] = useState(0)

  // Generate a stable ID once on mount
  // Note: props.id changes after mount will trigger an error in updateSource
  const generatedId = useId()
  const id = useMemo(
    () => props.id || `jsx-source-${generatedId.replace(/:/g, '-')}`,
    // Empty deps - id is set once on mount and should not change
    []
  )

  useEffect(() => {
    if (map) {
      /* global setTimeout */
      const forceUpdate = () => setTimeout(() => setStyleLoaded(version => version + 1), 0)
      map.on('styledata', forceUpdate)
      forceUpdate()

      return () => {
        map.off('styledata', forceUpdate)
        const mapInternal = map as unknown as MapInternalProperties
        if (mapInternal.style && mapInternal.style._loaded && map.getSource(id)) {
          // Parent effects are destroyed before child ones. see
          // https://github.com/facebook/react/issues/16728
          // Source can only be removed after all child layers are removed
          const allLayers = map.getStyle()?.layers
          if (allLayers) {
            for (const layer of allLayers) {
              const layerWithSource = layer as unknown as LayerWithSource
              if (layerWithSource.source === id) {
                map.removeLayer(layer.id)
              }
            }
          }
          map.removeSource(id)
        }
      }
    }
    /* v8 ignore next -- unreachable: a falsy map crashes in createSource first */
    return undefined
  }, [map])

  const mapInternal = map as unknown as MapInternalProperties
  let source = map && mapInternal.style && map.getSource(id)
  if (source) {
    updateSource(source, props, propsRef.current, context.onWarning)
  } else {
    source = createSource(map, id, props)
  }

  // Update source ref for imperative handle
  sourceRef.current = source
  propsRef.current = props

  // Expose source instance via ref
  useImperativeHandle(ref, () => sourceRef.current, [source])

  return (
    (source &&
      React.Children.map(
        props.children,
        child =>
          child &&
          cloneElement(child, {
            source: id,
          })
      )) ||
    null
  )
}

export const Source = memo(React.forwardRef(_Source))
