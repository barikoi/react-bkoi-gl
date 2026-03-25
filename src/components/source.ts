import * as React from 'react'
import { useContext, useEffect, useMemo, useState, useRef, cloneElement, memo, useId } from 'react'
import { MapContext } from './map'
import assert from '../utils/assert'
import { deepEqual } from '../utils/deep-equal'

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

export type SourceProps = SourceSpecification & {
  id?: string

  children?: any
}

function createSource(map: MapInstance, id: string, props: SourceProps) {
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

function updateSource(source: AnySourceImplementation, props: SourceProps, prevProps: SourceProps) {
  assert(props.id === prevProps.id, 'source id changed')
  assert(props.type === prevProps.type, 'source type changed')

  let changedKey = ''
  let changedKeyCount = 0

  for (const key in props) {
    if (key !== 'children' && key !== 'id' && !deepEqual(prevProps[key], props[key])) {
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
        console.warn(`Unable to update <Source> prop: ${changedKey}`)
    }
  }
}

function _Source(props: SourceProps) {
  const map = useContext(MapContext).map.getMap()
  const propsRef = useRef(props)
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
          // Parent effects are destroyed before child ones, see
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
    return undefined
  }, [map])

  const mapInternal = map as unknown as MapInternalProperties
  let source = map && mapInternal.style && map.getSource(id)
  if (source) {
    updateSource(source, props, propsRef.current)
  } else {
    source = createSource(map, id, props)
  }
  propsRef.current = props

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

export const Source = memo(_Source)
