import { useContext, useEffect, useMemo, useState, useRef, memo, useId } from 'react'
import { MapContext } from './map'
import assert from '../utils/assert'
import { deepEqual } from '../utils/deep-equal'

import type { FilterSpecification } from 'maplibre-gl'

import type { Map as MapInstance, CustomLayerInterface } from '../types/lib'
import type { LayerSpecification } from '../types/style-spec'
import type { MapInternalProperties } from '../types/internal'

// Type for layer with filter property (not all layer types have filter)
type LayerWithFilter = {
  filter?: FilterSpecification | null
  layout?: Record<string, unknown>
  paint?: Record<string, unknown>
  minzoom?: number
  maxzoom?: number
  beforeId?: string
  type?: string
  id?: string
  source?: string
}

// Omiting property from a union type, see
// https://github.com/microsoft/TypeScript/issues/39556#issuecomment-656925230
type OptionalId<T> = T extends { id: string } ? Omit<T, 'id'> & { id?: string } : T
type OptionalSource<T> = T extends { source: string } ? Omit<T, 'source'> & { source?: string } : T

export type LayerProps = (OptionalSource<OptionalId<LayerSpecification>> | CustomLayerInterface) & {
  /** If set, the layer will be inserted before the specified layer */
  beforeId?: string
}

function updateLayer(map: MapInstance, id: string, props: LayerProps, prevProps: LayerProps) {
  assert(props.id === prevProps.id, 'layer id changed')
  assert(props.type === prevProps.type, 'layer type changed')

  if (props.type === 'custom' || prevProps.type === 'custom') {
    return
  }

  const propsWithFilter = props as unknown as LayerWithFilter
  const prevPropsWithFilter = prevProps as unknown as LayerWithFilter
  const { layout = {}, paint = {}, filter, minzoom, maxzoom, beforeId } = propsWithFilter

  if (beforeId !== prevPropsWithFilter.beforeId) {
    map.moveLayer(id, beforeId)
  }
  if (layout !== prevPropsWithFilter.layout) {
    const prevLayout = prevPropsWithFilter.layout || {}
    for (const key in layout) {
      if (!deepEqual(layout[key], prevLayout[key])) {
        map.setLayoutProperty(id, key, layout[key])
      }
    }
    for (const key in prevLayout) {
      if (!Object.prototype.hasOwnProperty.call(layout, key)) {
        map.setLayoutProperty(id, key, undefined)
      }
    }
  }
  if (paint !== prevPropsWithFilter.paint) {
    const prevPaint = prevPropsWithFilter.paint || {}
    for (const key in paint) {
      if (!deepEqual(paint[key], prevPaint[key])) {
        map.setPaintProperty(id, key, paint[key])
      }
    }
    for (const key in prevPaint) {
      if (!Object.prototype.hasOwnProperty.call(paint, key)) {
        map.setPaintProperty(id, key, undefined)
      }
    }
  }

  if (!deepEqual(filter, prevPropsWithFilter.filter)) {
    map.setFilter(id, filter ?? null)
  }
  if (minzoom !== prevPropsWithFilter.minzoom || maxzoom !== prevPropsWithFilter.maxzoom) {
    map.setLayerZoomRange(id, minzoom, maxzoom)
  }
}

function createLayer(map: MapInstance, id: string, props: LayerProps) {
  const mapInternal = map as unknown as MapInternalProperties
  if (
    mapInternal.style &&
    mapInternal.style._loaded &&
    (!('source' in props) || map.getSource(props.source as string))
  ) {
    const options: LayerProps = { ...props, id }
    delete options.beforeId

    map.addLayer(options as LayerSpecification, props.beforeId)
  }
}

function _Layer(props: LayerProps) {
  const map = useContext(MapContext).map.getMap()
  const propsRef = useRef(props)
  const [, setStyleLoaded] = useState(0)

  // Generate a stable ID once on mount
  // Note: props.id changes after mount will trigger an error in updateLayer
  const generatedId = useId()
  const id = useMemo(
    () => props.id || `jsx-layer-${generatedId.replace(/:/g, '-')}`,
    // Empty deps - id is set once on mount and should not change
    []
  )

  useEffect(() => {
    if (map) {
      const forceUpdate = () => setStyleLoaded(version => version + 1)
      map.on('styledata', forceUpdate)
      forceUpdate()

      return () => {
        map.off('styledata', forceUpdate)
        const mapInternal = map as unknown as MapInternalProperties
        if (mapInternal.style && mapInternal.style._loaded && map.getLayer(id)) {
          map.removeLayer(id)
        }
      }
    }
    return undefined
  }, [map])

  const mapInternal = map as unknown as MapInternalProperties
  const layer = map && mapInternal.style && map.getLayer(id)
  if (layer) {
    try {
      updateLayer(map, id, props, propsRef.current)
    } catch (error) {
      console.warn(error)
    }
  } else {
    createLayer(map, id, props)
  }

  // Store last rendered props
  propsRef.current = props

  return null
}

export const Layer = memo(_Layer)
