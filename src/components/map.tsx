import * as React from 'react'
import { useState, useRef, useEffect, useContext, useMemo, useImperativeHandle } from 'react'

import { MountedMapsContext } from './use-map'
import Maplibre, { MaplibreProps } from '../maplibre/maplibre'
import createRef, { MapRef } from '../maplibre/create-ref'

import type { CSSProperties } from 'react'
import useIsomorphicLayoutEffect from '../utils/use-isomorphic-layout-effect'
import setGlobals, { GlobalSettings } from '../utils/set-globals'
import type { MapLib, MapOptions } from '../types/lib'
import type { MapOptionsInternal } from '../types/internal'
import type { ErrorEvent } from '../types/events'
import { LogoControl } from './logo-control'
import { AttributionControl } from './attribution-control'

export type MapContextValue = {
  mapLib: MapLib
  map: MapRef
  /** Consumer-supplied warning handler, propagated to child components so they
   * can surface non-fatal warnings without touching console directly. */
  onWarning?: (e: ErrorEvent) => void
}

export const MapContext = React.createContext<MapContextValue>(null)

type MapInitOptions = Omit<
  MapOptions,
  'style' | 'container' | 'bounds' | 'fitBoundsOptions' | 'center'
>

export type MapProps = MapInitOptions &
  MaplibreProps &
  GlobalSettings & {
    mapLib?: MapLib | Promise<MapLib>
    reuseMaps?: boolean
    /** Map container id */
    id?: string
    /** Map container CSS style */
    style?: CSSProperties
    children?: React.ReactNode
    /** Whether to render the Barikoi logo control.
     * @default true */
    showBarikoiLogo?: boolean
    /** Whether to render the map attribution control.
     * @default true
     * @remarks Attribution is required by the OpenStreetMap and MapLibre
     * license terms; keep this enabled unless you provide attribution elsewhere. */
    showAttribution?: boolean
  } & React.RefAttributes<MapRef>

function _Map(props: MapProps, ref: React.Ref<MapRef>) {
  const mountedMapsContext = useContext(MountedMapsContext)
  const [mapInstance, setMapInstance] = useState<Maplibre>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const propsRef = useRef(props)
  propsRef.current = props

  const prevPropsRef = useRef<MapProps>(props)

  const { current: contextValue } = useRef<MapContextValue>({
    mapLib: null,
    map: null,
  })

  useEffect(() => {
    const initialMapLib = propsRef.current.mapLib
    const initialId = propsRef.current.id
    const initialReuseMaps = propsRef.current.reuseMaps

    let isMounted = true
    let maplibre: Maplibre | null = null

    Promise.resolve(initialMapLib || import('maplibre-gl'))
      .then((module: MapLib | { default: MapLib }) => {
        if (!isMounted) {
          return
        }
        if (!module) {
          throw new Error('Invalid mapLib')
        }
        const mapboxgl = 'Map' in module ? module : module.default
        if (!mapboxgl.Map) {
          throw new Error('Invalid mapLib')
        }

        setGlobals(mapboxgl, propsRef.current)
        if (initialReuseMaps) {
          maplibre = Maplibre.reuse(propsRef.current, containerRef.current)
        }
        if (!maplibre) {
          maplibre = new Maplibre(
            mapboxgl.Map as any,
            {
              ...propsRef.current,
              attributionControl: false,
            } as MapOptions & MapOptionsInternal & MaplibreProps,
            containerRef.current
          )
        }
        if (maplibre) {
          contextValue.map = createRef(maplibre)
          contextValue.mapLib = mapboxgl
          setMapInstance(maplibre)
        }
        mountedMapsContext?.onMapMount(contextValue.map, propsRef.current.id || initialId)
      })
      .catch(error => {
        const { onError } = propsRef.current
        if (onError) {
          onError({
            type: 'error',
            target: null,
            originalEvent: null,
            error,
          })
        } else {
          console.error(error)
        }
      })

    return () => {
      isMounted = false
      if (maplibre) {
        mountedMapsContext?.onMapUnmount(propsRef.current.id || initialId)
        if (initialReuseMaps) {
          maplibre.recycle()
        } else {
          maplibre.destroy()
        }
      }
    }
  }, [])

  useIsomorphicLayoutEffect(() => {
    if (mapInstance && prevPropsRef.current) {
      const prevProps = prevPropsRef.current
      let propsChanged = false

      const keysToCompare = Object.keys(props).filter(key => key !== 'children' && key !== 'mapLib')
      const prevKeys = Object.keys(prevProps).filter(key => key !== 'children' && key !== 'mapLib')

      if (keysToCompare.length !== prevKeys.length) {
        propsChanged = true
      } else {
        for (const key of keysToCompare) {
          if (props[key] !== prevProps[key]) {
            propsChanged = true
            break
          }
        }
      }

      if (propsChanged) {
        mapInstance.setProps(props)
      }
    }
    prevPropsRef.current = props
  })

  useImperativeHandle(ref, () => contextValue.map, [mapInstance])

  const style: CSSProperties = useMemo(
    () => ({
      position: 'relative',
      width: '100%',
      height: '100%',
      ...props.style,
    }),
    [props.style]
  )

  const CHILD_CONTAINER_STYLE = {
    height: '100%',
  }

  // Propagate the warning handler to children via the (stable) context value.
  contextValue.onWarning = props.onWarning

  return (
    <div id={props.id} ref={containerRef} style={style}>
      {mapInstance && (
        <MapContext.Provider value={contextValue}>
          <div style={CHILD_CONTAINER_STYLE}>
            {/* Automatically include Barikoi Logo and Attribution controls.
                Both default to true; set showBarikoiLogo / showAttribution to
                false to opt out. */}
            {props.showBarikoiLogo !== false && <LogoControl position='bottom-left' />}
            {props.showAttribution !== false && <AttributionControl position='bottom-right' />}
            {props.children}
          </div>
        </MapContext.Provider>
      )}
    </div>
  )
}

export const Map: React.FC<MapProps> = React.forwardRef(_Map)
